import React, { useState } from 'react'
import { Loader2, Lock, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export default function AuthForm() {
  const [loading, setLoading] = useState(false)
  const [pin, setPin] = useState('')
  
  const { signInWithPin } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { success, error } = await signInWithPin(pin)
      if (!success) {
        throw new Error(error.message)
      }
      
      // Show role-specific welcome message
      const role = pin === '2609' ? 'Admin' : 'Viewer'
      toast.success(`Welcome to Luna Analytics!`, {
        description: `Signed in as ${role}`
      })
    } catch (error) {
      toast.error(error.message)
      setPin('') // Clear pin on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center">
              <img src="/luna.svg" alt="Millie" className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome to Luna</h1>
          <p className="text-muted-foreground mt-2">
            Enter your pin code to access the dashboard
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Access Dashboard</CardTitle>
            <CardDescription>
              Enter the 4-digit pin code to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin">Pin Code</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10 text-center text-lg font-mono tracking-widest"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 4-digit access code
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading || pin.length !== 4}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Access Dashboard
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure access to web analytics dashboard</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
