/**
 * gov.dn42 数据库抽象层
 *
 * 生产环境使用 node-postgres（pg）连接 PostgreSQL；
 * 开发/测试环境使用 @electric-sql/pglite（WASM PostgreSQL，零安装）。
 * 通过环境变量 PG_CONNECTION_STRING 切换：
 *   - 未设置：使用 pglite（内存/文件）
 *   - 设置为 postgres://...：使用 pg 连接真实 PostgreSQL
 *
 * 统一导出 db 对象，接口与 pg.PoolClient 兼容（query 方法）。
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface DbClient {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }>;
}

let dbClient: DbClient | null = null;
let isPglite = false;

/** 初始化数据库连接并加载 schema */
export async function initDb(): Promise<DbClient> {
  if (dbClient) return dbClient;

  const connStr = process.env.PG_CONNECTION_STRING;

  if (connStr) {
    // 生产：使用 pg 连接真实 PostgreSQL
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: connStr });
    dbClient = {
      async query<T extends Record<string, unknown> = Record<string, unknown>>(
        text: string,
        params?: unknown[],
      ): Promise<{ rows: T[]; rowCount: number }> {
        const res = await pool.query(text, params);
        return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
      },
    };
    isPglite = false;
    console.log(`[db] connected to PostgreSQL via pg`);
  } else {
    // 开发/测试：使用 pglite（WASM）
    const { PGlite } = await import('@electric-sql/pglite');
    // dataDir 为空 → 内存；为路径 → 持久化
    const dataDir = process.env.PGLITE_PATH ?? '';
    const pglite = dataDir
      ? await PGlite.create({ dataDir })
      : await PGlite.create();
    dbClient = {
      async query<T extends Record<string, unknown> = Record<string, unknown>>(
        text: string,
        params?: unknown[],
      ): Promise<{ rows: T[]; rowCount: number }> {
        const res = await pglite.query(text, params ?? []);
        return { rows: res.rows as T[], rowCount: res.affectedRows ?? res.rows.length };
      },
    };
    isPglite = true;
    console.log(`[db] connected to PGlite (${dataDir || 'memory'})`);
  }

  // 加载 schema（幂等：所有语句都带 IF NOT EXISTS / OR REPLACE）
  const schemaPath = resolve(import.meta.dirname, 'schema.sql');
  const schema = await readFile(schemaPath, 'utf-8');
  // pglite 不支持多语句在一次 query 中，需按 ; 拆分
  // 注意：$$ ... $$ 函数体内的 ; 不应被拆分
  const statements = splitSqlStatements(schema);
  for (const stmt of statements) {
    await dbClient.query(stmt);
  }
  console.log(`[db] schema loaded (${statements.length} statements)`);

  return dbClient;
}

/** 关闭数据库连接（用于测试或优雅退出） */
export async function closeDb(): Promise<void> {
  if (!dbClient) return;
  // pglite 不需要显式关闭；pg 的 pool 由进程退出时自动关闭
  dbClient = null;
}

/** 是否使用 pglite（测试用） */
export function isUsingPglite(): boolean {
  return isPglite;
}

/**
 * 将 SQL 脚本拆分为单条语句。
 * 处理：单行注释（--）、块注释、单引号字符串、
 * dollar quoting（$tag$ ... $tag$）。按语句分隔符 `;` 拆分。
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let i = 0;
  const len = sql.length;

  while (i < len) {
    // 单行注释
    if (sql[i] === '-' && sql[i + 1] === '-') {
      while (i < len && sql[i] !== '\n') {
        current += sql[i];
        i++;
      }
      continue;
    }
    // 块注释
    if (sql[i] === '/' && sql[i + 1] === '*') {
      current += '/*';
      i += 2;
      while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
        current += sql[i];
        i++;
      }
      if (i < len) {
        current += '*/';
        i += 2;
      }
      continue;
    }
    // 单引号字符串
    if (sql[i] === "'") {
      current += "'";
      i++;
      while (i < len) {
        current += sql[i];
        if (sql[i] === "'" && sql[i + 1] !== "'") {
          i++;
          break;
        }
        if (sql[i] === "'" && sql[i + 1] === "'") {
          // 转义的单引号
          current += sql[i + 1];
          i += 2;
          continue;
        }
        i++;
      }
      continue;
    }
    // dollar quoting: $tag$ ... $tag$（tag 可为空，即 $$ ... $$）
    if (sql[i] === '$' && sql[i + 1] === '$') {
      // 空 tag 情况：$$
      const tag = '$$';
      const closeIdx = sql.indexOf(tag, i + 2);
      if (closeIdx !== -1) {
        current += sql.slice(i, closeIdx + tag.length);
        i = closeIdx + tag.length;
        continue;
      }
    } else if (sql[i] === '$') {
      // 带名 tag：$tag$，向前查找 tag 结束的 $
      let tagEnd = i + 1;
      while (tagEnd < len && sql[tagEnd] !== '$' && sql[tagEnd] !== '\n' && /[a-zA-Z0-9_]/.test(sql[tagEnd])) {
        tagEnd++;
      }
      if (tagEnd < len && sql[tagEnd] === '$' && tagEnd > i + 1) {
        const tag = sql.slice(i, tagEnd + 1); // $tag$
        const closeIdx = sql.indexOf(tag, tagEnd + 1);
        if (closeIdx !== -1) {
          current += sql.slice(i, closeIdx + tag.length);
          i = closeIdx + tag.length;
          continue;
        }
      }
    }
    // 语句分隔符
    if (sql[i] === ';') {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
      i++;
      continue;
    }
    current += sql[i];
    i++;
  }
  const last = current.trim();
  if (last.length > 0) {
    statements.push(last);
  }
  return statements;
}
