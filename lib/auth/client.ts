import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL を明示しない場合、ブラウザでは現在のドメインが自動的に使用されます
  // 特定のURLを強制したい場合は環境変数を設定してください
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, useSession, signOut } = authClient;

