import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

// Blinking cursor component
const CursorSVG = () => (
  <svg
    viewBox="8 4 8 16"
    xmlns="http://www.w3.org/2000/svg"
    className="cursor"
    style={{
      display: 'inline-block',
      width: '1ch',
      animation: 'flicker 1s infinite',
      marginBottom: '4px'
    }}
  >
    <rect x="10" y="6" width="4" height="12" fill="currentColor" />
  </svg>
)

export default function AIInsights({ cachedInsight, isGenerating, onRefresh, loading }) {
  const [displayText, setDisplayText] = useState('')
  const [completedTyping, setCompletedTyping] = useState(false)

  // Character-by-character typing effect
  useEffect(() => {
    if (!cachedInsight) {
      setDisplayText('')
      setCompletedTyping(false)
      return
    }

    setCompletedTyping(false)
    setDisplayText('')

    let i = 0
    const intervalId = setInterval(() => {
      setDisplayText(cachedInsight.slice(0, i))
      i++

      if (i > cachedInsight.length) {
        clearInterval(intervalId)
        setCompletedTyping(true)
      }
    }, 20) // 20ms for smooth typing speed

    return () => clearInterval(intervalId)
  }, [cachedInsight])

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  // Don't render anything while loading or if no insight
  if (loading || (!cachedInsight && !isGenerating)) {
    return null
  }

  return (
    <>
      {/* CSS for blinking cursor animation */}
      <style jsx>{`
        @keyframes flicker {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground flex-shrink-0" />
                  <span className="text-base text-muted-foreground">Generating insights...</span>
                </div>
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
                  <span>
                    {displayText}
                    {!completedTyping && <CursorSVG />}
                  </span>
                </div>
              ) : null}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isGenerating}
              className="h-9 w-9 p-0 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
