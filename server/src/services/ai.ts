/**
 * AI 智能营养师 - 规则引擎
 *
 * 提供智能推荐、菜单生成、食材分析等 AI 能力。
 * V2 阶段使用规则引擎模拟 AI 行为，后续可接入 LLM API。
 */
import prisma from '../utils/prisma.js';
import { startOfWeek, addDays, format } from 'date-fns';

// ============ 辅助函数 ============

/** 将 SQLite 中 JSON 字符串字段解析为数组/对象 */
function parseRecipeField(field: any): any[] {
  if (field === null || field === undefined) return [];
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return []; }
  }
  return field;
}

/** 从菜谱中获取食材数组 */
function getRecipeIngredients(recipe: any): any[] {
  return parseRecipeField(recipe.ingredients);
}

/** 从菜谱中获取标签数组 */
function getRecipeTags(recipe: any): string[] {
  return parseRecipeField(recipe.tags).map((t: any) => String(t).toLowerCase());
}

// ============ 常量 ============

const PROTEIN_SOURCES = ['鸡胸肉', '牛肉', '虾仁', '三文鱼', '豆腐', '鸡蛋', '鸡腿肉', '龙利鱼', '瘦猪肉'];
const CARB_SOURCES = ['糙米', '燕麦', '全麦面包', '红薯', '玉米', '荞麦面', '藜麦', '紫薯', '土豆'];
const VEG_SOURCES = ['西兰花', '菠菜', '番茄', '黄瓜', '白菜', '生菜', '芹菜', '胡萝卜', '青椒', '蘑菇', '芦笋', '秋葵'];

// 用户意图关键词映射
const INTENT_KEYWORDS: Record<string, string[]> = {
  recommend_meal: ['今天吃什么', '推荐', '推荐菜', '吃什么', '推荐一下', '今天吃啥', '中午吃啥', '晚上吃啥', '早餐吃啥'],
  generate_weekly: ['生成菜单', '一周菜单', '周菜单', '本周计划', '一周计划', '每周菜单', '生成一周'],
  fridge_mode: ['冰箱', '库存', '有什么', '只有', '现有食材', '食材', '我还有'],
  nutrition_question: ['热量', '卡路里', '蛋白质', '碳水', '脂肪', '营养', '多少大卡'],
  diet_advice: ['减脂', '减肥', '瘦身', '怎么吃', '建议', '碳水循环', '断食', '平台期', '停滞'],
  recipe_cook: ['怎么做', '做法', '步骤', '烹饪', '怎么烧', '教程'],
  budget: ['预算', '省钱', '花费', '多少钱', '成本'],
  water_reminder: ['喝水', '饮水', '补水', '提醒喝水'],
  exercise: ['运动', '健身', '锻炼', '跑步', '消耗'],
  ingredient_sub: ['替代', '代替', '没有.*怎么办', '换.*食材', '替换'],
  quick_meal: ['快速', '简单', '快手', '十分钟', '省时间', '快'],
};

// 每日餐次模板回复
const MEAL_TEMPLATES = {
  breakfast: [
    '早餐推荐来一碗燕麦牛奶搭配水煮蛋，简单快手又营养！',
    '全麦面包配上牛油果和煎蛋，再来一杯黑咖啡，开启元气满满的一天～',
    '今天早餐试试红薯+酸奶+蓝莓的组合吧，碳水、蛋白质、纤维都有了！',
  ],
  lunch: [
    '午餐推荐鸡胸肉西兰花配糙米饭，高蛋白低脂肪，减脂必备！',
    '来一份三文鱼沙拉+藜麦吧，Omega-3丰富，对减脂很有帮助～',
    '牛肉炒青椒配紫薯是不错的选择，补铁又饱腹！',
  ],
  dinner: [
    '晚餐建议清淡一点，番茄豆腐汤+凉拌黄瓜就很不错！',
    '虾仁蒸蛋+白灼生菜，蛋白质充足又不会太撑～',
    '龙利鱼蒸粉丝+蒜蓉西兰花，鲜嫩好吃还不胖！',
  ],
};

const WATER_REMINDERS = [
  '💧 该喝水啦！已经喝了 {current}ml，还差 {remain}ml 达标～',
  '🥤 是时候补水了！建议再喝一杯（200ml），目标 {target}ml 哦',
  '💦 喝水提醒！充足的水分有助于新陈代谢，加速减脂！',
];

