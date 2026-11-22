# WristOS — Physical PineTime Flashing Guide (Phase 11)

> [!CAUTION]
> **READ BEFORE FLASHING**: Physical sealed PineTime units have their chassis permanently glued. There is no external SWD debug connector. Only flash firmware using verified MCUBoot DFU archives. Never flash raw hex binaries directly over bootloader memory.

---

## 1. Prerequisites Checklist

Before flashing your sealed PineTime:
- [ ] Watch battery is charged to at least **70%** (prevents power loss during OTA transfer).
- [ ] The current watch firmware has **MCUBoot** installed (standard InfiniTime 1.0+).
- [ ] You have downloaded the verified WristOS DFU package:
  - Location: `firmware/build/src/pinetime-mcuboot-app-dfu-1.16.0.zip` (Size: ~433 KB)
  - MD5 / SHA-256 integrity verified.

---

## 2. Flashing Method A: Gadgetbridge (Android) — Recommended

Gadgetbridge is the safest and most reliable BLE companion for PineTime.

### Steps:
1. Transfer `pinetime-mcuboot-app-dfu-1.16.0.zip` to your Android phone (via USB, email, or Google Drive).
2. Open **Gadgetbridge** on your phone.
3. Connect to your PineTime watch.
4. Open your phone's File Manager and tap the `pinetime-mcuboot-app-dfu-1.16.0.zip` file.
5. Select **Open with Gadgetbridge** (or **Install Firmware/App**).
6. Gadgetbridge will parse the manifest and display:
   - Target: PineTime Application
   - Version: 1.16.0
   - Size: ~433 KB
7. Tap **Install / Start Update**.
8. Keep the phone within 1 meter of the watch. The transfer takes approximately 3 to 5 minutes.
9. When complete, the watch will reboot into MCUBoot and boot into **WristOS**.

---

## 3. Flashing Method B: WristOS Web Companion (Chrome / Edge on macOS / Windows)

You can flash directly from your computer via Web Bluetooth:

### Steps:
1. Ensure the web companion is running (`npm --prefix web run dev`).
2. Open Google Chrome or Edge and navigate to `http://localhost:3000`.
3. Go to the **Devices** tab.
4. Click **Scan Physical BLE**.
5. Select your PineTime from the browser Bluetooth pairing dialog.
6. Once connected, locate the **Firmware OTA Update** section.
7. Select the file `firmware/build/src/pinetime-mcuboot-app-dfu-1.16.0.zip`.
8. Click **Start Wireless DFU Update**.
9. The progress bar will indicate transfer status. Do not close the tab until complete.

---

## 4. Flashing Method C: nRF Connect (iOS / Android)

If you use an iPhone or prefer Nordic's official developer utility:

### Steps:
1. Install **nRF Connect for Mobile** from the Apple App Store or Google Play Store.
2. Transfer `pinetime-mcuboot-app-dfu-1.16.0.zip` to your device.
3. Open nRF Connect and scan for Bluetooth devices.
4. Find **PineTime** or **WristOS** and tap **Connect**.
5. Swipe to the **DFU** tab in the top navigation.
6. Select **Distribution packet (ZIP)** and choose `pinetime-mcuboot-app-dfu-1.16.0.zip`.
7. Tap **Start**.
8. The Nordic DFU bootloader will receive the image and verify the CRC before rebooting.

---

## 5. First Boot & Firmware Validation

Upon first reboot into WristOS:
1. The **WristOS Minimal Pro** watch face will display with the signature geometric white numbers, ambient purple silk wave, and complications.
2. Tap the screen or press the side button to verify UI responsiveness.
3. In InfiniTime / MCUBoot, once the firmware runs without crashing for 10 seconds, the image is validated and becomes permanent in Slot 0.

### Emergency Rollback (If Needed)
If the watch does not respond or encounters an issue during the first boot:
- Long-press the physical side button for **8 seconds** to force a hard hardware reset.
- MCUBoot will detect that the test image was not validated and will automatically swap back to the previous firmware.
