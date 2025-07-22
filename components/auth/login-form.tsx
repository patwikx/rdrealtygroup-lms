"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link"; // Recommended for internal navigation
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth-actions";

// A small component to manage the submit button's state.
// It shows a loading indicator when the form is being processed.
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? "Logging In..." : "Login"}
    </Button>
  );
}

export default function LoginPage() {
  // Manages the form's state, including server-side errors.
  const [errorMessage, dispatch] = useActionState(loginAction, undefined);

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">LMS</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard.
            </CardDescription>
          </CardHeader>

          <form action={dispatch}>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>

                </div>
                <Input id="password" name="password" type="password" placeholder="********" required />
                                  <Link
                    href="#"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
              </div>

              {/* Server-side error message display */}
              {errorMessage && (
                <div className="text-sm font-medium text-red-500" role="alert">
                  {errorMessage}
                </div>
              )}
              
              <SubmitButton />

            </CardContent>
            
            <CardFooter className="flex mt-4 flex-col gap-4 text-center text-sm">
                <div>
                  Don&apos;t have an account?{" "}
                  <Link href="#" className="underline whitespace-nowrap underline-offset-4">
                    Contact MIS Department.
                  </Link>
                </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-muted-foreground text-center text-xs text-balance">
          By clicking continue, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>.
        </div>
      </div>
    </div>
  );
}