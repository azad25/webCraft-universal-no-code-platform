'use client'

interface RulerOverlayProps {
  zoom: number
}

export function RulerOverlay({ zoom }: RulerOverlayProps) {
  const scale = zoom / 100
  const majorTick = 100
  const minorTick = 10
  
  return (
    <>
      {/* Horizontal Ruler */}
      <div className="absolute top-0 left-8 right-0 h-6 bg-muted border-b z-20 overflow-hidden">
        <svg className="w-full h-full" style={{ transform: `scaleX(${scale})`, transformOrigin: 'left' }}>
          {Array.from({ length: 200 }).map((_, i) => {
            const x = i * minorTick
            const isMajor = i % 10 === 0
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={isMajor ? 0 : 16}
                  x2={x}
                  y2={24}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-muted-foreground/50"
                />
                {isMajor && (
                  <text
                    x={x + 2}
                    y={12}
                    fontSize={9}
                    className="fill-muted-foreground"
                  >
                    {x}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Vertical Ruler */}
      <div className="absolute top-6 left-0 bottom-0 w-6 bg-muted border-r z-20 overflow-hidden">
        <svg className="w-full h-full" style={{ transform: `scaleY(${scale})`, transformOrigin: 'top' }}>
          {Array.from({ length: 200 }).map((_, i) => {
            const y = i * minorTick
            const isMajor = i % 10 === 0
            return (
              <g key={i}>
                <line
                  x1={isMajor ? 0 : 16}
                  y1={y}
                  x2={24}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-muted-foreground/50"
                />
                {isMajor && (
                  <text
                    x={2}
                    y={y + 10}
                    fontSize={9}
                    className="fill-muted-foreground"
                    transform={`rotate(-90, 12, ${y + 5})`}
                  >
                    {y}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Corner */}
      <div className="absolute top-0 left-0 w-6 h-6 bg-muted border-r border-b z-30" />
    </>
  )
}
