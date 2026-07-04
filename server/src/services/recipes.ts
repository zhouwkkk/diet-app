/**
 * 菜谱业务逻辑
 */
import prisma from '../utils/prisma.js';

export interface RecipeCreateInput {
  name: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  ingredients: any;
  seasonings?: any;
  instructions: string;
  cookTime: number;
  difficulty: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface RecipeQuery {
  search?: string;
  category?: string;
  tags?: string;
  difficulty?: string;
  favorite?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  userId?: string;
}

// ============ 获取系统内置菜谱 ============
export async function getSystemRecipes(category?: string) {
  const where: any = { isSystem: true };
  if (category && category !== 'all') where.category = category;

  return prisma.recipe.findMany({
    where,
    orderBy: { cookTime: 'asc' },
  });
}

// ============ 获取菜谱列表 ============
export async function getRecipes(query: RecipeQuery) {
  const { search, category, tags, difficulty, favorite, page = 1, limit = 20, sortBy, userId } = query;

  const where: any = {};

  // 搜索：菜名模糊匹配
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  // 分类筛选
  if (category && category !== 'all') {
    where.category = category;
  }

  // 标签筛选：包含任一标签（SQLite 存 JSON 字符串，用 contains）
  if (tags) {
    const tagList = tags.split(',');
    where.AND = tagList.map(t => ({ tags: { contains: t.trim() } }));
  }

  // 难度筛选
  if (difficulty && difficulty !== 'all') {
    where.difficulty = difficulty;
  }

  // 收藏筛选（仅自己的）
  if (favorite && userId) {
    where.isFavorited = true;
  }

  // 显示系统菜谱 + 自己创建的菜谱
  where.OR = [
    { isSystem: true },
    ...(userId ? [{ userId }] : []),
  ];

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy === 'calories' ? { calories: 'asc' }
        : sortBy === 'protein' ? { protein: 'desc' }
        : sortBy === 'cookTime' ? { cookTime: 'asc' }
        : sortBy === 'cookCount' ? { cookCount: 'desc' }
        : { createdAt: 'desc' },
    }),
    prisma.recipe.count({ where }),
  ]);

  return { recipes, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ============ 获取单个菜谱 ============
export async function getRecipe(id: string) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) throw new Error('菜谱不存在');
  return recipe;
}

// ============ 新增菜谱 ============
export async function createRecipe(userId: string, data: RecipeCreateInput) {
  return prisma.recipe.create({
    data: {
      userId,
      name: data.name,
      imageUrl: data.imageUrl,
      category: data.category,
      tags: JSON.stringify(data.tags),
      ingredients: JSON.stringify(data.ingredients),
      seasonings: data.seasonings ? JSON.stringify(data.seasonings) : '[]',
      instructions: data.instructions,
      cookTime: data.cookTime,
      difficulty: data.difficulty,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fiber: data.fiber || 0,
    },
  });
}

// ============ 更新菜谱 ============
export async function updateRecipe(id: string, userId: string, data: Partial<RecipeCreateInput>) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) throw new Error('菜谱不存在');
  if (recipe.userId !== userId) throw new Error('无权修改此菜谱');

  return prisma.recipe.update({ where: { id }, data });
}

// ============ 删除菜谱 ============
export async function deleteRecipe(id: string, userId: string) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) throw new Error('菜谱不存在');
  if (recipe.isSystem) throw new Error('系统菜谱不可删除');
  if (recipe.userId !== userId) throw new Error('无权删除此菜谱');

  return prisma.recipe.delete({ where: { id } });
}

// ============ 切换收藏 ============
export async function toggleFavorite(id: string, userId: string) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) throw new Error('菜谱不存在');

  // 如果是系统菜谱且用户收藏，先查找是否有用户副本
  const userCopy = await prisma.recipe.findFirst({
    where: { name: recipe.name, userId, isSystem: false },
  });

  if (userCopy) {
    return prisma.recipe.update({
      where: { id: userCopy.id },
      data: { isFavorited: !userCopy.isFavorited },
    });
  }

  // 创建用户副本并收藏
  return prisma.recipe.create({
    data: {
      userId,
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      category: recipe.category,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      seasonings: recipe.seasonings || '[]',
      instructions: recipe.instructions,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      calories: recipe.calories,
      protein: Number(recipe.protein),
      carbs: Number(recipe.carbs),
      fat: Number(recipe.fat),
      fiber: Number(recipe.fiber),
      isFavorited: true,
    },
  });
}
