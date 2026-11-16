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
  MOTION_STEPS: '00000003-0002-0000-0000-000000000000'
}

export interface WatchTelemetry {
  heartRate: number
  stepCount: number
  batteryLevel: number
}

class WatchBleService {
  private deviceId: string | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (Capacitor.isNativePlatform()) {
      await BleClient.initialize()
    }
    this.isInitialized = true
  }

  async scanAndConnect(onTelemetry: (t: Partial<WatchTelemetry>) => void): Promise<string> {
    await this.initialize()

    if (!Capacitor.isNativePlatform()) {
      // Browser / Emulator fallback: Web Bluetooth or simulated telemetry
      return this.simulateConnection(onTelemetry)
    }

    // Android Native BLE Scan
    const device: BleDevice = await BleClient.requestDevice({
      namePrefix: 'PineTime',
      optionalServices: [
        INFINITIME_SERVICES.CTS,
        INFINITIME_SERVICES.HRS,
        INFINITIME_SERVICES.BAS,
        INFINITIME_SERVICES.ANS,
        INFINITIME_SERVICES.MOTION
      ]
    })

    this.deviceId = device.deviceId
    await BleClient.connect(this.deviceId)

    // 1. Synchronize Current Time (CTS)
    await this.syncCurrentTime(this.deviceId)

    // 2. Read Battery Level (BAS)
    try {
      const batVal = await BleClient.read(this.deviceId, INFINITIME_SERVICES.BAS, INFINITIME_SERVICES.BAS_LEVEL)
      const bat = batVal.getUint8(0)
      onTelemetry({ batteryLevel: bat })
    } catch (e) {
      console.warn('Battery read failed:', e)
    }

    // 3. Subscribe to Heart Rate Notifications (HRS)
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

    // 4. Subscribe to Steps Notifications
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

    return device.name || 'PineTime (BLE)'
  }

  async sendAlert(message: string): Promise<void> {
    // Phone haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch (e) {}

    // Dispatch BLE Alert Notification to PineTime (ANS 0x1811)
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
    }
  }

  async disconnect(): Promise<void> {
    if (this.deviceId && Capacitor.isNativePlatform()) {
      await BleClient.disconnect(this.deviceId)
      this.deviceId = null
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
        resolve('PineTime (BLE Simulator)')
      }, 1000)
    })
  }
}

export const watchBleService = new WatchBleService()
