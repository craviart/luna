import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import AIWriter from 'react-aiwriter'

// Black animated loader component
const BlackLoader = () => (
  <div className="loader-container">
    <div className="loader">
      <div className="loader-dot"></div>
      <div className="loader-dot"></div>
      <div className="loader-dot"></div>
    </div>
    <style jsx>{`
      .loader-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 120px;
        width: 100%;
      }
      
      .loader {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .loader-dot {
        width: 12px;
        height: 12px;
        background-color: #000;
        border-radius: 50%;
        animation: bounce 1.4s ease-in-out infinite both;
      }
      
      .loader-dot:nth-child(1) {
        animation-delay: -0.32s;
      }
      
      .loader-dot:nth-child(2) {
        animation-delay: -0.16s;
      }
      
      @keyframes bounce {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
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
        {isGenerating ? (
          <BlackLoader />
        ) : cachedInsight ? (
          <div 
            style={{
              fontSize: '32px',
              lineHeight: '1.4',
              color: 'hsl(var(--foreground))',
              fontWeight: '400'
            }}
            className="sm:text-3xl text-2xl leading-relaxed"
          >
            <AIWriter
              key={animationKey}
              delay={80} // 80ms between characters to match ChatGPT's natural pace
              onFinish={() => {
                console.log('AI insight typing completed')
              }}
            >
              <span>{cachedInsight}</span>
            </AIWriter>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
