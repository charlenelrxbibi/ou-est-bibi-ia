// Configuration
const TOLERANCE_PERCENTAGE = 8; // Tolérance de 8% pour détecter Bibi
const API_BASE = 'tables';

// Restaurer les défis par défaut si localStorage est vide
function initializeDefaultChallenges() {
    const today = new Date().toISOString().split('T')[0];
    const existingChallenges = localStorage.getItem('challenges');
    let challenges = [];
    
    if (existingChallenges) {
        challenges = JSON.parse(existingChallenges);
    }
    
    // Vérifier si défi pour aujourd'hui existe
    const hasTodayChallenge = challenges.some(c => c.date === today);
    
    if (!hasTodayChallenge) {
        const defaultChallenge = {
            id: Date.now().toString(),
            date: today,
            image_url: 'images/27_fevrier.png',
            bibi_x: 50,
            bibi_y: 50,
            active: true
        };
        challenges.push(defaultChallenge);
        localStorage.setItem('challenges', JSON.stringify(challenges));
        console.log('✅ Défi pour ' + today + ' créé/restauré');
    } else {
        console.log('✅ Défi pour ' + today + ' existe déjà');
    }
}

// Initialiser les défis au chargement
initializeDefaultChallenges();

// Utilitaires localStorage
function getChallengesFromStorage() {
    const data = localStorage.getItem('challenges');
    console.log('getChallengesFromStorage: données brutes taille:', data?.length || 0);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            console.log('getChallengesFromStorage: Nombre de défis:', parsed.length);
            // Afficher un résumé de chaque défi
            parsed.forEach((c, i) => {
                console.log(`  Défi ${i}: date=${c.date}, image_url type=${c.image_url?.substring(0, 30)}...`);
            });
            return parsed;
        } catch (e) {
            console.error('Erreur parsing localStorage:', e);
            return [];
        }
    }
    return [];
}

function getChallengeByDate(dateString) {
    const challenges = getChallengesFromStorage();
    console.log('getChallengeByDate: Cherche défi pour date:', dateString);
    console.log('getChallengeByDate: Défis disponibles:', challenges.map(c => ({date: c.date, hasImage: !!c.image_url})));
    const found = challenges.find(c => c.date === dateString);
    console.log('getChallengeByDate: Défi trouvé?', !!found);
    if (found) {
        console.log('getChallengeByDate: Image présente?', !!found.image_url);
        console.log('getChallengeByDate: Longueur image:', found.image_url?.length || 0);
    }
    return found;
}

function getScoresFromStorage() {
    const data = localStorage.getItem('scores');
    return data ? JSON.parse(data) : [];
}

// Variables globales
let currentChallenge = null;
let playerNickname = null;
let startTime = null;
let timerInterval = null;
let zoomLevel = 1;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;
let haFoundBibi = false; // Empêcher les clics multiples

