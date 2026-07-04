/**
 * 周菜单计划路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as mealPlanController from '../controllers/mealPlans.js';

const router = Router();

// 获取计划列表
router.get('/', requireAuth, mealPlanController.getPlans);
// 获取当前生效的周计划
router.get('/active', requireAuth, mealPlanController.getActivePlan);
// 生成一周菜单
router.post('/generate', requireAuth, mealPlanController.generatePlan);
// 获取某个计划详情
router.get('/:id', requireAuth, mealPlanController.getPlan);
// 删除计划
router.delete('/:id', requireAuth, mealPlanController.deletePlan);
// 锁定/解锁某天某餐
router.put('/:planId/lock/:dayPlanId', requireAuth, mealPlanController.toggleLock);
// 重新生成指定天数/餐次
router.post('/:planId/regenerate', requireAuth, mealPlanController.regenerateMeals);

export default router;