/** 计算文本中包含哪些意图 */
function detectIntent(text: string): string[] {
  const intents: string[] = [];
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (new RegExp(kw).test(text)) {
        intents.push(intent);
        break;
      }
    }
  }
  if (intents.length === 0) intents.push('recommend_meal');
  return intents;
}

/** 从文本中尝试提取餐次 */
function extractMealType(text: string): string | null {
  if (/早餐|早饭|早上/.test(text)) return 'breakfast';
  if (/午餐|午饭|中午|午饭/.test(text)) return 'lunch';
  if (/晚餐|晚饭|晚上|晚饭/.test(text)) return 'dinner';
  return null;
}

/** 从文本中提取食材名称 */
function extractIngredients(text: string): string[] {
  const allIngredients = [...PROTEIN_SOURCES, ...CARB_SOURCES, ...VEG_SOURCES, '鸡蛋', '牛奶', '酸奶', '燕麦'];
  return allIngredients.filter(ing => text.includes(ing));
}

/** 获取用户一周内做过的菜 */
async function getRecentCookedRecipes(userId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.cookingRecord.findMany({
    where: { userId, createdAt: { gte: since } },
    include: { recipe: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ============ 智能推荐引擎 ============

/** 推荐今日一餐 */
async function recommendMeal(userId: string, mealType?: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const targetCal = profile?.dailyCalories || 1500;
  const mealCal = mealType === 'breakfast' ? targetCal * 0.3 : mealType === 'lunch' ? targetCal * 0.4 : targetCal * 0.3;

  // 获取最近7天做过的菜，排除重复
  const recent = await getRecentCookedRecipes(userId, 7);
  const recentIds = recent.map(r => r.recipeId);

  // 获取库存食材
  const inventory = await prisma.inventory.findMany({ where: { userId } });
  const inventoryNames = inventory.map(i => i.name);

  // 获取收藏菜优先
  const favorites = await prisma.recipe.findMany({
    where: {
      isFavorited: true,
      ...(mealType ? { category: mealType } : {}),
    },
    take: 5,
  });

  // 按如下优先级选菜：收藏 > 库存匹配 > 热量匹配
  let candidates = [...favorites];

  if (candidates.length < 3) {
    const stockMatched = await prisma.recipe.findMany({
      where: {
        ...(mealType ? { category: mealType } : {}),
        id: { notIn: [...recentIds, ...candidates.map(c => c.id)] },
      },
      take: 10,
    });
    // 优先使用库存食材匹配的菜
    const scored = stockMatched.map(r => {
      const ingredients = getRecipeIngredients(r);
      const matchCount = ingredients.filter((ing: any) =>
        inventoryNames.some(n => ing.name?.includes(n) || n.includes(ing.name))
      ).length;
      return { ...r, _score: matchCount };
    });
    scored.sort((a, b) => b._score - a._score);
    candidates.push(...scored.filter(s => !candidates.find(c => c.id === s.id)));
  }

  // 补足：热量匹配
  if (candidates.length < 3) {
    const more = await prisma.recipe.findMany({
      where: {
        ...(mealType ? { category: mealType } : {}),
        id: { notIn: [...recentIds, ...candidates.map(c => c.id)] },
        calories: { gte: mealCal * 0.6, lte: mealCal * 1.4 },
      },
      take: 5,
    });
    candidates.push(...more);
  }

  // 去重取前3
  const unique = candidates.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i).slice(0, 3);

  return {
    mealType: mealType || '任何餐次',
    targetCalories: Math.round(mealCal),
    recommendations: unique.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      calories: r.calories,
      protein: Number(r.protein),
      carbs: Number(r.carbs),
      fat: Number(r.fat),
      cookTime: r.cookTime,
      difficulty: r.difficulty,
      tags: parseRecipeField(r.tags),
      isFavorited: r.isFavorited,
      matchReason: r.isFavorited ? '已收藏' : '热量匹配推荐',
    })),
  };
}

