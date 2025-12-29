import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MeditationTimer } from "./meditation-timer";
import { MuscleTrainingCounter } from "./muscle-training-counter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Dumbbell, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ToolsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">サポートツール</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">誘惑を乗り越えるための武器です。</p>
          </div>
        </div>

        <Tabs defaultValue="meditation" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
            <TabsTrigger value="meditation" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">瞑想・深呼吸</span>
            </TabsTrigger>
            <TabsTrigger value="muscle" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">筋トレ記録</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="meditation" className="mt-4 sm:mt-6">
            <MeditationTimer />
          </TabsContent>
          
          <TabsContent value="muscle" className="mt-4 sm:mt-6">
            <MuscleTrainingCounter />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}


