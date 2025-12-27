"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/app/actions/profile";
import { resetAccountData } from "@/app/actions/reset";
import { toast } from "sonner";
import { ChevronLeft, User, Bot, Sparkles, AlertTriangle, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsForm({ initialProfile }: { initialProfile: any }) {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [formData, setFormData] = useState({
    goal: initialProfile?.goal || "",
    reason: initialProfile?.reason || "",
    failTriggers: initialProfile?.failTriggers || "",
    selectedPersona: initialProfile?.selectedPersona || "sayuri",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success("プロファイルを更新しました");
    } catch (error) {
      toast.error("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirmText !== "削除") {
      toast.error("確認のため「削除」と入力してください");
      return;
    }

    setResetLoading(true);
    try {
      await resetAccountData();
      toast.success("データを初期化しました");
      setShowResetDialog(false);
      setConfirmText("");
      // フォームデータもリセット
      setFormData({
        goal: "",
        reason: "",
        failTriggers: "",
        selectedPersona: "sayuri",
      });
    } catch (error: any) {
      toast.error(error.message || "データの初期化に失敗しました");
    } finally {
      setResetLoading(false);
    }
  };

  const personas = [
    {
      id: "sayuri",
      name: "ユミ",
      role: "包容力のあるお姉さん",
      description: "優しく寄り添い、あなたの努力を全肯定します。",
    },
    {
      id: "mina",
      name: "ミナ",
      role: "厳格な鬼教官",
      description: "妥協を許さず、あなたを厳しく律します。",
    },
    {
      id: "alice",
      name: "アリス",
      role: "理知的なメンター",
      description: "論理的・データに基づいたアドバイスをします。",
    },
  ];

  return (
    <div className="space-y-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          ダッシュボードへ戻る
        </Button>
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AIコーチの選択
            </CardTitle>
            <CardDescription>
              あなたをサポートするAIの性格を選択してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {personas.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setFormData({ ...formData, selectedPersona: p.id as any })}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50",
                    formData.selectedPersona === p.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-lg">{p.name}</span>
                    <span className="text-xs text-primary font-medium">{p.role}</span>
                    <p className="text-xs text-muted-foreground mt-2">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              目標と動機
            </CardTitle>
            <CardDescription>
              AIがあなたをより良く理解するために、いくつかの情報を教えてください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal">あなたの目標は何ですか？</Label>
              <Input
                id="goal"
                placeholder="例: 90日間継続して、自分に自信を持ちたい"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">オナ禁を始めた理由は何ですか？</Label>
              <Textarea
                id="reason"
                placeholder="例: 集中力を高めたい、恋愛で成功したい、など"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="bg-background min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="failTriggers">過去の失敗要因やトリガーは何ですか？</Label>
              <Textarea
                id="failTriggers"
                placeholder="例: 深夜のスマホ、退屈、ストレス、など"
                value={formData.failTriggers}
                onChange={(e) => setFormData({ ...formData, failTriggers: e.target.value })}
                className="bg-background min-h-[80px]"
              />
              <p className="text-[10px] text-muted-foreground">
                ※これらの情報は、AIとの会話をパーソナライズするために使用されます。
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-6">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "更新中..." : "設定を保存する"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* データを初期化セクション */}
      <Card className="border-destructive/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            データを初期化
          </CardTitle>
          <CardDescription>
            すべてのアプリデータ（ストリーク、記録、チャット履歴、XP/レベル、目標設定など）を削除します。
            <br />
            <span className="font-semibold text-destructive">この操作は取り消せません。</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResetDialog ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              データを初期化する
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
                <p className="text-sm text-foreground mb-2">
                  <strong>警告:</strong> この操作により、以下のデータがすべて削除されます：
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>ストリーク情報（継続日数、最高記録）</li>
                  <li>日次記録と日記</li>
                  <li>AIチャット履歴</li>
                  <li>獲得したXPとレベル</li>
                  <li>目標、理由、失敗要因の設定</li>
                  <li>習慣データ</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  アカウント情報（ログイン情報）は保持されます。
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  確認のため、「<span className="font-mono font-bold">削除</span>」と入力してください：
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="削除"
                  className="bg-background"
                  disabled={resetLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReset}
                  disabled={resetLoading || confirmText !== "削除"}
                  className="flex-1"
                >
                  {resetLoading ? "初期化中..." : "初期化を実行"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResetDialog(false);
                    setConfirmText("");
                  }}
                  disabled={resetLoading}
                  className="flex-1"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


