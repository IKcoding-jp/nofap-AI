import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface MoteMeterProps {
  level: number; // 0 to 100
}

export function MoteMeter({ level }: MoteMeterProps) {
  // レベルに応じたメッセージ
  const getMessage = (lvl: number) => {
    if (lvl < 10) return "まずは一歩から。";
    if (lvl < 30) return "少しずつオーラが出てきました。";
    if (lvl < 50) return "自信が顔つきに現れています。";
    if (lvl < 80) return "周りの目が変わり始めています！";
    return "覇王のオーラを纏っています。";
  };

  return (
    <Card className="bg-slate-900 text-white border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium text-purple-400">
          <Sparkles className="h-5 w-5" />
          モテ度メーター
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
            style={{ width: `${level}%` }}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-slate-400">{getMessage(level)}</p>
          <div className="mt-1 text-2xl font-bold text-purple-300">{level}%</div>
        </div>
      </CardContent>
    </Card>
  );
}

