/**
 * 认证控制器
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.js';
import { success, created, fail, serverError } from '../utils/response.js';

// ============ 注册 ============
const registerSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '请输入昵称').max(50),
});

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const result = await authService.register(email, password, name);
    return created(res, result, '注册成功');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message || '参数错误');
    }
    if (error.message === '该邮箱已被注册') return fail(res, error.message);
    return serverError(res, error);
  }
}

// ============ 登录 ============
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, '请输入密码'),
});

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    return success(res, result, '登录成功');
  } catch (error: any) {
    if (error.message === '邮箱或密码错误') return fail(res, error.message, 401);
    return serverError(res, error);
  }
}

// ============ 获取当前用户 ============
export async function getMe(req: Request, res: Response) {
  try {
    const user = await authService.getMe(req.user!.userId);
    const { passwordHash, ...safeUser } = user as any;
    return success(res, safeUser);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 更新个人资料 ============
const profileSchema = z.object({
  gender: z.enum(['male', 'female', 'other']),
  age: z.number().int().min(10).max(120),
  height: z.number().min(100).max(250),
  currentWeight: z.number().min(30).max(300),
  targetWeight: z.number().min(30).max(300),
  weeklyLossGoal: z.number().min(0.1).max(2),
  weeklyExercise: z.number().int().min(0).max(14),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  waterTarget: z.number().int().min(500).max(5000).optional(),
});

export async function updateProfile(req: Request, res: Response) {
  try {
    const data = profileSchema.parse(req.body);
    const result = await authService.upsertProfile(req.user!.userId, data);
    return success(res, result, '资料更新成功');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message || '参数错误');
    }
    return serverError(res, error);
  }
}

// ============ 获取个人资料 ============
export async function getProfile(req: Request, res: Response) {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    return success(res, profile || null);
  } catch (error) {
    return serverError(res, error);
  }
}
