/**
 * App 路由配置
 * 使用 HashRouter 以支持移动端静态文件部署
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import MealPlanPage from './pages/MealPlanPage';
import RecordsPage from './pages/RecordsPage';
import StatsPage from './pages/StatsPage';
import InventoryPage from './pages/InventoryPage';
import ShoppingPage from './pages/ShoppingPage';
import WeightPage from './pages/WeightPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import AIPage from './pages/AIPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/plan" element={<MealPlanPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/weight" element={<WeightPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/ai" element={<AIPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
