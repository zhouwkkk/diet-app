/**
 * 购物清单路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { success, created, fail, notFound, serverError } from '../utils/response.js';

const router = Router();

// 获取购物清单
router.get('/', requireAuth, async (req, res) => {
  try {
    const { purchased } = req.query;
    const where: any = { userId: req.user!.userId };
    if (purchased === 'true') where.isPurchased = true;
    else if (purchased === 'false') where.isPurchased = false;
    const items = await prisma.shoppingList.findMany({
      where, orderBy: { createdAt: 'desc' },
    });
    return success(res, items);
  } catch (error) { return serverError(res, error); }
});

// 新增
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, quantity, unit, mealPlanId } = req.body;
    const item = await prisma.shoppingList.create({
      data: {
        userId: req.user!.userId, name,
        quantity: Number(quantity), unit: unit || 'g',
        mealPlanId: mealPlanId || null,
      },
    });
    return created(res, item);
  } catch (error) { return serverError(res, error); }
});

// 切换购买状态
router.patch('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const item = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!item) return notFound(res);
    const updated = await prisma.shoppingList.update({
      where: { id: req.params.id },
      data: { isPurchased: !item.isPurchased },
    });
    return success(res, updated);
  } catch (error) { return serverError(res, error); }
});

// 删除
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.shoppingList.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    return success(res, null, '已删除');
  } catch (error) { return serverError(res, error); }
});

export default router;
