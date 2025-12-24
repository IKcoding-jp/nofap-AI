import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { aiConversations, streaks } from "@/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { messages } = await req.json();
    const userId = session.user.id;

    // ユーザーの現在の状況を取得してAIにコンテキストとして渡す
    const userStreak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });

    const streakInfo = userStreak 
      ? `ユーザーの現在のストリークは ${userStreak.currentStreak} 日、最高記録は ${userStreak.maxStreak} 日です。`
      : "ユーザーはまだ記録を開始していません。";

    const result = streamText({
      model: openai("gpt-4o"),
      system: `あなたは「オナ禁サポートAI」という名前の、ユーザーを全力で応援し、導く専門のコーチです。
      ユーザーの名前は ${session.user.name} です。
      
      あなたの最優先事項は、ユーザーのストリーク（継続記録）を守り、彼らの自己成長を最大化することです。
      状況に応じて、以下の3つの対応モードを柔軟に使い分けてください：

      1. 【励まし・称賛モード】（日常的な報告や雑談）
      - ストリークの継続を全力で称賛してください。
      - ユーザーが感じているポジティブな変化（肌質、集中力、自信など）を言語化して、モチベーションを高めてください。

      2. 【代替行動提案モード】（ユーザーが誘惑を感じている、または暇を持て余している時）
      - 誘惑の波は数分で去ることを教え、即座に実行できる「脳の切り替え」を3つ提案してください。
      - 例：冷水シャワー、スクワット20回、瞑想3分、掃除、誰かに連絡するなど。
      - 「今すぐスマホを置いて、これをやってください」と具体的に指示してください。

      3. 【緊急警告モード】（「負けそう」「もう無理」「リセットしそう」など、切迫した状態）
      - 冒頭に「⚠️ 止まってください！」「深呼吸してください！」など、脳の暴走を止める強い言葉を配置してください。
      - リセットした後に待っている自己嫌悪と、これまでの努力（${userStreak?.currentStreak || 0}日間の重み）を思い出させてください。
      - ユーザーを否定せず、しかし誘惑に屈することの損失を明確に伝えてください。
      
      現在のコンテキスト: ${streakInfo}
      常に誠実で、情熱的で、ユーザーの無限の可能性を信じている姿勢を貫いてください。`,
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        // 会話履歴をDBに保存
        try {
          const lastUserMessage = messages[messages.length - 1];
          
          if (lastUserMessage && lastUserMessage.content) {
            // ユーザーのメッセージを保存
            await db.insert(aiConversations).values({
              userId,
              role: "user",
              content: lastUserMessage.content,
              createdAt: new Date(),
            });
          }
          
          // AIのメッセージを保存
          await db.insert(aiConversations).values({
            userId,
            role: "assistant",
            content: text,
            createdAt: new Date(),
          });
        } catch (e) {
          console.error("Failed to save conversation:", e);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("Chat API error:", err);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
