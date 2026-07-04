/**
 * 认证业务逻辑
 * 包含用户注册、登录、资料管理、热量计算
 */
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken, type JwtPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 10;

/** 计算 BMR (Mifflin-St Jeor) */
function calcBMR(gender: string, weight: number, height: number, age: number): number {
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  }
  return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

/** 活动系数 */
const activityMultiplier: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** 计算 TDEE */
function calcTDEE(bmr: number, activityLevel: string): number {
  return Math.round(bmr * (activityMultiplier[activityLevel] || 1.2));
}

/** 计算减脂热量（TDEE - 缺口） */
function calcDietCalories(tdee: number, weeklyLoss: number): number {
  // 1kg 脂肪 ≈ 7700 kcal，每天缺口 = weeklyLoss * 7700 / 7
  const dailyDeficit = Math.round((weeklyLoss * 7700) / 7);
  return Math.max(1200, tdee - dailyDeficit);
}

/** 计算三大营养素 */
function calcMacros(dailyCalories: number): { protein: number; carbs: number; fat: number } {
  const protein = Math.round((dailyCalories * 0.35) / 4); // 35% 热量来自蛋白质
  const fat = Math.round((dailyCalories * 0.25) / 9);      // 25% 脂肪
  const carbs = Math.round((dailyCalories * 0.4) / 4);      // 40% 碳水
  return { protein, carbs, fat };
}

// ============ 注册 ============

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('该邮箱已被注册');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = generateToken({ userId: user.id, email: user.email });
  return { user, token };
}

// ============ 登录 ============

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('邮箱或密码错误');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('邮箱或密码错误');
  }

  const token = generateToken({ userId: user.id, email: user.email });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}

// ============ 获取用户信息 ============

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw new Error('用户不存在');
  return user;
}

// ============ 更新 / 创建个人资料 ============

export async function upsertProfile(userId: string, data: {
  gender: string;
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  weeklyLossGoal: number;
  weeklyExercise: number;
  activityLevel: string;
  waterTarget?: number;
}) {
  const bmr = calcBMR(data.gender, data.currentWeight, data.height, data.age);
  const tdee = calcTDEE(bmr, data.activityLevel);
  const dailyCalories = calcDietCalories(tdee, data.weeklyLossGoal);
  const macros = calcMacros(dailyCalories);

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      ...data,
      bmr, tdee,
      dailyCalories,
      dailyProtein: macros.protein,
      dailyCarbs: macros.carbs,
      dailyFat: macros.fat,
    },
    create: {
      userId,
      ...data,
      bmr, tdee,
      dailyCalories,
      dailyProtein: macros.protein,
      dailyCarbs: macros.carbs,
      dailyFat: macros.fat,
    },
  });

  return { profile, bmr, tdee, dailyCalories, macros };
}

// ============ 获取个人资料 ============

export async function getProfile(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}
