"use client";

import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function UserNav() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ThemeToggle />
      <Link href="/settings">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:text-primary transition-colors h-8 w-8 sm:h-10 sm:w-10"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="text-slate-500 hover:text-red-500 transition-colors h-8 w-8 sm:h-10 sm:w-10"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    </div>
  );
}

