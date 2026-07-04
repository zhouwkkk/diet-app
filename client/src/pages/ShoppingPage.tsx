/**
 * 购物清单页面
 */
import { useEffect, useState } from 'react';
import { shopping } from '../services/api';
import type { ShoppingItem } from '../types';
import { Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await shopping.list();
      setItems(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await shopping.toggle(id);
      setItems(prev => prev.map(i => i.id === id ? res.data.data : i));
    } catch { toast.error('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    try { await shopping.delete(id); loadItems(); }
    catch { toast.error('删除失败'); }
  };

  const unpurchased = items.filter(i => !i.isPurchased);
  const purchased = items.filter(i => i.isPurchased);

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">购物清单</h1>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
          <Plus size={16} /> 添加
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🛒</div>
          <p>购物清单为空</p>
          <p className="text-xs mt-1">生成一周菜单后会自动生成</p>
        </div>
      ) : (
        <>
          {unpurchased.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">待购买 ({unpurchased.length})</h3>
              <div className="space-y-2">
                {unpurchased.map(item => (
                  <div key={item.id} className="card flex items-center gap-3">
                    <button onClick={() => handleToggle(item.id)}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    </button>
                    <span className="flex-1 text-sm">{item.name}</span>
                    <span className="text-xs text-gray-400">{item.quantity}{item.unit}</span>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {purchased.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">已购买 ({purchased.length})</h3>
              <div className="space-y-2">
                {purchased.map(item => (
                  <div key={item.id} className="card flex items-center gap-3 opacity-50">
                    <button onClick={() => handleToggle(item.id)}
                      className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </button>
                    <span className="flex-1 text-sm line-through">{item.name}</span>
                    <span className="text-xs text-gray-400">{item.quantity}{item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && <AddShoppingModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadItems(); }} />}
    </div>
  );
}

function AddShoppingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('g');

  const handleSave = async () => {
    if (!name) { toast.error('请输入物品名称'); return; }
    try {
      await shopping.create({ name, quantity: Number(quantity), unit });
      toast.success('添加成功');
      onSaved();
    } catch { toast.error('添加失败'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full p-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-center mb-4">添加购物项</h3>
        <div className="space-y-3">
          <input type="text" placeholder="物品名称" value={name}
            onChange={e => setName(e.target.value)} className="input-field" />
          <div className="flex gap-2">
            <input type="number" placeholder="数量" value={quantity}
              onChange={e => setQuantity(Number(e.target.value))} className="input-field flex-1" />
            <select value={unit} onChange={e => setUnit(e.target.value)} className="input-field w-24">
              {['g', 'kg', '个', '袋', '盒', '瓶', '把'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button onClick={handleSave} className="btn-primary w-full mt-2">添加</button>
        </div>
      </div>
    </div>
  );
}
