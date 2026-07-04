/**
 * 登录/注册页
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error('请填写所有必填字段');
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('登录成功');
      } else {
        await register(email, password, name);
        toast.success('注册成功，请完善个人资料');
      }
      setTimeout(() => navigate('/', { replace: true }), 500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-500 to-primary-700 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🍽️</div>
        <h1 className="text-3xl font-bold text-white">轻食记</h1>
        <p className="text-primary-100 mt-2 text-sm">减脂餐管理，让健康变简单</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >登录</button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${!isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >注册</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text" placeholder="昵称" value={name}
              onChange={e => setName(e.target.value)}
              className="input-field" maxLength={50}
            />
          )}
          <input
            type="email" placeholder="邮箱" value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password" placeholder="密码（至少6位）" value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
          />
          <button type="submit" disabled={submitting}
            className="btn-primary w-full text-center disabled:opacity-50">
            {submitting ? '处理中...' : isLogin ? '登 录' : '注 册'}
          </button>
        </form>
      </div>

    </div>
  );
}
