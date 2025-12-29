import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const profile = await getProfile();

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">設定</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">AIコーチの性格や、あなたの目標を設定します。</p>
        </div>

        <SettingsForm initialProfile={profile} />
      </div>
    </main>
  );
}


