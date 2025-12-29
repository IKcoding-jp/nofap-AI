"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        toast.error(error.message || "サインアップに失敗しました");
      } else {
        toast.success("サインアップに成功しました！");
        router.push("/");
      }
    } catch (err) {
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">新規登録</CardTitle>
            <CardDescription className="text-sm">
              アカウントを作成して、オナ禁の旅を始めましょう。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">お名前</Label>
                <Input
                  id="name"
                  placeholder="山田 太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border h-10 sm:h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border h-10 sm:h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border h-10 sm:h-11"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <Button type="submit" className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm sm:text-base" disabled={loading}>
                {loading ? "登録中..." : "登録する"}
              </Button>
              <div className="text-center text-xs sm:text-sm text-muted-foreground">
                既にアカウントをお持ちですか？{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  ログイン
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

