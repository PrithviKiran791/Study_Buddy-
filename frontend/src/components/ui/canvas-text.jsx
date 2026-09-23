import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function CanvasText({
  text,
  backgroundClassName,
  colors = ['rgba(0, 153, 255, 1)'],
  lineGap = 4,
  animationDuration = 20,
  className,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let animationFrame
    let resizeObserver
    const startedAt = performance.now()

    const draw = (now) => {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = window.devicePixelRatio || 1
      const width = Math.max(1, Math.ceil(bounds.width * pixelRatio))
      const height = Math.max(1, Math.ceil(bounds.height * pixelRatio))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.clearRect(0, 0, width, height)
      context.save()
      context.scale(pixelRatio, pixelRatio)

      const computedStyle = window.getComputedStyle(canvas)
      const fontSize = parseFloat(computedStyle.fontSize) || 16
      const fontWeight = computedStyle.fontWeight || '700'
      const fontFamily = computedStyle.fontFamily || 'sans-serif'
      context.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      const centerX = bounds.width / 2
      const centerY = bounds.height / 2
      const phase = ((now - startedAt) / 1000 / animationDuration) * Math.PI * 2
      const gradient = context.createLinearGradient(0, 0, bounds.width, bounds.height)

      colors.forEach((color, index) => {
        const stop = colors.length === 1 ? 0.5 : index / (colors.length - 1)
        gradient.addColorStop(stop, color)
      })

      context.save()
      context.fillStyle = gradient
      context.shadowBlur = Math.max(8, fontSize / 3)
      context.shadowColor = colors[0]
      context.fillText(text, centerX, centerY)
      context.globalCompositeOperation = 'source-atop'

      for (let index = 0; index < Math.ceil(bounds.width / lineGap); index += 1) {
        const x = (index * lineGap + (phase * 18) % lineGap) % bounds.width
        const wave = Math.sin(index * 0.35 + phase) * fontSize * 0.35
        context.fillStyle = colors[index % colors.length]
        context.fillRect(x, centerY - fontSize + wave, 1.5, fontSize * 2)
      }

      context.restore()
      context.restore()
      animationFrame = requestAnimationFrame(draw)
    }

    resizeObserver = new ResizeObserver(() => {
      canvas.width = 0
      canvas.height = 0
    })
    resizeObserver.observe(canvas)
    animationFrame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [text, colors, lineGap, animationDuration])

  return (
    <span className={cn('relative inline-flex min-w-0 align-baseline', backgroundClassName, className)}>
      <span className="invisible whitespace-nowrap px-3 py-1" aria-hidden="true">
        {text}
      </span>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ font: 'inherit' }}
        aria-label={text}
        role="img"
      />
    </span>
  )
}
