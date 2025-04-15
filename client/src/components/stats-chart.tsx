"use client"

import { useEffect, useRef } from "react"

export default function StatsChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Simple chart drawing
    const width = canvasRef.current.width
    const height = canvasRef.current.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#e2e8f0"
    ctx.moveTo(40, 10)
    ctx.lineTo(40, height - 30)
    ctx.lineTo(width - 10, height - 30)
    ctx.stroke()

    // Sample data
    const data = [12, 19, 8, 24, 10, 16, 29]
    const maxData = Math.max(...data)
    const barWidth = (width - 60) / data.length

    // Draw bars
    data.forEach((value, index) => {
      const barHeight = ((height - 40) * value) / maxData
      const x = 50 + index * barWidth
      const y = height - 30 - barHeight

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - 30)
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)")
      gradient.addColorStop(1, "rgba(34, 197, 94, 0.2)")

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth - 10, barHeight)

      // Add value on top
      ctx.fillStyle = "#64748b"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(value.toString(), x + (barWidth - 10) / 2, y - 5)

      // Add x-axis label
      ctx.fillText(`T${index + 1}`, x + (barWidth - 10) / 2, height - 15)
    })

    // Add y-axis label
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText("Lượt xem", 0, 0)
    ctx.restore()
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} width={300} height={200} className="w-full h-full" />
    </div>
  )
}
