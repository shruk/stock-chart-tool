-- Analyst data cache (refreshed every 24h)
CREATE TABLE IF NOT EXISTS analyst_cache (
  symbol      TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Price/bars cache (refreshed every 1h)
CREATE TABLE IF NOT EXISTS price_cache (
  symbol      TEXT NOT NULL,
  timeframe   TEXT NOT NULL,
  bars        JSONB NOT NULL,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symbol, timeframe)
);

-- Allow anonymous reads (public data)
ALTER TABLE analyst_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read analyst_cache"
  ON analyst_cache FOR SELECT USING (true);

CREATE POLICY "public read price_cache"
  ON price_cache FOR SELECT USING (true);

CREATE POLICY "public write analyst_cache"
  ON analyst_cache FOR ALL USING (true);

CREATE POLICY "public write price_cache"
  ON price_cache FOR ALL USING (true);
