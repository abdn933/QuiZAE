// Configuration de l'API
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api', // Changer cette URL quand l'API sera déployée
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// Classe pour gérer les appels API
class QuizAPI {
    static async login(username, password) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async register(username, password) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/register`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async getThemes() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/themes`, {
                headers: API_CONFIG.HEADERS
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de récupération des thèmes:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async startGame(theme_id, user_id) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/start_game`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({ theme_id, user_id })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de démarrage du jeu:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async submitAnswer(gameId, answer, timeTaken) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/submit_answer`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    game_id: gameId,
                    answer: answer,
                    time_taken: timeTaken
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de soumission de réponse:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async getLeaderboard(theme = 'general') {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/leaderboard?theme=${theme}`, {
                headers: API_CONFIG.HEADERS
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de récupération du classement:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async createDuelRoom(theme_id, user_id) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/create_duel_room`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({ theme_id, user_id })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de création de salon:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async joinDuelRoom(room_code, user_id) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/join_duel_room`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({ room_code, user_id })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur pour rejoindre le salon:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async getRoomPlayers(room_code, user_id) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/room_players?room_code=${room_code}&user_id=${user_id}`, {
                headers: API_CONFIG.HEADERS
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de récupération des joueurs:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }

    static async startDuel(room_code, user_id) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/start_duel`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({ room_code, user_id })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur de démarrage du duel:', error);
            return { status: 'error', message: 'Erreur de connexion au serveur' };
        }
    }
}

// Modification des fonctions existantes pour utiliser l'API
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const response = await QuizAPI.login(username, password);
    if (response.status === 'success') {
        localStorage.setItem('user_id', response.user_id);
        localStorage.setItem('username', username);
        document.querySelector('.login-form').style.display = 'none';
        document.getElementById('playButton').style.display = 'block';
    } else {
        alert('Erreur de connexion: ' + response.message);
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const response = await QuizAPI.register(username, password);
    if (response.status === 'success') {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        await login();
    } else {
        alert('Erreur lors de l\'inscription: ' + response.message);
    }
}

async function showLeaderboard(theme) {
    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach(button => button.classList.remove('active'));
    event.target.classList.add('active');

    const response = await QuizAPI.getLeaderboard(theme);
    if (response.status === 'success') {
        updateLeaderboardDisplay(response.scores);
    }
}

async function createRoom() {
    const userId = localStorage.getItem('user_id');
    const themeId = localStorage.getItem('current_theme_id'); // Assurez-vous de stocker le thème sélectionné
    
    const response = await QuizAPI.createDuelRoom(themeId, userId);
    if (response.status === 'success') {
        currentRoomCode = response.room_code;
        isHost = true;
        showWaitingRoom();
        startPlayerUpdates();
    } else {
        alert('Erreur lors de la création du salon: ' + response.message);
    }
}

async function joinRoom() {
    const code = document.getElementById('roomCode').value;
    const userId = localStorage.getItem('user_id');
    
    if (code.length === 4) {
        const response = await QuizAPI.joinDuelRoom(code, userId);
        if (response.status === 'success') {
            currentRoomCode = code;
            isHost = false;
            showWaitingRoom();
            startPlayerUpdates();
        } else {
            alert(response.message);
            backToMenu();
        }
    } else {
        alert('Veuillez entrer un code à 4 chiffres');
    }
}

async function updatePlayerList() {
    const userId = localStorage.getItem('user_id');
    const response = await QuizAPI.getRoomPlayers(currentRoomCode, userId);
    
    if (response.status === 'success') {
        const playerList = document.getElementById('playerList');
        playerList.innerHTML = '';
        
        response.players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.innerHTML = `
                <span>${player.username}</span>
                ${player.is_host ? '<span class="host-badge">Hôte</span>' : ''}
            `;
            playerList.appendChild(div);
        });

        if (isHost) {
            const startButton = document.getElementById('startButton');
            startButton.disabled = response.players.length < 2;
        }

        if (response.game_started) {
            window.location.href = 'quiz.html';
        }
    }
}

async function startDuel() {
    const userId = localStorage.getItem('user_id');
    const response = await QuizAPI.startDuel(currentRoomCode, userId);
    
    if (response.status === 'success') {
        localStorage.setItem('current_game_id', response.game_id);
        window.location.href = 'quiz.html';
    } else {
        alert('Erreur lors du démarrage du duel: ' + response.message);
    }
}

// Fonction utilitaire pour vérifier l'état de la connexion
function checkAuth() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = '/';
        return false;
    }
    return true;
}