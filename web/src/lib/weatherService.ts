import { watchBleService } from './bleService'

export interface WeatherData {
  city: string
  tempC: number
  condition: string
  tempMax: number
  tempMin: number
  humidity: number
  isDay: boolean
  iconCode: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder' | 'snow'
  lastUpdated: number
}

// Fallback data matching the WatchOS Smartwatch firmware display
const FALLBACK_WEATHER: WeatherData = {
  city: 'Local Area',
  tempC: 28,
  condition: 'Partly Cloudy',
  tempMax: 31,
  tempMin: 24,
  humidity: 62,
  isDay: true,
  iconCode: 'cloud-sun',
  lastUpdated: Date.now()
}

function mapWmoToCondition(code: number): { condition: string; iconCode: WeatherData['iconCode'] } {
  if (code === 0) return { condition: 'Clear Sky', iconCode: 'sun' }
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', iconCode: 'cloud-sun' }
  if (code === 3) return { condition: 'Overcast', iconCode: 'cloud' }
  if ([45, 48].includes(code)) return { condition: 'Foggy', iconCode: 'cloud' }
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { condition: 'Rain Showers', iconCode: 'rain' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snowfall', iconCode: 'snow' }
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', iconCode: 'thunder' }
  return { condition: 'Partly Cloudy', iconCode: 'cloud-sun' }
}

class WeatherService {
  private cachedWeather: WeatherData | null = null

  async getWeather(): Promise<WeatherData> {
    // If cached within the last 15 minutes, return cache
    if (this.cachedWeather && Date.now() - this.cachedWeather.lastUpdated < 15 * 60 * 1000) {
      return this.cachedWeather
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      // Query Open-Meteo free API (No API key needed, zero-rate-limit for standard client use)
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m,relative_humidity_2m,is_day,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto',
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const current = data.current
        const daily = data.daily
        const mapping = mapWmoToCondition(current.weather_code)

        this.cachedWeather = {
          city: 'Current Location',
          tempC: Math.round(current.temperature_2m),
          condition: mapping.condition,
          tempMax: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 3),
          tempMin: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 4),
          humidity: current.relative_humidity_2m ?? 60,
          isDay: current.is_day === 1,
          iconCode: mapping.iconCode,
          lastUpdated: Date.now()
        }
        return this.cachedWeather
      }
    } catch {
      // Offline fallback
    }

    this.cachedWeather = {
      ...FALLBACK_WEATHER,
      lastUpdated: Date.now()
    }
    return this.cachedWeather
  }

  async syncWeatherToWatch(data?: WeatherData): Promise<void> {
    const weather = data || (await this.getWeather())
    const alertMsg = `Weather: ${weather.tempC}°C • ${weather.condition}`
    try {
      await watchBleService.sendAlert(alertMsg)
    } catch (e) {
      console.warn('Could not dispatch weather to watch over BLE:', e)
    }
  }
}

export const weatherService = new WeatherService()
