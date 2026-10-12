-- ============================================================
-- gov.dn42 后端 PostgreSQL schema
-- 数据表：subdomains / submissions / sessions / users
-- ============================================================

-- 子域名注册申请
CREATE TABLE IF NOT EXISTS subdomains (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  ns          TEXT[] NOT NULL,
  ds          TEXT[] NOT NULL DEFAULT '{}',
  purpose     TEXT NOT NULL,
  contact     TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  auth_provider TEXT NOT NULL,
  auth_sub    TEXT NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 已批准的委派记录（用于 bind9 DLZ 查询）
CREATE TABLE IF NOT EXISTS delegations (
  name        TEXT PRIMARY KEY,        -- 如 'home.gov.dn42'
  application_id TEXT NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
  ns          TEXT[] NOT NULL,
  ds          TEXT[] NOT NULL DEFAULT '{}',
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by TEXT NOT NULL           -- 审批管理员标识（providerId:sub）
);

-- 举报与意见
CREATE TABLE IF NOT EXISTS submissions (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('report', 'feedback')),
  category    TEXT NOT NULL,
  content     TEXT NOT NULL,
  target      TEXT,
  contact     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 会话 token（OIDC 回调后下发，前端通过 Bearer 携带）
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  sub         TEXT NOT NULL,
  name        TEXT,
  email       TEXT,
  dn42        TEXT,
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_subdomains_status ON subdomains(status);
CREATE INDEX IF NOT EXISTS idx_subdomains_name ON subdomains(name);
CREATE INDEX IF NOT EXISTS idx_subdomains_auth ON subdomains(auth_provider, auth_sub);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_delegations_name ON delegations(name);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subdomains_updated_at ON subdomains;
CREATE TRIGGER subdomains_updated_at BEFORE UPDATE ON subdomains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
