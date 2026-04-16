/**
 * Sparkline micro-chart for stat cards
 */
export default function Sparkline({ data = [], color = 'var(--primary-container)', height = 32 }) {
  const max = Math.max(...data, 1)

  return (
    <div className="sparkline-container" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="sparkline-bar"
          style={{
            height: `${(val / max) * 100}%`,
            background: `linear-gradient(180deg, ${color}, ${color}33)`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  )
}
