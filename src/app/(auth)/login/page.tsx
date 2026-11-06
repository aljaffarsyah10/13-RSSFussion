"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/lib/api/client";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Welcome back</CardTitle>
        <CardDescription className="text-xs">
          Sign in to access your monitored intelligence feeds
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-9 text-xs"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-xs"
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full h-9 text-xs cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
              Create account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
