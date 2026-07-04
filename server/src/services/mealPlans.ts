/**
 * 周菜单计划业务逻辑
 * 核心算法：自动生成一周减脂餐，确保不重复、营养均衡
 */
import prisma from '../utils/prisma.js';

// ============ 获取计划列表 ============
export async function getPlans(userId: string) {
  return prisma.mealPlan.findMany({
    where: { userId },
    include: { dayPlans: { include: { breakfast: true, lunch: true, dinner: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// ============ 获取当前生效的周计划 ============
export async function getActivePlan(userId: string) {
  const plan = await prisma.mealPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      dayPlans: {
        include: { breakfast: true, lunch: true, dinner: true },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return plan;
}

// ============ 获取某个计划详情 ============
export async function getPlan(userId: string, planId: string) {
  const plan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    include: {
      dayPlans: {
        include: { breakfast: true, lunch: true, dinner: true },
        orderBy: { date: 'asc' },
      },
    },
  });
  if (!plan) throw new Error('计划不存在');
  return plan;
}

// ============ 生成一周菜单（核心算法） ============
export async function generatePlan(
  userId: string,
  options: {
    weekStart?: string;
    name?: string;
    style?: string;
    dailyCalories?: number;
    dailyProtein?: number;
  } = {}
) {
  // 1. 确定周一日期
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const weekStart = options.weekStart 
    ? new Date(options.weekStart) 
    : new Date(monday.setHours(0, 0, 0, 0));

  // 2. 获取用户资料和目标
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const targetCalories = options.dailyCalories || profile?.dailyCalories || 1500;
  const targetProtein = options.dailyProtein || profile?.dailyProtein || 100;

  // 3. 获取用户的所有菜谱（系统 + 自建）
  const allRecipes = await prisma.recipe.findMany({
    where: {
      OR: [{ isSystem: true }, { userId }],
    },
  });

  if (allRecipes.length < 21) {
    throw new Error(`菜谱不足：需要至少21道菜（当前${allRecipes.length}道），请先添加更多菜谱`);
  }

  // 4. 按类别分组
  const breakfasts = allRecipes.filter(r => r.category === 'breakfast');
  const lunches = allRecipes.filter(r => r.category === 'lunch');
  const dinners = allRecipes.filter(r => r.category === 'dinner');

  // 5. 获取用户最近7天做过的菜（避免短时间重复）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRecords = await prisma.cookingRecord.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    select: { recipeId: true },
  });
  const recentRecipeIds = new Set(recentRecords.map(r => r.recipeId));

  // 6. 获取收藏菜谱优先
  const favoriteRecipes = allRecipes.filter(r => r.isFavorited);

  // 7. 获取库存食材
  const inventory = await prisma.inventory.findMany({
    where: { userId, quantity: { gt: 0 } },
    select: { name: true },
  });
  const inventoryNames = new Set(inventory.map(i => i.name));

  // 8. 生成7天菜单
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const usedRecipeIds = new Set<string>();
  const usedMainIngredients = new Set<string>(); // 追踪主食材避免同一天重复

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayPlan = {
      date: dateStr,
      dayOfWeek: i + 1,
      breakfast: null as any,
      lunch: null as any,
      dinner: null as any,
    };

    // 选早餐
    dayPlan.breakfast = pickRecipe(breakfasts, usedRecipeIds, recentRecipeIds, inventoryNames, favoriteRecipes, targetCalories * 0.25);
    usedMainIngredients.add(getMainIngredient(dayPlan.breakfast));

    // 选午餐
    dayPlan.lunch = pickRecipe(lunches, usedRecipeIds, recentRecipeIds, inventoryNames, favoriteRecipes, targetCalories * 0.4);
    usedMainIngredients.add(getMainIngredient(dayPlan.lunch));

    // 选晚餐（清淡为主，不与同天主食材重复）
    const dinnerCandidates = dinners.filter(d => !usedMainIngredients.has(getMainIngredient(d)));
    const dinnerPool = dinnerCandidates.length >= 3 ? dinnerCandidates : dinners;
    dayPlan.dinner = pickRecipe(dinnerPool, usedRecipeIds, recentRecipeIds, inventoryNames, favoriteRecipes, targetCalories * 0.35);

    usedMainIngredients.clear();
    days.push(dayPlan);
  }

  // 9. 将之前的活跃计划设为非活跃
  await prisma.mealPlan.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  // 10. 创建计划
  const plan = await prisma.mealPlan.create({
    data: {
      userId,
      name: options.name || `减脂餐计划 ${weekStart.toISOString().split('T')[0]}`,
      weekStart,
      style: options.style || 'balanced',
      isActive: true,
      dayPlans: {
        create: days.map((day, idx) => ({
          date: new Date(day.date),
          dayOfWeek: idx + 1,
          breakfastId: day.breakfast?.id || null,
          lunchId: day.lunch?.id || null,
          dinnerId: day.dinner?.id || null,
        })),
      },
    },
    include: {
      dayPlans: {
        include: { breakfast: true, lunch: true, dinner: true },
        orderBy: { date: 'asc' },
      },
    },
  });

  // 11. 计算总营养素
  const summary = days.reduce((acc, day) => {
    acc.calories += (day.breakfast?.calories || 0) + (day.lunch?.calories || 0) + (day.dinner?.calories || 0);
    acc.protein += Number(day.breakfast?.protein || 0) + Number(day.lunch?.protein || 0) + Number(day.dinner?.protein || 0);
    acc.carbs += Number(day.breakfast?.carbs || 0) + Number(day.lunch?.carbs || 0) + Number(day.dinner?.carbs || 0);
    acc.fat += Number(day.breakfast?.fat || 0) + Number(day.lunch?.fat || 0) + Number(day.dinner?.fat || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    plan,
    targetCalories,
    targetProtein,
    avgDaily: {
      calories: Math.round(summary.calories / 7),
      protein: Math.round(summary.protein / 7),
      carbs: Math.round(summary.carbs / 7),
      fat: Math.round(summary.fat / 7),
    },
  };
}

// ============ 选菜算法 ============
function pickRecipe(
  recipes: any[],
  usedIds: Set<string>,
  recentIds: Set<string>,
  inventoryNames: Set<string>,
  favorites: any[],
  targetCalories: number
): any {
  if (recipes.length === 0) return null;

  // 打分：收藏+2，库存匹配+3，最近没做过+5，热量接近+2，没被选中+10
  const scored = recipes.map(r => {
    let score = 0;
    if (!usedIds.has(r.id)) score += 10;
    if (!recentIds.has(r.id)) score += 5;
    if (r.isFavorited) score += 2;

    // 库存匹配
    try {
      const ingredients = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
      if (Array.isArray(ingredients)) {
        const matchCount = ingredients.filter((ing: any) => inventoryNames.has(ing.name)).length;
        score += matchCount * 3;
      }
    } catch { /* ignore */ }

    // 热量接近度
    const calorieDiff = Math.abs(r.calories - targetCalories);
    if (calorieDiff < 50) score += 2;
    else if (calorieDiff < 100) score += 1;

    return { recipe: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 从前3名中随机选一个（增加随机性）
  const top = scored.slice(0, Math.min(3, scored.length));
  const chosen = top[Math.floor(Math.random() * top.length)];

  usedIds.add(chosen.recipe.id);
  return chosen.recipe;
}

// ============ 获取主食材关键词 ============
function getMainIngredient(recipe: any): string {
  if (!recipe) return '';
  const mainIngredients = ['鸡', '鱼', '虾', '牛肉', '猪肉', '豆腐', '鸡蛋', '牛肉'];
  for (const key of mainIngredients) {
    if (recipe.name.includes(key)) return key;
    try {
      const ingredients = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients;
      if (Array.isArray(ingredients)) {
        for (const ing of ingredients) {
          if (ing.name && ing.name.includes(key)) return key;
        }
      }
    } catch { /* ignore */ }
  }
  return recipe.name.substring(0, 2);
}

// ============ 锁定/解锁某天的餐次 ============
export async function toggleLock(userId: string, planId: string, dayPlanId: string, meals?: string[]) {
  const dayPlan = await prisma.dayPlan.findFirst({
    where: { id: dayPlanId, mealPlan: { id: planId, userId } },
  });
  if (!dayPlan) throw new Error('日计划不存在');

  return prisma.dayPlan.update({
    where: { id: dayPlanId },
    data: {
      isLocked: !dayPlan.isLocked,
      lockedMeals: JSON.stringify(meals || []),
    },
  });
}

// ============ 重新生成指定餐次 ============
export async function regenerateMeals(
  userId: string,
  planId: string,
  targets: { dayPlanId: string; meals: string[] }[]
) {
  const plan = await prisma.mealPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error('计划不存在');

  const allRecipes = await prisma.recipe.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
  });

  const results = [];
  for (const target of targets) {
    const dayPlan = await prisma.dayPlan.findFirst({
      where: { id: target.dayPlanId, mealPlanId: planId },
    });
    if (!dayPlan) continue;

    const updateData: any = {};
    for (const meal of target.meals) {
      const recipes = allRecipes.filter(r => r.category === meal);
      if (recipes.length > 0) {
        // 排除当前已选的
        const currentId = dayPlan[meal + 'Id' as keyof typeof dayPlan];
        const candidates = recipes.filter(r => r.id !== currentId);
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        updateData[meal + 'Id'] = chosen.id;
      }
    }

    if (Object.keys(updateData).length > 0) {
      const updated = await prisma.dayPlan.update({
        where: { id: target.dayPlanId },
        data: updateData,
        include: { breakfast: true, lunch: true, dinner: true },
      });
      results.push(updated);
    }
  }

  return results;
}

// ============ 删除计划 ============
export async function deletePlan(userId: string, planId: string) {
  const plan = await prisma.mealPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error('计划不存在');

  await prisma.dayPlan.deleteMany({ where: { mealPlanId: planId } });
  return prisma.mealPlan.delete({ where: { id: planId } });
}
