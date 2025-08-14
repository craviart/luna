import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import AIWriter from 'react-aiwriter'

export default function AIInsights({ cachedInsight, isGenerating, onRefresh, loading }) {
  const [animationKey, setAnimationKey] = useState(0)

  // Force re-render of AIWriter when cached insight changes
  useEffect(() => {
    if (cachedInsight) {
      setAnimationKey(prev => prev + 1)
    }
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
                <AIWriter
                  key={animationKey}
                  delay={25} // 25ms between characters for smooth typing
                  onFinish={() => {
                    console.log('AI insight typing completed')
                  }}
                >
                  <span>{cachedInsight}</span>
                </AIWriter>
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
  )
}
