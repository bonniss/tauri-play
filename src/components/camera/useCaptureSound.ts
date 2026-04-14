import { useRef } from 'react'

function playTone(
  ctx: AudioContext,
  opts: {
    freq: number
    duration: number
    gainPeak: number
    startDelay?: number
  },
) {
  const { freq, duration, gainPeak, startDelay = 0 } = opts
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay)

  const t = ctx.currentTime + startDelay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(gainPeak, t + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration / 1000)

  osc.start(t)
  osc.stop(t + duration / 1000 + 0.02)
}

export function useCaptureSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume()
    }
    return ctxRef.current
  }

  function playTick() {
    const ctx = getCtx()
    playTone(ctx, { freq: 1100, duration: 75, gainPeak: 0.15 })
  }

  function playPositive() {
    const ctx = getCtx()
    playTone(ctx, { freq: 880, duration: 110, gainPeak: 0.14, startDelay: 0 })
    playTone(ctx, { freq: 1320, duration: 130, gainPeak: 0.12, startDelay: 0.11 })
  }

  return { playTick, playPositive }
}
