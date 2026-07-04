/**
 * 个人资料 & 减脂目标设置
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../types';
import { auth } from '../services/api';
import { LogOut, Save, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gender: 'female' as string,
    age: 25,
    height: 165,
    currentWeight: 65,
    targetWeight: 55,
    weeklyLossGoal: 0.5,
    weeklyExercise: 3,
    activityLevel: 'light' as string,
    waterTarget: 2000,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        currentWeight: profile.currentWeight,
        targetWeight: profile.targetWeight,
        weeklyLossGoal: profile.weeklyLossGoal,
        weeklyExercise: profile.weeklyExercise,
        activityLevel: profile.activityLevel,
        waterTarget: profile.waterTarget,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await auth.updateProfile(form);
      const result = res.data?.data;
      toast.success('保存成功');
      // 显示计算结果
      toast(
        <div className="text-sm">
          <p>BMR: {result?.bmr || result?.profile?.bmr} kcal</p>
          <p>TDEE: {result?.tdee || result?.profile?.tdee} kcal</p>
          <p>建议: {result?.dailyCalories || result?.profile?.dailyCalories} kcal/天</p>
        </div>,
        { duration: 5000 }
      );
      await refreshProfile();
      setEdit(false);
    } catch { toast.error('保存失败'); }
    setSaving(false);
  };

  const activityLabels: Record<string, string> = {
    sedentary: '久坐不动',
    light: '轻度活动（散步）',
    moderate: '中度活动（运动3-5天/周）',
    active: '高度活动（运动6-7天/周）',
    very_active: '极高活动（高强度体力劳动）',
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">个人资料</h1>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="btn-ghost text-sm text-red-500 flex items-center gap-1">
          <LogOut size={16} /> 退出
        </button>
      </div>

      {/* 用户信息卡片 */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
            {user?.name?.[0]}
          </div>
          <div>
            <h2 className="font-semibold">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 减脂目标 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">减脂目标</h3>
          {!editing ? (
            <button onClick={() => setEdit(true)} className="text-sm text-primary-600">
              {profile ? '修改' : '设置'}
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
              <Save size={15} /> {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>

        {!profile && !editing ? (
          <div className="text-center py-6 text-gray-400">
            <Calculator size={32} className="mx-auto mb-2" />
            <p>还没有设置减脂目标</p>
            <button onClick={() => setEdit(true)}
              className="btn-primary mt-3 text-sm">开始设置</button>
          </div>
        ) : !editing ? (
          <div className="space-y-3 text-sm">
            <InfoRow label="性别" value={profile?.gender === 'male' ? '男' : profile?.gender === 'female' ? '女' : '其他'} />
            <InfoRow label="年龄" value={`${profile?.age} 岁`} />
            <InfoRow label="身高" value={`${profile?.height} cm`} />
            <InfoRow label="当前体重" value={`${profile?.currentWeight} kg`} />
            <InfoRow label="目标体重" value={`${profile?.targetWeight} kg`} />
            <InfoRow label="周减重目标" value={`${profile?.weeklyLossGoal} kg`} />
            <InfoRow label="BMR" value={`${profile?.bmr} kcal`} />
            <InfoRow label="TDEE" value={`${profile?.tdee} kcal`} />
            <InfoRow label="每日建议" value={`${profile?.dailyCalories} kcal`} highlight />
            <InfoRow label="蛋白质" value={`${profile?.dailyProtein}g`} />
            <InfoRow label="碳水" value={`${profile?.dailyCarbs}g`} />
            <InfoRow label="脂肪" value={`${profile?.dailyFat}g`} />
            <InfoRow label="饮水目标" value={`${profile?.waterTarget}ml`} />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">性别</label>
              <div className="flex gap-2">
                {[{ key: 'male', label: '男' }, { key: 'female', label: '女' }].map(g => (
                  <button key={g.key}
                    onClick={() => setForm(f => ({ ...f, gender: g.key }))}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      form.gender === g.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>{g.label}</button>
                ))}
              </div>
            </div>
            <FormField label="年龄" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} suffix="岁" />
            <FormField label="身高" value={form.height} onChange={v => setForm(f => ({ ...f, height: v }))} suffix="cm" />
            <FormField label="当前体重" value={form.currentWeight} onChange={v => setForm(f => ({ ...f, currentWeight: v }))} suffix="kg" type="float" />
            <FormField label="目标体重" value={form.targetWeight} onChange={v => setForm(f => ({ ...f, targetWeight: v }))} suffix="kg" type="float" />
            <FormField label="每周减重" value={form.weeklyLossGoal} onChange={v => setForm(f => ({ ...f, weeklyLossGoal: v }))} suffix="kg" type="float" step={0.1} />
            <FormField label="每周运动" value={form.weeklyExercise} onChange={v => setForm(f => ({ ...f, weeklyExercise: v }))} suffix="次" />
            <div>
              <label className="text-xs text-gray-500 mb-1 block">活动量</label>
              <select value={form.activityLevel}
                onChange={e => setForm(f => ({ ...f, activityLevel: e.target.value }))}
                className="input-field">
                {Object.entries(activityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <FormField label="饮水目标" value={form.waterTarget} onChange={v => setForm(f => ({ ...f, waterTarget: v }))} suffix="ml" step={100} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? 'text-primary-600 font-bold' : 'text-gray-800'}>{value}</span>
    </div>
  );
}

function FormField({ label, value, onChange, suffix, type = 'int', step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; type?: string; step?: number;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type="number" value={value} step={step}
          onChange={e => onChange(type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value))}
          className="input-field pr-12"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}
