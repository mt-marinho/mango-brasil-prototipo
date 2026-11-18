import { useEffect, useRef } from "react"
import { Chart, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip, Filler } from "chart.js"
import { brl } from "@/lib/format"

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip, Filler)

export function RevenueChart({ dates, values }: { dates: string[]; values: number[] }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const dataKey = JSON.stringify({ dates, values })
  useEffect(() => {
    if (!canvas.current) return
    const data: { dates: string[]; values: number[] } = JSON.parse(dataKey)
    const chart = new Chart(canvas.current, {
      type: "line",
      data: { labels: data.dates.map((d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`), datasets: [{ data: data.values, borderColor: "#ffe600", backgroundColor: "rgba(255,230,0,0.10)", fill: true, tension: 0.25, borderWidth: 2, pointRadius: data.dates.length > 45 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: "#ffe600" }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => data.dates[items[0]?.dataIndex]?.split("-").reverse().join("/") || "", label: (item) => brl(item.parsed.y ?? 0) } } }, scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", maxTicksLimit: 10, maxRotation: 0 } }, y: { beginAtZero: true, grid: { color: "rgba(148,163,184,0.15)" }, border: { display: false }, ticks: { color: "#94a3b8", maxTicksLimit: 4, callback: (value) => brl(Number(value)) } } } },
    })
    return () => chart.destroy()
  }, [dataKey])
  return <div className="relative mt-5 h-56 w-full"><canvas ref={canvas} role="img" aria-label="Gráfico de linha dos recebimentos diários" /></div>
}