// Elements DOM
const shareScoreBtn = document.getElementById('shareBtn');
const shareTwitter = document.getElementById('shareTwitter');
const shareTiktok = document.getElementById('shareTiktok');
const shareInstagram = document.getElementById('shareInstagram');
const shareFacebook = document.getElementById('shareFacebook');
const shareMenu = document.getElementById('shareMenu');
const nicknameModal = document.getElementById('nicknameModal');
const nicknameInput = document.getElementById('nicknameInput');
const startGameBtn = document.getElementById('startGameBtn');
const displayNickname = document.getElementById('displayNickname');
const changeNicknameBtn = document.getElementById('changeNicknameBtn');
const timer = document.getElementById('timer');
const challengeImage = document.getElementById('challengeImage');
const imageContainer = document.getElementById('imageContainer');
const clickMarker = document.getElementById('clickMarker');
const loadingMessage = document.getElementById('loadingMessage');
const noChallengeMessage = document.getElementById('noChallengeMessage');
const gameInfoSection = document.getElementById('gameInfoSection');
const alreadyPlayedInfo = document.getElementById('alreadyPlayedInfo');
const victoryModal = document.getElementById('victoryModal');
const victoryTime = document.getElementById('victoryTime');
const closeVictoryBtn = document.getElementById('closeVictoryBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardListAlreadyPlayed = document.getElementById('leaderboardListAlreadyPlayed');
const globalLeaderboardSection = document.getElementById('globalLeaderboardSection');
const globalLeaderboardList = document.getElementById('globalLeaderboardList');
const toggleLeaderboardBtn = document.getElementById('toggleLeaderboardBtn');
const gameSection = document.querySelector('.game-section');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');

// Gestion du thème sombre/clair
function initTheme() {
    const savedTheme = localStorage.getItem('ouEstBibiTheme') || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
        document.body.classList.add('dark-mode');
        toggleThemeBtn.classList.remove('fa-moon');
        toggleThemeBtn.classList.add('fa-sun');
        toggleThemeBtn.setAttribute('title', 'Mode clair');
    } else {
        document.body.classList.remove('dark-mode');
        toggleThemeBtn.classList.remove('fa-sun');
        toggleThemeBtn.classList.add('fa-moon');
        toggleThemeBtn.setAttribute('title', 'Mode sombre');
    }
    localStorage.setItem('ouEstBibiTheme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('ouEstBibiTheme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// Initialisation
document.addEventListener('DOMContentLoaded', init);

function init() {
    initTheme();
    loadNickname();
    setupEventListeners();
}

// Gestion du pseudo
function loadNickname() {
    playerNickname = localStorage.getItem('ouEstBibiNickname');
    if (playerNickname) {
        displayNickname.textContent = playerNickname;
        loadTodayChallenge();
    } else {
        showNicknameModal();
    }
}

function showNicknameModal() {
    nicknameModal.classList.add('show');
    nicknameInput.focus();
}

function hideNicknameModal() {
    nicknameModal.classList.remove('show');
}

function saveNickname() {
    const nickname = nicknameInput.value.trim();
    if (nickname.length < 2) {
        alert('Le pseudo doit contenir au moins 2 caractères');
        return;
    }
    playerNickname = nickname;
    localStorage.setItem('ouEstBibiNickname', nickname);
    displayNickname.textContent = nickname;
    hideNicknameModal();
    loadTodayChallenge();
}

// Event Listeners
function setupEventListeners() {
    startGameBtn.addEventListener('click', saveNickname);
    nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveNickname();
    });
    
    changeNicknameBtn.addEventListener('click', () => {
        nicknameInput.value = playerNickname;
        showNicknameModal();
    });
    
    toggleThemeBtn.addEventListener('click', toggleTheme);
    
    closeVictoryBtn.addEventListener('click', () => {
        victoryModal.classList.remove('show');
        // Afficher l'écran "déjà joué" avec le classement
        showLeaderboardAfterVictory();
    });
    
    // Zoom controls
    zoomInBtn.addEventListener('click', () => zoom(0.2));
    zoomOutBtn.addEventListener('click', () => zoom(-0.2));
    zoomResetBtn.addEventListener('click', resetZoom);
    
    // Click sur l'image
    imageContainer.addEventListener('click', handleImageClick);
    
    // Drag pour mobile et desktop
    imageContainer.addEventListener('mousedown', startDrag);
    imageContainer.addEventListener('mousemove', drag);
    imageContainer.addEventListener('mouseup', endDrag);
    imageContainer.addEventListener('mouseleave', endDrag);
    
    // Touch events pour mobile
    imageContainer.addEventListener('touchstart', handleTouchStart, {passive: false});
    imageContainer.addEventListener('touchmove', handleTouchMove, {passive: false});
    imageContainer.addEventListener('touchend', endDrag);
    
    // Toggle classement général
    if (toggleLeaderboardBtn) {
        toggleLeaderboardBtn.addEventListener('click', toggleLeaderboardView);
    }
    
    // Share buttons
    if (shareScoreBtn) {
        shareScoreBtn.addEventListener('click', () => {
            shareMenu.style.display = shareMenu.style.display === 'none' ? 'grid' : 'none';
        });
    }
    
    if (shareTwitter) {
        shareTwitter.addEventListener('click', () => {
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
            shareOnPlatform('twitter', timeSeconds);
            shareMenu.style.display = 'none';
        });
    }
    
    if (shareTiktok) {
        shareTiktok.addEventListener('click', () => {
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
            shareOnPlatform('tiktok', timeSeconds);
            shareMenu.style.display = 'none';
        });
    }
    
    if (shareInstagram) {
        shareInstagram.addEventListener('click', () => {
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
            shareOnPlatform('instagram', timeSeconds);
            shareMenu.style.display = 'none';
        });
    }
    
    if (shareFacebook) {
        shareFacebook.addEventListener('click', () => {
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
            shareOnPlatform('facebook', timeSeconds);
            shareMenu.style.display = 'none';
        });
    }
}

