/**
 * 认证路由：登录 / 注册 / 个人资料
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as authController from '../controllers/auth.js';

const router = Router();

// 注册
router.post('/register', authController.register);
// 登录
router.post('/login', authController.login);
// 获取当前用户信息
router.get('/me', requireAuth, authController.getMe);
// 更新个人资料（含减脂目标计算）
router.put('/profile', requireAuth, authController.updateProfile);
// 获取资料
router.get('/profile', requireAuth, authController.getProfile);

export default router;
