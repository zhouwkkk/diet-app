/**
 * 做饭记录控制器
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as recordService from '../services/records.js';
import { success, created, fail, serverError } from '../utils/response.js';

// ============ 获取记录列表 ============
export async function getRecords(req: Request, res: Response) {
  try {
    const { startDate, endDate, mealType, page, limit } = req.query;
    const result = await recordService.getRecords(req.user!.userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      mealType: mealType as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    return success(res, result);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 获取今日记录 ============
export async function getTodayRecords(req: Request, res: Response) {
  try {
    const date = req.query.date as string | undefined;
    const result = await recordService.getTodayRecords(req.user!.userId, date);
    return success(res, result);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 新增记录 ============
const recordSchema = z.object({
  recipeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误 (YYYY-MM-DD)'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  isFinished: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

export async function createRecord(req: Request, res: Response) {
  try {
    const data = recordSchema.parse(req.body);
    const record = await recordService.createRecord(req.user!.userId, data);
    return created(res, record, '记录成功');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message || '参数错误');
    }
    if (error.message === '菜谱不存在') return fail(res, error.message);
    return serverError(res, error);
  }
}

// ============ 删除记录 ============
export async function deleteRecord(req: Request, res: Response) {
  try {
    await recordService.deleteRecord(req.params.id, req.user!.userId);
    return success(res, null, '记录已删除');
  } catch (error: any) {
    if (error.message.includes('不存在') || error.message.includes('无权')) {
      return fail(res, error.message, 403);
    }
    return serverError(res, error);
  }
}
