import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card className="border-border">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Create an account</CardTitle>
        <CardDescription className="text-xs">
          Start aggregating intelligence across your favorite feeds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullname" className="text-xs">Full Name</Label>
          <Input id="fullname" placeholder="Alex Morgan" className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <Input id="password" type="password" className="h-9 text-xs" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-0">
        <Link
          href="/dashboard"
          className={buttonVariants({ className: "w-full h-9 text-xs" })}
        >
          Create Account (Demo Mode)
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
