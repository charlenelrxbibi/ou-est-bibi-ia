// Configuration
const ADMIN_PASSWORD = 'Bibi2026@'; // Mot de passe par défaut
const API_BASE = 'tables';
const USE_LOCAL_STORAGE = true; // Utiliser localStorage au lieu de Supabase
let supabaseClient = null;

try {
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
} catch (e) {
    console.warn('Supabase non disponible, utilisation de localStorage', e);
}

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
const imageFile = document.getElementById('imageFile');

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

// ====== FONCTIONS LOCALSTORAGE ======
function getChallengesFromStorage() {
    const data = localStorage.getItem('challenges');
    return data ? JSON.parse(data) : [];
}

function saveChallengeToStorage(challenge) {
    try {
        console.log('saveChallengeToStorage: Début');
        const challenges = getChallengesFromStorage();
        console.log('Défis actuels:', challenges.length);
        
        challenge.id = Date.now().toString(); // ID simple basé sur le timestamp
        challenges.push(challenge);
        const dataStr = JSON.stringify(challenges);
        
        // Vérifier la taille (localStorage limite à ~5-10MB)
        const sizeInMB = new Blob([dataStr]).size / (1024 * 1024);
        console.log('Taille totale des données:', sizeInMB.toFixed(2), 'MB');
        
        if (sizeInMB > 8) {
            throw new Error(`Les données sont trop volumineux (${sizeInMB.toFixed(2)}MB). Veuillez utiliser des images plus petites.`);
        }
        
        localStorage.setItem('challenges', dataStr);
        console.log('Données sauvegardées dans localStorage');
        return challenge;
    } catch (error) {
        if (error.name === 'QuotaExceededError' || error.message.includes('volumineux')) {
            throw new Error('Erreur: L\'image est trop grande pour être sauvegardée. Veuillez utiliser une image plus petite.');
        }
        throw error;
    }
}

function deleteChallengeFromStorage(challengeId) {
    let challenges = getChallengesFromStorage();
    challenges = challenges.filter(c => c.id !== challengeId);
    localStorage.setItem('challenges', JSON.stringify(challenges));
}

function updateChallengeInStorage(challengeId, updates) {
    let challenges = getChallengesFromStorage();
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
        Object.assign(challenge, updates);
        localStorage.setItem('challenges', JSON.stringify(challenges));
    }
}

// ====== AUTHENTIFICATION ======
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

// Utilitaires pour les images
async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('fileToDataUrl: Conversion réussie');
            resolve(e.target.result);
        };
        reader.onerror = (e) => {
            console.error('fileToDataUrl: Erreur');
            reject(new Error('Impossible de lire le fichier'));
        };
        console.log('fileToDataUrl: Démarrage de la lecture');
        reader.readAsDataURL(file);
    });
}

async function compressImage(file, maxWidth = 400, maxHeight = 300, quality = 0.3) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    console.log('compressImage: Image chargée, dimensions originales:', img.width, 'x', img.height);
                    
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    // Redimensionner si nécessaire
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                        console.log('compressImage: Redimensionnement à', width, 'x', height);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir en blob compressé avec qualité très basse
                    canvas.toBlob((blob) => {
                        console.log('compressImage: Blob créé, taille:', blob.size, 'bytes');
                        resolve(blob);
                    }, 'image/jpeg', quality);
                } catch (error) {
                    console.error('compressImage: Erreur lors de la compression', error);
                    reject(error);
                }
            };
            img.onerror = () => {
                console.error('compressImage: Erreur lors du chargement de l\'image');
                reject(new Error('Impossible de charger l\'image'));
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            console.error('compressImage: Erreur lors de la lecture du fichier');
            reject(new Error('Impossible de lire le fichier'));
        };
        console.log('compressImage: Démarrage de la compression, taille fichier:', file.size, 'bytes');
        reader.readAsDataURL(file);
    });
}

