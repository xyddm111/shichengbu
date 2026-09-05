export interface WeatherInfo {
  temperature: number
  weatherCode: number
  isDay: boolean
}

async function fetchByCoords(lat: number, lon: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    const cw = data?.current_weather
    if (!cw) return null
    return { temperature: Math.round(cw.temperature), weatherCode: cw.weathercode ?? 0, isDay: cw.is_day === 1 }
  } catch {
    return null
  }
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    const r = data?.results?.[0]
    if (!r) return null
    return { lat: r.latitude, lon: r.longitude }
  } catch {
    return null
  }
}

const CITY_KEY = 'shichengbu-weather-city'

export function getSavedCity(): string {
  try {
    return localStorage.getItem(CITY_KEY) || ''
  } catch {
    return ''
  }
}

export function saveCity(city: string) {
  try {
    localStorage.setItem(CITY_KEY, city.trim())
  } catch {
    /* ignore */
  }
}

export async function fetchWeather(): Promise<WeatherInfo | null> {
  // 1) 优先用手动设置的城市
  const city = getSavedCity()
  if (city) {
    const coords = await geocodeCity(city)
    if (coords) return await fetchByCoords(coords.lat, coords.lon)
    return null
  }
  // 2) 否则用浏览器定位
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return null
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchByCoords(pos.coords.latitude, pos.coords.longitude).then(resolve)
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 600000 }
    )
  })
}
