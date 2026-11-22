import { BleClient, BleDevice, numbersToDataView, dataViewToNumbers } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export const INFINITIME_SERVICES = {
  CTS: '00001805-0000-1000-8000-00805f9b34fb', // Current Time Service
  CTS_TIME: '00002a2b-0000-1000-8000-00805f9b34fb',

  HRS: '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
  HRS_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',

  BAS: '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
  BAS_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',

  ANS: '00001811-0000-1000-8000-00805f9b34fb', // Alert Notification Service
  ANS_ALERT: '00002a46-0000-1000-8000-00805f9b34fb',

  MOTION: '00000001-0002-0000-0000-000000000000', // Motion / Steps
  MOTION_STEPS: '00000003-0002-0000-0000-000000000000',

  EVENT: '00000000-78fc-48fe-8e23-433b3a1942d0', // WristOS Watch Event Service
  EVENT_TRIGGER: '00000001-78fc-48fe-8e23-433b3a1942d0'
}

export interface WatchTelemetry {
  heartRate: number
  stepCount: number
  batteryLevel: number
}

class WatchBleService {
  private deviceId: string | null = null
  private isInitialized = false
  // Web Bluetooth handles
  private webDevice: any = null
  private webServer: any = null

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (Capacitor.isNativePlatform()) {
      await BleClient.initialize()
    }
    this.isInitialized = true
  }

  async scanAndConnect(onTelemetry: (t: Partial<WatchTelemetry>) => void, onAiTrigger?: () => void): Promise<string> {
    await this.initialize()

    // 1. Android Native Platform via Capacitor
    if (Capacitor.isNativePlatform()) {
      const device: BleDevice = await BleClient.requestDevice({
        namePrefix: 'WristOS',
        optionalServices: [
          INFINITIME_SERVICES.CTS,
          INFINITIME_SERVICES.HRS,
          INFINITIME_SERVICES.BAS,
          INFINITIME_SERVICES.ANS,
          INFINITIME_SERVICES.MOTION,
          INFINITIME_SERVICES.EVENT
        ]
      })

      this.deviceId = device.deviceId
      await BleClient.connect(this.deviceId)

      // Synchronize Current Time (CTS)
      await this.syncCurrentTime(this.deviceId)

      // Read Battery Level (BAS)
      try {
        const batVal = await BleClient.read(this.deviceId, INFINITIME_SERVICES.BAS, INFINITIME_SERVICES.BAS_LEVEL)
        const bat = batVal.getUint8(0)
        onTelemetry({ batteryLevel: bat })
      } catch (e) {
        console.warn('Battery read failed:', e)
      }

      // Subscribe to Heart Rate Notifications (HRS)
      try {
        await BleClient.startNotifications(
          this.deviceId,
          INFINITIME_SERVICES.HRS,
          INFINITIME_SERVICES.HRS_MEASUREMENT,
          (val) => {
            const raw = dataViewToNumbers(val)
            if (raw.length > 1) {
              const hr = raw[0] & 0x01 ? (raw[1] | (raw[2] << 8)) : raw[1]
              onTelemetry({ heartRate: hr })
            }
          }
        )
      } catch (e) {
        console.warn('HRS notification start failed:', e)
      }

      // Subscribe to Steps Notifications
      try {
        await BleClient.startNotifications(
          this.deviceId,
          INFINITIME_SERVICES.MOTION,
          INFINITIME_SERVICES.MOTION_STEPS,
          (val) => {
            const raw = dataViewToNumbers(val)
            if (raw.length >= 4) {
              const steps = raw[0] | (raw[1] << 8) | (raw[2] << 16) | (raw[3] << 24)
              onTelemetry({ stepCount: steps })
            }
          }
        )
      } catch (e) {
        console.warn('Motion steps notification start failed:', e)
      }

      // Subscribe to Watch AI Mode Trigger Events (Music event 0xAA)
      try {
        await BleClient.startNotifications(
          this.deviceId,
          INFINITIME_SERVICES.EVENT,
          INFINITIME_SERVICES.EVENT_TRIGGER,
          (val) => {
            const raw = dataViewToNumbers(val)
            if (raw.length > 0 && raw[0] === 0xAA) {
              onAiTrigger?.()
            }
          }
        )
      } catch (e) {
        console.warn('Watch AI event notification start failed:', e)
      }

      return device.name || 'WatchOS (BLE)'
    }

    // 2. Standard Web Bluetooth API (Google Chrome on Android, Windows, Mac, Linux)
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        return await this.connectWebBluetooth(onTelemetry, onAiTrigger)
      } catch (err: any) {
        console.warn('Web Bluetooth cancelled or unavailable, using simulation fallback:', err)
        return this.simulateConnection(onTelemetry)
      }
    }

    // 3. Fallback to Simulator if browser lacks Bluetooth support
    return this.simulateConnection(onTelemetry)
  }

  private async connectWebBluetooth(
    onTelemetry: (t: Partial<WatchTelemetry>) => void,
    onAiTrigger?: () => void
  ): Promise<string> {
    const navBle = (navigator as any).bluetooth
    const device = await navBle.requestDevice({
      filters: [
        { namePrefix: 'WristOS' },
        { namePrefix: 'PineTime' },
        { namePrefix: 'InfiniTime' }
      ],
      optionalServices: [
        INFINITIME_SERVICES.CTS,
        INFINITIME_SERVICES.HRS,
        INFINITIME_SERVICES.BAS,
        INFINITIME_SERVICES.ANS,
        INFINITIME_SERVICES.EVENT,
        INFINITIME_SERVICES.MOTION
      ]
    })

    this.webDevice = device
    const server = await device.gatt.connect()
    this.webServer = server

    // 1. Synchronize Current Time (CTS)
    try {
      const cts = await server.getPrimaryService(INFINITIME_SERVICES.CTS)
      const timeChar = await cts.getCharacteristic(INFINITIME_SERVICES.CTS_TIME)
      const now = new Date()
      const year = now.getFullYear()
      const payload = new Uint8Array([
        year & 0xff,
        (year >> 8) & 0xff,
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getDay() || 7,
        0,
        1
      ])
      await timeChar.writeValue(payload)
    } catch (e) {
      console.warn('CTS Web Bluetooth sync failed:', e)
    }

    // 2. Battery Level (BAS)
    try {
      const bas = await server.getPrimaryService(INFINITIME_SERVICES.BAS)
      const batChar = await bas.getCharacteristic(INFINITIME_SERVICES.BAS_LEVEL)
      const val = await batChar.readValue()
      onTelemetry({ batteryLevel: val.getUint8(0) })
    } catch (e) {
      console.warn('BAS Web Bluetooth read failed:', e)
    }

    // 3. Heart Rate (HRS)
    try {
      const hrs = await server.getPrimaryService(INFINITIME_SERVICES.HRS)
      const hrChar = await hrs.getCharacteristic(INFINITIME_SERVICES.HRS_MEASUREMENT)
      await hrChar.startNotifications()
      hrChar.addEventListener('characteristicvaluechanged', (ev: any) => {
        const val: DataView = ev.target.value
        if (val.byteLength > 1) {
          const hr = val.getUint8(0) & 0x01 ? val.getUint16(1, true) : val.getUint8(1)
          onTelemetry({ heartRate: hr })
        }
      })
    } catch (e) {
      console.warn('HRS Web Bluetooth subscribe failed:', e)
    }

    // 4. Motion / Steps
    try {
      const motion = await server.getPrimaryService(INFINITIME_SERVICES.MOTION)
      const stepsChar = await motion.getCharacteristic(INFINITIME_SERVICES.MOTION_STEPS)
      await stepsChar.startNotifications()
      stepsChar.addEventListener('characteristicvaluechanged', (ev: any) => {
        const val: DataView = ev.target.value
        if (val.byteLength >= 4) {
          const steps = val.getUint32(0, true)
          onTelemetry({ stepCount: steps })
        }
      })
    } catch (e) {
      console.warn('Motion Web Bluetooth subscribe failed:', e)
    }

    // 5. Watch AI Mode Trigger Events (Music Event 0xAA)
    try {
      const evtService = await server.getPrimaryService(INFINITIME_SERVICES.EVENT)
      const evtChar = await evtService.getCharacteristic(INFINITIME_SERVICES.EVENT_TRIGGER)
      await evtChar.startNotifications()
      evtChar.addEventListener('characteristicvaluechanged', (ev: any) => {
        const val: DataView = ev.target.value
        if (val.byteLength > 0 && val.getUint8(0) === 0xAA) {
          onAiTrigger?.()
        }
      })
    } catch (e) {
      console.warn('Watch AI event subscribe failed:', e)
    }

    return device.name || 'WatchOS (Web Bluetooth)'
  }

  async sendAlert(message: string): Promise<void> {
    // Phone haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch (e) {}

    // Dispatch BLE Alert Notification to WatchOS (ANS 0x1811)
    if (this.deviceId && Capacitor.isNativePlatform()) {
      try {
        const encoder = new TextEncoder()
        const textBytes = Array.from(encoder.encode(message.slice(0, 18)))
        const payload = [0x05, 0x01, ...textBytes]
        await BleClient.write(
          this.deviceId,
          INFINITIME_SERVICES.ANS,
          INFINITIME_SERVICES.ANS_ALERT,
          numbersToDataView(payload)
        )
      } catch (e) {
        console.warn('Watch alert write failed:', e)
      }
    } else if (this.webServer) {
      try {
        const ans = await this.webServer.getPrimaryService(INFINITIME_SERVICES.ANS)
        const alertChar = await ans.getCharacteristic(INFINITIME_SERVICES.ANS_ALERT)
        const encoder = new TextEncoder()
        const textBytes = Array.from(encoder.encode(message.slice(0, 18)))
        const payload = new Uint8Array([0x05, 0x01, ...textBytes])
        await alertChar.writeValue(payload)
      } catch (e) {
        console.warn('Web Bluetooth alert failed:', e)
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.deviceId && Capacitor.isNativePlatform()) {
      await BleClient.disconnect(this.deviceId)
      this.deviceId = null
    }
    if (this.webDevice && this.webDevice.gatt?.connected) {
      this.webDevice.gatt.disconnect()
      this.webDevice = null
      this.webServer = null
    }
  }

  public async syncTime(): Promise<void> {
    if (this.deviceId) {
      await this.syncCurrentTime(this.deviceId)
    } else if (this.webServer) {
      try {
        const cts = await this.webServer.getPrimaryService(INFINITIME_SERVICES.CTS)
        const timeChar = await cts.getCharacteristic(INFINITIME_SERVICES.CTS_TIME)
        const now = new Date()
        const year = now.getFullYear()
        const payload = new Uint8Array([
          year & 0xff,
          (year >> 8) & 0xff,
          now.getMonth() + 1,
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getDay() || 7,
          0,
          1
        ])
        await timeChar.writeValue(payload)
      } catch (e) {
        console.warn('Web CTS sync failed:', e)
      }
    } else {
      console.log('CTS simulated time synchronized.')
    }
  }

  private async syncCurrentTime(deviceId: string): Promise<void> {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const payload = [
        year & 0xff,
        (year >> 8) & 0xff,
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getDay() || 7,
        0, // 1/256 sec
        1  // manual update reason
      ]
      await BleClient.write(
        deviceId,
        INFINITIME_SERVICES.CTS,
        INFINITIME_SERVICES.CTS_TIME,
        numbersToDataView(payload)
      )
    } catch (e) {
      console.warn('CTS time sync error:', e)
    }
  }

  private simulateConnection(onTelemetry: (t: Partial<WatchTelemetry>) => void): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        onTelemetry({
          heartRate: 74,
          stepCount: 7120,
          batteryLevel: 86
        })
        resolve('WatchOS (BLE Simulator)')
      }, 1000)
    })
  }
}

export const watchBleService = new WatchBleService()
