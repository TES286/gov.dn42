# gov.dn42 PostgreSQL 初始化脚本
#
# 在 PostgreSQL 服务器上执行（替换占位符）：
#   sudo -u postgres psql -f deploy/postgres-init.sql
#
# 创建数据库与用户，并授权。

-- 创建应用用户（请替换密码）
CREATE USER gov_dn42 WITH PASSWORD 'CHANGE_ME';

-- 创建数据库（owner 为应用用户，便于自动建表）
CREATE DATABASE gov_dn42 OWNER gov_dn42;

-- 限制连接数（可选）
ALTER USER gov_dn42 CONNECTION LIMIT 20;

-- 授权
GRANT ALL PRIVILEGES ON DATABASE gov_dn42 TO gov_dn42;

-- 在新数据库中授权 schema 使用（PostgreSQL 15+ 需显式授权）
\c gov_dn42
GRANT ALL ON SCHEMA public TO gov_dn42;
