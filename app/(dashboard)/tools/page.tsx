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
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">サポートツール</h1>
            <p className="text-muted-foreground text-sm">誘惑を乗り越えるための武器です。</p>
          </div>
        </div>

        <Tabs defaultValue="meditation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meditation" className="gap-2">
              <Brain className="h-4 w-4" />
              瞑想・深呼吸
            </TabsTrigger>
            <TabsTrigger value="muscle" className="gap-2">
              <Dumbbell className="h-4 w-4" />
              筋トレ記録
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="meditation" className="mt-6">
            <MeditationTimer />
          </TabsContent>
          
          <TabsContent value="muscle" className="mt-6">
            <MuscleTrainingCounter />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}


