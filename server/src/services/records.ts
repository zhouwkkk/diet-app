/**
 * 做饭记录业务逻辑
 */
import prisma from '../utils/prisma.js';

export interface RecordCreateInput {
  recipeId: string;
  date: string;
  mealType: string;
  isFinished?: boolean;
  rating?: number;
  note?: string;
}

// ============ 获取记录列表 ============
export async function getRecords(userId: string, params: {
  startDate?: string;
  endDate?: string;
  mealType?: string;
  page?: number;
  limit?: number;
}) {
  const { startDate, endDate, mealType, page = 1, limit = 20 } = params;

  const where: any = { userId };
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) };
  } else if (startDate) {
    where.date = { gte: new Date(startDate) };
  }
  if (mealType && mealType !== 'all') {
    where.mealType = mealType;
  }

  const [records, total] = await Promise.all([
    prisma.cookingRecord.findMany({
      where,
      include: { recipe: { select: { id: true, name: true, emoji: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cookingRecord.count({ where }),
  ]);

  return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ============ 获取今日记录 ============
export async function getTodayRecords(userId: string, date?: string) {
  const today = date ? new Date(date) : new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await prisma.cookingRecord.findMany({
    where: {
      userId,
      date: { gte: today, lt: tomorrow },
    },
    include: {
      recipe: {
        select: { id: true, name: true, emoji: true, calories: true, protein: true, carbs: true, fat: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // 统计今日总热量
  const totalCalories = records.reduce((sum, r) => sum + r.recipe.calories, 0);
  const totalProtein = records.reduce((sum, r) => sum + Number(r.recipe.protein), 0);
  const totalCarbs = records.reduce((sum, r) => sum + Number(r.recipe.carbs), 0);
  const totalFat = records.reduce((sum, r) => sum + Number(r.recipe.fat), 0);

  // 早餐/午餐/晚餐 完成状态
  const meals = {
    breakfast: records.find(r => r.mealType === 'breakfast') || null,
    lunch: records.find(r => r.mealType === 'lunch') || null,
    dinner: records.find(r => r.mealType === 'dinner') || null,
  };

  return { records, totalCalories, totalProtein, totalCarbs, totalFat, meals };
}

// ============ 新增做饭记录 ============
export async function createRecord(userId: string, data: RecordCreateInput) {
  const recipe = await prisma.recipe.findUnique({ where: { id: data.recipeId } });
  if (!recipe) throw new Error('菜谱不存在');

  // 创建记录
  const record = await prisma.cookingRecord.create({
    data: {
      userId,
      recipeId: data.recipeId,
      date: new Date(data.date),
      mealType: data.mealType,
      isFinished: data.isFinished ?? true,
      rating: data.rating || null,
      note: data.note || '',
    },
  });

  // 更新菜谱制作次数和最近制作时间
  await prisma.recipe.update({
    where: { id: data.recipeId },
    data: { cookCount: { increment: 1 }, lastCookedAt: new Date() },
  });

  return record;
}

// ============ 删除记录 ============
export async function deleteRecord(id: string, userId: string) {
  const record = await prisma.cookingRecord.findUnique({ where: { id } });
  if (!record) throw new Error('记录不存在');
  if (record.userId !== userId) throw new Error('无权删除');

  return prisma.cookingRecord.delete({ where: { id } });
}
