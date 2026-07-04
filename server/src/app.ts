/**
 * 减脂餐管理 App - 服务端入口
 * 
 * 模块化路由设计，按功能拆分：
 * - authRoutes     登录/注册/个人资料
 * - recipeRoutes   菜谱管理 CRUD
 * - recordRoutes   做饭记录
 * - mealPlanRoutes 周菜单计划
 * - inventoryRoutes 库存管理
 * - shoppingRoutes 购物清单
 * - statsRoutes    数据统计
 * - waterRoutes    饮水记录
 * - weightRoutes   体重记录
 * - uploadRoutes   文件上传
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';

// 路由模块
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
import recordRoutes from './routes/records.js';
import mealPlanRoutes from './routes/mealPlans.js';
import inventoryRoutes from './routes/inventory.js';
import shoppingRoutes from './routes/shopping.js';
import statsRoutes from './routes/stats.js';
import waterRoutes from './routes/water.js';
import weightRoutes from './routes/weight.js';
import uploadRoutes from './routes/upload.js';
import aiRoutes from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ============ 全局中间件 ============
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件：上传的图片
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ============ 健康检查 ============
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '轻食记 API 运行中', version: '1.0.0' });
});

// ============ API 路由 ============
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// ============ 生产环境：托管前端静态文件 ============
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ============ 全局错误处理 ============
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// ============ 启动服务 ============
app.listen(config.port, () => {
  console.log(`\n🍽️  轻食记 API 已启动: http://localhost:${config.port}`);
  console.log(`📋 健康检查: http://localhost:${config.port}/api/health\n`);
});

export default app;
