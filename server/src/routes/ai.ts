/**
 * AI 路由模块
 */
import { Router } from 'express';
import { aiController } from '../controllers/ai.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 所有 AI 路由需要认证
router.use(requireAuth);

// 对话接口
router.post('/chat', aiController.chat);

// 智能推荐
router.post('/recommend', aiController.recommend);

// 冰箱模式
router.post('/fridge', aiController.fridge);

// AI 生成一周菜单
router.post('/generate-plan', aiController.generatePlan);

// 获取对话历史
router.get('/history', aiController.getHistory);

// 清除对话历史
router.delete('/history', aiController.clearHistory);

export default router;
