<div align="center">

# AroniumPOS Display Client

**Écran client secondaire pour Aronium POS — gratuit et open source**

[![Download](https://img.shields.io/github/v/release/Hamidlegardien/posdisplayclientAronium?label=T%C3%A9l%C3%A9charger&style=for-the-badge&color=e8a000)](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-blue?style=for-the-badge&logo=windows)](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)

</div>

---

## C'est quoi ?

Un logiciel gratuit qui affiche les articles scannés par **Aronium POS** en temps réel sur un **deuxième écran** ou sur le **téléphone / tablette** du client.

> Branchez un second moniteur, ou ouvrez un lien sur n'importe quel téléphone — le client voit sa commande instantanément.

---

## Screenshots

| PC (second écran) | Téléphone / Tablette |
|---|---|
| Affichage plein écran avec articles, quantités, total | Même affichage responsive via le navigateur |

---

## Installation rapide

### 1. Télécharger

👉 **[Télécharger le Setup .exe](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)**

Choisissez le fichier `AroniumPOS-Display-Client-Setup-x.x.x.exe`

---

### 2. Installer et lancer

1. Lancez le `.exe` téléchargé
2. Au premier démarrage, un **assistant de configuration** s'ouvre automatiquement
3. Cliquez **"Installer le pilote virtuel"** → les ports COM20 et COM21 sont créés automatiquement *(le pilote est inclus, pas besoin d'internet)*
4. Fermez et relancez — l'application se souvient de votre configuration

---

### 3. Configurer Aronium

Dans Aronium POS :

```
Paramètres → Périphériques → Affichage client
  Port COM : COM20
  Activer  : ✓
```

---

### 4. Affichage sur téléphone / tablette

Sur le téléphone du client, ouvrez **Chrome ou Safari** et tapez :

```
http://[IP-DE-VOTRE-PC]:3000
```

L'adresse exacte est affichée dans le panneau Config de l'application (icône ⚙️ en haut à droite).

---

## Fonctionnalités

| Fonctionnalité | Détail |
|---|---|
| 🛒 Commande en temps réel | Articles, quantités, prix, total mis à jour instantanément |
| ⚖️ Produits au poids | `0.343 kg × 89.90` → total calculé automatiquement |
| 🔁 Fusion intelligente | Rescanner un article incrémente la quantité, pas de doublon |
| 💰 Remises | Affichage par article et global |
| 💳 Paiement reçu / Monnaie | Affiché 5 secondes puis disparaît |
| 👋 Écran de bienvenue | Entre chaque client |
| 🌐 3 langues | Anglais / Français / Arabe — réglable dans Config |
| 📱 PWA (téléphone/tablette) | Fonctionne sur Chrome, Safari, Edge |
| 🔆 Écran allumé | Wake Lock : l'écran de la tablette ne se met pas en veille |
| ⛶ Plein écran | Bouton sur PC et téléphone |
| 💱 Devise automatique | Détectée depuis les paramètres Windows (MAD, EUR, USD…) |
| 🔄 Reconnexion auto | Reconnecte le port série toutes les 5s en cas de coupure |

---

## Changer la langue

1. Cliquez sur l'icône **⚙️ Config** en haut à droite
2. Dans le panneau, choisissez la langue dans le menu **Language**
3. L'affichage et les téléphones connectés changent immédiatement

---

## Problèmes courants

**Le port COM20 n'apparaît pas dans Aronium**
→ Relancez l'application en tant qu'administrateur, puis cliquez "Installer le pilote" dans l'assistant.

**Écran noir au démarrage**
→ Fermez et relancez. Si ça persiste, désactivez l'accélération GPU dans les options.

**Le téléphone ne se connecte pas**
→ Vérifiez que le PC et le téléphone sont sur le même réseau WiFi. Vérifiez que le pare-feu Windows autorise le port 3000.

**"SetupOpenInfFile" ou erreur com0com**
→ Mise à jour vers v1.1.3 — ce bug est corrigé.

---

## Pour les développeurs

### Prérequis

- Node.js 18+
- Windows 10/11 (pour le serial port)

### Lancer en développement

```bash
git clone https://github.com/Hamidlegardien/posdisplayclientAronium.git
cd posdisplayclientAronium
npm install
npm start
```

### Compiler le .exe

```bash
npm run build
# → dist/AroniumPOS-Display-Client-Setup-x.x.x.exe
```

### Publier une nouvelle version

```bash
git add .
git commit -m "feat: description de la mise à jour"
git tag v1.1.3
git push && git push origin v1.1.3
```

GitHub Actions compile et publie le `.exe` automatiquement (~5 min).

> ⚠️ **À faire une fois :** repo Settings → Actions → General → **Read and write permissions**

### Architecture

```
Aronium POS
    │  COM20 → câble virtuel → COM21
    ▼
Electron (main.js)
    ├── IPC ──────────► index.html     (écran PC)
    ├── WS :9600 ─────► PWA            (téléphone/tablette)
    └── HTTP :3000 ───► Sert pwa/      (accès navigateur)
```

### Structure du projet

```
├── main.js                  # Process principal — serial, WS, HTTP, parser Aronium
├── preload.js               # Pont IPC sécurisé
├── index.html               # Interface écran PC
├── app.js                   # Logique écran PC
├── styles.css               # Thème sombre / ambre
├── setup.html               # Assistant premier démarrage
├── pwa/
│   ├── index.html           # Interface téléphone/tablette
│   ├── client.js            # Client WebSocket + Wake Lock
│   └── manifest.json        # Manifeste PWA
├── build/
│   ├── icon.ico
│   ├── com0com-setup.exe    # Pilote COM virtuel (inclus)
│   ├── install_com0com.ps1  # Script d'installation silencieuse
│   └── installer.nsh        # Config NSIS (démarrage auto)
└── .github/workflows/
    └── build.yml            # CI/CD — build automatique sur tag git
```

---

## Contribuer

Les PR sont les bienvenues ! Merci de :
- Respecter le style de code existant
- Un fix ou une feature par PR
- Message de commit clair en anglais ou français

---

## Changelog

### v1.1.3
- 🐛 **Fix com0com** — erreur `SetupOpenInfFile / com0com.inf introuvable` corrigée : l'exe est maintenant copié dans un dossier temporaire propre avant exécution
- 🌐 **Langue dans Config uniquement** — le sélecteur de langue est déplacé dans le panneau Config (⚙️) ; persiste dans `config.json` ; les téléphones connectés reçoivent la langue automatiquement via WebSocket

### v1.1.2
- Fix : persistance de l'écran de bienvenue après le premier scan
- Fix : collisions de trames serial lors du scan rapide
- Fix : chemins incorrects dans l'exe packagé
- Fix : cache npm GitHub Actions
- Fix : erreurs de langue NSIS

### v1.1.1
- Support PWA mobile/tablette
- Wake Lock API
- Assistant de configuration au premier lancement
- Pilote com0com inclus dans l'installeur

### v1.1.0
- Première version publique

---

## Licence

MIT © [Hamidlegardien](https://github.com/Hamidlegardien)
