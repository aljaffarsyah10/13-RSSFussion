import Link from "next/link";
import { Rss } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Rss className="size-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              RSSFusion
            </span>
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            Information Intelligence Workspace
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
