# WristOS™ — Modern Smartwatch Firmware & Ecosystem

![WristOS Banner](firmware/src/resources/images/pine_logo.png)

> **WristOS** is a next-generation, luxury-inspired, battery-efficient operating system firmware for the **PINE64 PineTime** smartwatch ($240 \times 240$ display, Nordic nRF52832 ARM Cortex-M4F), accompanied by a real-time **Web Companion** and native **Android Companion** application.

---

## 📸 Visual Design Portfolio

WristOS transforms the PineTime with an OLED deep black aesthetic, signature geometric typography (`wristos_display_60`), vibrant ambient violet wave ribbons, and modular complication cards.

| Screen | Category | Description |
| :--- | :--- | :--- |
| **Minimal Pro (Hero)** | Watch Face | Signature geometric digits, date, dynamic violet silk wave, steps & heart complication cards, brand badge `[W] WristOS`, battery %, BLE indicator. |
| **Analog Classic** | Watch Face | Clean dial with perimeter hour/minute indices, outline `[W]` badge, white hour/minute hands, purple seconds hand, single-line date `Tue 14`. |
| **Health Dashboard** | Core App | Real-time HRS3300 heart rate with animated multi-phase ECG waveform line, live BMA421 daily step count, and target arc progress ring. |
| **Activity Tracker** | Core App | 7-day weekly bar chart showing daily activity trends (M, T, W, T, F, S, S), average steps, and percentage growth. |
| **Focus Timer** | Core App | Pomodoro timer with 25m / 50m / 10m presets, glowing circular progress arc, haptic pulses, and play/pause/reset controls. |
| **App Menu (Launcher)** | Core App | 3×2 circular button grid with custom icons and labels (`Activity`, `Health`, `Focus`, `AI`, `Tasks`, `Breathe`), and 3-dot pagination. |
| **Music Player** | Utility App | Track title, artist, volume/track swipe gestures, circular playback controls (prev, play/pause, next), and violet progress bar. |
| **Weather** | Utility App | Current temperature (°C), high/low range, condition description, and FontAwesome weather glyphs. |
| **AI Assistant** | Utility App | Dedicated phone AI voice trigger, Gemini 2.5 smart briefing card, and quick-action launcher buttons (`FOCUS`, `TASKS`, `VAULT`). |
| **Quick Settings** | System | 2×2 grid of rounded controls: multi-level brightness, flashlight, vibration/DND, and settings launcher. |
| **Knowledge Vault** | Utility App | Synced micro-notes and personal memory cards tagged by `#HEALTH`, `#WORK`, `#ROUTINE`. |
| **Daily Tasks** | Utility App | Interactive checklist with priority color accents (`URGENT`, `HIGH`, `NORMAL`, `CALM`) and haptic check feedback. |

---

## 🏗️ Architecture & Technology Stack

```
WristOS Workspace
├── firmware/         # C++17 FreeRTOS + LVGL 7 Embedded Firmware for nRF52832
├── simulator/        # Native SDL2 InfiniSim Desktop Simulator (macOS / Linux)
├── web/              # React 19 + TypeScript + Tailwind CSS Companion App
├── app/              # Native Android Companion App (Kotlin + BLE GATT)
└── docs/             # Architecture, Hardware, Safety, & Protocol documentation
```

### Firmware Specifications
- **Target Microcontroller**: Nordic Semiconductor nRF52832 (ARM Cortex-M4F @ 64 MHz, 512 KB Flash, 64 KB RAM)
- **Display**: $240 \times 240$ ST7789 IPS LCD with SPI interface
- **Graphics Engine**: LVGL v7 with customized memory-optimized display fonts
- **RTOS**: FreeRTOS with preemptive task scheduling
- **BLE Stack**: Apache Mynewt NimBLE
- **Memory Footprint**:
  - **Flash Usage**: 441,344 bytes / 474,632 bytes (**92.99%**, ~32 KB safety headroom)
  - **RAM Usage**: 24,204 bytes / 65,536 bytes (**36.93%**, ~41 KB headroom)

---

## 🚀 Getting Started

### 1. Running the Interactive Simulator (Desktop)
You can run and interact with the full watch firmware locally without touching hardware:

```bash
# Build and run the native InfiniSim simulator
cd simulator
cmake -B build -S .
cmake --build build -j$(sysctl -n hw.ncpu)
./build/infinisim
```
- **Mouse**: Drag/swipe across the watch screen or click buttons.
- **Keys 0–9**: Switch instantly between watch faces and apps.

### 2. Running the Web Companion
The companion application provides real-time telemetry, AI assistant pairing, and BLE management:

```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Edge.

### 3. Building the Production ARM Firmware (Docker)
A reproducible Docker environment ensures deterministic binary generation:

```bash
docker run --rm -v $(pwd)/firmware:/sources -w /sources pinetime-build cmake -B build -S .
docker run --rm -v $(pwd)/firmware:/sources -w /sources pinetime-build cmake --build build -j4
```
Outputs:
- Primary DFU Zip: `firmware/build/src/pinetime-mcuboot-app-dfu-1.16.0.zip`
- Headered Binary: `firmware/build/src/pinetime-mcuboot-app-image-1.16.0.bin`

---

## 🔒 Safety & Sealed PineTime Flashing (Phase 11)

> [!IMPORTANT]
> The physical sealed PineTime cannot be easily recovered via SWD if bricked. WristOS strictly follows MCUBoot test-swap safety protocols.

### MCUBoot Automatic Rollback
When flashing via Bluetooth OTA DFU:
1. The firmware is flashed into secondary storage (Slot 1).
2. MCUBoot swaps slots in **test mode** upon restart.
3. If the firmware boots successfully and is validated, the image is marked permanent.
4. If a crash or watchdog reset occurs before validation, MCUBoot automatically reverts to the previous working firmware on the next reboot.

### Flashing Procedure (OTA DFU)
See [docs/FLASHING_GUIDE.md](docs/FLASHING_GUIDE.md) for full instructions using:
1. **Gadgetbridge** (Android)
2. **WristOS Web Companion** (Google Chrome with Web Bluetooth)
3. **nRF Connect for Mobile** (iOS / Android)

---

## 📜 Documentation Index
- [Architecture & Memory Layout](docs/ARCHITECTURE.md)
- [BLE GATT Services & Protocol](docs/BLE_PROTOCOL.md)
- [Hardware & Pin Mapping](docs/HARDWARE.md)
- [Sensor Analysis & Drivers](docs/SENSOR_ANALYSIS.md)
- [Hardware Safety Checklist](docs/SAFETY.md)
- [Build Environment Setup](docs/BUILD_GUIDE.md)
- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Step-by-Step Flashing Guide](docs/FLASHING_GUIDE.md)

---
© 2026 WristOS Project. Based on InfiniTime. Released under GPLv3.