// Chargement du défi du jour
async function loadTodayChallenge() {
    try {
        loadingMessage.style.display = 'block';
        imageContainer.style.display = 'none';
        noChallengeMessage.style.display = 'none';
        gameInfoSection.style.display = 'flex';
        alreadyPlayedInfo.style.display = 'none';
        if (gameSection) gameSection.style.display = 'grid';
        
        // Réinitialiser le drapeau de victoire
        haFoundBibi = false;
        
        const today = getTodayDateString();
        console.log('Chargement du défi pour la date:', today);
        
        // Vérifier si le joueur a déjà joué aujourd'hui
        const hasPlayed = localStorage.getItem(`ouEstBibi_played_${today}`);
        if (hasPlayed === 'true') {
            loadingMessage.style.display = 'none';
            gameInfoSection.style.display = 'none';
            if (gameSection) gameSection.style.display = 'none';
            alreadyPlayedInfo.style.display = 'block';
            imageContainer.style.display = 'none';
            
            // Charger le TOP 3 + l'utilisateur en dessous
            loadLeaderboardWithUserHighlight(today, leaderboardListAlreadyPlayed, playerNickname);
            
            // Charger le classement général
            loadGlobalLeaderboard();
            
            return;
        }
        
        // Charger le défi du jour depuis localStorage
        const allChallenges = getChallengesFromStorage();
        console.log('Tous les défis sauvegardés:', allChallenges);
        
        const challenge = getChallengeByDate(today);
        console.log('Défi trouvé pour aujourd\'hui:', challenge);
        
        if (challenge && challenge.active) {
            currentChallenge = challenge;
            loadingMessage.style.display = 'none';
            gameInfoSection.style.display = 'flex';
            alreadyPlayedInfo.style.display = 'none';
            imageContainer.style.display = 'block';
            console.log('=== CHARGEMENT IMAGE ===');
            console.log('Avant d\'assigner src, challenge.image_url présent?', !!challenge.image_url);
            console.log('Type de image_url:', typeof challenge.image_url);
            console.log('Premiers 100 chars:', challenge.image_url?.substring(0, 100) || 'undefined');
            console.log('Longueur totale:', challenge.image_url?.length || 0);
            
            challengeImage.src = challenge.image_url;
            console.log('✓ src assigné au img tag');
            console.log('img.src actuellement:', challengeImage.src.substring(0, 100) || 'vide');
            
            challengeImage.onload = () => {
                console.log('✓✓ onload déclenché - Image chargée avec succès, dimensions:', challengeImage.width, 'x', challengeImage.height);
            };
            challengeImage.onerror = () => {
                console.error('✗✗ onerror déclenché - Erreur lors du chargement de l\'image');
                console.error('src utilisé:', challengeImage.src.substring(0, 100));
                console.error('Vérification img: naturalWidth=', challengeImage.naturalWidth, 'complete=', challengeImage.complete);
            };
            startTimer();
            loadLeaderboard(today, leaderboardList, 3);
        } else {
            console.warn('Pas de défi actif pour aujourd\'hui');
            console.warn('Défi trouvé?', !!challenge, 'Actif?', challenge?.active);
            showNoChallengeMessage();
        }
    } catch (error) {
        console.error('Erreur lors du chargement du défi:', error);
        showNoChallengeMessage();
    }
}

