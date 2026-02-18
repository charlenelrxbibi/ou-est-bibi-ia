// Configuration
const ADMIN_PASSWORD = 'Bibi2026@'; // Mot de passe par défaut
const API_BASE = 'tables';

// Variables globales
let isAuthenticated = false;
let bibiPosition = { x: null, y: null };

// Elements DOM
const loginModal = document.getElementById('loginModal');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const adminPanel = document.getElementById('adminPanel');
const logoutBtn = document.getElementById('logoutBtn');

// Form elements
const addChallengeForm = document.getElementById('addChallengeForm');
const challengeDate = document.getElementById('challengeDate');
const imageUrl = document.getElementById('imageUrl');
const loadImageBtn = document.getElementById('loadImageBtn');
const imagePreview = document.getElementById('imagePreview');
const noImageText = document.getElementById('noImageText');
const bibiPositionGroup = document.getElementById('bibiPositionGroup');
const clickableImageContainer = document.getElementById('clickableImageContainer');
const clickableImage = document.getElementById('clickableImage');
const bibiMarker = document.getElementById('bibiMarker');
const bibiX = document.getElementById('bibiX');
const bibiY = document.getElementById('bibiY');
const activeCheckbox = document.getElementById('activeCheckbox');

// Lists
const challengesList = document.getElementById('challengesList');

// Stats
const totalChallenges = document.getElementById('totalChallenges');
const totalPlayers = document.getElementById('totalPlayers');
const totalScores = document.getElementById('totalScores');

// Initialisation
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupEventListeners();
    checkAuthentication();
}

// Event Listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    logoutBtn.addEventListener('click', handleLogout);
    loadImageBtn.addEventListener('click', loadImage);
    clickableImage.addEventListener('click', handleImageClick);
    addChallengeForm.addEventListener('submit', handleAddChallenge);
}

// Authentification
function checkAuthentication() {
    const auth = sessionStorage.getItem('ouEstBibiAdmin');
    if (auth === 'true') {
        isAuthenticated = true;
        showAdminPanel();
    }
}

function handleLogin() {
    const password = passwordInput.value.trim();
    if (password === ADMIN_PASSWORD) {
        isAuthenticated = true;
        sessionStorage.setItem('ouEstBibiAdmin', 'true');
        showAdminPanel();
    } else {
        alert('Mot de passe incorrect');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function handleLogout() {
    sessionStorage.removeItem('ouEstBibiAdmin');
    isAuthenticated = false;
    adminPanel.style.display = 'none';
    loginModal.classList.add('show');
    passwordInput.value = '';
}

function showAdminPanel() {
    loginModal.classList.remove('show');
    adminPanel.style.display = 'block';
    loadChallenges();
    loadStatistics();
    setDefaultDate();
}

function setDefaultDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    challengeDate.value = dateStr;
}

// Chargement de l'image
function loadImage() {
    const url = imageUrl.value.trim();
    if (!url) {
        alert('Veuillez entrer une URL d\'image');
        return;
    }
    
    // Vérifier que c'est une URL valide
    try {
        new URL(url);
    } catch (e) {
        alert('URL invalide');
        return;
    }
    
    // Charger l'image
    imagePreview.src = url;
    clickableImage.src = url;
    
    imagePreview.onload = () => {
        noImageText.style.display = 'none';
        imagePreview.style.display = 'block';
        bibiPositionGroup.style.display = 'block';
        bibiPosition = { x: null, y: null };
        bibiMarker.style.display = 'none';
        bibiX.textContent = '-';
        bibiY.textContent = '-';
    };
    
    imagePreview.onerror = () => {
        alert('Impossible de charger l\'image. Vérifiez l\'URL.');
        imagePreview.style.display = 'none';
        noImageText.style.display = 'block';
    };
}

// Gestion du clic sur l'image pour positionner Bibi
function handleImageClick(e) {
    const rect = clickableImage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);
    
    bibiPosition.x = parseFloat(x);
    bibiPosition.y = parseFloat(y);
    
    // Afficher le marqueur
    bibiMarker.style.left = x + '%';
    bibiMarker.style.top = y + '%';
    bibiMarker.style.display = 'block';
    
    // Afficher les coordonnées
    bibiX.textContent = x;
    bibiY.textContent = y;
}

