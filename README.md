# 🔍 Où est Bibi?

Un jeu quotidien inspiré de "Où est Charlie?" avec un système de classement en temps réel.

## 📋 Description

**Où est Bibi?** est un jeu web interactif où les joueurs doivent trouver le personnage "Bibi" caché dans une image différente chaque jour. Le jeu propose un système de classement basé sur le temps de recherche et permet aux administrateurs de programmer des défis en avance.

## ✨ Fonctionnalités Complétées

### 🎮 Interface Utilisateur (Frontend)

✅ **Système de pseudo**
- Demande de pseudo au premier lancement
- Sauvegarde locale dans `localStorage`
- Possibilité de changer de pseudo à tout moment

✅ **Défi quotidien**
- Une nouvelle image chaque jour
- Timer de recherche en temps réel
- Système de détection de proximité (tolérance de 2%)
- Message si le défi a déjà été joué

✅ **Image interactive**
- Zoom avant/arrière avec boutons (+ molette et pinch sur mobile)
- Pan/déplacement en mode zoom
- Marqueur visuel au clic
- Support tactile complet

✅ **Système de classement**
- Calcul automatique du rang après avoir trouvé Bibi
- Affichage TOP 5 en temps réel
- Badges colorés (or, argent, bronze)
- Affichage du temps de chaque joueur

✅ **Design & UX**
- Design moderne et coloré inspiré de Cémantix
- Animations de victoire
- Interface responsive (mobile & desktop)
- 2 emplacements publicitaires intégrés
- Polices Google Fonts (Poppins)
- Icônes Font Awesome

### 🔧 Administration (Backend)

✅ **Authentification**
- Protection par mot de passe (défaut: `bibi2026`)
- Session persistante

✅ **Gestion des défis**
- Ajout de nouveaux défis avec date programmée
- Upload d'images via URL
- Positionnement précis de Bibi par clic sur l'image
- Aperçu en temps réel
- Liste de tous les défis créés
- Activation/désactivation des défis
- Suppression de défis

✅ **Statistiques**
- Nombre total de défis créés
- Nombre de joueurs uniques
- Nombre total de parties jouées

## 🗂️ Structure du Projet

```
/
├── index.html              # Page principale du jeu
├── admin.html              # Interface d'administration
├── css/
│   ├── style.css          # Styles de la page principale
│   └── admin.css          # Styles de l'administration
├── js/
│   ├── main.js            # Logique du jeu
│   └── admin.js           # Logique de l'administration
└── README.md              # Documentation
```

## 🎯 Points d'Entrée (URI)

### Pages Principales

| Page | URI | Description |
|------|-----|-------------|
| Jeu | `/` ou `index.html` | Page principale du jeu |
| Administration | `/admin.html` | Back-office (mot de passe requis) |

### API REST (Tables)

Le projet utilise l'API RESTful intégrée pour la persistance des données :

#### Challenges (Défis)
- `GET tables/challenges?search=YYYY-MM-DD&limit=1` - Récupérer le défi du jour
- `GET tables/challenges?limit=100&sort=-date` - Liste tous les défis
- `POST tables/challenges` - Créer un nouveau défi
- `PATCH tables/challenges/{id}` - Modifier un défi (activation/désactivation)
- `DELETE tables/challenges/{id}` - Supprimer un défi

#### Scores
- `GET tables/scores?limit=1000` - Récupérer tous les scores
- `POST tables/scores` - Enregistrer un nouveau score

## 💾 Modèles de Données

### Table: `challenges`
| Champ | Type | Description |
|-------|------|-------------|
| id | text | Identifiant unique |
| date | text | Date du défi (YYYY-MM-DD) |
| image_url | text | URL de l'image |
| bibi_x | number | Position X de Bibi (%) |
| bibi_y | number | Position Y de Bibi (%) |
| active | bool | Statut d'activation |

### Table: `scores`
| Champ | Type | Description |
|-------|------|-------------|
| id | text | Identifiant unique |
| challenge_id | text | ID du défi associé |
| player_name | text | Pseudo du joueur |
| time_seconds | number | Temps en secondes |
| date_completed | text | Date de complétion (ISO) |

## 🚀 Guide d'Utilisation

### Pour les Joueurs

1. **Première visite**
   - Entrez votre pseudo (sera sauvegardé localement)
   - Cliquez sur "Commencer"

2. **Jouer au défi du jour**
   - Utilisez les boutons de zoom pour agrandir l'image
   - Cliquez sur l'image où vous pensez que Bibi se cache
   - Le timer s'arrête automatiquement quand vous trouvez Bibi
   - Découvrez votre classement !

3. **Limitations**
   - Un seul essai par jour par joueur
   - Le défi est verrouillé après avoir trouvé Bibi

### Pour les Administrateurs

1. **Connexion**
   - Allez sur `/admin.html`
   - Mot de passe par défaut : `bibi2026`

