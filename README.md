# AroniumPOS Display Client

> Secondary customer-facing display for **Aronium POS**.  
> Shows real-time order data on a dedicated PC screen, phone, or tablet on your WiFi.

---

## ⬇️ Download

**[→ Go to Releases](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)**

| File | Description |
|------|-------------|
| `AroniumPOS-Display-Client-Setup-x.x.x.exe` | ✅ **Recommended** — Full installer, desktop shortcut, starts with Windows |
| `AroniumPOS-Display-Client-Portable-x.x.x.exe` | No installation needed, run directly |

---

## 🚀 Setup Guide (5 minutes)

### 1 — Install the app

Run `AroniumPOS-Display-Client-Setup-x.x.x.exe`.  
Follow the installer. On **first launch**, a setup wizard opens automatically.

---

### 2 — Create a virtual COM port pair

Aronium sends data through a COM port. You need **two different port numbers** connected together virtually — like the two ends of a cable.

> ⚠️ **Never use the same port number on both sides.**  
> ✓ COM10 ↔ COM11 — correct  
> ✗ COM11 ↔ COM11 — will not work

**Option A — HHD Virtual Serial Port Tools** (recommended, easy UI):
1. Download → https://www.hhdsoftware.com/virtual-serial-port-tools
2. Open the app → **Create Pair**
3. Port 1: `COM10` — Port 2: `COM11`
4. Click **Create**

**Option B — com0com** (free, open source):
1. Download → https://sourceforge.net/projects/com0com/
2. Install → open **Setup** utility
3. Create pair: `COM10` ↔ `COM11` → Apply
4. The app's setup wizard can do this automatically if com0com is installed

**Option C — Windows "Add Legacy Hardware"** (no extra software):
1. Open **Device Manager** → Action → **Add Legacy Hardware**
2. Choose **"Install hardware manually"**
3. Select **Ports (COM & LPT)** → **Communications Port**
4. Repeat twice with different COM numbers

---

### 3 — Configure Aronium POS

In Aronium → **Settings** → **Devices** → **Customer Display**:
- **Port**: `COM10` (the first port of your pair)
- **Enabled**: ✓ checked
- **Type**: VFD or Generic

---

### 4 — Finish the setup wizard

The wizard asks you to select:
- **Aronium's port** → `COM10`
- **App port** → `COM11`

Click **Finish** → the main display window opens.

---

## 📱 Phone & Tablet Display (PWA)

The app also runs as a **Progressive Web App** on any phone or tablet on the same WiFi — no app store needed.

Works on: **Android** (Chrome), **iPhone/iPad** (Safari), **Samsung Galaxy**, **iPad**, any modern browser.

1. Launch the app on PC
2. The window shows your local IP — example: `http://192.168.1.42:3000`
3. On your phone/tablet, open **Chrome** (Android) or **Safari** (iPhone/iPad)
4. Go to that URL
5. Tap **"Add to home screen"** or **"Install app"**
6. Open the installed app — it launches **fullscreen**, screen stays on automatically

> The phone/tablet display is fully synchronized with the PC display in real time.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| Real-time sync | Orders appear instantly on all screens |
| Weight products | `0.343 kg` items displayed and summed correctly |
| Smart merge | Rescanning a product increments quantity — no duplicates |
| Discounts | Per-item and global discounts |
| Payment info | Paid amount and change displayed after payment |
| Welcome screen | Shows between customers, closes on first scan |
| Fullscreen | One-click fullscreen on PC, phone, and tablet |
| Auto-reconnect | Reconnects automatically if WiFi drops |
| Auto-start | Starts with Windows (disable in Task Manager → Startup) |
| Feedback | In-app bug report and feature request buttons |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Access denied` on COM port | Aronium is using that port. Check your port assignments — Aronium on COM10, app on COM11. The app retries automatically. |
| Nothing shows on display | Check the virtual COM pair is created and both ports are different |
| Phone/tablet can't reach PWA | Make sure both are on the same WiFi. Try disabling Windows Firewall temporarily to test |
| Welcome screen stays on | The first product scan closes it. Check the COM port is receiving data from Aronium |
| App doesn't start at login | Open Task Manager → Startup tab → Enable "AroniumPOS Display Client" |
| Reset setup wizard | Delete `%APPDATA%\aroniumpos-display-client\config.json` and restart the app |

---

## 💬 Feedback

Use the **💬** button inside the app to report bugs or suggest improvements.  
Or open an issue: https://github.com/Hamidlegardien/posdisplayclientAronium/issues

---

## 🛠️ Build from Source

```bash
git clone https://github.com/Hamidlegardien/posdisplayclientAronium.git
cd posdisplayclientAronium
npm install
npm start          # Development mode
npm run build      # Build Windows installer → dist/
```

---

## 📦 Release a new version

```bash
git add .
git commit -m "feat: your change"
git tag v1.1.0
git push && git push origin v1.1.0
```

GitHub Actions builds and publishes the `.exe` automatically (~5 min).

> **Required once:** Go to repo Settings → Actions → General → set **"Read and write permissions"** under Workflow permissions.

---

## License

MIT © [Hamidlegardien](https://github.com/Hamidlegardien)