/** 冰箱模式：根据用户已有食材推荐菜谱 */
async function fridgeMode(userId: string, customIngredients?: string[]) {
  let ingredientNames = customIngredients || [];

  if (!customIngredients?.length) {
    const inventory = await prisma.inventory.findMany({ where: { userId } });
    ingredientNames = inventory.map(i => i.name);
  }

  if (ingredientNames.length === 0) {
    return { error: '你还没有录入食材，请先添加库存或告诉我你有什么食材～' };
  }

  // 在所有菜谱中匹配食材
  const allRecipes = await prisma.recipe.findMany({ take: 200 });
  const scored = allRecipes.map(r => {
    const ingredients = getRecipeIngredients(r);
    const totalIngs = ingredients.length || 1;
    // 计算该菜谱中，用户已有食材的数量 + 缺少的数量
    const matched: string[] = [];
    const missing: string[] = [];
    for (const ing of ingredients) {
      const found = ingredientNames.some(n => ing.name?.includes(n) || n.includes(ing.name));
      if (found) matched.push(ing.name);
      else missing.push(ing.name);
    }
    return {
      ...r,
      _matchRate: matched.length / totalIngs,
      _matched: matched,
      _missing: missing,
    };
  });

  // 按匹配率排序，优先推荐匹配率高的
  scored.sort((a, b) => b._matchRate - a._matchRate);

  const top = scored.filter(s => s._matchRate > 0).slice(0, 8);

  // 分析库存
  const analysis = {
    totalTypes: ingredientNames.length,
    suggestions: [] as string[],
  };

  // 检查库存中蛋白质、碳水、蔬菜的比例
  const hasProtein = ingredientNames.some(n => PROTEIN_SOURCES.some(p => n.includes(p)));
  const hasCarbs = ingredientNames.some(n => CARB_SOURCES.some(c => n.includes(c)));
  const hasVeg = ingredientNames.some(n => VEG_SOURCES.some(v => n.includes(v)));

  if (!hasProtein) analysis.suggestions.push('建议补充蛋白质类食材（鸡胸肉、鸡蛋、豆腐等）');
  if (!hasCarbs) analysis.suggestions.push('建议补充主食类食材（糙米、红薯、燕麦等）');
  if (!hasVeg) analysis.suggestions.push('建议补充蔬菜类食材（西兰花、菠菜、番茄等）');
  if (hasProtein && hasCarbs && hasVeg) analysis.suggestions.push('食材种类齐全，可以做一顿均衡的减脂餐！');

  return {
    ingredients: ingredientNames,
    analysis,
    recommendations: top.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      calories: r.calories,
      protein: Number(r.protein),
      carbs: Number(r.carbs),
      fat: Number(r.fat),
      cookTime: r.cookTime,
      difficulty: r.difficulty,
      matchRate: Math.round(r._matchRate * 100),
      matchedIngredients: r._matched,
      missingIngredients: r._missing,
    })),
  };
}

