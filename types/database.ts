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
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  account_id: string;
  content: unknown; // JSONB — shape depends on the Gemini schema
  trade_count_at_generation: number;
  generated_at: string;
}
