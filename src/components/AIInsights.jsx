import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import AIWriter from 'react-aiwriter'

// Black animated loader component
const BlackLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '120px',
    width: '100%'
  }}>
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: '#000',
        borderRadius: '50%',
        animation: 'bounce1 1.4s ease-in-out infinite both'
      }}></div>
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: '#000',
        borderRadius: '50%',
        animation: 'bounce2 1.4s ease-in-out infinite both'
      }}></div>
      <div style={{
        width: '12px',
        height: '12px',
        backgroundColor: '#000',
        borderRadius: '50%',
        animation: 'bounce3 1.4s ease-in-out infinite both'
      }}></div>
    </div>
    <style>{`
      @keyframes bounce1 {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      @keyframes bounce2 {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        24% { transform: scale(1); opacity: 1; }
      }
      @keyframes bounce3 {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        8% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  </div>
)

export default function AIInsights({ cachedInsight, isGenerating, loading }) {
  const [animationKey, setAnimationKey] = useState(0)

  // Force re-render of AIWriter when cached insight changes
  useEffect(() => {
    if (cachedInsight) {
      setAnimationKey(prev => prev + 1)
    }
  }, [cachedInsight])

  // Don't render anything while loading or if no insight
  if (loading || (!cachedInsight && !isGenerating)) {
    return null
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="w-full">
          {isGenerating ? (
            <BlackLoader />
          ) : cachedInsight ? (
            <div 
              className="text-[20px] leading-[1.5] sm:text-[32px] sm:leading-[1.4]"
              style={{
                color: 'hsl(var(--foreground))',
                fontWeight: '400'
              }}
            >
              <AIWriter
                key={`insight-${animationKey}-${cachedInsight.length}`}
                delay={80}
              >
                <span>{cachedInsight}</span>
              </AIWriter>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
