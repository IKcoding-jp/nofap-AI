import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// BetterAuth Tables
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// App Specific Tables
export const streaks = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const dailyRecords = sqliteTable("daily_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // ISO Date string YYYY-MM-DD
  status: text("status", { enum: ["success", "failure"] }).notNull(),
  journal: text("journal"),
  analysisSummary: text("analysis_summary"),
  analysisCategory: text("analysis_category"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  // updatedAt はテーブルに存在しないため削除
});

export const aiChatSessions = sqliteTable("ai_chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("新しいチャット"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sessionId: integer("session_id")
    .references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  contextType: text("context_type", { enum: ["general", "emergency", "advice"] }).notNull().default("general"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  goal: text("goal"),
  reason: text("reason"),
  failTriggers: text("fail_triggers"),
  selectedPersona: text("selected_persona", { enum: ["mina", "sayuri", "alice"] }).notNull().default("sayuri"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  moteLevel: integer("mote_level").notNull().default(0),
  moteVitality: integer("mote_vitality").notNull().default(0),
  moteCalmness: integer("mote_calmness").notNull().default(0),
  moteConfidence: integer("mote_confidence").notNull().default(0),
  moteCleanliness: integer("mote_cleanliness").notNull().default(0),
  maxMoteLevel: integer("max_mote_level").notNull().default(0),
  lastResetAt: integer("last_reset_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const userHabits = sqliteTable("user_habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  habitName: text("habit_name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  streak: integer("streak").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const dailyMissions = sqliteTable("daily_missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  missionId: text("mission_id").notNull(),
  date: text("date").notNull(), // ISO Date string YYYY-MM-DD
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================
// 継続チャレンジ（習慣チェック）機能用テーブル
// ============================================

// ユーザーの習慣解放状態を管理
export const userHabitProgress = sqliteTable("user_habit_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  unlockedSlots: integer("unlocked_slots").notNull().default(1), // 解放済み習慣枠数
  currentChallengeHabitId: integer("current_challenge_habit_id"), // 現在チャレンジ中の習慣ID
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// 習慣の定義と進捗状態
export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", {
    enum: ["challenge", "maintenance", "archived"]
  }).notNull().default("challenge"),
  sortOrder: integer("sort_order").notNull().default(0),
  challengeStartedOn: text("challenge_started_on"), // ISO date: YYYY-MM-DD (JST)
  challengeCompletedOn: text("challenge_completed_on"), // nullable
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalChecks: integer("total_checks").notNull().default(0),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 日次チェック記録 (UNIQUE: habitId + checkDate)
export const habitChecks = sqliteTable("habit_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  checkDate: text("check_date").notNull(), // ISO date: YYYY-MM-DD (JST)
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull(),
  source: text("source", {
    enum: ["same_day", "backfill_yesterday"]
  }).notNull().default("same_day"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
