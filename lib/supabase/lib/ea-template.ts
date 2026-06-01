// lib/ea-template.ts
// The MQL5 source for our sync EA. The download endpoint replaces
// __EA_TOKEN__ and __WEBHOOK_URL__ before returning the .mq5 file
// so each user gets a pre-configured EA they just drop into MT5.

export const EA_TEMPLATE = String.raw`//+------------------------------------------------------------------+
//|                                            TradeFull1Sync.mq5    |
//|                                  Auto-syncs MT5 trades to your   |
//|                                          trade-full-1 dashboard. |
//+------------------------------------------------------------------+
#property copyright "trade-full-1"
#property version   "1.00"
#property strict

input string EA_TOKEN              = "__EA_TOKEN__";       // Pre-filled at download
input string WEBHOOK_URL           = "__WEBHOOK_URL__";    // Pre-filled at download
input int    POSITIONS_INTERVAL_SEC = 10;                   // How often to push open positions
input bool   DEBUG_LOG             = true;                  // Print sync events to Experts tab

//+------------------------------------------------------------------+
//| Lifecycle                                                        |
//+------------------------------------------------------------------+
int OnInit()
{
   if(StringFind(WEBHOOK_URL, "__") >= 0 || StringFind(EA_TOKEN, "__") >= 0) {
      Alert("TradeFull1: EA not configured. Re-download from your dashboard.");
      return INIT_FAILED;
   }
   Print("TradeFull1Sync online. Account #", AccountInfoInteger(ACCOUNT_LOGIN));
   Print("Webhook: ", WEBHOOK_URL);
   Print("Token: ", StringSubstr(EA_TOKEN, 0, 8), "...");
   EventSetTimer(POSITIONS_INTERVAL_SEC);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("TradeFull1Sync offline. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Push open positions snapshot every N seconds                     |
//+------------------------------------------------------------------+
void OnTimer()
{
   PushPositionsSnapshot();
}

//+------------------------------------------------------------------+
//| Fired when ANY trade event happens. We watch for closing deals.  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest&     request,
                        const MqlTradeResult&      result)
{
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD) return;
   if(!HistoryDealSelect(trans.deal)) return;

   ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal, DEAL_ENTRY);

   // DEAL_ENTRY_OUT means a closing leg. We push the full closed position.
   if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
      ulong posId = (ulong)HistoryDealGetInteger(trans.deal, DEAL_POSITION_ID);
      PushClosedTrade(posId);
   }
}

//+------------------------------------------------------------------+
//| Walk history for both legs of a closed position, push to API     |
//+------------------------------------------------------------------+
void PushClosedTrade(ulong positionId)
{
   datetime to = TimeCurrent() + 86400;
   datetime from = to - 86400 * 30;
   if(!HistorySelect(from, to)) return;

   ulong  openTicket = 0, closeTicket = 0;
   datetime openTime = 0, closeTime = 0;
   double openPrice = 0, closePrice = 0;
   double volume = 0, profit = 0, commission = 0, swap = 0;
   string symbol = "", comment = "";
   ENUM_DEAL_TYPE entryType = WRONG_VALUE;

   int dealsCount = HistoryDealsTotal();
   for(int i = 0; i < dealsCount; i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      if((ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != positionId) continue;

      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      ENUM_DEAL_TYPE  type  = (ENUM_DEAL_TYPE) HistoryDealGetInteger(ticket, DEAL_TYPE);

      if(entry == DEAL_ENTRY_IN) {
         openTicket = ticket;
         openTime   = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         openPrice  = HistoryDealGetDouble(ticket, DEAL_PRICE);
         volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
         entryType  = type;
         if(symbol == "") symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
         if(comment == "") comment = HistoryDealGetString(ticket, DEAL_COMMENT);
      }
      else if(entry == DEAL_ENTRY_OUT) {
         closeTicket = ticket;
         closeTime   = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         closePrice  = HistoryDealGetDouble(ticket, DEAL_PRICE);
      }

      profit     += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      commission += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      swap       += HistoryDealGetDouble(ticket, DEAL_SWAP);
   }

   if(openTicket == 0 || closeTicket == 0) {
      if(DEBUG_LOG) Print("PushClosedTrade: Could not find both legs for position ", positionId);
      return;
   }

   string direction = (entryType == DEAL_TYPE_BUY) ? "long" : "short";
   string externalId = IntegerToString((long)positionId);

   string json = "{";
   json += "\"external_trade_id\":\"" + externalId + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"direction\":\"" + direction + "\",";
   json += "\"volume\":" + DoubleToString(volume, 2) + ",";
   json += "\"entry_price\":" + DoubleToString(openPrice, 5) + ",";
   json += "\"exit_price\":" + DoubleToString(closePrice, 5) + ",";
   json += "\"open_time\":\"" + IsoUtc(openTime) + "\",";
   json += "\"close_time\":\"" + IsoUtc(closeTime) + "\",";
   json += "\"pnl\":" + DoubleToString(profit, 2) + ",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"comment\":\"" + EscapeJson(comment) + "\"";
   json += "}";

   if(DEBUG_LOG) Print("Pushing trade: ", symbol, " ", direction, " ", DoubleToString(profit, 2));

   PostJson(WEBHOOK_URL + "/api/ea/sync/trades", json);
}

//+------------------------------------------------------------------+
//| Snapshot all currently open positions, push to API               |
//+------------------------------------------------------------------+
void PushPositionsSnapshot()
{
   int total = PositionsTotal();
   string json = "{\"positions\":[";

   for(int i = 0; i < total; i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;

      string symbol      = PositionGetString(POSITION_SYMBOL);
      double volume      = PositionGetDouble(POSITION_VOLUME);
      double entryPrice  = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentPrice= PositionGetDouble(POSITION_PRICE_CURRENT);
      double profit      = PositionGetDouble(POSITION_PROFIT);
      double swap        = PositionGetDouble(POSITION_SWAP);
      double sl          = PositionGetDouble(POSITION_SL);
      double tp          = PositionGetDouble(POSITION_TP);
      datetime openTime  = (datetime)PositionGetInteger(POSITION_TIME);
      long posType       = PositionGetInteger(POSITION_TYPE);
      string direction   = (posType == POSITION_TYPE_BUY) ? "long" : "short";

      if(i > 0) json += ",";
      json += "{";
      json += "\"external_position_id\":\"" + IntegerToString((long)ticket) + "\",";
      json += "\"symbol\":\"" + symbol + "\",";
      json += "\"direction\":\"" + direction + "\",";
      json += "\"volume\":" + DoubleToString(volume, 2) + ",";
      json += "\"entry_price\":" + DoubleToString(entryPrice, 5) + ",";
      json += "\"current_price\":" + DoubleToString(currentPrice, 5) + ",";
      json += "\"open_time\":\"" + IsoUtc(openTime) + "\",";
      json += "\"unrealized_pnl\":" + DoubleToString(profit, 2) + ",";
      json += "\"swap\":" + DoubleToString(swap, 2) + ",";
      // SL/TP: MT5 returns 0 when none is set, so only send non-zero values.
      // The API treats 0/null/missing identically.
      json += "\"stop_loss\":" + DoubleToString(sl, 5) + ",";
      json += "\"take_profit\":" + DoubleToString(tp, 5);
      json += "}";
   }

   json += "]}";

   PostJson(WEBHOOK_URL + "/api/ea/sync/positions", json);
}

//+------------------------------------------------------------------+
//| HTTP POST helper using MT5's WebRequest                          |
//+------------------------------------------------------------------+
void PostJson(string url, string json)
{
   char post[];
   StringToCharArray(json, post, 0, StringLen(json));
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\n";
   headers += "Authorization: Bearer " + EA_TOKEN + "\r\n";

   ResetLastError();
   int responseCode = WebRequest(
      "POST",
      url,
      headers,
      5000,
      post,
      result,
      resultHeaders
   );

   if(responseCode == -1) {
      int err = GetLastError();
      if(err == 4014) {
         Print("WebRequest failed: URL not whitelisted. Add ", WEBHOOK_URL,
               " to Tools > Options > Expert Advisors > Allow WebRequest.");
      } else {
         Print("WebRequest failed for ", url, " error=", err);
      }
   }
   else if(responseCode >= 400) {
      string body = CharArrayToString(result);
      Print("API rejected: ", responseCode, " ", body);
   }
   else if(DEBUG_LOG) {
      Print("Sync OK: ", responseCode);
   }
}

//+------------------------------------------------------------------+
//| Convert a MT5 broker-server datetime to ISO 8601 UTC string      |
//+------------------------------------------------------------------+
string IsoUtc(datetime serverTime)
{
   int offset = (int)(TimeTradeServer() - TimeGMT());
   datetime utc = serverTime - offset;
   MqlDateTime dt;
   TimeToStruct(utc, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}

//+------------------------------------------------------------------+
//| Escape characters that would break JSON                          |
//+------------------------------------------------------------------+
string EscapeJson(string s)
{
   string out = "";
   int len = StringLen(s);
   for(int i = 0; i < len; i++) {
      ushort ch = StringGetCharacter(s, i);
      if(ch == '"')       out += "\\\"";
      else if(ch == '\\') out += "\\\\";
      else if(ch == '\n') out += "\\n";
      else if(ch == '\r') out += "\\r";
      else if(ch == '\t') out += "\\t";
      else                out += ShortToString(ch);
   }
   return out;
}
//+------------------------------------------------------------------+
`;
