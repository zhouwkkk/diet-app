/**
 * 食材库存页面
 */
import { useEffect, useState } from 'react';
import { inventory } from '../services/api';
import type { InventoryItem } from '../types';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await inventory.list({ category });
      setItems(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, [category]);

  const handleDelete = async (id: string) => {
    try { await inventory.delete(id); toast.success('已删除'); loadItems(); }
    catch { toast.error('删除失败'); }
  };

  // 即将过期的（3天内）
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 86400000);
  const expiringItems = items.filter(i => i.expiryDate && new Date(i.expiryDate) <= threeDaysLater);

  const categories = ['all', 'meat', 'vegetable', 'staple', 'dairy', 'fruit', 'seasoning', 'other'];
  const catLabels: Record<string, string> = {
    all: '全部', meat: '肉类', vegetable: '蔬菜', staple: '主食', dairy: '奶制品', fruit: '水果', seasoning: '调料', other: '其他'
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">食材库存</h1>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
          <Plus size={16} /> 添加
        </button>
      </div>

      {/* 过期提醒 */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <AlertTriangle size={16} /> 即将过期的食材
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {expiringItems.map(item => (
              <span key={item.id} className="bg-white px-2 py-1 rounded-full text-xs text-amber-700">
                {item.name} ({item.expiryDate})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 分类 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={category === c ? 'tab-active' : 'tab-inactive'}>{catLabels[c]}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🧊</div>
          <p>库存空空</p>
          <p className="text-xs mt-1">添加食材开始管理吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.quantity}{item.unit}
                  {item.expiryDate && (
                    <span className={`ml-2 ${new Date(item.expiryDate) <= threeDaysLater ? 'text-red-500' : ''}`}>
                      过期: {item.expiryDate}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-300 active:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 添加弹窗 */}
      {showAdd && <AddInventoryModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadItems(); }} />}
    </div>
  );
}

function AddInventoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('g');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = async () => {
    if (!name) { toast.error('请输入食材名称'); return; }
    try {
      await inventory.create({ name, quantity: Number(quantity), unit, expiryDate: expiryDate || undefined, category: category || undefined });
      toast.success('添加成功');
      onSaved();
    } catch { toast.error('添加失败'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full p-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-center mb-4">添加食材</h3>
        <div className="space-y-3">
          <input type="text" placeholder="食材名称" value={name}
            onChange={e => setName(e.target.value)} className="input-field" />
          <div className="flex gap-2">
            <input type="number" placeholder="数量" value={quantity}
              onChange={e => setQuantity(Number(e.target.value))} className="input-field flex-1" />
            <select value={unit} onChange={e => setUnit(e.target.value)} className="input-field w-24">
              {['g', 'kg', 'ml', '个', '棵', '袋', '盒'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <input type="date" placeholder="过期日期" value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)} className="input-field" />
          <button onClick={handleSave} className="btn-primary w-full mt-2">添加</button>
        </div>
      </div>
    </div>
  );
}