// Ajout d'un défi
async function handleAddChallenge(e) {
    e.preventDefault();
    
    // Validation
    if (!imageUrl.value.trim()) {
        alert('Veuillez entrer une URL d\'image');
        return;
    }
    
    if (bibiPosition.x === null || bibiPosition.y === null) {
        alert('Veuillez cliquer sur l\'image pour positionner Bibi');
        return;
    }
    
    if (!challengeDate.value) {
        alert('Veuillez sélectionner une date');
        return;
    }
    
    try {
        // Créer le défi
        const challengeData = {
            date: challengeDate.value,
            image_url: imageUrl.value.trim(),
            bibi_x: bibiPosition.x,
            bibi_y: bibiPosition.y,
            active: activeCheckbox.checked
        };
        
        const response = await fetch(`${API_BASE}/challenges`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(challengeData)
        });
        
        if (response.ok) {
            alert('Défi ajouté avec succès!');
            resetForm();
            loadChallenges();
            loadStatistics();
        } else {
            alert('Erreur lors de l\'ajout du défi');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du défi');
    }
}

function resetForm() {
    addChallengeForm.reset();
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    clickableImage.src = '';
    noImageText.style.display = 'block';
    bibiPositionGroup.style.display = 'none';
    bibiPosition = { x: null, y: null };
    bibiMarker.style.display = 'none';
    bibiX.textContent = '-';
    bibiY.textContent = '-';
    setDefaultDate();
}

// Chargement des défis
async function loadChallenges() {
    try {
        const response = await fetch(`${API_BASE}/challenges?limit=100&sort=-date`);
        const result = await response.json();
        
        if (!result.data || result.data.length === 0) {
            challengesList.innerHTML = '<p class="loading-text">Aucun défi créé</p>';
            return;
        }
        
        // Trier par date (plus récent en premier)
        const challenges = result.data.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        challengesList.innerHTML = challenges.map(challenge => {
            const dateObj = new Date(challenge.date);
            const dateStr = dateObj.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const statusClass = challenge.active ? 'active' : 'inactive';
            const statusText = challenge.active ? 'Actif' : 'Inactif';
            
            return `
                <div class="challenge-card">
                    <img src="${challenge.image_url}" alt="Défi ${challenge.date}" class="challenge-thumbnail">
                    <div class="challenge-info">
                        <div class="challenge-date">${dateStr}</div>
                        <div class="challenge-status ${statusClass}">${statusText}</div>
                        <div>Position: X=${challenge.bibi_x.toFixed(2)}%, Y=${challenge.bibi_y.toFixed(2)}%</div>
                    </div>
                    <div class="challenge-actions">
                        <button class="btn-secondary btn-small" onclick="toggleChallengeStatus('${challenge.id}', ${!challenge.active})">
                            ${challenge.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button class="btn-danger btn-small" onclick="deleteChallenge('${challenge.id}')">
                            Supprimer
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
        challengesList.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
    }
}

// Toggle status d'un défi
async function toggleChallengeStatus(challengeId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/challenges/${challengeId}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ active: newStatus })
        });
        
        if (response.ok) {
            loadChallenges();
        } else {
            alert('Erreur lors de la modification du statut');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la modification du statut');
    }
}

// Suppression d'un défi
async function deleteChallenge(challengeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce défi?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/challenges/${challengeId}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            alert('Défi supprimé');
            loadChallenges();
            loadStatistics();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
    }
}

// Chargement des statistiques
async function loadStatistics() {
    try {
        // Nombre de défis
        const challengesResponse = await fetch(`${API_BASE}/challenges?limit=1000`);
        const challengesResult = await challengesResponse.json();
        totalChallenges.textContent = challengesResult.total || challengesResult.data.length || 0;
        
        // Nombre de scores
        const scoresResponse = await fetch(`${API_BASE}/scores?limit=1000`);
        const scoresResult = await scoresResponse.json();
        totalScores.textContent = scoresResult.total || scoresResult.data.length || 0;
        
        // Nombre de joueurs uniques
        const uniquePlayers = new Set(scoresResult.data.map(score => score.player_name));
        totalPlayers.textContent = uniquePlayers.size;
        
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Rendre les fonctions globales pour les boutons
window.toggleChallengeStatus = toggleChallengeStatus;
window.deleteChallenge = deleteChallenge;
