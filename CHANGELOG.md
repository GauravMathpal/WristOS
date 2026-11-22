# Changelog — WristOS Project

All notable changes to the WristOS smartwatch firmware and companion applications are documented here.

## [1.0.0] — 2026-11-21

### Added
- **Minimal Pro Watch Face**: Geometric sans font `wristos_display_60`, ambient violet silk wave, modular step and heart complication cards, and interactive `[W] WristOS` AI trigger.
- **Analog Classic Watch Face**: Perimeter tick dial with centered `[W]` logo, white hands, purple second hand, and single-line date `Tue 14`.
- **Interactive AI Assistant Screen**: Phone voice note trigger via BLE, Gemini 2.5 briefing card, and quick-action shortcuts.
- **Knowledge Vault**: Micro-notes and synced memory cards categorized by `#HEALTH`, `#WORK`, and `#ROUTINE`.
- **Daily Tasks**: Interactive task priority checklist with check-state toggling and haptic feedback.
- **Focus Pomodoro Timer**: 25m/50m/10m focus presets with animated circular progress arc.
- **Enhanced Health Dashboard**: Animated multi-phase ECG waveform, live HRS3300 heart rate, and step goal progress ring.
- **Activity Tracker**: 7-day bar chart visualization for weekly step tracking.
- **Music Control Screen**: Track/artist display, circular controls, and lavender progress bar.
- **Modernized App Launcher**: 3×2 circular grid with custom icons and labels.
- **Web Companion App**: React 19 + TypeScript dashboard on port 3000 with Web Bluetooth support and AI chat.
- **Physical Flashing Guide**: Comprehensive OTA DFU instructions in `docs/FLASHING_GUIDE.md`.

### Changed
- Standardized bottom carousel navigation dots to 6×6 circular indicators with 6px spacing across all core and utility screens.
- Pixel-aligned all card paddings (`pad_all = 0`) across `WatchFaceWristOS`, `Music`, `Assistant`, `TasksList`, and `MemoryList`.
- Replaced Bebas Neue with custom `wristos_display_60` geometric font for sharp rendering on 240×240 IPS display.
- Rebalanced vertical rhythm and spacing on the Music Player screen.

### Verified
- Zero compilation errors/warnings on Apple Silicon native InfiniSim simulator.
- ARM Cortex-M4 production target linked and packaged into MCUBoot DFU zip (`441,344 B` Flash, `24,204 B` RAM).
