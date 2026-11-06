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

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await authApi.register({ email, password, fullName });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Create an account</CardTitle>
        <CardDescription className="text-xs">
          Start aggregating intelligence across your favorite feeds
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
            <Label htmlFor="fullname" className="text-xs">Full Name</Label>
            <Input
              id="fullname"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 text-xs"
              disabled={loading}
            />
          </div>
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
            <Label htmlFor="password" className="text-xs">Password (min 6 chars)</Label>
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
