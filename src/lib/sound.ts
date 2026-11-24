let ctx: AudioContext | null = null

/** A soft two-note chime for called tokens. Browsers may require a user gesture first. */
export function playChime() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    for (const [freq, offset] of [[784, 0], [1046, 0.14]] as const) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.5)
    }
  } catch {
    /* audio is a nice-to-have */
  }
}

export function vibrate() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([180, 90, 180])
}