function showNoChallengeMessage() {
    loadingMessage.style.display = 'none';
    gameInfoSection.style.display = 'flex';
    gameInfoSection.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666; font-size: 1.2em;">
            <i style="font-size: 3em; color: #999; margin-bottom: 20px;" class="fas fa-calendar-xmark"></i>
            <p><strong>Pas de défi pour aujourd'hui</strong></p>
            <p style="font-size: 0.9em;">Revenez demain pour un nouveau défi!</p>
        </div>
    `;
    alreadyPlayedInfo.style.display = 'none';
    imageContainer.style.display = 'none';
    if (gameSection) gameSection.style.display = 'grid';
    noChallengeMessage.style.display = 'none';
}

function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    timer.textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function getElapsedTime() {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
}

// Zoom et Pan
function zoom(delta) {
    zoomLevel += delta;
    zoomLevel = Math.max(1, Math.min(3, zoomLevel));
    challengeImage.style.transform = `scale(${zoomLevel})`;
}

function resetZoom() {
    zoomLevel = 1;
    challengeImage.style.transform = 'scale(1)';
    imageContainer.scrollLeft = 0;
    imageContainer.scrollTop = 0;
}

function startDrag(e) {
    if (zoomLevel <= 1) return;
    isDragging = true;
    imageContainer.style.cursor = 'grabbing';
    startX = e.pageX - imageContainer.offsetLeft;
    startY = e.pageY - imageContainer.offsetTop;
    scrollLeft = imageContainer.scrollLeft;
    scrollTop = imageContainer.scrollTop;
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - imageContainer.offsetLeft;
    const y = e.pageY - imageContainer.offsetTop;
    const walkX = (x - startX) * 2;
    const walkY = (y - startY) * 2;
    imageContainer.scrollLeft = scrollLeft - walkX;
    imageContainer.scrollTop = scrollTop - walkY;
}

function endDrag() {
    isDragging = false;
    imageContainer.style.cursor = 'crosshair';
}

let lastTouchX, lastTouchY;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && zoomLevel > 1) {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = (lastTouchX - touchX) * 2;
        const deltaY = (lastTouchY - touchY) * 2;
        imageContainer.scrollLeft += deltaX;
        imageContainer.scrollTop += deltaY;
        lastTouchX = touchX;
        lastTouchY = touchY;
    }
}

// Gestion du clic sur l'image
function handleImageClick(e) {
    if (!currentChallenge || isDragging) return;
    
    const rect = challengeImage.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Position du clic relative à l'image
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    
    // Afficher le marqueur de clic
    showClickMarker(e.clientX - containerRect.left, e.clientY - containerRect.top);
    
    // Vérifier si c'est proche de Bibi
    checkIfFoundBibi(x, y);
}

function showClickMarker(x, y) {
    clickMarker.style.left = x + 'px';
    clickMarker.style.top = y + 'px';
    clickMarker.style.display = 'block';
    
    setTimeout(() => {
        clickMarker.style.display = 'none';
    }, 500);
}

function checkIfFoundBibi(clickX, clickY) {
    // Empêcher les clics multiples après la première victoire
    if (haFoundBibi) return;
    
    const bibiX = currentChallenge.bibi_x;
    const bibiY = currentChallenge.bibi_y;
    
    const distance = Math.sqrt(
        Math.pow(clickX - bibiX, 2) + Math.pow(clickY - bibiY, 2)
    );
    
    if (distance <= TOLERANCE_PERCENTAGE) {
        foundBibi();
    }
}

// Animation de confettis 🎊
function showConfetti() {
    const confettiCount = 80;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.width = (Math.random() * 8 + 4) + 'px';
        confetti.style.height = (Math.random() * 8 + 4) + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10000';
        confetti.style.opacity = '0.8';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        // Animation
        const duration = Math.random() * 2 + 2; // 2-4 secondes
        const xDistance = (Math.random() - 0.5) * 400;
        const yDistance = window.innerHeight + 20;
        const rotation = Math.random() * 720;
        
        confetti.animate([
            {
                transform: `translateX(0) translateY(0) rotate(0deg)`,
                opacity: 0.8
            },
            {
                transform: `translateX(${xDistance}px) translateY(${yDistance}px) rotate(${rotation}deg)`,
                opacity: 0
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
}

// Bibi trouvé!
function foundBibi() {
    // Empêcher les clics multiples
    haFoundBibi = true;
    
    stopTimer();
    const timeSeconds = getElapsedTime();
    
    try {
        // Sauvegarder le score dans localStorage
        const scoreData = {
            id: Date.now().toString(),
            challenge_id: currentChallenge.id,
            player_name: playerNickname,
            time_seconds: timeSeconds,
            date_completed: new Date().toISOString()
        };
        
        // Ajouter le score à localStorage
        let scores = getScoresFromStorage();
        scores.push(scoreData);
        localStorage.setItem('scores', JSON.stringify(scores));
        
        // Calculer le rang
        const rank = calculateRank(currentChallenge.id, timeSeconds);
        
        // Marquer comme joué aujourd'hui
        const today = getTodayDateString();
        localStorage.setItem(`ouEstBibi_played_${today}`, 'true');
        localStorage.setItem(`ouEstBibi_rank_${today}`, rank);
        
        // Afficher les confettis! 🎊
        showConfetti();
        
        // Afficher la victoire
        showVictory(timeSeconds, rank);
        
        // Recharger le classement (Top 3)
        loadLeaderboard(today, leaderboardList, 3);
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du score:', error);
        alert('Erreur lors de la sauvegarde du score. Veuillez réessayer.');
        haFoundBibi = false; // Réinitialiser si erreur
    }
}

function calculateRank(challengeId, timeSeconds) {
  try {
    const scores = getScoresFromStorage();

    const cid = String(challengeId);
    const t = Number(timeSeconds);

    const challengeScores = scores
      .filter(s => String(s.challenge_id) === cid || s.id === cid)
      .sort((a, b) => Number(a.time_seconds) - Number(b.time_seconds));

    const rank = challengeScores.filter(s => Number(s.time_seconds) < t).length + 1;

    return rank; // <-- un nombre (ex: 3)
  } catch (error) {
    console.error("Erreur lors du calcul du rang:", error);
    return null;
  }
}

// Afficher le classement après victoire
function showLeaderboardAfterVictory() {
    const today = getTodayDateString();
    
    // Masquer le jeu et afficher l'écran "déjà joué"
    gameInfoSection.style.display = 'none';
    if (gameSection) gameSection.style.display = 'none';
    imageContainer.style.display = 'none';
    alreadyPlayedInfo.style.display = 'block';
    
    // Charger le TOP 3 + l'utilisateur en dessous
    loadLeaderboardWithUserHighlight(today, leaderboardListAlreadyPlayed, playerNickname);
    
    // Charger le classement général
    loadGlobalLeaderboard();
}

function getRankSuffix(rank) {
    if (rank === 1) return 'er';
    return 'ème';
}

function showVictory(timeSeconds, rank) {
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    victoryTime.textContent = timeStr;

    const rankText = Number.isFinite(rank) ? `${rank}${getRankSuffix(rank)}` : "—";
    victoryRank.textContent = rankText;
    
    victoryModal.classList.add('show');
    shareScoreBtn.onclick = () => shareScore(timeSeconds);
    if (typeof confetti === "function") {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 }
  });
}
}

// Classement avec affichage de l'utilisateur
function loadLeaderboardWithUserHighlight(date, targetElement, playerName) {
    try {
        const target = targetElement || leaderboardList;
        const scores = getScoresFromStorage();
        
        // Trouver le défi du jour
        const todayChallenge = getChallengeByDate(date);
        
        if (!todayChallenge) {
            target.innerHTML = '<p class="loading-text">Aucun défi aujourd\'hui</p>';
            return;
        }
        
        // Filtrer et trier tous les scores du jour
        const allTodayScores = scores
            .filter(score => String(score.challenge_id) === String(todayChallenge.id) || score.id === todayChallenge.id)
            .sort((a, b) => a.time_seconds - b.time_seconds);
        
        if (allTodayScores.length === 0) {
            target.innerHTML = '<p class="loading-text">Aucun joueur encore</p>';
            return;
        }
        
        // Obtenir le top 3
        const top3 = allTodayScores.slice(0, 3);
        
        // Trouver le rang de l'utilisateur
        const userScore = allTodayScores.find(s => s.player_name === playerName);
        const userRank = allTodayScores.indexOf(userScore) + 1;
        
        // Construire HTML du top 3
        let html = top3.map((score, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const minutes = Math.floor(score.time_seconds / 60);
            const seconds = score.time_seconds % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${rank}</span>
                    <span class="leaderboard-player">${score.player_name}</span>
                    <span class="leaderboard-time">${timeStr}</span>
                </div>
            `;
        }).join('');
        
        // Si l'utilisateur n'est pas dans le top 3, l'afficher en dessous
        if (userRank > 3 && userScore) {
            const minutes = Math.floor(userScore.time_seconds / 60);
            const seconds = userScore.time_seconds % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            html += `
                <div class="leaderboard-separator">
                    <span>···</span>
                </div>
                <div class="leaderboard-item user-highlight">
                    <span class="leaderboard-rank">${userRank}</span>
                    <span class="leaderboard-player">${userScore.player_name}</span>
                    <span class="leaderboard-time">${timeStr}</span>
                </div>
            `;
        }
        
        target.innerHTML = html;
        
    } catch (error) {
        console.error('Erreur lors du chargement du classement:', error);
        const target = targetElement || leaderboardList;
        target.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
    }
}

