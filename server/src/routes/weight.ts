/**
 * 体重记录路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { success, created, notFound, serverError } from '../utils/response.js';

const router = Router();

// 获取体重记录列表
router.get('/', requireAuth, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));

    const records = await prisma.weightRecord.findMany({
      where: { userId: req.user!.userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    return success(res, records);
  } catch (error) { return serverError(res, error); }
});

// 新增体重记录
router.post('/', requireAuth, async (req, res) => {
  try {
    const { date, weight, bodyFat, waist, hip, note } = req.body;
    // 同一天已有记录则更新
    const existing = await prisma.weightRecord.findFirst({
      where: { userId: req.user!.userId, date: new Date(date) },
    });

    let record;
    if (existing) {
      record = await prisma.weightRecord.update({
        where: { id: existing.id },
        data: { weight, bodyFat, waist, hip, note },
      });
      return success(res, record, '已更新');
    } else {
      record = await prisma.weightRecord.create({
        data: { userId: req.user!.userId, date: new Date(date), weight, bodyFat, waist, hip, note },
      });
      return created(res, record);
    }
  } catch (error) { return serverError(res, error); }
});

// 删除
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const record = await prisma.weightRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!record) return notFound(res);
    await prisma.weightRecord.delete({ where: { id: req.params.id } });
    return success(res, null, '已删除');
  } catch (error) { return serverError(res, error); }
});

export default router;