2. **Créer un défi**
   - Entrez la date du défi (peut être dans le futur)
   - Collez l'URL d'une image hébergée en ligne
   - Cliquez sur "Charger l'image"
   - Cliquez sur l'image exactement où se trouve Bibi
   - Les coordonnées s'affichent automatiquement
   - Cochez "Défi actif" si vous voulez l'activer immédiatement
   - Cliquez sur "Ajouter le défi"

3. **Gérer les défis**
   - Voir la liste de tous les défis programmés
   - Activer/désactiver un défi
   - Supprimer un défi

4. **Consulter les statistiques**
   - Nombre de défis créés
   - Nombre de joueurs uniques
   - Nombre total de parties jouées

## 🔐 Sécurité

- **Mot de passe administrateur**: Stocké dans `js/admin.js` (ligne 2)
- **Session**: Persistante via `sessionStorage` (expiration à la fermeture du navigateur)
- **Données joueurs**: Stockées localement (`localStorage`) pour la vie privée

## 🎨 Personnalisation

### Changer le mot de passe administrateur
Dans `js/admin.js`, ligne 2 :
```javascript
const ADMIN_PASSWORD = 'votre_nouveau_mot_de_passe';
```

### Modifier la tolérance de détection
Dans `js/main.js`, ligne 2 :
```javascript
const TOLERANCE_PERCENTAGE = 2; // Changer la valeur (en %)
```

### Changer les couleurs
Modifiez les gradients dans `css/style.css` :
- Background principal : ligne 7
- Boutons primaires : ligne 64
- En-têtes : ligne 35

## 📱 Compatibilité

- ✅ Chrome, Firefox, Safari, Edge (versions récentes)
- ✅ Support mobile complet (iOS & Android)
- ✅ Support tactile (pinch-to-zoom)
- ✅ Design responsive

## 🛠️ Technologies Utilisées

- **HTML5** - Structure sémantique
- **CSS3** - Design moderne avec gradients et animations
- **JavaScript (Vanilla)** - Logique du jeu sans framework
- **RESTful API** - Persistance des données
- **LocalStorage** - Sauvegarde locale du pseudo
- **SessionStorage** - Session administrateur
- **Font Awesome** - Icônes
- **Google Fonts (Poppins)** - Typographie

## 📊 Fonctionnalités Techniques

### Système de Zoom
- 3 niveaux de zoom (1x, 1.2x, 1.4x... jusqu'à 3x)
- Pan/déplacement en mode zoom
- Support souris + tactile

### Détection de Bibi
- Calcul de distance euclidienne
- Tolérance configurable (2% par défaut)
- Feedback visuel immédiat

### Classement en Temps Réel
- Tri automatique par temps de recherche
- Rafraîchissement après chaque découverte
- Top 5 visible en permanence

### Gestion du Temps
- Timer précis (affichage MM:SS)
- Démarrage automatique au chargement de l'image
- Arrêt automatique à la découverte

## 🐛 Fonctionnalités Non Implémentées

Les fonctionnalités suivantes pourraient être ajoutées dans le futur :

- ❌ Système de comptes utilisateurs avec authentification
- ❌ Historique personnel des performances
- ❌ Partage sur réseaux sociaux
- ❌ Indices progressifs pour les joueurs bloqués
- ❌ Mode multi-joueurs en temps réel
- ❌ Upload direct d'images (actuellement URL uniquement)
- ❌ Système de notifications push pour nouveaux défis
- ❌ Classement global (tous les temps)
- ❌ Système de badges et achievements
- ❌ Mode nuit/jour
- ❌ Support multilingue

## 🎯 Prochaines Étapes Recommandées

1. **Améliorer la sécurité admin**
   - Implémenter une vraie authentification backend
   - Hash du mot de passe
   - Tokens de session sécurisés

2. **Optimiser les performances**
   - Lazy loading des images
   - Compression des images
   - Cache des défis

3. **Améliorer l'expérience utilisateur**
   - Système d'indices
   - Animation du timer
   - Sons d'ambiance (optionnel)
   - Particules de victoire

4. **Fonctionnalités sociales**
   - Partage de score sur réseaux sociaux
   - Défis entre amis
   - Commentaires sur les défis

5. **Analytics**
   - Taux de réussite par défi
   - Temps moyen de recherche
   - Carte thermique des clics

6. **Monétisation**
   - Intégration Google AdSense dans les espaces pub
   - Système de dons
   - Version premium sans pub

## 📞 Support

Pour toute question ou problème :
- Consultez ce README
- Vérifiez les messages d'erreur dans la console du navigateur (F12)
- Assurez-vous que JavaScript est activé

## 📄 Licence

Ce projet est un prototype de démonstration. Tous droits réservés.

---

**Créé avec ❤️ pour les amateurs de jeux de recherche visuelle!**

🎮 **Bon jeu et bonne chance pour trouver Bibi!** 🔍
