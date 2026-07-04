/**
 * 一周减脂菜单页（核心功能）
 * 生成、查看、锁定、重新生成
 */
import { useEffect, useState } from 'react';
import { mealPlans, records as recordApi } from '../services/api';
import type { MealPlan, DayPlan, Recipe } from '../types';
import { Sparkles, Lock, Unlock, RefreshCw, Flame, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function MealPlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const res = await mealPlans.active();
      setPlan(res.data?.data || null);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadPlan(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await mealPlans.generate();
      setPlan(res.data?.data?.plan || res.data?.data);
      toast.success('一周菜单生成成功！');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '生成失败，请确认已有足够菜谱');
    }
    setGenerating(false);
  };

  const handleToggleLock = async (dayPlanId: string) => {
    try {
      await mealPlans.toggleLock(plan!.id, dayPlanId);
      loadPlan();
    } catch { toast.error('操作失败'); }
  };

  const handleRecordMeal = async (date: string, mealType: string, recipeId: string) => {
    try {
      await recordApi.create({ recipeId, date, mealType });
      toast.success('已记录！');
    } catch { toast.error('记录失败'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">一周菜单</h1>
        <div className="flex gap-2">
          {plan && (
            <button onClick={handleGenerate} disabled={generating}
              className="btn-ghost text-sm py-1.5 flex items-center gap-1">
              <RefreshCw size={15} /> 重新生成
            </button>
          )}
        </div>
      </div>

      {!plan ? (
        /* 空状态 */
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">还没有周计划</h3>
          <p className="text-gray-400 text-sm mb-6">
            系统会根据你的减脂目标和菜谱库，<br />自动生成一周不重样的减脂餐
          </p>
          <button onClick={handleGenerate} disabled={generating}
            className="btn-primary inline-flex items-center gap-2">
            <Sparkles size={18} />
            {generating ? '生成中...' : '生成一周菜单'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plan.dayPlans?.map((day: DayPlan, idx: number) => (
            <DayCard
              key={day.id}
              day={day}
              dayName={DAY_NAMES[idx]}
              onToggleLock={() => handleToggleLock(day.id)}
              onRecordMeal={(mealType, recipeId) => handleRecordMeal(day.date, mealType, recipeId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 单日卡片 */
function DayCard({ day, dayName, onToggleLock, onRecordMeal }: {
  day: DayPlan;
  dayName: string;
  onToggleLock: () => void;
  onRecordMeal: (mealType: string, recipeId: string) => void;
}) {
  return (
    <div className={`card ${day.isLocked ? 'ring-2 ring-primary-200' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          <span className="font-semibold text-sm">{dayName}</span>
          <span className="text-xs text-gray-400">{day.date}</span>
        </div>
        <button onClick={onToggleLock}
          className={`p-1.5 rounded-full ${day.isLocked ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}>
          {day.isLocked ? <Lock size={15} /> : <Unlock size={15} />}
        </button>
      </div>
      <div className="space-y-2">
        {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
          const recipe = day[mealType] as Recipe | undefined;
          const labels: Record<string, { emoji: string; label: string }> = {
            breakfast: { emoji: '🥐', label: '早餐' },
            lunch: { emoji: '🍱', label: '午餐' },
            dinner: { emoji: '🥗', label: '晚餐' },
          };
          return (
            <div key={mealType} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm">{labels[mealType].emoji}</span>
                <span className="text-xs text-gray-500 w-10">{labels[mealType].label}</span>
                {recipe ? (
                  <div>
                    <div className="text-sm font-medium text-gray-800">{recipe.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Flame size={10} /> {recipe.calories}kcal · {recipe.cookTime}分钟
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">未安排</span>
                )}
              </div>
              {recipe && (
                <button onClick={() => onRecordMeal(mealType, recipe.id)}
                  className="text-xs bg-primary-500 text-white px-2.5 py-1 rounded-full active:bg-primary-600">
                  吃了
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
