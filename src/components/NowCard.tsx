import { useEffect, useState } from 'react'
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun } from 'lucide-react'
import type { Block } from '../lib/schedule'
import { nowInfo } from '../lib/schedule'
import { toHHMM } from '../lib/time'
import { fetchWeather, type WeatherInfo } from '../lib/weather'

function WeatherIcon({ weather }: { weather: WeatherInfo | null }) {
  if (!weather) return <Sun size={18} />
  const c = weather.weatherCode
  if (c === 0) return weather.isDay ? <Sun size={18} /> : <Moon size={18} />
  if (c <= 3) return <CloudSun size={18} />
  if (c <= 48) return <CloudFog size={18} />
  if (c <= 57) return <CloudDrizzle size={18} />
  if (c <= 67 || (c >= 80 && c <= 82)) return <CloudRain size={18} />
  if (c <= 77) return <CloudSnow size={18} />
  if (c >= 95) return <CloudLightning size={18} />
  return <Cloud size={18} />
}

export function NowCard({ blocks }: { blocks: Block[] }) {
  const { now, current, next } = nowInfo(blocks)
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const pct = current
    ? Math.min(100, Math.max(0, ((now - current.start) / Math.max(1, current.end - current.start)) * 100))
    : 0

  useEffect(() => {
    let mounted = true
    fetchWeather().then((w) => {
      if (mounted) setWeather(w)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={'nowcard' + (current ? ' nowcard--live' : '')}>
      <div className="nowcard__top">
        <div className="nowcard__time">{toHHMM(now)}</div>
        <div className="nowcard__weather">
          <WeatherIcon weather={weather} />
          <span>{weather ? weather.temperature + '°' : '--°'}</span>
        </div>
      </div>
      {current ? (
        <>
          <div className="nowcard__current">
            <span className="nowcard__dot" style={{ background: current.color || 'var(--accent)' }} />
            <span className="nowcard__title">{current.title}</span>
            <span className="nowcard__remain">{Math.max(1, Math.ceil((current.end - now) / 60))} 分钟后</span>
          </div>
          <div className="nowcard__progress">
            <div className="nowcard__progress-fill" style={{ width: pct + '%' }} />
          </div>
        </>
      ) : (
        <div className="nowcard__free">现在是空闲时间</div>
      )}
      {next && (
        <div className="nowcard__next">
          下一件 · {toHHMM(next.start)} {next.title}
        </div>
      )}
    </div>
  )
}
