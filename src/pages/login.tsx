import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/login-form'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { useAuth } from '../hooks/use-auth'
import { Shield } from 'lucide-react'

export function LoginPage() {
  const { session, isLoading } = useAuth()

  if (!isLoading && session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-olive lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.22_0.04_150)_0%,oklch(0.30_0.06_150)_50%,oklch(0.25_0.05_140)_100%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brass/30 bg-brass/10">
            <Shield className="h-10 w-10 text-brass" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-white">
            14th OTS
          </h1>
          <p className="mt-2 text-lg font-light tracking-wide text-brass-light">
            Officers Database
          </p>
          <div className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
          <p className="mt-8 text-sm leading-relaxed text-white/60">
            A secure repository for managing officer records,
            subscriptions, and alumni information for the 14th Officers Training School.
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex w-full items-center justify-center bg-background px-6 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile-only header */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-olive/10">
              <Shield className="h-7 w-7 text-olive" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">14th OTS</h1>
            <p className="text-sm text-muted-foreground">Officers Database</p>
          </div>

          <Card className="card-elevated border-border/60">
            <CardHeader className="space-y-1 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-dark">
                Secure Access
              </p>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Welcome Back
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your credentials to continue.
              </p>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Pakistan Army Alumni Records System
          </p>
        </div>
      </div>
    </div>
  )
}
