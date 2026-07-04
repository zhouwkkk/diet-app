/**
 * 菜谱路由
 */
import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import * as recipeController from '../controllers/recipes.js';

const router = Router();

// 获取系统内置菜谱（无需登录）
router.get('/system', recipeController.getSystemRecipes);
// 获取菜谱列表（搜索、筛选、分页）
router.get('/', optionalAuth, recipeController.getRecipes);
// 获取单个菜谱
router.get('/:id', optionalAuth, recipeController.getRecipe);
// 新增菜谱
router.post('/', requireAuth, recipeController.createRecipe);
// 更新菜谱
router.put('/:id', requireAuth, recipeController.updateRecipe);
// 删除菜谱
router.delete('/:id', requireAuth, recipeController.deleteRecipe);
// 切换收藏
router.post('/:id/favorite', requireAuth, recipeController.toggleFavorite);

export default router;
