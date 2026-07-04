/**
 * 菜谱库页面
 * 浏览、搜索、筛选、收藏
 */
import { useEffect, useState } from 'react';
import { recipes as recipeApi } from '../services/api';
import type { Recipe } from '../types';
import { Plus, Search, Heart, Clock, Flame, X, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const categories = [
  { key: 'all', label: '全部' },
  { key: 'breakfast', label: '🥐 早餐' },
  { key: 'lunch', label: '🍱 午餐' },
  { key: 'dinner', label: '🥗 晚餐' },
];

export default function RecipesPage() {
  const [recipeList, setRecipeList] = useState<Recipe[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRecipes = async () => {
  console.log("开始加载菜谱");
  setLoading(true);
    try {
      const res = await recipeApi.list({ category, search, limit: 50 });
      console.log(res.data);
      setRecipeList(res.data?.data?.recipes || []);
      console.log(res.data.data.recipes[0]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadRecipes(); }, [category, search]);

  const toggleFav = async (id: string) => {
    try {
      const res = await recipeApi.toggleFavorite(id);
      setRecipeList(prev => prev.map(r => r.id === id ? res.data.data : r));
      toast.success(res.data?.data?.isFavorited ? '已收藏' : '已取消');
    } catch { toast.error('操作失败'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">菜谱库</h1>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
          <Plus size={16} /> 新增
        </button>
      </div>

      {/* 搜索 */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="搜索菜谱..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* 分类 Tab */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={category === c.key ? 'tab-active' : 'tab-inactive'}>
            {c.label}
          </button>
        ))}
      </div>

      {/* 菜谱列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : recipeList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🍽️</div>
          <p>暂无菜谱</p>
          <p className="text-xs mt-1">去新增一道菜吧</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {recipeList.map(recipe => (
            <div key={recipe.id} className="card flex gap-3 cursor-pointer active:bg-gray-50"
              onClick={() => toast('查看详情（开发中）')}>
              {/* 菜谱图 */}
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
  {recipe.imageUrl || (recipe as any).emoji || "🍽️"}
</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm truncate pr-2">{recipe.name}</h3>
                  <button onClick={e => { e.stopPropagation(); toggleFav(recipe.id); }}
                    className="shrink-0">
                    <Heart size={18} className={recipe.isFavorited ? 'fill-red-400 text-red-400' : 'text-gray-300'} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-0.5"><Flame size={12} />{recipe.calories}kcal</span>
                  <span className="flex items-center gap-0.5"><Clock size={12} />{recipe.cookTime}分钟</span>
                  <span className="tag-green">{recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}</span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                 {(() => {
  const tags = typeof recipe.tags === "string"
    ? JSON.parse(recipe.tags)
    : recipe.tags || [];

  return tags.slice(0, 3).map((tag: string) => (
    <span key={tag} className="tag-blue text-xs">
      {tag}
    </span>
  ));
})()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
