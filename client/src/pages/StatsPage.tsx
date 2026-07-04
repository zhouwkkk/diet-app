/**
 * 数据统计页面
 */
import { useEffect, useState } from 'react';
import { stats as statsApi } from '../services/api';
import type { StatsOverview } from '../types';
import { Flame, TrendingUp, Award, Zap, Beef, Wheat, Fish } from 'lucide-react';

export default function StatsPage() {
  const [data, setData] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.overview()
      .then(res => setData(res.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content text-center py-16 text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>暂无数据</p>
        <p className="text-xs mt-1">开始做饭后就能看到统计了</p>
      </div>
    );
  }

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const calorieData = data.weekDailyCalories || {};
  const maxCal = Math.max(...Object.values(calorieData), 500);

  return (
    <div className="page-content">
      <h1 className="text-xl font-bold mb-4">数据统计</h1>

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp size={16} className="text-primary-500" />
            <span className="text-xs text-gray-400">累计做饭</span>
          </div>
          <span className="text-2xl font-bold text-gray-800">{data.totalCookCount}</span>
          <span className="text-xs text-gray-400 ml-1">次</span>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={16} className="text-amber-500" />
            <span className="text-xs text-gray-400">连续做饭</span>
          </div>
          <span className="text-2xl font-bold text-amber-500">{data.streak}</span>
          <span className="text-xs text-gray-400 ml-1">天</span>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1.5">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs text-gray-400">今日热量</span>
          </div>
          <span className="text-2xl font-bold text-orange-500">{data.today.calories}</span>
          <span className="text-xs text-gray-400 ml-1">kcal</span>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1.5">
            <Award size={16} className="text-purple-500" />
            <span className="text-xs text-gray-400">本周总热量</span>
          </div>
          <span className="text-2xl font-bold text-purple-500">{data.weekTotalCalories}</span>
          <span className="text-xs text-gray-400 ml-1">kcal</span>
        </div>
      </div>

      {/* 本周每日热量柱状图 */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm mb-3">本周每日热量</h3>
        <div className="flex items-end justify-between h-32 gap-1">
          {weekDays.map((day, i) => {
            const key = Object.keys(calorieData).find(k => {
              const d = new Date(k);
              return d.getDay() === (i === 6 ? 0 : i + 1) || 
                (i === 6 && d.getDay() === 0) || 
                (i === 0 && d.getDay() === 1);
            }) || Object.keys(calorieData)[i] || '';
            const val = calorieData[key] || 0;
            const height = maxCal > 0 ? (val / maxCal) * 100 : 0;
            return (
              <div key={day} className="flex-1 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">{val || '-'}</span>
                <div
                  className="w-full bg-primary-300 rounded-t-md transition-all"
                  style={{ height: `${Math.max(height, 2)}%`, minHeight: 4 }}
                />
                <span className="text-xs text-gray-400 mt-1">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 今日营养素比例 */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm mb-3">今日营养素</h3>
        <div className="flex gap-3">
          <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
            <Beef size={16} className="mx-auto text-red-400 mb-1" />
            <div className="font-bold text-lg">{data.today.protein}g</div>
            <div className="text-xs text-gray-400">蛋白质</div>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <Wheat size={16} className="mx-auto text-amber-400 mb-1" />
            <div className="font-bold text-lg">{data.today.carbs}g</div>
            <div className="text-xs text-gray-400">碳水</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
            <Fish size={16} className="mx-auto text-blue-400 mb-1" />
            <div className="font-bold text-lg">{data.today.fat}g</div>
            <div className="text-xs text-gray-400">脂肪</div>
          </div>
        </div>
      </div>

      {/* 最常做的菜 */}
      {data.topRecipes?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm mb-3">最常做 TOP {data.topRecipes.length}</h3>
          <div className="space-y-2">
            {data.topRecipes.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                }`}>{i + 1}</span>
                <span className="text-lg">{r.emoji || '🍽️'}</span>
                <span className="flex-1 text-sm font-medium">{r.name}</span>
                <span className="text-xs text-gray-400">{r.count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
