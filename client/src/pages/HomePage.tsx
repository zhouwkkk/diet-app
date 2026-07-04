/**
 * 首页仪表盘
 * 显示今日饮食概览、目标、快捷入口
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { records, water, stats } from '../services/api';
import type { TodayRecords, StatsOverview, WaterData } from '../types';
import { today, getDayOfWeek } from '../utils/date';
import { Flame, Droplets, Beef, Wheat, Fish, Plus, Zap, TrendingUp, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayData, setTodayData] = useState<TodayRecords | null>(null);
  const [waterData, setWaterData] = useState<WaterData | null>(null);
  const [statsData, setStatsData] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [todayRes, waterRes, statsRes] = await Promise.all([
        records.today(),
        water.today().catch(() => ({ data: { data: null } })),
        stats.overview().catch(() => ({ data: { data: null } })),
      ]);
      setTodayData(todayRes.data?.data);
      setWaterData(waterRes.data?.data);
      setStatsData(statsRes.data?.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const dailyTarget = profile?.dailyCalories || 2000;
  const progress = todayData ? Math.round((todayData.totalCalories / dailyTarget) * 100) : 0;

  // 快捷入口
  const quickActions = [
    { label: '今天吃什么', icon: ChefHat, path: '/plan', color: 'bg-primary-500' },
    { label: '一周菜单', icon: Calendar, path: '/plan', color: 'bg-blue-500' },
    { label: '我的菜谱', icon: Book, path: '/recipes', color: 'bg-orange-500' },
    { label: '做饭记录', icon: Plus, path: '/records', color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">早上好, {user?.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {today()} {getDayOfWeek(today())}
            </p>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            {user?.name?.[0]}
          </button>
        </div>
      </div>

      {/* 今日目标卡片 */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-100 text-sm">今日减脂目标</span>
          <span className="text-primary-100 text-sm">{dailyTarget} kcal</span>
        </div>
        <div className="flex items-end gap-6 mb-4">
          <div>
            <span className="text-4xl font-bold">{todayData?.totalCalories || 0}</span>
            <span className="text-primary-100 text-sm ml-1">/ {dailyTarget} 已摄入</span>
          </div>
          <div className="pb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              progress <= 100 ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
            }`}>
              {progress}%
            </span>
          </div>
        </div>
        {/* 进度条 */}
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {/* 三大营养素 */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-primary-100 text-xs mb-1">
              <Beef size={12} /> 蛋白质
            </div>
            <div className="font-bold text-lg">{todayData?.totalProtein || 0}g</div>
            <div className="text-xs text-primary-200">目标 {profile?.dailyProtein || '-'}g</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-primary-100 text-xs mb-1">
              <Wheat size={12} /> 碳水
            </div>
            <div className="font-bold text-lg">{todayData?.totalCarbs || 0}g</div>
            <div className="text-xs text-primary-200">目标 {profile?.dailyCarbs || '-'}g</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-primary-100 text-xs mb-1">
              <Fish size={12} /> 脂肪
            </div>
            <div className="font-bold text-lg">{todayData?.totalFat || 0}g</div>
            <div className="text-xs text-primary-200">目标 {profile?.dailyFat || '-'}g</div>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {quickActions.map((action, i) => (
          <button key={i} onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1.5">
            <div className={`${action.color} w-12 h-12 rounded-2xl flex items-center justify-center shadow-md`}>
              <action.icon size={22} className="text-white" />
            </div>
            <span className="text-xs text-gray-600">{action.label}</span>
          </button>
        ))}
      </div>

      {/* 今日三餐 */}
      <div className="card mb-4">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <UtensilsIcon size={18} className="text-primary-500" />
          今日三餐
        </h2>
        <div className="space-y-2.5">
          {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
            const record = todayData?.meals?.[mealType];
            const labels = { breakfast: '🥐 早餐', lunch: '🍱 午餐', dinner: '🥗 晚餐' };
            return (
              <div key={mealType} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{labels[mealType]}</span>
                <span className="text-sm text-gray-400">—</span>
                {record ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{record.recipe.name}</span>
                    <span className="text-xs text-gray-400">{record.recipe.calories}kcal</span>
                  </div>
                ) : (
                  <button onClick={() => navigate('/records')}
                    className="text-xs text-primary-500 font-medium">
                    去记录
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 饮水 */}
      {waterData && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Droplets size={18} className="text-blue-500" />
              饮水量
            </h2>
            <span className="text-sm text-gray-400">{waterData.totalMl}/{waterData.target}ml</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(waterData.progress, 100)}%` }} />
          </div>
          <div className="flex gap-2 mt-3">
            {[200, 300, 500].map(ml => (
              <button key={ml}
                onClick={async () => {
                  await water.add(ml);
                  toast.success(`+${ml}ml`);
                  loadData();
                }}
                className="flex-1 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full active:bg-blue-100">
                +{ml}ml
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 连续打卡 */}
      {statsData && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <span className="text-sm text-gray-600">连续做饭</span>
            </div>
            <span className="text-lg font-bold text-amber-500">{statsData.streak} 天</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              <span className="text-sm text-gray-600">累计做饭</span>
            </div>
            <span className="text-lg font-bold text-green-500">{statsData.totalCookCount} 次</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 内部图标组件
function UtensilsIcon({ size, className }: any) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </svg>;
}

function Calendar({ size, className }: any) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>;
}

function Book({ size, className }: any) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>;
}
