/**
 * SQLite 序列化工具
 * SQLite 不支持 Json/String[] 原生类型，所有复杂字段以 JSON 字符串存储
 */

/** 写入DB前：将数组/对象转为 JSON 字符串 */
export function serialize(val: any): string {
  if (val === null || val === undefined) return '[]';
  if (typeof val === 'string') return val; // 已经序列化过了
  return JSON.stringify(val);
}

/** 读取DB后：将 JSON 字符串转为数组/对象 */
export function deserialize<T = any>(val: any): T {
  if (val === null || val === undefined) return [] as unknown as T;
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T; } catch { return [] as unknown as T; }
  }
  return val as T;
}