/** AI 智能生成一周菜单 */
async function generateAIMenuPlan(
  userId: string,
  options: {
    style?: string;
    excludeMeats?: string[];
    maxCookTime?: number;
    budget?: number;
    preferFavorites?: boolean;
    useInventory?: boolean;
  } = {}
) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const dailyCal = profile?.dailyCalories || 1500;
  const perMealTarget = { breakfast: Math.round(dailyCal * 0.25), lunch: Math.round(dailyCal * 0.4), dinner: Math.round(dailyCal * 0.35) };

  // 获取所有可用菜谱
  let allRecipes = await prisma.recipe.findMany({
    where: {
      isSystem: true,
      ...(options.maxCookTime ? { cookTime: { lte: options.maxCookTime } } : {}),
    },
  });

  // 按类别分组
  const byCategory: Record<string, typeof allRecipes> = {};
  for (const r of allRecipes) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }

  // 获取收藏菜优先
  if (options.preferFavorites) {
    const favs = await prisma.recipe.findMany({ where: { isFavorited: true } });
    for (const f of favs) {
      const cat = f.category;
      if (byCategory[cat]) {
        // 收藏菜排前面
        byCategory[cat] = [f, ...byCategory[cat].filter(r => r.id !== f.id)];
      }
    }
  }

  // 获取最近7天已安排/做过的菜，避免重复
  const recent = await getRecentCookedRecipes(userId, 14);
  const recentIds = new Set(recent.map(r => r.recipeId));

  // 生成7天
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const results: Array<{
    date: string;
    dayOfWeek: number;
    dayLabel: string;
    breakfast: any;
    lunch: any;
    dinner: any;
    dayCalories: number;
    dayProtein: number;
  }> = [];

  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const recentPicks: string[] = []; // 追踪最近选的菜，保证不连续两天重复

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    // 每餐选一个菜
    const pickRecipe = (cat: string, targetCal: number): any => {
      const candidates = (byCategory[cat] || []).filter((r: any) => {
        // 排除最近两天选过的
        if (recentPicks.slice(-8).includes(r.id)) return false;
        // 排除最近14天做过的
        if (recentIds.has(r.id)) return false;
        // 排除特定肉类
        if (options.excludeMeats?.length) {
          const tags = getRecipeTags(r);
          if (options.excludeMeats.some(m => tags.includes(m.toLowerCase()))) return false;
        }
        return true;
      });

      // 按热量匹配度排序
      const sorted = candidates
        .map((r: any) => ({ ...r, _calDiff: Math.abs(r.calories - targetCal) }))
        .sort((a: any, b: any) => a._calDiff - b._calDiff);

      // 取前3中随机选一个
      const top = sorted.slice(0, Math.min(3, sorted.length));
      const picked = top.length > 0 ? top[Math.floor(Math.random() * top.length)] : null;

      if (picked) recentPicks.push(picked.id);
      return picked;
    };

    const breakfast = pickRecipe('breakfast', perMealTarget.breakfast);
    const lunch = pickRecipe('lunch', perMealTarget.lunch);
    const dinner = pickRecipe('dinner', perMealTarget.dinner);

    results.push({
      date: dateStr,
      dayOfWeek: i + 1,
      dayLabel: dayLabels[i],
      breakfast: breakfast ? { id: breakfast.id, name: breakfast.name, calories: breakfast.calories, protein: Number(breakfast.protein), carbs: Number(breakfast.carbs), fat: Number(breakfast.fat), cookTime: breakfast.cookTime } : null,
      lunch: lunch ? { id: lunch.id, name: lunch.name, calories: lunch.calories, protein: Number(lunch.protein), carbs: Number(lunch.carbs), fat: Number(lunch.fat), cookTime: lunch.cookTime } : null,
      dinner: dinner ? { id: dinner.id, name: dinner.name, calories: dinner.calories, protein: Number(dinner.protein), carbs: Number(dinner.carbs), fat: Number(dinner.fat), cookTime: dinner.cookTime } : null,
      dayCalories: (breakfast?.calories || 0) + (lunch?.calories || 0) + (dinner?.calories || 0),
      dayProtein: Math.round((Number(breakfast?.protein) || 0) + (Number(lunch?.protein) || 0) + (Number(dinner?.protein) || 0)),
    });
  }

  // 汇总信息
  const allIngredients = new Set<string>();
  for (const day of results) {
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      if (!meal) continue;
      // 从菜谱获取食材
      const recipe = allRecipes.find(r => r.id === meal.id);
      if (recipe?.ingredients) {
        for (const ing of getRecipeIngredients(recipe)) {
          allIngredients.add(`${ing.name} ${ing.amount || ''}${ing.unit || ''}`);
        }
      }
    }
  }

  return {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    style: options.style || 'balanced',
    dailyTarget: dailyCal,
    perMealTarget,
    days: results,
    weeklyTotals: {
      avgCalories: Math.round(results.reduce((s, d) => s + d.dayCalories, 0) / 7),
      avgProtein: Math.round(results.reduce((s, d) => s + d.dayProtein, 0) / 7),
    },
    shoppingList: Array.from(allIngredients),
  };
}

