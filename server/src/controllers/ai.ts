/**
 * AI 控制器
 */
import { Request, Response } from 'express';
import { aiService } from '../services/ai.js';
import { success, fail } from '../utils/response.js';

// 内存中存储对话历史（生产环境应存数据库）
const chatHistory = new Map<string, Array<{ role: string; content: string }>>();

function getUserId(req: Request): string {
  return req.user!.userId;
}

export const aiController = {
  /** AI 对话 */
  async chat(req: Request, res: Response) {
    const userId = getUserId(req);
    const { message, clearHistory } = req.body;

    if (!message) return fail(res, '请输入消息');

    if (clearHistory) chatHistory.set(userId, []);
    if (!chatHistory.has(userId)) chatHistory.set(userId, []);

    const history = chatHistory.get(userId)!;
    history.push({ role: 'user', content: message });

    const result = await aiService.chat(userId, message, history);
    history.push({ role: 'assistant', content: result.reply });

    if (history.length > 50) chatHistory.set(userId, history.slice(-40));

    return success(res, result);
  },

  /** 智能推荐 */
  async recommend(req: Request, res: Response) {
    const { mealType } = req.body;
    const result = await aiService.recommendMeal(getUserId(req), mealType);
    return success(res, result);
  },

  /** 冰箱模式 */
  async fridge(req: Request, res: Response) {
    const { ingredients } = req.body;
    const result = await aiService.fridgeMode(getUserId(req), ingredients);
    return success(res, result);
  },

  /** AI 生成一周菜单 */
  async generatePlan(req: Request, res: Response) {
    const options = req.body || {};
    const result = await aiService.generateAIMenuPlan(getUserId(req), options);
    return success(res, result);
  },

  /** 获取对话历史 */
  async getHistory(req: Request, res: Response) {
    const history = chatHistory.get(getUserId(req)) || [];
    return success(res, history);
  },

  /** 清除对话历史 */
  async clearHistory(req: Request, res: Response) {
    chatHistory.set(getUserId(req), []);
    return success(res, null, '对话历史已清除');
  },
};
