/**
 * 菜谱控制器
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as recipeService from '../services/recipes.js';
import { success, created, fail, notFound, serverError } from '../utils/response.js';

// ============ 获取系统内置菜谱 ============
export async function getSystemRecipes(req: Request, res: Response) {
  try {
    const category = req.query.category as string | undefined;
    const recipes = await recipeService.getSystemRecipes(category);
    return success(res, recipes);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 获取菜谱列表 ============
export async function getRecipes(req: Request, res: Response) {
  try {
    const { search, category, tags, difficulty, favorite, page, limit, sortBy } = req.query;
    const result = await recipeService.getRecipes({
      search: search as string,
      category: category as string,
      tags: tags as string,
      difficulty: difficulty as string,
      favorite: favorite === 'true',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      userId: req.user?.userId,
    });
    return success(res, result);
  } catch (error) {
    return serverError(res, error);
  }
}

// ============ 获取单个菜谱 ============
export async function getRecipe(req: Request, res: Response) {
  try {
    const recipe = await recipeService.getRecipe(req.params.id);
    return success(res, recipe);
  } catch (error: any) {
    if (error.message === '菜谱不存在') return notFound(res, error.message);
    return serverError(res, error);
  }
}

// ============ 新增菜谱 ============
const recipeCreateSchema = z.object({
  name: z.string().min(1).max(200),
  imageUrl: z.string().url().optional(),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  tags: z.array(z.string()),
  ingredients: z.array(z.object({
    name: z.string(), amount: z.number().min(0), unit: z.string(),
  })),
  seasonings: z.array(z.object({ name: z.string(), amount: z.string().optional() })).optional(),
  instructions: z.string().min(1),
  cookTime: z.number().int().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  calories: z.number().int().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
});

export async function createRecipe(req: Request, res: Response) {
  try {
    const data = recipeCreateSchema.parse(req.body);
    const recipe = await recipeService.createRecipe(req.user!.userId, data);
    return created(res, recipe, '菜谱创建成功');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message || '参数错误');
    }
    return serverError(res, error);
  }
}

// ============ 更新菜谱 ============
const recipeUpdateSchema = recipeCreateSchema.partial();

export async function updateRecipe(req: Request, res: Response) {
  try {
    const data = recipeUpdateSchema.parse(req.body);
    const recipe = await recipeService.updateRecipe(req.params.id, req.user!.userId, data);
    return success(res, recipe, '菜谱更新成功');
  } catch (error: any) {
    if (error.message.includes('不存在') || error.message.includes('无权')) {
      return fail(res, error.message, 403);
    }
    return serverError(res, error);
  }
}

// ============ 删除菜谱 ============
export async function deleteRecipe(req: Request, res: Response) {
  try {
    await recipeService.deleteRecipe(req.params.id, req.user!.userId);
    return success(res, null, '菜谱已删除');
  } catch (error: any) {
    if (error.message.includes('不存在') || error.message.includes('无权') || error.message.includes('系统菜谱')) {
      return fail(res, error.message, 403);
    }
    return serverError(res, error);
  }
}

// ============ 切换收藏 ============
export async function toggleFavorite(req: Request, res: Response) {
  try {
    const recipe = await recipeService.toggleFavorite(req.params.id, req.user!.userId);
    return success(res, recipe, recipe.isFavorited ? '已收藏' : '已取消收藏');
  } catch (error: any) {
    return serverError(res, error);
  }
}
