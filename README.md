# AroniumPOS Display Client

> **Open-source secondary customer display for Aronium POS.**  
> Real-time order display on a dedicated PC screen and/or any phone/tablet on the local network.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Hamidlegardien/posdisplayclientAronium)](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)

---

## ⬇️ Download

**[→ Releases](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)**

| File | Description |
|------|-------------|
| `AroniumPOS-Display-Client-Setup-1.1.2.exe` | ✅ Windows installer (x64) — recommended |
| `AroniumPOS-Display-Client-Portable-1.1.2.exe` | Portable, no install needed |

---

## Architecture

```
Aronium POS
    │  COM20 → virtual cable → COM21
    ▼
Electron (main.js)
    ├── IPC ──────────► index.html   (PC display)
    ├── WS :9600 ─────► PWA          (phone/tablet)
    └── HTTP :3000 ───► Serves pwa/  (to phone/tablet)
```

---

## Stack

| Layer | Tech |
|-------|------|
| Desktop app | Electron 27 |
| Serial port | SerialPort 11 |
| Real-time sync | WebSocket (ws 8) |
| Phone/tablet | PWA (Chrome/Safari) |
| Build | electron-builder 24 + GitHub Actions |
| OS | Windows 10/11 x64 |

---

## Project structure

```
├── main.js              # Electron main — serial, WS server, HTTP server, Aronium parser
├── preload.js           # Secure IPC bridge
├── index.html           # PC display UI
├── app.js               # PC display logic
├── styles.css           # Design system (amber/dark theme)
├── setup.html           # First-launch setup wizard
├── pwa/
│   ├── index.html       # Phone/tablet UI (responsive)
│   ├── client.js        # WebSocket client + Wake Lock
│   └── manifest.json    # PWA manifest
├── build/
│   ├── icon.ico         # App icon
│   ├── com0com-setup.exe    # Bundled virtual COM driver
│   ├── install_com0com.ps1  # Silent install script
│   └── installer.nsh        # NSIS auto-start config
└── .github/
    └── workflows/
        └── build.yml    # Auto-builds .exe on git tag push
```

---

## Features

- Real-time order sync — products, quantities, prices, totals
- Weight-based products (`0.343 kg`) — auto-summed on rescan
- Smart merge — rescanning a product increments quantity, no duplicates
- Discounts (per-item and global)
- Paid / Change display (5 seconds then fades)
- Welcome screen between customers
- Fullscreen button on PC and phone
- Auto-reconnect serial port (every 5s)
- Auto-detect system currency (MAD, USD, EUR…)
- 3 languages: English, Français, العربية
- Wake Lock — phone screen stays on
- Setup wizard runs once, never again

---

## Development

```bash
git clone https://github.com/Hamidlegardien/posdisplayclientAronium.git
cd posdisplayclientAronium
npm install
npm start
```

---

## Release a new version

```bash
git add .
git commit -m "your commit message"
git tag v1.1.2
git push && git push origin v1.1.2
```

GitHub Actions builds and publishes the `.exe` automatically (~5 min).

> **Required once:** repo Settings → Actions → General → **Read and write permissions**

---

## Contributing

Pull requests are welcome. Please:
- Follow the existing code style
- Write a clear commit message describing your change
- One feature or fix per PR

---

## License

MIT © [Hamidlegardien](https://github.com/Hamidlegardien)
