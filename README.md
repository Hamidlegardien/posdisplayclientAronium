<div align="center">

<img src="https://img.shields.io/badge/AroniumPOS-Display%20Client-e8a000?style=for-the-badge&logoColor=white" alt="AroniumPOS Display Client"/>

# AroniumPOS Display Client

### Show your customers their order in real time — for free

[![Download](https://img.shields.io/github/v/release/Hamidlegardien/posdisplayclientAronium?label=⬇️%20Download&style=for-the-badge&color=e8a000)](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)
[![Free](https://img.shields.io/badge/Free-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078d4?style=for-the-badge&logo=windows)](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)

</div>

---

## 🖥️ What is it?

**AroniumPOS Display Client** is a **free** customer-facing display for **Aronium POS**. It shows every scanned item, price, total, and change — in real time — on a second screen, phone, or tablet.

Your customers see exactly what's being rung up, without any action on their part.

---

## ✨ Features

| | |
|---|---|
| 🛒 **Live order display** | Every scanned item appears instantly |
| ⚖️ **Weight products** | Handles kg quantities automatically |
| 💳 **Payment & change** | Displayed for 5 seconds at checkout |
| 👋 **Welcome screen** | Shown between customers |
| 📢 **Promo display** | Drag & drop an image or video — fullscreen while waiting, side panel during orders |
| 📱 **Works on phones** | Customer opens a link on their phone — no app needed |
| 🌐 **3 languages** | English · Français · العربية |
| 💱 **Auto currency** | Detected from Windows locale (MAD, EUR, USD…) |

---

## ⬇️ Installation — 4 steps

### Step 1 — Download

<div align="center">

**[⬇️ Download AroniumPOS-Display-Client-Setup.exe](https://github.com/Hamidlegardien/posdisplayclientAronium/releases/latest)**

</div>

---

### Step 2 — Create virtual COM ports

The app communicates with Aronium through a **virtual COM port pair**.  
Create one using one of these free tools:

- **[VSPE](https://www.eterlogic.com/Products.VSPE.html)** — Virtual Serial Port Emulator
- **[com0com](https://com0com.sourceforge.net/)** — Null-modem emulator

> Create a pair — for example **COM20 ↔ COM21**

---

### Step 3 — Configure Aronium

In Aronium POS:
```
Settings → Devices → Customer Display
  COM Port : COM20
  Enable   : ✓
```

---

### Step 4 — Launch and configure the app

Launch the app. The setup wizard will ask you to select your two COM ports — pick the pair you created in step 2.

That's it. ✅

---

## 📱 Phone / Tablet display

No app installation needed. The customer simply opens **Chrome or Safari** and types the address shown in the app:

```
http://192.168.x.x:3000
```

> The exact address is shown in the ⚙️ Config panel (top right).

---

## 📢 Promo display

1. Click **"Promo"** in the top bar
2. Drag & drop an **image** (jpg, png, gif) or **video** (mp4)
3. The promo plays **fullscreen** while no order is in progress
4. It moves to a **side panel** as soon as an item is scanned

---

## ❓ Common issues

**No COM ports detected**
→ Make sure you've created a virtual COM port pair (step 2) before launching the app.

**Windows Defender blocks the download**
→ Click **"More info"** then **"Run anyway"**. The app is open source and safe.

**Phone can't connect**
→ The PC and phone must be on the **same WiFi network**. Also check that Windows Firewall allows port 3000.

---

## 📋 Changelog

### v1.1.5
- 📢 Promo display — drag & drop image/video, fullscreen when idle, side panel during orders
- 🔒 Hardened IPC security on all channels
- 🧹 Full code audit and cleanup

### v1.1.4
- 🎨 New design — black amber theme, pill buttons
- 🔧 Simplified setup wizard with manual port entry

### v1.1.3
- 🌐 Language selection moved to Config panel only
- 🔧 Inno Setup installer

### v1.1.2 and earlier
- Various fixes, PWA mobile support, Wake Lock, initial public release

---

<div align="center">

Made with ❤️ by **[Hamidlegardien](https://github.com/Hamidlegardien)** · MIT License · Free forever

</div>
