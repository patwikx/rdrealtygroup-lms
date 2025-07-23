"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/actions/auth-actions"
import { AlertCircle, Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(loginAction, undefined)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
            <div className="text-white font-bold text-xl">L</div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">RD Realty Group -  LMS</h1>
          <p className="text-slate-600">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome back! 👋</h2>
              <p className="text-sm text-slate-600">Enter your credentials to continue</p>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form action={dispatch} className="space-y-4">
              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium text-slate-700">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  placeholder="Z-123"
                  required
                  className="border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <Link href="#" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  required
                  className="border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Authentication failed</h3>
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>

            {/* Support Contact */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600">
                Need help accessing your account?{" "}
           
              </p>     <Link href="#" className="font-medium text-slate-900 hover:text-slate-700">
                  Contact MIS Department
                </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-slate-700 hover:text-slate-900">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-slate-700 hover:text-slate-900">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
