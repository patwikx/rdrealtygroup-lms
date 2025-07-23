"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/actions/auth-actions"
import { User, Lock, AlertCircle, BookOpen, Loader2 } from "lucide-react"

// Enhanced submit button with better loading state
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging In...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(loginAction, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LMS Portal
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Welcome back! Please sign in to access your dashboard.
            </CardDescription>
          </CardHeader>

          <form action={dispatch}>
            <CardContent className="space-y-6 px-8">
              {/* Employee ID Field */}
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                  Employee ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    placeholder="Z-001"
                    required
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Link
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Enhanced Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-1 duration-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <SubmitButton />
            </CardContent>

            <CardFooter className="flex flex-col gap-4 text-center text-sm px-8 pb-8">
              <div className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                >
                  Contact MIS Department
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Terms and Privacy */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-blue-600 transition-colors duration-200">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-blue-600 transition-colors duration-200">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  )
}
