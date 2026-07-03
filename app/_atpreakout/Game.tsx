// app/atpreakout/Game.tsx
'use client'
import { useEffect, useRef } from 'react'
export default function Game() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let stop: undefined | (() => void)
    import('./engine').then(({ mount }) => { if (ref.current) stop = mount(ref.current) })
    return () => stop?.()
  }, [])
  return <div ref={ref} />
}