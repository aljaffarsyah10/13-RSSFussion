import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="border-border">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Welcome back</CardTitle>
        <CardDescription className="text-xs">
          Sign in to access your monitored intelligence feeds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <span className="text-[11px] text-muted-foreground hover:underline cursor-pointer">
              Forgot?
            </span>
          </div>
          <Input id="password" type="password" className="h-9 text-xs" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-0">
        <Link
          href="/dashboard"
          className={buttonVariants({ className: "w-full h-9 text-xs" })}
        >
          Sign In (Demo Mode)
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Create account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