/** AI 对话处理器：根据用户输入返回智能回复 */
async function processChat(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }> = []
) {
  const intents = detectIntent(message);
  const mealType = extractMealType(message);
  const extractedIngredients = extractIngredients(message);

  // 获取用户资料用于个性化回复
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const userName = (await prisma.user.findUnique({ where: { id: userId } }))?.name || '用户';

  const responses: string[] = [];
  let data: any = null;

  // 处理"冰箱模式"
  if (intents.includes('fridge_mode') && extractedIngredients.length > 0) {
    const result = await fridgeMode(userId, extractedIngredients);
    if (!('error' in result)) {
      responses.push(`🔍 根据你提供的食材（${extractedIngredients.join('、')}），我帮你找到了以下可以做的菜：`);
      data = { type: 'fridge', result };
    } else {
      responses.push((result as { error: string }).error);
    }
  }

  // 处理"推荐吃什么"
  if (intents.includes('recommend_meal')) {
    const rec = await recommendMeal(userId, mealType || undefined);
    const mealLabel = mealType ? { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }[mealType] : '今日';
    responses.push(`🍽️ 为你推荐${mealLabel}（目标约 ${rec.targetCalories} kcal）：`);
    data = { type: 'recommendation', result: rec };

    // 加入一条随机模板文案
    if (mealType && MEAL_TEMPLATES[mealType as keyof typeof MEAL_TEMPLATES]) {
      const templates = MEAL_TEMPLATES[mealType as keyof typeof MEAL_TEMPLATES];
      responses.splice(0, 0, templates[Math.floor(Math.random() * templates.length)]);
    } else {
      responses.splice(0, 0, `Hi ${userName}！让我帮你看看今天吃什么～`);
    }
  }

  // 处理"生成一周菜单"
  if (intents.includes('generate_weekly')) {
    // 解析额外约束
    const excludeMeats: string[] = [];
    if (/不吃牛肉/.test(message)) excludeMeats.push('牛肉');
    if (/不吃猪肉/.test(message)) excludeMeats.push('猪肉', '瘦猪肉');
    if (/不吃鸡肉/.test(message)) excludeMeats.push('鸡肉', '鸡胸肉', '鸡腿肉');

    const maxCookTime = /(\d+)\s*分钟/.test(message) ? parseInt(message.match(/(\d+)\s*分钟/)![1]) : undefined;
    const preferFav = /收藏|喜欢/.test(message);

    const plan = await generateAIMenuPlan(userId, {
      excludeMeats: excludeMeats.length > 0 ? excludeMeats : undefined,
      maxCookTime,
      preferFavorites: preferFav,
      useInventory: /库存|冰箱/.test(message),
    });

    responses.push(`📅 我为你生成了一周减脂菜单（每日目标 ${plan.dailyTarget} kcal）：`);
    data = { type: 'weekly_plan', result: plan };
  }

  // 处理营养问题
  if (intents.includes('nutrition_question')) {
    // 看用户在问哪个菜
    const allRecipes = await prisma.recipe.findMany();
    const matchedRecipe = allRecipes.find((r: any) => message.includes(r.name));
    if (matchedRecipe) {
      responses.push(
        `📊 **${matchedRecipe.name}** 的营养成分：\n` +
        `- 热量：${matchedRecipe.calories} kcal\n` +
        `- 蛋白质：${matchedRecipe.protein}g\n` +
        `- 碳水：${matchedRecipe.carbs}g\n` +
        `- 脂肪：${matchedRecipe.fat}g\n` +
        `- 膳食纤维：${matchedRecipe.fiber}g\n` +
        `- 烹饪时间：${matchedRecipe.cookTime}分钟\n` +
        `- 难度：${matchedRecipe.difficulty === 'easy' ? '简单 ⭐' : matchedRecipe.difficulty === 'medium' ? '中等 ⭐⭐' : '困难 ⭐⭐⭐'}`
      );
    } else {
      const todayRecs = await prisma.cookingRecord.findMany({
        where: {
          userId,
          date: new Date(),
        },
        include: { recipe: true },
      });
      if (todayRecs.length > 0) {
        const totalCal = todayRecs.reduce((s: number, r: any) => s + r.recipe.calories, 0);
        const totalProtein = todayRecs.reduce((s: number, r: any) => s + Number(r.recipe.protein), 0);
        const remain = profile ? profile.dailyCalories - totalCal : 0;
        responses.push(
          `📊 今日营养摄入：\n` +
          `- 已摄入热量：${totalCal} kcal / ${profile?.dailyCalories || '?'} kcal（剩余 ${remain} kcal）\n` +
          `- 蛋白质：${Math.round(totalProtein)}g / ${profile?.dailyProtein || '?'}g\n` +
          `- 已记录 ${todayRecs.length} 餐`
        );
      } else {
        responses.push('你还没有今天用餐记录哦～先去记录一下吧！需要我推荐今天的菜单吗？');
      }
    }
  }

  // 处理减脂建议
  if (intents.includes('diet_advice')) {
    if (/平台期|停滞/.test(message)) {
      responses.push(
        '🔬 遇到减脂平台期？试试以下策略：\n' +
        '1. **碳水循环**：连续3天低炭水（<100g），第4天恢复（~150g）\n' +
        '2. **增加蛋白质**：每日蛋白质提高到1.8-2.0g/kg体重\n' +
        '3. **改变运动模式**：尝试HIIT替代匀速有氧\n' +
        '4. **注意睡眠**：每天保证7-8小时睡眠\n' +
        '5. **重新计算TDEE**：减重后基础代谢会下降，需要重新调整热量'
      );
    } else {
      responses.push(
        `💡 ${userName}，给您的减脂建议：\n` +
        `- 每日目标热量：${profile?.dailyCalories || '请先设置资料'} kcal\n` +
        `- 蛋白质：${profile?.dailyProtein || '?'}g | 碳水：${profile?.dailyCarbs || '?'}g | 脂肪：${profile?.dailyFat || '?'}g\n` +
        `- 保持每天饮水量 ≥ ${profile?.waterTarget || 2000}ml\n` +
        `- 每周运动 ${profile?.weeklyExercise || 3} 次\n\n` +
        `需要我帮你生成本周菜单吗？回复"生成一周菜单"即可～`
      );
    }
  }

  // 处理怎么做的
  if (intents.includes('recipe_cook')) {
    const allRecipes = await prisma.recipe.findMany();
    const matchedRecipe = allRecipes.find((r: any) => message.includes(r.name));
    if (matchedRecipe) {
      responses.push(
        `👨‍🍳 **${matchedRecipe.name}** 做法：\n${matchedRecipe.instructions}\n\n⏱️ 烹饪时间：${matchedRecipe.cookTime}分钟 | 难度：${matchedRecipe.difficulty}`
      );
    } else {
      responses.push('想学哪道菜的做法呢？告诉我菜名，我来教你！');
    }
  }

  // 处理喝水提醒
  if (intents.includes('water_reminder')) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const waterRecords = await prisma.waterRecord.findMany({
      where: { userId, date: new Date(today) },
    });
    const current = waterRecords.reduce((s: number, r: any) => s + r.amountMl, 0);
    const target = profile?.waterTarget || 2000;
    const reminder = WATER_REMINDERS[Math.floor(Math.random() * WATER_REMINDERS.length)]
      .replace('{current}', String(current))
      .replace('{remain}', String(Math.max(0, target - current)))
      .replace('{target}', String(target));
    responses.push(reminder);
  }

  // 处理食材替代
  if (intents.includes('ingredient_sub')) {
    const subs: Record<string, string> = {
      '鸡胸肉': '鸡腿肉（去皮）或豆腐',
      '牛肉': '瘦猪肉或去皮鸡腿肉',
      '三文鱼': '龙利鱼或虾仁',
      '西兰花': '菜花或芦笋',
      '糙米': '藜麦或荞麦面',
      '红薯': '紫薯或土豆',
      '菠菜': '生菜或白菜',
    };
    let found = false;
    for (const [key, val] of Object.entries(subs)) {
      if (message.includes(key)) {
        responses.push(`🔄 **${key}** 可以替代为：${val}`);
        found = true;
        break;
      }
    }
    if (!found) {
      responses.push('你知道哪种食材可以用什么替代呢？告诉我具体食材名，我来帮你找替代方案！');
    }
  }

  // 默认回复
  if (responses.length === 0) {
    responses.push(
      `Hi ${userName}！我是你的AI营养师 🥗\n\n` +
      `你可以问我：\n` +
      `• "今天吃什么？" — 智能推荐\n` +
      `• "生成一周菜单" — 自动规划\n` +
      `• "我只有鸡蛋和番茄" — 冰箱模式\n` +
      `• "这个菜怎么做？" — 烹饪指导\n` +
      `• "减脂平台期怎么办？" — 专业建议\n\n` +
      `试试看吧～`
    );
  }

  return {
    reply: responses.join('\n\n'),
    intents,
    data,
  };
}

// ============ 导出 ============
export const aiService = {
  chat: processChat,
  recommendMeal,
  fridgeMode,
  generateAIMenuPlan,
  detectIntent,
};
