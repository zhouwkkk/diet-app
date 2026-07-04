/**
 * 做饭记录路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as recordController from '../controllers/records.js';

const router = Router();

// 获取记录列表（按日/周/月）
router.get('/', requireAuth, recordController.getRecords);
// 获取今日记录
router.get('/today', requireAuth, recordController.getTodayRecords);
// 新增做饭记录
router.post('/', requireAuth, recordController.createRecord);
// 删除记录
router.delete('/:id', requireAuth, recordController.deleteRecord);

export default router;
