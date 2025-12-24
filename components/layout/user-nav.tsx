"use client";

import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-500"
      onClick={handleSignOut}
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}

