// Configuration
const TOLERANCE_PERCENTAGE = 2; // Tolérance de 2% pour détecter Bibi
const API_BASE = 'tables';

// Variables globales
let currentChallenge = null;
let playerNickname = null;
let startTime = null;
let timerInterval = null;
let zoomLevel = 1;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

// Elements DOM
const shareScoreBtn = document.getElementById('shareScoreBtn');
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
const alreadyPlayedMessage = document.getElementById('alreadyPlayedMessage');
const yourRank = document.getElementById('yourRank');
const victoryModal = document.getElementById('victoryModal');
const victoryTime = document.getElementById('victoryTime');
const victoryRank = document.getElementById('victoryRank');
const closeVictoryBtn = document.getElementById('closeVictoryBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const leaderboardList = document.getElementById('leaderboardList');


// Initialisation
document.addEventListener('DOMContentLoaded', init);

function init() {
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
    
    closeVictoryBtn.addEventListener('click', () => {
        victoryModal.classList.remove('show');
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
}

// Chargement du défi du jour
async function loadTodayChallenge() {
    try {
        loadingMessage.style.display = 'block';
        imageContainer.style.display = 'none';
        noChallengeMessage.style.display = 'none';
        alreadyPlayedMessage.style.display = 'none';
        
        const today = getTodayDateString();
        
        // Vérifier si le joueur a déjà joué aujourd'hui
        const hasPlayed = localStorage.getItem(`ouEstBibi_played_${today}`);
        if (hasPlayed === 'true') {
            const rank = localStorage.getItem(`ouEstBibi_rank_${today}`);
            loadingMessage.style.display = 'none';
            alreadyPlayedMessage.style.display = 'block';
            yourRank.textContent = rank || 'N/A';
            loadLeaderboard(today);
            return;
        }
        
        // Charger le défi du jour
        const response = await fetch(`${API_BASE}/challenges?search=${today}&limit=1`);
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            const challenge = result.data[0];
            if (challenge.active) {
                currentChallenge = challenge;
                loadingMessage.style.display = 'none';
                imageContainer.style.display = 'block';
                challengeImage.src = challenge.image_url;
                startTimer();
                loadLeaderboard(today);
            } else {
                showNoChallengeMessage();
            }
        } else {
            showNoChallengeMessage();
        }
    } catch (error) {
        console.error('Erreur lors du chargement du défi:', error);
        showNoChallengeMessage();
    }
}

function showNoChallengeMessage() {
    loadingMessage.style.display = 'none';
    noChallengeMessage.style.display = 'block';
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
    const bibiX = currentChallenge.bibi_x;
    const bibiY = currentChallenge.bibi_y;
    
    const distance = Math.sqrt(
        Math.pow(clickX - bibiX, 2) + Math.pow(clickY - bibiY, 2)
    );
    
    if (distance <= TOLERANCE_PERCENTAGE) {
        foundBibi();
    }
}

// Bibi trouvé!
async function foundBibi() {
    stopTimer();
    const timeSeconds = getElapsedTime();
    
    try {
        // Sauvegarder le score
        const scoreData = {
            challenge_id: currentChallenge.id,
            player_name: playerNickname,
            time_seconds: timeSeconds,
            date_completed: new Date().toISOString()
        };
        
        await fetch(`${API_BASE}/scores`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(scoreData)
        });
        
        // Calculer le rang
        const rank = await calculateRank(currentChallenge.id, timeSeconds);
        
        // Marquer comme joué aujourd'hui
        const today = getTodayDateString();
        localStorage.setItem(`ouEstBibi_played_${today}`, 'true');
        localStorage.setItem(`ouEstBibi_rank_${today}`, rank);
        
        // Afficher la victoire
        showVictory(timeSeconds, rank);
        
        // Recharger le classement
        await loadLeaderboard(today);
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du score:', error);
        alert('Erreur lors de la sauvegarde du score. Veuillez réessayer.');
    }
}

async function calculateRank(challengeId, timeSeconds) {
    try {
        const response = await fetch(`${API_BASE}/scores?limit=1000`);
        const result = await response.json();
        
        // Filtrer les scores pour ce défi et trier
        const challengeScores = result.data
            .filter(score => score.challenge_id === challengeId)
            .sort((a, b) => a.time_seconds - b.time_seconds);
        
        // Trouver le rang
        const rank = challengeScores.findIndex(score => 
            score.player_name === playerNickname && score.time_seconds === timeSeconds
        ) + 1;
        
        return rank + getRankSuffix(rank);
    } catch (error) {
        console.error('Erreur lors du calcul du rang:', error);
        return 'N/A';
    }
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
    victoryRank.textContent = rank;
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

// Classement
async function loadLeaderboard(date) {
    try {
        const response = await fetch(`${API_BASE}/scores?limit=1000`);
        const result = await response.json();
        
        // Trouver le défi du jour
        const challengeResponse = await fetch(`${API_BASE}/challenges?search=${date}&limit=1`);
        const challengeResult = await challengeResponse.json();
        
        if (!challengeResult.data || challengeResult.data.length === 0) {
            leaderboardList.innerHTML = '<p class="loading-text">Aucun défi aujourd\'hui</p>';
            return;
        }
        
        const todayChallenge = challengeResult.data[0];
        
        // Filtrer et trier les scores
        const todayScores = result.data
            .filter(score => score.challenge_id === todayChallenge.id)
            .sort((a, b) => a.time_seconds - b.time_seconds)
            .slice(0, 5);
        
        if (todayScores.length === 0) {
            leaderboardList.innerHTML = '<p class="loading-text">Aucun joueur encore</p>';
            return;
        }
        
        // Afficher le classement
        leaderboardList.innerHTML = todayScores.map((score, index) => {
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
        leaderboardList.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
    }
}

// Formatage du temps
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
