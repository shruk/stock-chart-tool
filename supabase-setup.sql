-- Drop old tables
DROP TABLE IF EXISTS price_cache;
DROP TABLE IF EXISTS analyst_cache;
DROP TABLE IF EXISTS price_bars;

-- Normalized daily price bars (one row per symbol per trading day)
CREATE TABLE price_bars (
  id      BIGSERIAL PRIMARY KEY,
  symbol  TEXT      NOT NULL,
  ts      DATE      NOT NULL,
  open    NUMERIC   NOT NULL,
  high    NUMERIC   NOT NULL,
  low     NUMERIC   NOT NULL,
  close   NUMERIC   NOT NULL,
  volume  BIGINT    NOT NULL,
  UNIQUE (symbol, ts)
);

CREATE INDEX idx_price_bars_symbol_ts ON price_bars (symbol, ts DESC);

-- Analyst data cache (refreshed daily by Azure Function)
CREATE TABLE analyst_cache (
  symbol     TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow public reads (anon key) and server writes (service role)
ALTER TABLE price_bars    ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read price_bars"     ON price_bars    FOR SELECT USING (true);
CREATE POLICY "public write price_bars"    ON price_bars    FOR ALL    USING (true);
CREATE POLICY "public read analyst_cache"  ON analyst_cache FOR SELECT USING (true);
CREATE POLICY "public write analyst_cache" ON analyst_cache FOR ALL    USING (true);

-- Used by the admin page to show bar counts per symbol
CREATE OR REPLACE FUNCTION get_symbol_stats()
RETURNS TABLE(symbol TEXT, bar_count BIGINT, from_date TEXT, to_date TEXT, has_analyst BOOLEAN)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    pb.symbol,
    COUNT(*)::BIGINT,
    MIN(pb.ts::text),
    MAX(pb.ts::text),
    EXISTS(SELECT 1 FROM analyst_cache ac WHERE ac.symbol = pb.symbol)
  FROM price_bars pb
  GROUP BY pb.symbol
  ORDER BY pb.symbol;
$$;
