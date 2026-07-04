/**
 * 食材库存路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { success, created, fail, notFound, serverError } from '../utils/response.js';

const router = Router();

// 获取库存列表
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, expiring } = req.query;
    const where: any = { userId: req.user!.userId };
    if (category && category !== 'all') where.category = category;
    if (expiring === 'true') {
      const soon = new Date();
      soon.setDate(soon.getDate() + 3);
      where.expiryDate = { lte: soon };
    }
    const items = await prisma.inventory.findMany({
      where, orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });
    return success(res, items);
  } catch (error) { return serverError(res, error); }
});

// 新增库存
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, quantity, unit, purchaseDate, expiryDate, category } = req.body;
    const item = await prisma.inventory.create({
      data: {
        userId: req.user!.userId, name,
        quantity: Number(quantity), unit: unit || 'g',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        category: category || null,
      },
    });
    return created(res, item);
  } catch (error: any) {
    if (error.message?.includes('name')) return fail(res, '请输入食材名称');
    return serverError(res, error);
  }
});

// 更新库存
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.inventory.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!item) return notFound(res, '库存项不存在');
    const updated = await prisma.inventory.update({
      where: { id: req.params.id }, data: req.body,
    });
    return success(res, updated);
  } catch (error) { return serverError(res, error); }
});

// 删除库存
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.inventory.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!item) return notFound(res, '库存项不存在');
    await prisma.inventory.delete({ where: { id: req.params.id } });
    return success(res, null, '已删除');
  } catch (error) { return serverError(res, error); }
});

export default router;
