const WEATHER_CITY_KEY = 'sme-ai-dashboard-weather-city'

export function loadPreferredWeatherCity(shopId?: string): string {
  try {
    const key = shopId ? `${WEATHER_CITY_KEY}-${shopId}` : WEATHER_CITY_KEY
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export function savePreferredWeatherCity(city: string, shopId?: string): void {
  try {
    const key = shopId ? `${WEATHER_CITY_KEY}-${shopId}` : WEATHER_CITY_KEY
    localStorage.setItem(key, city)
  } catch {
    // ignore browser storage failures
  }
}
