/**
 * 数据统计路由
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { success, serverError } from '../utils/response.js';

const router = Router();

// 获取综合统计
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // 累计做饭次数
    const totalCookCount = await prisma.cookingRecord.count({ where: { userId } });

    // 今日记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = await prisma.cookingRecord.findMany({
      where: { userId, date: { gte: today, lt: tomorrow } },
      include: { recipe: { select: { calories: true, protein: true, carbs: true, fat: true } } },
    });

    const todayCalories = todayRecords.reduce((s, r) => s + r.recipe.calories, 0);
    const todayProtein = todayRecords.reduce((s, r) => s + Number(r.recipe.protein), 0);
    const todayCarbs = todayRecords.reduce((s, r) => s + Number(r.recipe.carbs), 0);
    const todayFat = todayRecords.reduce((s, r) => s + Number(r.recipe.fat), 0);

    // 本周记录
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekRecords = await prisma.cookingRecord.findMany({
      where: { userId, date: { gte: weekStart, lte: tomorrow } },
      include: { recipe: { select: { calories: true, protein: true, carbs: true, fat: true, name: true } } },
    });

    // 本周每日热量
    const dailyCalories: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      dailyCalories[d.toISOString().split('T')[0]] = 0;
    }
    weekRecords.forEach(r => {
      const dateKey = r.date.toISOString().split('T')[0];
      if (dailyCalories[dateKey] !== undefined) {
        dailyCalories[dateKey] += r.recipe.calories;
      }
    });

    // 最常做的菜
    const topRecipes = await prisma.cookingRecord.groupBy({
      by: ['recipeId'],
      where: { userId },
      _count: { recipeId: true },
      orderBy: { _count: { recipeId: 'desc' } },
      take: 10,
    });

    const recipeIds = topRecipes.map(t => t.recipeId);
    const recipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, name: true, emoji: true, calories: true, cookCount: true },
    });

    const topRecipesData = topRecipes.map(t => ({
      ...recipes.find(r => r.id === t.recipeId),
      count: t._count.recipeId,
    }));

    // 连续做饭天数
    let streak = 0;
    const checkDate = new Date(today);
    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.cookingRecord.count({
        where: { userId, date: { gte: dayStart, lt: dayEnd } },
      });
      if (count > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    return success(res, {
      totalCookCount,
      streak,
      today: { calories: todayCalories, protein: todayProtein, carbs: todayCarbs, fat: todayFat, count: todayRecords.length },
      weekDailyCalories: dailyCalories,
      topRecipes: topRecipesData,
      weekTotalCalories: weekRecords.reduce((s, r) => s + r.recipe.calories, 0),
    });
  } catch (error) { return serverError(res, error); }
});

// 体重变化
router.get('/weight', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { days = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));

    const records = await prisma.weightRecord.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    return success(res, records);
  } catch (error) { return serverError(res, error); }
});

export default router;
