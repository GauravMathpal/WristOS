# WristOS Firmware — Hardware Specification & Pinout

## 1. Physical Hardware Platform
The target hardware for WristOS is the **PINE64 PineTime (Factory Sealed Edition)**.

> [!CAUTION]
> The sealed edition is sonically welded and waterproofed. There are **NO accessible SWD / JTAG pins**. If a bad firmware bricks the watch, hardware recovery is impossible without destructively opening the casing.

---

## 2. Core SoC: Nordic Semiconductor nRF52832
- **Architecture**: 32-bit ARM Cortex-M4F with single-precision hardware FPU.
- **Clock Speed**: 64 MHz (Internal 64 MHz RC oscillator + 32 MHz HF crystal; 32.768 kHz external crystal for LFCLK).
- **Internal Flash**: 512 KB (Page size: 4 KB).
- **Internal SRAM**: 64 KB.
- **Operating Voltage**: 3.3V (Stepped down via internal DC/DC converter from battery).

---

## 3. Peripheral Hardware & Interconnects

### 3.1 Display
- **Type**: 1.3-inch Transflective/IPS TFT LCD, 240 × 240 pixels (RGB565, 65k colors).
- **Display Driver IC**: Sitronix **ST7789V**.
- **Bus Interface**: SPI (Shared hardware master `SPI0`).
- **Maximum Clock**: 8 MHz.

### 3.2 External Flash Memory
- **Chip**: Macronix / XTX **XT25F32B** (or compatible 32 Mbit / 4 MByte NOR Flash).
- **Bus Interface**: SPI (Shared hardware master `SPI0`).
- **Chip Select**: Independent CS line.
- **Partitioning**:
  - `0x00000000 - 0x0003FFFF` (256 KB): Bootloader splash assets & recovery fonts.
  - `0x00040000 - 0x000B3FFF` (464 KB): MCUBoot Secondary Application Slot (OTA Staging).
  - `0x000B4000 - 0x003FFFFF` (~3.3 MB): LittleFS partition for user data, settings, and watchfaces.

### 3.3 Capacitive Touch Controller
- **Chip**: Hynitron **CST816S**.
- **Bus Interface**: I2C (`TWIM1`), standard slave address `0x15`.
- **Interrupt Mode**: Active Low pulse on `P0.28`.
- **Capabilities**: Point coordinates (X, Y), touch down/up, gestures (Swipe Up, Down, Left, Right, Tap, DoubleTap, LongPress).

### 3.4 Accelerometer / Motion Sensor
- **Chip**: Bosch Sensortec **BMA421** (or pin-compatible BMA425).
- **Bus Interface**: I2C (`TWIM1`), slave address `0x18`.
- **Features**: 3-axis accelerometer (±2g to ±16g), integrated hardware step-counting engine, tilt/wake interrupt generation on `P0.08`.

### 3.5 Optical Heart Rate Sensor (PPG)
- **Chip**: TianYiHeXin **HRS3300**.
- **Bus Interface**: I2C (`TWIM1`), slave address `0x44`.
- **Features**: Dual green LED emitter, integrated photodiode, 15-bit ADC output for raw PPG data, integrated ambient light sensing (ALS).

### 3.6 Power & Battery Management
- **Battery**: Rechargeable 3.7V Lithium-Polymer, 170 mAh – 180 mAh.
- **Charging IC**: SGM40561 1A linear Li-ion charger.
- **ADC Voltage Reading**: Dedicated analog line to `P0.31` (AIN7) connected across a 1/2 resistor divider.
- **Power Detection**: Active Low pin `P0.19` detects connection to 5V magnetic charging dock.

### 3.7 Haptic Feedback (Vibration Motor)
- **Type**: Eccentric Rotating Mass (ERM) micro vibration motor.
- **Control**: Driven by an NPN transistor on `P0.16` (Active High).

### 3.8 Push Button
- **Location**: Single physical button on the left edge.
- **Control**: Connected to `P0.13` with internal pull-down. Monitored via GPIOTE toggle interrupt. `P0.15` (ButtonEnable) must be driven HIGH to supply power to button circuit.

---

## 4. Complete Pinout Matrix

| Pin Identifier | Function / Peripheral | Direction | Active Level / Config |
| :--- | :--- | :--- | :--- |
| **`P0.02`** | SPI SCK (Shared ST7789 & XT25F32B) | Output | Mode 3, 8 MHz |
| **`P0.03`** | SPI MOSI (Shared) | Output | SPI Data Out |
| **`P0.04`** | SPI MISO (XT25F32B Flash Data Out) | Input | SPI Data In |
| **`P0.05`** | SPI Flash CS (`SpiFlashCsn`) | Output | Active Low |
| **`P0.06`** | I2C SDA (`TwiSda`) | Bi-dir | External Pullup, 390 kHz |
| **`P0.07`** | I2C SCL (`TwiScl`) | Output | External Pullup, 390 kHz |
| **`P0.08`** | BMA421 Motion Interrupt | Input | Active High |
| **`P0.10`** | CST816S Touch Reset | Output | Active Low |
| **`P0.13`** | Physical Push Button | Input | Active High (GPIOTE) |
| **`P0.14`** | LCD Backlight Low (`LcdBacklightLow`) | Output | Active Low |
| **`P0.15`** | Push Button Power Enable (`ButtonEnable`) | Output | Active High |
| **`P0.16`** | Vibration Motor Enable (`Motor`) | Output | Active High |
| **`P0.18`** | ST7789 Command/Data Select (`LcdDataCommand`) | Output | High = Data, Low = Command |
| **`P0.19`** | 5V Power Present Detect (`PowerPresent`) | Input | Active Low (on charger) |
| **`P0.22`** | LCD Backlight Mid (`LcdBacklightMid`) | Output | Active Low |
| **`P0.23`** | LCD Backlight High (`LcdBacklightHigh`) | Output | Active Low |
| **`P0.25`** | ST7789 LCD CS (`SpiLcdCsn`) | Output | Active Low |
| **`P0.26`** | ST7789 LCD Reset (`LcdReset`) | Output | Active Low |
| **`P0.28`** | CST816S Touch Interrupt (`Cst816sIrq`) | Input | Active Low (Falling edge) |
| **`P0.31`** | Battery Voltage Sense (`BatteryVoltage` / AIN7) | Analog Input | Internal 0.6V ref, 1/6 gain |
