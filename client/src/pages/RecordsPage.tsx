/**
 * 做饭记录页面
 * 按日/周/月查看，新增记录
 */
import { useEffect, useState } from 'react';
import { records as recordApi, recipes as recipeApi } from '../services/api';
import type { CookingRecord, Recipe } from '../types';
import { today, getDayOfWeek } from '../utils/date';
import { Plus, Trash2, Flame, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecordsPage() {
  const [recordList, setRecordList] = useState<CookingRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(today());
  const [totalCal, setTotalCal] = useState(0);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await recordApi.today(viewDate);
      const data = res.data?.data;
      setRecordList(data?.records || []);
      setTotalCal(data?.totalCalories || 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [viewDate]);

  const changeDate = (offset: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + offset);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    try {
      await recordApi.delete(id);
      toast.success('已删除');
      loadRecords();
    } catch { toast.error('删除失败'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">做饭记录</h1>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
          <Plus size={16} /> 记一笔
        </button>
      </div>

      {/* 日期切换 */}
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 mb-4 shadow-sm">
        <button onClick={() => changeDate(-1)} className="p-1 text-gray-400 active:text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold">{viewDate}</div>
          <div className="text-sm text-gray-400">{getDayOfWeek(viewDate)}</div>
        </div>
        <button onClick={() => changeDate(1)} className="p-1 text-gray-400 active:text-gray-600">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 当日热量汇总 */}
      {totalCal > 0 && (
        <div className="card mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">当日总摄入</span>
          <span className="text-lg font-bold text-primary-600 flex items-center gap-1">
            <Flame size={18} /> {totalCal} kcal
          </span>
        </div>
      )}

      {/* 记录列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : recordList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🍽️</div>
          <p>今天还没有记录</p>
          <p className="text-xs mt-1">点击右上角记一笔吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordList.map(record => (
            <div key={record.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-3xl">
                {(record as any).recipe?.emoji || record.recipeEmoji || '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{record.recipe?.name || record.recipeName}</div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-0.5"><Flame size={11} />{record.recipe?.calories || record.recipeCalories}kcal</span>
                  <span>·</span>
                  <span>{mealLabels[record.mealType] || record.mealType}</span>
                  {record.note && <span className="text-gray-300">"{record.note}"</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(record.id)}
                className="p-2 text-gray-300 active:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 新增记录弹窗 */}
      {showAdd && <AddRecordModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadRecords(); }} date={viewDate} />}
    </div>
  );
}

const mealLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };

/** 新增记录弹窗 */
function AddRecordModal({ onClose, onSaved, date }: { onClose: () => void; onSaved: () => void; date: string }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealType, setMealType] = useState<string>('lunch');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    recipeApi.list({ limit: 50 }).then(res => {
      setRecipes(res.data?.data?.recipes || []);
    });
  }, []);

  const filtered = search
    ? recipes.filter(r => r.name.includes(search))
    : recipes;

  const handleSave = async (recipeId: string) => {
    setSaving(true);
    try {
      await recordApi.create({ recipeId, date, mealType });
      toast.success('已记录');
      onSaved();
    } catch { toast.error('记录失败'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-in" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-center">记一笔</h3>
        </div>
        <div className="p-4">
          {/* 餐次选择 */}
          <div className="flex gap-2 mb-4">
            {Object.entries(mealLabels).map(([key, label]) => (
              <button key={key} onClick={() => setMealType(key)}
                className={`px-4 py-1.5 rounded-full text-sm ${mealType === key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
          
          {/* 搜索 */}
          <input type="text" placeholder="搜索菜谱..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-field mb-3" />

          {/* 菜谱列表 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map(recipe => (
              <button key={recipe.id}
                onClick={() => !saving && handleSave(recipe.id)}
                disabled={saving}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 text-left disabled:opacity-50">
                <span className="text-2xl">{(recipe as any).emoji || '🍽️'}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{recipe.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <span><Flame size={10} /> {recipe.calories}kcal</span>
                    <span><Clock size={10} /> {recipe.cookTime}分钟</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
