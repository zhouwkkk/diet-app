/**
 * 饮水记录路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { success, created, serverError } from '../utils/response.js';

const router = Router();

// 获取今日饮水
router.get('/today', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await prisma.waterRecord.findMany({
      where: { userId: req.user!.userId, date: { gte: today, lt: tomorrow } },
      orderBy: { createdAt: 'desc' },
    });

    const totalMl = records.reduce((s, r) => s + r.amountMl, 0);
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { waterTarget: true },
    });
    const target = profile?.waterTarget || 2000;

    return success(res, { records, totalMl, target, progress: Math.round((totalMl / target) * 100) });
  } catch (error) { return serverError(res, error); }
});

// 记录喝水
router.post('/', requireAuth, async (req, res) => {
  try {
    const { amountMl } = req.body;
    const record = await prisma.waterRecord.create({
      data: {
        userId: req.user!.userId, date: new Date(),
        amountMl: amountMl || 200,
      },
    });
    return created(res, record);
  } catch (error) { return serverError(res, error); }
});

export default router;