// Classement
function loadLeaderboard(date, targetElement = null, limit = 5) {
    try {
        // Utiliser l'élément target fourni ou le défaut
        const target = targetElement || leaderboardList;
        
        const scores = getScoresFromStorage();
        
        // Trouver le défi du jour
        const todayChallenge = getChallengeByDate(date);
        
        if (!todayChallenge) {
            target.innerHTML = '<p class="loading-text">Aucun défi aujourd\'hui</p>';
            return;
        }
        
        // Filtrer et trier les scores
        const todayScores = scores
            .filter(score => String(score.challenge_id) === String(todayChallenge.id) || score.id === todayChallenge.id)
            .sort((a, b) => a.time_seconds - b.time_seconds)
            .slice(0, limit);
        
        if (todayScores.length === 0) {
            target.innerHTML = '<p class="loading-text">Aucun joueur encore</p>';
            return;
        }
        
        // Afficher le classement
        target.innerHTML = todayScores.map((score, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const minutes = Math.floor(score.time_seconds / 60);
            const seconds = score.time_seconds % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${rank}</span>
                    <span class="leaderboard-player">${score.player_name}</span>
                    <span class="leaderboard-time">${timeStr}</span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erreur lors du chargement du classement:', error);
        const target = targetElement || leaderboardList;
        target.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
    }
}

// Formatage du temps
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculer le rang global d'un joueur
function calculateGlobalRank(playerName) {
    try {
        const scores = getScoresFromStorage();
        
        // Calculer le score total par joueur (nombre de victoires)
        const playerScores = {};
        scores.forEach(score => {
            if (!playerScores[score.player_name]) {
                playerScores[score.player_name] = 0;
            }
            playerScores[score.player_name]++;
        });
        
        // Créer une liste triée
        const rankedPlayers = Object.entries(playerScores)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], index) => ({
                rank: index + 1,
                name: name,
                wins: count
            }));
        
        // Trouver le rang du joueur
        const playerRank = rankedPlayers.find(p => p.name === playerName);
        return playerRank ? playerRank.rank : null;
    } catch (error) {
        console.error('Erreur calcul rang global:', error);
        return null;
    }
}

