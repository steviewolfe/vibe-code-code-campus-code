import { useEffect, useState } from 'react'
import './ClothingRain.css'

const CLOTHING_EMOJIS = ['👕', '👔', '👗', '👠', '👞', '👜', '🧥', '👖', '👘', '🥾', '🎽', '🧣', '🧤', '🎩', '👒']

interface Raindrop {
  id: number
  emoji: string
  left: number
  delay: number
  duration: number
}

export function ClothingRain() {
  const [isVisible, setIsVisible] = useState(false)
  const [raindrops, setRaindrops] = useState<Raindrop[]>([])

  useEffect(() => {
    // Show animation every time page loads
    setIsVisible(true)

    // Generate raindrops (all fall for 3 seconds)
    const drops: Raindrop[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      emoji: CLOTHING_EMOJIS[Math.floor(Math.random() * CLOTHING_EMOJIS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 3,
    }))

    setRaindrops(drops)

    // Auto-hide after 3 seconds
    setTimeout(() => setIsVisible(false), 3000)
  }, [])

  if (!isVisible || raindrops.length === 0) return null

  return (
    <div className="clothing-rain-container">
      {raindrops.map((drop) => (
        <div
          key={drop.id}
          className="raindrop"
          style={{
            left: `${drop.left}%`,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          } as React.CSSProperties}
        >
          {drop.emoji}
        </div>
      ))}
    </div>
  )
}
