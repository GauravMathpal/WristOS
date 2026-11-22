# WristOS Firmware — Hardware Safety & Bricking Prevention Guide

## 1. The Sealed PineTime Reality

> [!CAUTION]
> **OUR WATCH IS THE SEALED VERSION.**
> The sealed watch casing is ultrasonically welded and watertight.
> There are **NO accessible debug headers, SWD pins, or serial pads**.
> If corrupted code locks the MCU or overwrites the bootloader, **THE DEVICE IS PERMANENTLY BRICKED.**
> Treat every binary and update command as a mission-critical production operation.

---

## 2. Bootloader Architecture: MCUBoot & Protection

The PineTime utilizes **MCUBoot**, an open-source, dual-bank, rollback-capable bootloader.

```
Internal Flash (512 KB):
+-------------------------+ 0x00000000
| MCUBoot Bootloader      | (Read-Only Partition, 28 KB)
| CANNOT BE OVERWRITTEN   |
+-------------------------+ 0x00007000
| Reboot & Crash Logs     | (4 KB)
+-------------------------+ 0x00008000
| MCUBoot Header (32 B)   |
+-------------------------+ 0x00008020
| Application Slot 0      | (Active running firmware, ~463 KB)
|                         |
+-------------------------+ 0x0007BE50
| MCUBoot Image Trailer   | (Validation status flags, 432 B)
+-------------------------+ 0x0007C000
| MCUBoot Scratch Pad     | (Swap workspace, 4 KB)
+-------------------------+ 0x0007D000
| Unused Space (12 KB)    |
+-------------------------+ 0x00080000
```

### External SPI NOR Flash (4 MB):
- `0x00040000 - 0x000B3FFF` (464 KB): **Application Slot 1** (Secondary / Staging Slot).

---

## 3. How the Safe Rollback Mechanism Works

1. During a wireless OTA update, the companion app uploads the new firmware binary **ONLY to External Flash Slot 1**.
2. The image trailer in Slot 1 is marked with flag: `TEST` (Candidate Image).
3. The watch executes a software reset (`NVIC_SystemReset()`).
4. On startup, MCUBoot detects a valid pending image in Slot 1.
5. MCUBoot swaps Slot 1 into Internal Flash Slot 0 using the 4 KB Scratch partition.
6. The new firmware begins execution in **Unvalidated Mode**.
7. **The Validation Gate**:
   - The user must explicitly press "Validate" on the watch screen (or the companion app confirms stability within the timeout window).
   - Once confirmed, `validator.Validate()` writes to the MCUBoot trailer, marking the slot as `CONFIRMED`.
8. **Automatic Rollback Trigger**:
   - If the new firmware crashes, encounters a HardFault, causes a watchdog reset, or hangs before being validated, MCUBoot detects an unconfirmed boot.
   - Upon the next reset, MCUBoot automatically **reverts back to the previous stable firmware image**.

---

## 4. Absolute Rules for Safety

### NEVER:
1. **NEVER modify or rewrite the bootloader sector** (`0x00000000 - 0x00007FFF`).
2. **NEVER change partition boundaries or flash offsets** in `gcc_nrf52-mcuboot.ld`.
3. **NEVER execute mass erase commands** on internal flash.
4. **NEVER flash a firmware that automatically self-validates on boot** without verifying system stability and watchdog execution first.
5. **NEVER attempt physical SWD flashing** or soldering on the sealed device.
6. **NEVER deploy a raw `.bin` without proper MCUBoot headers and trailers**.
7. **NEVER bypass physical verification in the InfiniSim simulator**.

### ALWAYS:
1. **ALWAYS test UI, logic, and state machines in InfiniSim** before hardware staging.
2. **ALWAYS verify the MCUBoot image magic number and header length** (`imgtool verify`).
3. **ALWAYS maintain the safe rollback window** (minimum 60 seconds) before confirming any OTA update.
4. **ALWAYS keep a tested, known-good reference firmware package** archived for emergency rollback.
5. **ALWAYS get explicit confirmation from the project lead** before initiating any wireless DFU transmission to the physical watch.
