import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveHabits, getHabitProgress } from "@/app/actions/continuity-challenge";
import { ContinuityChallengeClient } from "./client";

export default async function ContinuityChallengePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // 習慣データを取得
    const [habits, progress] = await Promise.all([
        getActiveHabits(),
        getHabitProgress(),
    ]);

    return (
        <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
                <ContinuityChallengeClient
                    initialHabits={habits}
                    initialProgress={progress}
                />
            </div>
        </main>
    );
}
