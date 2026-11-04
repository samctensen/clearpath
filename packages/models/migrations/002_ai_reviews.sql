CREATE TABLE IF NOT EXISTS ai_reviews (
  case_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  content JSONB NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, revision),
  FOREIGN KEY (case_id, revision) REFERENCES revisions(case_id, number)
);
CREATE TABLE IF NOT EXISTS ai_review_daily_usage (
  day DATE NOT NULL,
  scope TEXT NOT NULL,
  requests INTEGER NOT NULL CHECK (requests > 0),
  PRIMARY KEY (day, scope)
);
