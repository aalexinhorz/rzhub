import { useState, useEffect } from 'react'

const CANAL_ID = 'UC-UjWmvk0vM5A-ug1CgeykQ'
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const INTERVALO_MS = 2 * 60 * 1000

export default function useLiveStream() {
  const [live, setLive] = useState(null)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CANAL_ID}&part=snippet&eventType=live&type=video`
        )
        const data = await res.json()
        const items = data.items || []
        if (items.length > 0) {
          setLive({
            id: items[0].id.videoId,
            titulo: items[0].snippet.title,
          })
        } else {
          setLive(null)
        }
      } catch (e) {
        console.error('Error comprobando directo:', e)
      }
    }
    check()
    const interval = setInterval(check, INTERVALO_MS)
    return () => clearInterval(interval)
  }, [])

  return live
}