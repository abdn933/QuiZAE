from flask import Flask, request, jsonify
from flask_cors import CORS
from quiz_database import QuizDatabase, QuestionType
import random
import json
import time

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'Quiz Game API is running'
    })



# Initialisation de la base de données
db = QuizDatabase('quiz.db')

# Structure pour stocker les parties en cours
active_games = {}
duel_rooms = {}

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user_id = db.verify_user(username, password)
    if user_id:
        return jsonify({'status': 'success', 'user_id': user_id})
    return jsonify({'status': 'error', 'message': 'Identifiants invalides'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if db.add_user(username, password):
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'Nom d\'utilisateur déjà pris'})

@app.route('/api/themes', methods=['GET'])
def get_themes():
    themes = db.get_all_themes()
    return jsonify({'status': 'success', 'themes': themes})

@app.route('/api/start_game', methods=['POST'])
def start_game():
    data = request.json
    theme_id = data.get('theme_id')
    user_id = data.get('user_id')
    
    if not theme_id or not user_id:
        return jsonify({'status': 'error', 'message': 'Données manquantes'})

    questions = db.get_questions_for_game(theme_id)
    formatted_questions = []
    
    # Formatage des questions
    for q_type in [QuestionType.OPEN, QuestionType.QUAD, QuestionType.DUAL]:
        if q_type in questions:
            formatted_questions.extend(questions[q_type])

    if not formatted_questions:
        return jsonify({'status': 'error', 'message': 'Pas assez de questions disponibles'})

    random.shuffle(formatted_questions)
    game_id = f"game_{int(time.time())}_{user_id}"
    
    active_games[game_id] = {
        'questions': formatted_questions,
        'current_index': 0,
        'score': 0,
        'user_id': user_id,
        'answers_history': [],
        'start_time': time.time()
    }

    return jsonify({
        'status': 'success',
        'game_id': game_id,
        'question': formatted_questions[0]
    })

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    data = request.json
    game_id = data.get('game_id')
    answer = data.get('answer')
    time_taken = data.get('time_taken', 30)
    
    if game_id not in active_games:
        return jsonify({'status': 'error', 'message': 'Partie non trouvée'})
        
    game = active_games[game_id]
    current_question = game['questions'][game['current_index']]
    
    if answer is None:
        points = 0
        is_correct = False
    else:
        is_correct = answer.lower() == current_question[5].lower()
        points = current_question[3] if is_correct else 0
        if is_correct:
            time_bonus = max(0, (30 - time_taken) / 30 * 0.2)
            points = int(points * (1 + time_bonus))
            game['score'] += points
    
    game['answers_history'].append({
        'question': current_question[4],
        'user_answer': answer,
        'correct_answer': current_question[5],
        'is_correct': is_correct,
        'points': points,
        'time_taken': time_taken
    })
    
    game['current_index'] += 1
    next_question = None
    if game['current_index'] < len(game['questions']):
        next_question = game['questions'][game['current_index']]
    
    return jsonify({
        'status': 'success',
        'is_correct': is_correct,
        'correct_answer': current_question[5],
        'points': points,
        'time_taken': time_taken,
        'next_question': next_question,
        'game_finished': next_question is None
    })

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    theme_id = request.args.get('theme')
    if theme_id == 'general':
        theme_id = None
    scores = db.get_leaderboard(theme_id)
    return jsonify({'status': 'success', 'scores': scores})

@app.route('/api/create_duel_room', methods=['POST'])
def create_duel_room():
    data = request.json
    theme_id = data.get('theme_id')
    user_id = data.get('user_id')
    
    room_code = str(random.randint(1000, 9999))
    while room_code in duel_rooms:
        room_code = str(random.randint(1000, 9999))
    
    duel_rooms[room_code] = {
        'theme_id': theme_id,
        'players': [user_id],
        'status': 'waiting',
        'max_players': 6,
        'questions': [],
        'scores': {}
    }
    
    return jsonify({'status': 'success', 'room_code': room_code})

@app.route('/api/join_duel_room', methods=['POST'])
def join_duel_room():
    data = request.json
    room_code = data.get('room_code')
    user_id = data.get('user_id')
    
    if room_code not in duel_rooms:
        return jsonify({'status': 'error', 'message': 'Salon introuvable'})
    
    room = duel_rooms[room_code]
    if room['status'] != 'waiting':
        return jsonify({'status': 'error', 'message': 'Le salon n\'accepte plus de joueurs'})
    
    if len(room['players']) >= room['max_players']:
        return jsonify({'status': 'error', 'message': 'Le salon est complet'})
    
    if user_id not in room['players']:
        room['players'].append(user_id)
        
    return jsonify({'status': 'success'})

@app.route('/api/room_players', methods=['GET'])
def get_room_players():
    room_code = request.args.get('room_code')
    user_id = request.args.get('user_id')
    
    if room_code not in duel_rooms:
        return jsonify({'status': 'error', 'message': 'Salon introuvable'})
    
    room = duel_rooms[room_code]
    players = []
    
    with db.conn:
        cursor = db.conn.cursor()
        for player_id in room['players']:
            cursor.execute('SELECT username FROM users WHERE user_id = ?', (player_id,))
            result = cursor.fetchone()
            if result:
                players.append({
                    'user_id': player_id,
                    'username': result[0],
                    'is_host': player_id == room['players'][0]
                })
    
    return jsonify({
        'status': 'success',
        'players': players,
        'is_host': user_id == room['players'][0],
        'game_started': room['status'] == 'playing'
    })

@app.route('/api/start_duel', methods=['POST'])
def start_duel():
    data = request.json
    room_code = data.get('room_code')
    user_id = data.get('user_id')
    
    if room_code not in duel_rooms:
        return jsonify({'status': 'error', 'message': 'Salon introuvable'})
    
    room = duel_rooms[room_code]
    if user_id != room['players'][0]:
        return jsonify({'status': 'error', 'message': 'Seul l\'hôte peut démarrer la partie'})
    
    if len(room['players']) < 2:
        return jsonify({'status': 'error', 'message': 'Il faut au moins 2 joueurs pour démarrer'})
    
    room['status'] = 'playing'
    questions = db.get_questions_for_game(room['theme_id'])
    formatted_questions = []
    
    for q_type in [QuestionType.OPEN, QuestionType.QUAD, QuestionType.DUAL]:
        if q_type in questions:
            formatted_questions.extend(questions[q_type])
    
    random.shuffle(formatted_questions)
    room['questions'] = formatted_questions
    
    return jsonify({
        'status': 'success',
        'message': 'La partie va commencer',
        'first_question': formatted_questions[0]
    })

if __name__ == '__main__':
    app.run(debug=True)
