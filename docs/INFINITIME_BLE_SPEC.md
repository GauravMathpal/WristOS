# WristOS InfiniTime BLE Communication Protocol Specification

**Document Version:** 1.0.0  
**Target Firmware:** InfiniTime (PineTime)  
**Coordination:** Group 1 (App / Phone) & Group 2 (Watch / Firmware)

---

## 1. Overview
The PineTime smartwatch runs InfiniTime firmware. WristOS uses standard BLE GATT services supported natively by InfiniTime alongside custom Alert Notification services.

---

## 2. Standard InfiniTime GATT Services & UUIDs

### 2.1 Current Time Service (CTS)
- **Service UUID:** `00001805-0000-1000-8000-00805f9b34fb` (0x1805)
- **Current Time Characteristic:** `00002a2b-0000-1000-8000-00805f9b34fb` (0x2A2B)
- **Properties:** Read, Write
- **Usage:** Synchronizes exact phone time to PineTime on connection.

### 2.2 Heart Rate Service (HRS)
- **Service UUID:** `0000180d-0000-1000-8000-00805f9b34fb` (0x180D)
- **Measurement Characteristic:** `00002a37-0000-1000-8000-00805f9b34fb` (0x2A37)
- **Properties:** Notify
- **Format:** Standard BLE HRS format. Byte 1 contains BPM (if 8-bit format).

### 2.3 Battery Service (BAS)
- **Service UUID:** `0000180f-0000-1000-8000-00805f9b34fb` (0x180F)
- **Battery Level Characteristic:** `00002a19-0000-1000-8000-00805f9b34fb` (0x2A19)
- **Properties:** Read, Notify
- **Format:** 1 unsigned byte representing battery percentage (0-100%).

### 2.4 Alert Notification Service (ANS) / InfiniTime Notifications
- **Service UUID:** `00001811-0000-1000-8000-00805f9b34fb` (0x1811)
- **New Alert Characteristic:** `00002a46-0000-1000-8000-00805f9b34fb` (0x2A46)
- **Properties:** Write
- **Format:**
  - Byte 0: Category ID (e.g., 0x01 = Email, 0x02 = News, 0x03 = Call, 0x04 = SMS, 0x05 = Simple Alert)
  - Byte 1: Number of alerts (0x01)
  - Byte 2+: UTF-8 string containing message/notification payload.

### 2.5 Motion / Step Counter Service (InfiniTime Motion Service)
- **Service UUID:** `00000001-0002-0000-0000-000000000000` (InfiniTime standard)
- **Step Count Characteristic:** `00000003-0002-0000-0000-000000000000`
- **Properties:** Read, Notify
- **Format:** 4-byte unsigned integer (little-endian) representing total steps.

---

## 3. Phone-Side Connection State Machine
1. **Scanning:** Filter for devices advertising `InfiniTime` or `PineTime`.
2. **Connecting:** Establish GATT connection with auto-reconnect fallback.
3. **Discovery:** Discover all services upon connection.
4. **Time Sync:** Immediately write current phone timestamp to CTS (0x1805).
5. **Subscription:** Enable notifications for Heart Rate (0x180D) and Step Count.
6. **Alert Dispatch:** Forward reminders and phone alerts to 0x1811.