// Charger le classement global
function loadGlobalLeaderboard() {
    try {
        const scores = getScoresFromStorage();
        
        // Calculer le score total par joueur
        const playerScores = {};
        scores.forEach(score => {
            if (!playerScores[score.player_name]) {
                playerScores[score.player_name] = { wins: 0, totalTime: 0, count: 0 };
            }
            playerScores[score.player_name].wins++;
            playerScores[score.player_name].totalTime += score.time_seconds;
            playerScores[score.player_name].count++;
        });
        
        // Créer une liste triée par nombre de victoires, puis par temps moyen
        const rankedPlayers = Object.entries(playerScores)
            .map(([name, stats]) => ({
                name: name,
                wins: stats.wins,
                avgTime: stats.totalTime / stats.count,
                totalTime: stats.totalTime
            }))
            .sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins; // Plus de victoires en premier
                return a.avgTime - b.avgTime; // Si égalité, par temps moyen
            })
            .slice(0, 20); // Top 20 global
        
        if (rankedPlayers.length === 0) {
            globalLeaderboardList.innerHTML = '<p class="loading-text">Aucun joueur encore</p>';
            return;
        }
        
        // Afficher le classement global
        globalLeaderboardList.innerHTML = rankedPlayers.map((player, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const avgMinutes = Math.floor(player.avgTime / 60);
            const avgSeconds = Math.floor(player.avgTime % 60);
            const avgTimeStr = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
            
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${rank}</span>
                    <span class="leaderboard-player">${player.name}</span>
                    <span class="leaderboard-time">${player.wins} victoires • ${avgTimeStr} moy.</span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erreur chargement classement global:', error);
        globalLeaderboardList.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
    }
}

