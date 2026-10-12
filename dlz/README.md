# gov.dn42 bind9 DLZ 模块

bind9 通过 DLZ (Dynamically Loadable Zones) 驱动直接查询 PostgreSQL 中的
委派记录，无需手动维护 zone 文件。审批通过的子域名自动生效。

## 工作原理

```
DNS 客户端 ──▶ bind9 ──▶ DLZ 驱动 ──▶ PostgreSQL (delegations 表)
                                    └─▶ 返回 NS/DS/SOA 记录
```

当管理员审批通过一个子域名申请时，后端在 `delegations` 表写入一条记录；
bind9 的 DLZ 驱动每次收到 DNS 查询时，通过 SQL 查询该表返回响应。

## 安装

### 1. 确认 bind9 支持 DLZ PostgreSQL

```bash
named -V | grep -i dlz
# 应包含：--with-dlz-postgres
```

Debian/Ubuntu 的 `bind9` 包默认已启用。若未启用，需从源码编译或安装
`bind9-dlz-postgres` 变体。

### 2. 创建 DLZ 查询视图

```bash
psql -d gov_dn42 -f dlz/dlz-views.sql
```

视图 `dlz_zones`、`dlz_records`、`dlz_all_records` 会从 `delegations` 表
派生 NS / DS / SOA 记录。

### 3. 配置 bind9

```bash
sudo cp dlz/named.conf.dlz /etc/bind/named.conf.dlz
# 编辑数据库连接参数（密码等）
sudo nano /etc/bind/named.conf.dlz

# 在 named.conf 中 include
echo 'include "/etc/bind/named.conf.dlz";' | sudo tee -a /etc/bind/named.conf
```

### 4. 重启 bind9

```bash
sudo systemctl restart bind9
sudo systemctl status bind9
```

## 测试

假设有一个已审批的委派 `home.gov.dn42` → `ns1.example.gov.dn42`：

```bash
# 查询 NS 记录
dig @localhost home.gov.dn42 NS

# 期望：
# home.gov.dn42.  3600  IN  NS  ns1.example.gov.dn42.
# home.gov.dn42.  3600  IN  NS  ns2.example.gov.dn42.

# 查询 SOA
dig @localhost home.gov.dn42 SOA

# 查询 DS（如果申请时提供了）
dig @localhost home.gov.dn42 DS
```

## 文件说明

- `dlz-views.sql`：PostgreSQL 视图定义，从 `delegations` 表派生 DNS 记录
- `named.conf.dlz`：bind9 DLZ 配置，包含连接串与查询语句

## 记录类型

当前支持的记录类型：

| 类型 | 来源 | 说明 |
|------|------|------|
| NS | `delegations.ns[]` | 委派给申请者的名称服务器（必需，≥2 条） |
| DS | `delegations.ds[]` | DNSSEC 委派签名（可选） |
| SOA | 合成 | DLZ 要求每个 zone 至少一条 SOA |

SOA 记录中的序列号使用审批日期（YYYYMMDD 格式），刷新/重试/过期/最小 TTL
使用 BIND 默认值。

## 故障排查

### named 启动失败

```bash
sudo named -g -c /etc/bind/named.conf
# 检查 DLZ 查询语法与连接参数
```

### 查询返回空

```bash
# 确认数据库中有数据
psql -d gov_dn42 -c "SELECT * FROM delegations;"

# 确认视图正常
psql -d gov_dn42 -c "SELECT * FROM dlz_records WHERE zone_name = 'home.gov.dn42';"

# 检查 bind9 日志
journalctl -u bind9 -f
```

### DLZ 驱动未编译

若 `named -V` 不含 `--with-dlz-postgres`，需安装支持 DLZ 的 bind9 变体：
```bash
# Debian/Ubuntu
sudo apt install bind9-dlz-postgres  # 若可用
# 否则从源码编译，configure 加 --with-dlz-postgres=yes
```

## 安全注意事项

- DLZ 查询使用的数据库用户应只读（建议创建专门的 `bind_dlz` 用户，
  仅授予 `delegations` 表与相关视图的 SELECT 权限）
- PostgreSQL 连接走 localhost，不对外暴露
- bind9 与后端使用不同数据库用户，权限隔离
