/**
 * 周菜单控制器
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as mealPlanService from '../services/mealPlans.js';
import { success, created, fail, notFound, serverError } from '../utils/response.js';

// ============ 获取计划列表 ============
export async function getPlans(req: Request, res: Response) {
  try {
    const plans = await mealPlanService.getPlans(req.user!.userId);
    return success(res, plans);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 获取当前计划 ============
export async function getActivePlan(req: Request, res: Response) {
  try {
    const plan = await mealPlanService.getActivePlan(req.user!.userId);
    return success(res, plan);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 生成一周菜单 ============
const generateSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  name: z.string().optional(),
  style: z.string().optional(),
  dailyCalories: z.number().int().optional(),
  dailyProtein: z.number().int().optional(),
});

export async function generatePlan(req: Request, res: Response) {
  try {
    const options = generateSchema.parse(req.body);
    const result = await mealPlanService.generatePlan(req.user!.userId, options);
    return created(res, result, '一周菜单生成成功');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message || '参数错误');
    }
    if (error.message?.includes('菜谱不足')) {
      return fail(res, error.message);
    }
    return serverError(res, error);
  }
}

// ============ 获取计划详情 ============
export async function getPlan(req: Request, res: Response) {
  try {
    const plan = await mealPlanService.getPlan(req.user!.userId, req.params.id);
    return success(res, plan);
  } catch (error: any) {
    if (error.message === '计划不存在') return notFound(res, error.message);
    return serverError(res, error);
  }
}

// ============ 删除计划 ============
export async function deletePlan(req: Request, res: Response) {
  try {
    await mealPlanService.deletePlan(req.user!.userId, req.params.id);
    return success(res, null, '计划已删除');
  } catch (error: any) {
    if (error.message === '计划不存在') return notFound(res, error.message);
    return serverError(res, error);
  }
}

// ============ 锁定/解锁 ============
export async function toggleLock(req: Request, res: Response) {
  try {
    const { meals } = req.body;
    const result = await mealPlanService.toggleLock(
      req.user!.userId, req.params.planId, req.params.dayPlanId, meals
    );
    return success(res, result, result.isLocked ? '已锁定' : '已解锁');
  } catch (error: any) {
    return serverError(res, error);
  }
}

// ============ 重新生成 ============
const regenerateSchema = z.object({
  targets: z.array(z.object({
    dayPlanId: z.string(),
    meals: z.array(z.enum(['breakfast', 'lunch', 'dinner'])),
  })),
});

export async function regenerateMeals(req: Request, res: Response) {
  try {
    const { targets } = regenerateSchema.parse(req.body);
    const results = await mealPlanService.regenerateMeals(
      req.user!.userId, req.params.planId, targets
    );
    return success(res, results, '已重新生成');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message || '参数错误');
    }
    return serverError(res, error);
  }
}