// Chargement de l'image
function loadImage() {
const file = imageFile?.files?.[0];

// 1) Si on a choisi un fichier => preview local
if (file) {
const previewUrl = URL.createObjectURL(file);
imagePreview.src = previewUrl;
clickableImage.src = previewUrl;

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
alert("Impossible d'afficher l'image locale.");
imagePreview.style.display = 'none';
noImageText.style.display = 'block';
};
return;
}

// 2) Sinon => on utilise l'URL comme avant
const url = imageUrl.value.trim();
if (!url) {
alert("Mets une URL OU choisis un fichier.");
return;
}

try { new URL(url); } catch (e) { alert("URL invalide"); return; }

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
alert("Impossible de charger l'image. Vérifie l'URL.");
imagePreview.style.display = 'none';
noImageText.style.display = 'block';
};

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
    
    console.log('handleAddChallenge: Début');
    
    // Validation : vérifier qu'on a soit une URL soit un fichier
    const hasUrl = imageUrl.value.trim();
    const hasFile = imageFile?.files?.[0];
    
    console.log('hasUrl:', hasUrl ? 'oui' : 'non');
    console.log('hasFile:', hasFile ? 'oui' : 'non');
    
    if (!hasUrl && !hasFile) {
        alert('Veuillez entrer une URL d\'image ou uploader un fichier');
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
        let finalImageUrl = hasUrl;
        
        // Si on a un fichier, le compresser et convertir en Data URL (base64)
        if (hasFile) {
            console.log('Compression de l\'image...');
            // Compresser l'image avant de la convertir
            const compressedImage = await compressImage(hasFile);
            console.log('Compression réussie, taille:', compressedImage.size, 'bytes');
            
            console.log('Conversion en base64...');
            finalImageUrl = await fileToDataUrl(compressedImage);
            console.log('Conversion réussie, longueur:', finalImageUrl.length, 'chars');
        }
        
        // Créer l'objet défi
        const challengeData = {
            date: challengeDate.value,
            image_url: finalImageUrl,
            bibi_x: bibiPosition.x,
            bibi_y: bibiPosition.y,
            active: activeCheckbox?.checked || true
        };
        
        console.log('Sauvegarde du défi:', challengeData.date);
        // Sauvegarder dans localStorage
        saveChallengeToStorage(challengeData);
        console.log('Défi sauvegardé avec succès');
        
        alert('Défi ajouté avec succès!');
        resetForm();
        loadChallenges();
        loadStatistics();
    } catch (error) {
        console.error('Erreur complète:', error);
        console.error('Stack:', error.stack);
        alert('Erreur lors de l\'ajout du défi: ' + error.message);
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
function loadChallenges() {
    try {
        console.log('loadChallenges: Début');
        // Charger depuis localStorage
        let challenges = getChallengesFromStorage();
        console.log('Défis chargés:', challenges.length);
        
        // Trier par date (plus récent en premier)
        challenges.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (!challenges || challenges.length === 0) {
            console.log('Aucun défi trouvé');
            challengesList.innerHTML = '<p class="loading-text">Aucun défi créé</p>';
            return;
        }
        
        challengesList.innerHTML = challenges.map((challenge) => {
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
function toggleChallengeStatus(challengeId, newStatus) {
    try {
        updateChallengeInStorage(challengeId, { active: newStatus });
        loadChallenges();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la modification du statut');
    }
}

// Suppression d'un défi
function deleteChallenge(challengeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce défi?')) {
        return;
    }
    
    try {
        deleteChallengeFromStorage(challengeId);
        alert('Défi supprimé');
        loadChallenges();
        loadStatistics();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
    }
}

// Chargement des statistiques
function loadStatistics() {
    try {
        // Nombre de défis
        const challenges = getChallengesFromStorage();
        totalChallenges.textContent = challenges?.length || 0;
        
        // Note: Les scores et joueurs seraient chargés depuis localStorage aussi si le jeu utilise localStorage
        totalScores.textContent = '0';
        totalPlayers.textContent = '0';
        
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Rendre les fonctions globales pour les boutons
window.toggleChallengeStatus = toggleChallengeStatus;
window.deleteChallenge = deleteChallenge;
