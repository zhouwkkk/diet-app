/**
 * 全局布局 + 底部导航
 */
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, UtensilsCrossed, Calendar, ClipboardList, BarChart3, User, LogIn } from 'lucide-react';
import { useEffect } from 'react';

const tabs = [
  { path: '/', label: '首页', icon: Home },
  { path: '/recipes', label: '菜谱', icon: UtensilsCrossed },
  { path: '/plan', label: '计划', icon: Calendar },
  { path: '/records', label: '记录', icon: ClipboardList },
  { path: '/stats', label: '统计', icon: BarChart3 },
];

export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 未登录跳转
  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Outlet />
      
      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center py-2 px-3 min-w-0 transition-colors ${
                  active ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-xs mt-0.5 font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
