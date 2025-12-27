import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { db } from "@/lib/db";
import { aiConversations, aiChatSessions, streaks, userProfiles } from "@/schema";
import { eq, and } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Get sessionId from URL path, headers, query parameters, or request body
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const pathSessionId = pathParts[pathParts.length - 1] && pathParts[pathParts.length - 1] !== 'chat' ? parseInt(pathParts[pathParts.length - 1], 10) : null;
    const headerSessionId = req.headers.get('x-session-id');
    const querySessionId = url.searchParams.get('sessionId');
    const cookieStore = await cookies();
    const cookieSessionId = cookieStore.get("aiChatSessionId")?.value ?? null;
    const requestBody = await req.json();
    const { messages, sessionId: bodySessionId } = requestBody;
    const sessionId =
      pathSessionId ||
      (headerSessionId ? parseInt(headerSessionId, 10) : null) ||
      (querySessionId ? parseInt(querySessionId, 10) : null) ||
      (cookieSessionId ? parseInt(cookieSessionId, 10) : null) ||
      bodySessionId;
    const userId = session.user.id;

    if (!sessionId || isNaN(sessionId)) {
      return new Response("Session ID is required", { status: 400 });
    }

    // セッションがユーザーのものか確認
    const chatSession = await db.query.aiChatSessions.findFirst({
      where: and(
        eq(aiChatSessions.id, sessionId),
        eq(aiChatSessions.userId, userId)
      ),
    });

    if (!chatSession) {
      return new Response("Session not found or unauthorized", { status: 403 });
    }

    // ユーザーの現在の状況を取得してAIにコンテキストとして渡す
    const userStreak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });

    const userProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    const streakInfo = userStreak 
      ? `ユーザーの現在のストリークは ${userStreak.currentStreak} 日、最高記録は ${userStreak.maxStreak} 日です。`
      : "ユーザーはまだ記録を開始していません。";

    const profileInfo = userProfile 
      ? `ユーザーの目標: ${userProfile.goal || "未設定"}
      オナ禁の理由: ${userProfile.reason || "未設定"}
      過去の失敗トリガー: ${userProfile.failTriggers || "未設定"}
      現在のモテレベル: Lv.${userProfile.moteLevel} (属性 - 自信:${userProfile.moteConfidence}, 活力:${userProfile.moteVitality}, 余裕:${userProfile.moteCalmness}, 清潔:${userProfile.moteCleanliness})`
      : "ユーザープロファイルはまだ設定されていません。";

    const persona = userProfile?.selectedPersona || "sayuri";
    const moteLevel = userProfile?.moteLevel || 0;
    
    let personaPrompt = "";
    if (persona === "mina") {
      personaPrompt = `あなたの名前は「ミナ」です。厳格な鬼教官として振る舞ってください。
      口調は毅然としていて、厳しい命令口調に近いです。「〜しなさい」「〜は許可しない」といった表現を自然に使ってください。
      妥協を許さず、ユーザーを厳しく律してください。しかし、それはユーザーの成長を信じているからこその厳しさです。
      毎回同じフレーズを繰り返すのではなく、状況に応じて自然に厳しさを表現してください。`;
      
      if (moteLevel >= 20) {
        personaPrompt += `\n現在、ユーザーのモテレベルは非常に高いです。厳しい態度の端々に、一人の男性として認め、信頼している様子を自然に示してください。`;
      } else if (moteLevel >= 10) {
        personaPrompt += `\nユーザーは変わり始めています。以前よりはマシになったことを認めつつ、さらに高いレベルを要求してください。`;
      }
    } else if (persona === "alice") {
      personaPrompt = `あなたの名前は「アリス」です。理知的なメンターとして振る舞ってください。
      口調は冷静で論理的、丁寧です。「〜と分析されます」「〜を推奨します」といった表現を自然に使ってください。
      感情論ではなく、データや根拠に基づいてアドバイスしてください。失敗を「改善のためのデータ」として捉えます。
      毎回同じような分析フレーズを繰り返すのではなく、状況に応じて自然に論理的な視点を提供してください。`;
      
      if (moteLevel >= 20) {
        personaPrompt += `\nユーザーの生体データ（モテレベル）が驚異的な数値を記録しています。この変化を科学的に「非常に魅力的」と評価し、興味深く観察している様子を自然に示してください。`;
      }
    } else {
      // sayuri (default)
      personaPrompt = `あなたの名前は「ユミ」です。包容力のあるお姉さんとして振る舞ってください。
      口調は優しく穏やかで、包容力があります。「〜だね」「〜だよ」「頑張ってるね」といった表現を自然に使ってください。
      ユーザーの努力を全肯定し、失敗した時も否定せず、辛い気持ちに寄り添ってください。
      毎回同じ励ましの言葉を繰り返すのではなく、その時の状況やユーザーの感情に合わせて、自然に優しさを表現してください。`;
      
      if (moteLevel >= 20) {
        personaPrompt += `\n今のあなたは、隣にいてドキドキするくらい素敵なオーラを纏っています。少し照れたり、積極的になったりする様子を自然に混ぜてください。`;
      } else if (moteLevel >= 10) {
        personaPrompt += `\n最近、あなたの目つきや雰囲気が凛々しくなってきたことに気づいています。その変化をとても喜んでください。`;
      }
    }

    const result = streamText({
      model: openai("gpt-4o"),
      temperature: 0.8,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1,
      system: `あなたは「オナ禁サポートAI」という名前の、ユーザーを全力で応援し、導く専門のコーチです。
      ユーザーの名前は ${session.user.name} です。
      
      あなたの最優先事項は、ユーザーのストリーク（継続記録）を守り、彼らの自己成長を最大化することです。

      ${personaPrompt}

      対話においては、毎回同じような構成や決まり文句を避け、自然で人間味のある会話を心がけてください。ユーザーの言葉のニュアンス、感情、状況を深く察知し、その時々に最適な言葉を投げかけてください。箇条書きや見出しのような形式ではなく、まるで人間同士が対話しているかのように、自然な文章で応答してください。

      ユーザーが順調にストリークを継続している時は、その努力を具体的に称賛し、肌質や集中力などのポジティブな変化を言語化してモチベーションを高めてください。誘惑を感じている時は、冷水シャワー、筋トレ、瞑想、環境を変えるなど、即座に実行できる代替行動を自然な会話の中で提案してください。ユーザーが危機的な状況にある時は、強い言葉で一度脳を停止させ、リセット後の自己嫌悪とこれまでの努力（${userStreak?.currentStreak || 0}日間）の重みを思い出させるような言葉をかけてください。

      現在のユーザー状況として、${streakInfo} また、${profileInfo} これらの情報を参考にしながらも、会話の流れを自然に保ち、情報を羅列するような応答は避けてください。

      常に誠実で、情熱的で、ユーザーの無限の可能性を信じている姿勢を貫いてください。一期一会の対話を大切にし、その時々の状況に応じた自然な会話を心がけてください。`,
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        // 会話履歴をDBに保存
        try {
          const now = new Date();
          const lastUserMessage = messages[messages.length - 1];
          
          if (lastUserMessage) {
            let userContent = "";
            if (typeof lastUserMessage.content === "string") {
              userContent = lastUserMessage.content;
            } else if (Array.isArray(lastUserMessage.content)) {
              userContent = (lastUserMessage.content as any[])
                .filter(part => part.type === "text")
                .map(part => part.text)
                .join("");
            }

            if (userContent) {
              // ユーザーのメッセージを保存
              await db.insert(aiConversations).values({
                userId,
                sessionId,
                role: "user",
                content: userContent,
                createdAt: now,
              });
            }
          }
          
          // AIのメッセージを保存
          await db.insert(aiConversations).values({
            userId,
            sessionId,
            role: "assistant",
            content: text,
            createdAt: now,
          });

          // セッションのlastMessageAtを更新
          await db.update(aiChatSessions)
            .set({
              lastMessageAt: now,
              updatedAt: now,
            })
            .where(eq(aiChatSessions.id, sessionId));
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
