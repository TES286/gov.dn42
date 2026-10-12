-- ============================================================
-- gov.dn42 bind9 DLZ PostgreSQL 查询视图
--
-- bind9 的 DLZ (Dynamically Loadable Zones) 驱动通过一组固定查询
-- 从 PostgreSQL 读取 DNS 记录。本文件创建辅助视图，使 DLZ 查询
-- 能正确返回 NS / DS / SOA 记录。
--
-- 使用：
--   psql -d gov_dn42 -f dlz/dlz-views.sql
--
-- DLZ 配置见 dlz/named.conf.dlz
-- ============================================================

-- DLZ 查询入口视图：每个委派对应一个 zone
-- bind9 DLZ 驱动通过 zone 名称查找 zone_id，再按 qtype 查记录。
-- 我们用一个视图模拟 zone + records 两层。

-- zone 视图：返回所有已批准的委派作为 zone
CREATE OR REPLACE VIEW dlz_zones AS
SELECT
  name AS zone_name           -- 如 'home.gov.dn42'
FROM delegations;

-- SOA 记录（合成）：DLZ 要求每个 zone 至少一条 SOA
-- 序列号用审批日期 YYYYMMDD 格式；用 to_char 若可用，否则用 extract 拼接
CREATE OR REPLACE VIEW dlz_records AS
SELECT
  d.name AS zone_name,
  d.name AS host,
  'NS' AS type,
  3600 AS ttl,
  ns_val AS data
FROM delegations d, unnest(d.ns) AS ns_val

UNION ALL

SELECT
  d.name AS zone_name,
  d.name AS host,
  'DS' AS type,
  3600 AS ttl,
  ds_val AS data
FROM delegations d, unnest(d.ds) AS ds_val

UNION ALL

SELECT
  d.name AS zone_name,
  d.name AS host,
  'SOA' AS type,
  3600 AS ttl,
  'ns.gov.dn42. admin.gov.dn42. ' ||
    extract(year from d.approved_at)::text ||
    lpad(extract(month from d.approved_at)::text, 2, '0') ||
    lpad(extract(day from d.approved_at)::text, 2, '0') || ' ' ||
    '10800 3600 604800 3600' AS data
FROM delegations d;

-- 辅助视图：允许 DLZ 查询 apex 的 NS（zone transfer 用，可选）
CREATE OR REPLACE VIEW dlz_all_records AS
SELECT
  zone_name,
  host,
  type,
  ttl,
  data
FROM dlz_records;
