# AroniumPOS Display Client

> Afficheur client secondaire pour **Aronium POS**.  
> Affiche les commandes en temps réel sur un écran PC dédié, un téléphone ou une tablette sur votre WiFi.

---

## ⬇️ Télécharger

**[→ Aller aux Releases](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)**

| Fichier | Description |
|---------|-------------|
| `AroniumPOS-Display-Client-Setup-x.x.x.exe` | ✅ **Recommandé** — Installeur complet, raccourci bureau, démarre avec Windows |
| `AroniumPOS-Display-Client-Portable-x.x.x.exe` | Sans installation, lancer directement |

---

## 🚀 Guide d'installation (5 minutes)

### 1 — Installer l'application

Lancer `AroniumPOS-Display-Client-Setup-x.x.x.exe`.  
Suivre l'installeur. Au **premier lancement**, un assistant de configuration s'ouvre automatiquement.

---

### 2 — Créer une paire de ports COM virtuels

Aronium envoie les données via un port COM. Vous avez besoin de **deux numéros de ports différents** connectés ensemble virtuellement — comme les deux extrémités d'un câble.

> ⚠️ **Ne jamais utiliser le même numéro des deux côtés.**  
> ✓ COM10 ↔ COM11 — correct  
> ✗ COM11 ↔ COM11 — ne fonctionnera pas

**Option A — HHD Virtual Serial Port Tools** (recommandé, interface simple) :
1. Télécharger → https://www.hhdsoftware.com/virtual-serial-port-tools
2. Ouvrir → **Create Pair**
3. Port 1 : `COM10` — Port 2 : `COM11`
4. Cliquer **Create**

**Option B — com0com** (gratuit, open source) :
1. Télécharger → https://sourceforge.net/projects/com0com/
2. Installer → ouvrir l'utilitaire **Setup**
3. Créer la paire : `COM10` ↔ `COM11` → Apply
4. L'assistant de l'application peut le faire automatiquement si com0com est installé

**Option C — Windows "Ajouter du matériel ancien"** (sans logiciel supplémentaire) :
1. Ouvrir le **Gestionnaire de périphériques** → Action → **Ajouter du matériel d'ancienne génération**
2. Choisir **"Installer manuellement"**
3. Sélectionner **Ports (COM et LPT)** → **Port de communications**
4. Répéter deux fois avec des numéros COM différents

---

### 3 — Configurer Aronium POS

Dans Aronium → **Paramètres** → **Périphériques** → **Afficheur client** :
- **Port** : `COM10` (le premier port de la paire)
- **Activé** : ✓ coché
- **Type** : VFD ou Générique

---

### 4 — Terminer l'assistant

L'assistant vous demande de sélectionner :
- **Port d'Aronium** → `COM10`
- **Port de l'application** → `COM11`

Cliquer **Terminer** → la fenêtre d'affichage principale s'ouvre.

---

## 📱 Afficheur Téléphone & Tablette (PWA)

L'application fonctionne aussi comme **Progressive Web App** sur n'importe quel téléphone ou tablette sur le même WiFi — pas besoin d'app store.

Compatible : **Android** (Chrome), **iPhone/iPad** (Safari), **Samsung Galaxy**, **iPad**, tout navigateur moderne.

1. Lancer l'application sur le PC
2. La fenêtre affiche votre IP locale — exemple : `http://192.168.1.42:3000`
3. Sur votre téléphone/tablette, ouvrir **Chrome** (Android) ou **Safari** (iPhone/iPad)
4. Aller à cette URL
5. Appuyer **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**
6. Ouvrir l'application installée — elle se lance en **plein écran**, l'écran reste allumé automatiquement

> L'afficheur téléphone/tablette est entièrement synchronisé avec l'écran PC en temps réel.

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| Sync temps réel | Les commandes apparaissent instantanément sur tous les écrans |
| Produits au poids | Articles `0.343 kg` affichés et additionnés correctement |
| Fusion intelligente | Rescanner un produit incrémente la quantité — pas de doublons |
| Remises | Remises par article et globales |
| Informations paiement | Montant reçu et monnaie rendue après paiement |
| Écran bienvenue | S'affiche entre les clients, se ferme au premier scan |
| Plein écran | Un clic pour le plein écran sur PC, téléphone et tablette |
| Reconnexion auto | Se reconnecte automatiquement si le WiFi coupe |
| Démarrage auto | Démarre avec Windows (désactivable dans Gestionnaire des tâches → Démarrage) |
| Feedback | Boutons de rapport de bug et suggestion directement dans l'app |

---

## 🔧 Résolution de problèmes

| Problème | Solution |
|----------|----------|
| `Access denied` sur le port COM | Aronium utilise ce port. Vérifier les ports — Aronium sur COM10, app sur COM11. L'app réessaie automatiquement. |
| Rien ne s'affiche | Vérifier que la paire de ports virtuels est créée et que les deux ports sont différents |
| Téléphone/tablette ne trouve pas la PWA | Vérifier que les deux appareils sont sur le même WiFi. Désactiver temporairement le pare-feu Windows pour tester |
| L'écran de bienvenue reste affiché | Le premier scan produit le ferme. Vérifier que le port COM reçoit des données d'Aronium |
| L'app ne démarre pas au login | Gestionnaire des tâches → onglet Démarrage → Activer "AroniumPOS Display Client" |
| Réinitialiser l'assistant | Supprimer `%APPDATA%\aroniumpos-display-client\config.json` et relancer l'app |

---

## 💬 Feedback

Utiliser le bouton **💬** dans l'application pour signaler un bug ou suggérer une amélioration.  
Ou ouvrir une issue : https://github.com/Hamidlegardien/posdisplayclientAronium/issues

---

## 🛠️ Compiler depuis les sources

```bash
git clone https://github.com/Hamidlegardien/posdisplayclientAronium.git
cd posdisplayclientAronium
npm install
npm start          # Mode développement
npm run build      # Compiler l'installeur Windows → dist/
```

---

## 📦 Publier une nouvelle version

```bash
git add .
git commit -m "feat: votre changement"
git tag v1.1.0
git push && git push origin v1.1.0
```

GitHub Actions compile et publie le `.exe` automatiquement (~5 min).

> **À faire une fois :** Aller dans Settings → Actions → General → activer **"Read and write permissions"** sous Workflow permissions.

---

## Licence

MIT © [Hamidlegardien](https://github.com/Hamidlegardien)
