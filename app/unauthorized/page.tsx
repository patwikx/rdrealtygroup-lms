import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, AlertTriangle, Lock, Home, User } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-100 dark:bg-red-900/20 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-100 dark:bg-slate-800/30 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fillOpacity='1'%3E%3Cpath d='M0 0h40v1H0zM0 20h40v1H0z'/%3E%3Cpath d='M0 0v40h1V0zM20 0v40h1V0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span>UNAUTHORIZED ACCESS DETECTED</span>
            </div>

            <div className="space-y-4 mb-8">
              <h1 className="text-8xl font-bold text-slate-900 dark:text-white tracking-tight">401</h1>
              <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-200">Access Denied</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                You don&apos;t have the necessary permissions to access this resource. Please authenticate with valid
                credentials or contact your system administrator.
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Security Info */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Security Protocol</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This area is protected by enterprise-grade security measures. Authentication is required to proceed.
              </p>
            </div>

            {/* Authentication Required */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Authentication Required</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please sign in with your authorized credentials to access this protected resource.
              </p>
            </div>

            {/* Support */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Need Assistance?</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Contact your system administrator or IT support team for access permissions.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 h-14 px-10 text-base font-semibold min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link href="/dashboard" className="flex items-center justify-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="h-14 px-10 text-base font-semibold min-w-[220px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link href="/login" className="flex items-center justify-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Sign In</span>
                </Link>
              </Button>
            </div>

            {/* Footer Info */}
            <div className="pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 dark:text-slate-400 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <span>Error Code: HTTP 401</span>
                  <span>•</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/support" className="text-slate-700 dark:text-slate-300 hover:underline font-medium">
                    Contact Support
                  </Link>
                  <span>•</span>
                  <Link href="/help" className="text-slate-700 dark:text-slate-300 hover:underline font-medium">
                    Help Center
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
