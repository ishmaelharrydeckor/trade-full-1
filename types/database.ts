// types/database.ts
// Type definitions matching the database schema. Used across the dashboard.

export type Direction = "long" | "short";
export type TransactionType = "deposit" | "withdrawal";
export type AssetClass =
  | "forex"
  | "crypto"
  | "indices"
  | "commodities"
  | "stocks"
  | "synthetics";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  broker: string | null;
  account_number: string | null;
  currency: string;
  starting_balance: number | null;
  ea_token: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  external_trade_id: string | null;
  symbol: string;
  direction: Direction;
  volume: number;
  entry_price: number;
  exit_price: number | null;
  open_time: string;
  close_time: string | null;
  pnl: number | null;
  commission: number;
  swap: number;
  stop_loss: number | null;
  take_profit: number | null;
  risk_amount: number | null;
  asset_class: AssetClass | null;
  tags: string[] | null;
  mindset: string | null;
  notes: string | null;
  screenshot_url: string | null;
  is_backtest: boolean;
  backtest_session_id: string | null;
  is_missed: boolean;
  grade: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountTransaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  occurred_at: string;
  notes: string | null;
  created_at: string;
}

export interface OpenPosition {
  id: string;
  user_id: string;
  account_id: string;
  external_position_id: string;
  symbol: string;
  direction: Direction;
  volume: number;
  entry_price: number;
  open_time: string;
  stop_loss: number | null;
  take_profit: number | null;
  current_price: number | null;
  unrealized_pnl: number | null;
  synced_at: string;
}

export interface AccountSettings {
  id: string;
  user_id: string;
  account_id: string;
  risk_parts: number;
  dashboard_layout: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  account_id: string;
  observations: string[];
  blindspots: string[];
  discipline_notes: string | null;
  trades_count: number;
  generated_at: string;
}

export type TradeGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface PlaybookRule {
  id: string;
  text: string;
  order: number;
}

export interface Playbook {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  description: string | null;
  rules: PlaybookRule[];
  tags: string[] | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradePlaybookEntry {
  id: string;
  user_id: string;
  trade_id: string;
  playbook_id: string;
  rules_followed: string[];
  rules_broken: string[];
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  account_id: string;
  entry_date: string;
  pre_session_plan: string | null;
  post_session_review: string | null;
  market_conditions: string | null;
  mental_state: string | null;
  lessons_learned: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyHabit {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  category: string;
  is_automated: boolean;
  auto_rule: Record<string, unknown> | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  account_id: string;
  log_date: string;
  habits_completed: string[];
  habits_violated: string[];
  notes: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface MentorLink {
  id: string;
  mentor_id: string;
  mentee_id: string;
  account_id: string;
  status: 'pending' | 'active' | 'revoked';
  invite_code: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface TradeComment {
  id: string;
  user_id: string;
  trade_id: string;
  content: string;
  created_at: string;
}
