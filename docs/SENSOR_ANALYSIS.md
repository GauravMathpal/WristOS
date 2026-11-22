# WristOS Firmware — Sensor Analysis & Limitations

## 1. Overview
WristOS strictly adheres to the principle: **NEVER generate fake sensor readings.**
If a sensor is disconnected, reading fails, or hardware is uninitialized, the firmware reports error states explicitly to the UI and companion application.

---

## 2. Bosch Sensortec BMA421 (Accelerometer)

### 2.1 Hardware Architecture
- The BMA421 is a 3-axis digital accelerometer connected via I2C (`0x18`).
- Driver: `firmware/src/drivers/Bma421.cpp`.
- Integrated firmware engine: BMA421 contains an internal micro-engine configured by an initialization binary blob (`bma423_init`).

### 2.2 Capabilities:
1. **Raw Acceleration**: Measured in 3 axes (X, Y, Z). Scaled using factor `1024 LSB/g` (±2g range).
2. **Step Counter**:
   - The chip's internal engine detects walking/running steps in hardware.
   - InfiniTime queries `bma423_step_counter_output(&bma, &steps)`.
   - The hardware register yields total lifetime steps since power-on.
   - `MotionController` computes daily deltas and preserves totals in LittleFS.
3. **Wrist Wake / Tilt Detection**:
   - Polled in `SystemTask` every 100 ms (`stateUpdatePeriod`).
   - Analyzes orientation angle against predefined thresholds to wake the display.

### 2.3 Limitations & Constraints:
- **I2C Bus Glitches**: A known nRF52 TWIM hardware erratum can lock the bus if clocks are interrupted. `main.cpp` executes a manual 16-pulse SCL clock sequence on boot, and `SystemTask` resets TWIM if BMA421 fails to acknowledge.
- **No Gyroscope / Magnetometer**: No compass heading or rotation rate available.
- **Reset Persistence**: If the watch does a cold reboot, the hardware register in BMA421 resets to 0. Firmware must retain accumulated steps in NVRAM/LittleFS.

---

## 3. TianYiHeXin HRS3300 (Optical Heart Rate & PPG)

### 3.1 Hardware Architecture
- The HRS3300 consists of dual green LEDs (525 nm) and a photodiode detector connected via I2C (`0x44`).
- Driver: `firmware/src/drivers/Hrs3300.cpp`.
- Processing Task: `firmware/src/heartratetask/HeartRateTask.cpp`.

### 3.2 Signal Acquisition & Processing
1. **LED Drive & Gain Settings**:
   - Resolution: 15-bit mode for both HRS and ALS (`0x77` written to `Res` register).
   - LED drive current: 12.5 mA (`0x2F` written to `PDriver`).
   - Low nibble `0xF` provides clean, unmodulated continuous light during ADC sampling.
2. **Sampling Rate**:
   - `HeartRateTask` samples the sensor at 25 Hz via FreeRTOS timer.
3. **Signal Processing Pipeline**:
   - Samples enter a rolling FIFO buffer.
   - Fast Fourier Transform (FFT) via `arduinoFFT` library isolates dominant frequency peaks within human heart rate limits (40 BPM – 220 BPM).
   - Signal quality metric (SNR) confirms whether skin contact is detected.

### 3.3 Sensor States & Error Handling:
The firmware reports 4 distinct states to the UI and BLE stack:
- `Off`: Sensor disabled (LED off, power-down).
- `Sampling`: Sensor active, collecting initial window (~5 seconds) before first stable reading.
- `Reading`: Stable BPM reading available with high confidence.
- `NoContact`: Watch is not against skin or photodiode saturated by ambient light.

### 3.4 Limitations & Constraints:
- **No SpO2 (Pulse Oximetry)**: The HRS3300 on PineTime has green LEDs only. Pulse oximetry requires red (660 nm) and infrared (940 nm) LEDs. WristOS will NOT simulate or synthesize SpO2 readings.
- **Motion Artifact Sensitivity**: High motion (running, shaking) induces noise. The algorithm flags noisy readings rather than guessing.

---

## 4. Battery Monitoring (SAADC)

### 4.1 Hardware Architecture
- Battery: 3.7V nominal Li-Po cell.
- Sensing: Pin `P0.31` (AIN7) connected to a 1/2 resistor divider (e.g. 1MΩ + 1MΩ).
- Controller: `firmware/src/components/battery/BatteryController.cpp`.

### 4.2 ADC Configuration:
- Resolution: 12-bit SAADC (0 to 4095).
- Internal Reference: 0.6V with 1/6 gain stage (input range: 0V to 3.6V).
- Sampling formula:
  $$\text{Voltage (mV)} = \frac{\text{ADC Output} \times 3600 \times 2}{4095}$$

### 4.3 Calibration & Percent Approximation:
- InfiniTime uses a piecewise linear curve to map non-linear LiPo discharge voltages to battery percentage:
  - 4.18V+: 100%
  - 3.85V: ~70%
  - 3.70V: ~40%
  - 3.50V: ~10%
  - 3.30V: 0% (Shutdown threshold)
- Filter: Hysteresis window and moving average filter prevent percentage jumping when current loads spike (e.g. vibration motor or BLE transmission).
- Charging status is verified via `PowerPresent` (`P0.19`).

---

## 5. CST816S Capacitive Touch Panel

### 5.1 Architecture
- Self-capacitive single-touch controller over I2C (`0x15`).
- Interrupt triggered on `P0.28` (active low falling edge).
- Coordinates: 0 to 239 on X and Y axes.
- Gestures decoded directly by hardware/touch firmware:
  - `0x01`: Slide Up
  - `0x02`: Slide Down
  - `0x03`: Slide Left
  - `0x04`: Slide Right
  - `0x05`: Single Click (Tap)
  - `0x0B`: Double Click (DoubleTap)
  - `0x0C`: Long Press

---

## 6. Summary Matrix: Sensor Truth Table

| Sensor Parameter | Real Hardware Measurement | Error/No-Data Presentation | Prohibited Behavior |
| :--- | :--- | :--- | :--- |
| **Heart Rate** | 40 - 220 BPM from HRS3300 PPG | Display `-- BPM` / "Measuring..." | Never inject random/placeholder BPM |
| **SpO2 / Blood Oxygen** | NOT PRESENT IN HARDWARE | Feature disabled / hidden | Never fake blood oxygen percentages |
| **Step Count** | Hardware BMA421 counter | `0` or last saved count | Never generate synthetic steps |
| **Battery Level** | SAADC voltage piecewise conversion | Display warning if `< 3.3V` | Never lock to 100% |
| **Skin Temperature** | NOT PRESENT IN HARDWARE | Feature disabled / hidden | Never estimate skin temperature |
