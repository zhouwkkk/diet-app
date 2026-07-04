/**
 * 体重记录页面
 */
import { useEffect, useState } from 'react';
import { weight } from '../services/api';
import type { WeightRecord } from '../types';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { today } from '../utils/date';
import toast from 'react-hot-toast';

export default function WeightPage() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await weight.list(30);
      setRecords(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, []);

  const handleDelete = async (id: string) => {
    try { await weight.delete(id); loadRecords(); }
    catch { toast.error('删除失败'); }
  };

  // 计算体重变化
  const firstWeight = records[0]?.weight;
  const lastWeight = records[records.length - 1]?.weight;
  const diff = firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null;

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">体重记录</h1>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
          <Plus size={16} /> 记录
        </button>
      </div>

      {/* 趋势概览 */}
      {records.length > 1 && (
        <div className="card mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingDown size={22} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">30天变化</div>
              <div className="text-lg font-bold text-green-600">{diff} kg</div>
              <div className="text-xs text-gray-400">
                {firstWeight}kg → {lastWeight}kg
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 简易折线图 */}
      {records.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-sm mb-3">体重趋势</h3>
          <div className="flex items-end justify-between h-32 gap-0.5">
            {records.slice(-30).map((r, i) => {
              const minW = Math.min(...records.map(r => r.weight));
              const maxW = Math.max(...records.map(r => r.weight));
              const range = maxW - minW || 1;
              const height = ((r.weight - minW) / range) * 100;
              return (
                <div key={r.id} className="flex-1 flex flex-col items-center" title={`${r.date}: ${r.weight}kg`}>
                  <span className="text-[9px] text-gray-400">{r.weight}</span>
                  <div className="w-full bg-primary-400 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(height, 2)}%`, minHeight: 3 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 记录列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">⚖️</div>
          <p>还没有体重记录</p>
          <p className="text-xs mt-1">每天记录体重，跟踪减脂进度</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => (
            <div key={record.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{record.date}</div>
                <div className="text-xs text-gray-400 flex gap-3 mt-0.5">
                  {record.bodyFat && <span>体脂 {record.bodyFat}%</span>}
                  {record.waist && <span>腰围 {record.waist}cm</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">{record.weight}<span className="text-xs text-gray-400 ml-0.5">kg</span></span>
                <button onClick={() => handleDelete(record.id)}
                  className="p-1 text-gray-300 active:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 记录弹窗 */}
      {showAdd && <AddWeightModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadRecords(); }} />}
    </div>
  );
}

function AddWeightModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [weightVal, setWeightVal] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [date, setDate] = useState(today());

  const handleSave = async () => {
    if (!weightVal) { toast.error('请输入体重'); return; }
    try {
      await weight.record({
        date,
        weight: Number(weightVal),
        bodyFat: bodyFat ? Number(bodyFat) : undefined,
        waist: waist ? Number(waist) : undefined,
      });
      toast.success('记录成功');
      onSaved();
    } catch { toast.error('记录失败'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full p-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-center mb-4">记录体重</h3>
        <div className="space-y-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
          <div className="relative">
            <input type="number" placeholder="体重" value={weightVal} step="0.1"
              onChange={e => setWeightVal(e.target.value)} className="input-field pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">kg</span>
          </div>
          <div className="relative">
            <input type="number" placeholder="体脂率（可选）" value={bodyFat} step="0.1"
              onChange={e => setBodyFat(e.target.value)} className="input-field pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
          <div className="relative">
            <input type="number" placeholder="腰围（可选）" value={waist} step="0.1"
              onChange={e => setWaist(e.target.value)} className="input-field pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">cm</span>
          </div>
          <button onClick={handleSave} className="btn-primary w-full mt-2">保存</button>
        </div>
      </div>
    </div>
  );
}
