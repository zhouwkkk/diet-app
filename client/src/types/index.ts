/* ========== 菜谱 ========== */
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Seasoning {
  name: string;
  amount?: string;
}

export interface Recipe {
  id: string;
  name: string;
  imageUrl?: string;
  category: MealCategory;
  tags: string[];
  ingredients: Ingredient[];
  seasonings: Seasoning[];
  instructions: string;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isFavorited: boolean;
  cookCount: number;
  lastCookedAt?: string;
  isSystem: boolean;
  emoji?: string;
  createdAt: string;
}

/* ========== 用户 ========== */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  weeklyLossGoal: number;
  weeklyExercise: number;
  activityLevel: string;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  waterTarget: number;
}

/* ========== 做饭记录 ========== */
export interface CookingRecord {
  id: string;
  date: string;
  mealType: MealCategory;
  isFinished: boolean;
  rating?: number;
  note?: string;
  createdAt: string;
  recipe: Recipe;
  recipeId: string;
  recipeName: string;
  recipeCalories: number;
  recipeEmoji: string;
}

/* ========== 周计划 ========== */
export interface DayPlan {
  id: string;
  date: string;
  dayOfWeek: number;
  breakfastId?: string;
  lunchId?: string;
  dinnerId?: string;
  isLocked: boolean;
  lockedMeals: string[];
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  weekStart: string;
  style?: string;
  isActive: boolean;
  createdAt: string;
  dayPlans: DayPlan[];
}

/* ========== 库存 ========== */
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseDate?: string;
  expiryDate?: string;
  category?: string;
}

/* ========== 购物清单 ========== */
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
}

/* ========== 体重 ========== */
export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  waist?: number;
  hip?: number;
  note?: string;
}

/* ========== 饮水 ========== */
export interface WaterData {
  records: { id: string; amountMl: number; createdAt: string }[];
  totalMl: number;
  target: number;
  progress: number;
}

/* ========== 统计 ========== */
export interface StatsOverview {
  totalCookCount: number;
  streak: number;
  today: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  };
  weekDailyCalories: Record<string, number>;
  topRecipes: { id: string; name: string; emoji?: string; calories: number; count: number }[];
  weekTotalCalories: number;
}

/* ========== 今日记录响应 ========== */
export interface TodayRecords {
  records: CookingRecord[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: {
    breakfast: CookingRecord | null;
    lunch: CookingRecord | null;
    dinner: CookingRecord | null;
  };
}

/* ========== AI ========== */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRecommendation {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cookTime: number;
  difficulty: string;
  tags: string[];
  isFavorited: boolean;
  matchReason: string;
}

export interface AIMealRecommendation {
  mealType: string;
  targetCalories: number;
  recommendations: AIRecommendation[];
}

export interface FridgeRecipe {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cookTime: number;
  difficulty: string;
  matchRate: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface FridgeAnalysis {
  ingredients: string[];
  analysis: {
    totalTypes: number;
    suggestions: string[];
  };
  recommendations: FridgeRecipe[];
}

export interface AIDayPlan {
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  breakfast: { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; cookTime: number } | null;
  lunch: { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; cookTime: number } | null;
  dinner: { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; cookTime: number } | null;
  dayCalories: number;
  dayProtein: number;
}

export interface AIWeeklyPlan {
  weekStart: string;
  style: string;
  dailyTarget: number;
  perMealTarget: { breakfast: number; lunch: number; dinner: number };
  days: AIDayPlan[];
  weeklyTotals: { avgCalories: number; avgProtein: number };
  shoppingList: string[];
}

export interface AIChatResponse {
  reply: string;
  intents: string[];
  data?: { type: string; result: any } | null;
}

/* ========== API 响应 ========== */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