// Basculer entre affichage du top du jour et classement global
function toggleLeaderboardView() {
    const isShowingGlobal = globalLeaderboardSection.style.display !== 'none';
    
    if (isShowingGlobal) {
        // Masquer classement global, afficher top du jour
        globalLeaderboardSection.style.display = 'none';
        toggleLeaderboardBtn.textContent = 'Voir le classement général';
        toggleLeaderboardBtn.classList.remove('active');
    } else {
        // Afficher classement global, masquer top du jour
        globalLeaderboardSection.style.display = 'block';
        toggleLeaderboardBtn.textContent = 'Voir le top du jour';
        toggleLeaderboardBtn.classList.add('active');
    }
}

async function shareScore(timeSeconds) {
  const text = `J’ai trouvé Bibi en ${formatTime(timeSeconds)} 🧦🔍\nEssaie de faire mieux : ${window.location.href}`;

  // Mobile / navigateurs compatibles
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Où est Bibi ?', text });
      return;
    } catch (e) {
      // si annulation, on ignore
    }
  }

  // Fallback : copie + twitter
  try { await navigator.clipboard.writeText(text); } catch (e) {}
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
}
function shareOnPlatform(platform, timeSeconds) {
  const time = formatTime(timeSeconds);
  const text = `J'ai trouvé Bibi en ${time} 🧦🔍`;
  const url = window.location.href;

  let shareUrl = '';
  
  switch(platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      break;
    case 'tiktok':
      // TikTok n'a pas d'API de partage direct, on copie le texte
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('⏭️ Texte copié ! Tu peux le coller dans TikTok');
      return;
    case 'instagram':
      // Instagram Story ne supporte pas le partage direct depuis le web
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('📸 Texte copié ! Tu peux le coller dans ta Story Instagram');
      return;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}