/**
 * 统一响应格式
 */
import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export function success<T>(res: Response, data: T, message = '操作成功', status = 200) {
  return res.status(status).json({ success: true, data, message } as ApiResponse<T>);
}

export function created<T>(res: Response, data: T, message = '创建成功') {
  return success(res, data, message, 201);
}

export function fail(res: Response, message = '操作失败', status = 400) {
  return res.status(status).json({ success: false, message } as ApiResponse);
}

export function unauthorized(res: Response, message = '请先登录') {
  return fail(res, message, 401);
}

export function notFound(res: Response, message = '资源不存在') {
  return fail(res, message, 404);
}

export function serverError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : '服务器内部错误';
  console.error('[Server Error]', error);
  return res.status(500).json({ success: false, message } as ApiResponse);
}
