# WristOS Firmware — BLE Communication Protocol Specification

## 1. Overview
WristOS implements standard Bluetooth Low Energy (BLE) GATT services alongside optimized proprietary characteristics powered by the **Apache Mynewt NimBLE** stack on the nRF52832.

Compatibility is strictly maintained with:
1. Standard InfiniTime companion tools (Gadgetbridge, Siglo, InfiniLink).
2. The WristOS Android Mobile Application (`app/`).
3. The WristOS Web Client (`web/`).

---

## 2. Device Identity & Advertising

- **Device Name**: `WristOS` (or `Pinetime-WristOS`)
- **Advertising Interval**: 100 ms (Fast connect when disconnected) / 500 ms (Battery save mode)
- **Primary Service Advertised**: Current Time Service (`0x1805`) & DFU Service (`00001530-1212-efde-1523-785feabcd123`)

---

## 3. GATT Services & Characteristics

### 3.1 Current Time Service (CTS)
- **Service UUID**: `0x1805` (`00001805-0000-1000-8000-00805f9b34fb`)
- **Current Time Characteristic**: `0x2A2B`
  - **Properties**: Read, Write
  - **Payload Structure (10 bytes)**:
    - Byte 0..1: Year (uint16, little-endian)
    - Byte 2: Month (1-12)
    - Byte 3: Day of month (1-31)
    - Byte 4: Hours (0-23)
    - Byte 5: Minutes (0-59)
    - Byte 6: Seconds (0-59)
    - Byte 7: Day of week (1=Monday .. 7=Sunday)
    - Byte 8: Fractions (1/256th of second)
    - Byte 9: Adjust reason

### 3.2 Battery Service (BAS)
- **Service UUID**: `0x180F` (`0000180f-0000-1000-8000-00805f9b34fb`)
- **Battery Level Characteristic**: `0x2A19`
  - **Properties**: Read, Notify
  - **Payload**: 1 byte (`uint8`), range `0` to `100` (%)

### 3.3 Heart Rate Service (HRS)
- **Service UUID**: `0x180D` (`0000180d-0000-1000-8000-00805f9b34fb`)
- **Heart Rate Measurement Characteristic**: `0x2A37`
  - **Properties**: Notify
  - **Payload Structure**:
    - Byte 0: Flags (`0x00` = 8-bit BPM format)
    - Byte 1: Heart Rate in BPM (`uint8`)

### 3.4 Motion & Step Counter Service (InfiniTime Motion)
- **Service UUID**: `00000001-0002-0000-0000-000000000000`
- **Step Count Characteristic**: `00000003-0002-0000-0000-000000000000`
  - **Properties**: Read, Notify
  - **Payload**: 4 bytes (`uint32_t`, little-endian) representing total step count
- **Raw Motion Values Characteristic**: `00000002-0002-0000-0000-000000000000`
  - **Properties**: Read, Notify
  - **Payload**: 6 bytes (int16 X, Y, Z acceleration)

### 3.5 Alert Notification Service (ANS)
- **Service UUID**: `0x1811` (`00001811-0000-1000-8000-00805f9b34fb`)
- **New Alert Characteristic**: `0x2A46`
  - **Properties**: Write
  - **Payload Structure**:
    - Byte 0: Category ID:
      - `0x01`: Email
      - `0x02`: News
      - `0x03`: Call
      - `0x04`: SMS
      - `0x05`: Voice mail
      - `0x06`: Schedule / Reminder
      - `0x0E`: Instant Message (WhatsApp, Telegram, Slack)
    - Byte 1: Number of alerts (typically `0x01`)
    - Byte 2+: UTF-8 string payload (Title + `\0` + Message body)

### 3.6 Immediate Alert Service (Vibration & Find My Watch)
- **Service UUID**: `0x1802` (`00001802-0000-1000-8000-00805f9b34fb`)
- **Alert Level Characteristic**: `0x2A06`
  - **Properties**: Write Without Response
  - **Values**:
    - `0x00`: No Alert / Stop vibrating
    - `0x01`: Mild Alert (Short vibration pulse)
    - `0x02`: High Alert (Continuous vibration pattern)

### 3.7 Device Information Service (DIS)
- **Service UUID**: `0x180A`
- **Manufacturer Name**: `WristOS Project`
- **Model Number**: `PineTime Sealed V1`
- **Firmware Revision**: `WristOS 1.0.0`

### 3.8 MCUBoot OTA DFU Service
- **Service UUID**: `00001530-1212-efde-1523-785feabcd123`
- **Control Point**: `00001531-1212-efde-1523-785feabcd123`
- **Packet Characteristic**: `00001532-1212-efde-1523-785feabcd123`
- **Revision Characteristic**: `00001534-1212-efde-1523-785feabcd123`

---

## 4. Communication Flows

### Phone $\to$ Watch Data Flow
1. **Time Sync**: Phone writes timestamp to `0x2A2B` on connection.
2. **Alerts/Notifications**: Phone writes notification text to `0x2A46`. Watch wakes up, triggers vibration, and displays notification overlay.
3. **Timer / Productivity Triggers**: Phone sends focus alerts or alarms via Immediate Alert (`0x1802`).

### Watch $\to$ Phone Data Flow
1. **Heart Rate Stream**: Watch pushes notifications on `0x2A37` at 1 Hz when sensor is active.
2. **Steps Stream**: Watch updates `0x0003-0002...` periodically or when polled.
3. **Battery Monitoring**: Watch sends notify updates on `0x2A19` on state change or 5% intervals.
