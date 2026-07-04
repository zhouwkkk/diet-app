/**
 * AI 营养师对话页面
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ai } from '../services/api';
import type { AIChatResponse } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: '今天吃什么', message: '今天吃什么？给我推荐减脂餐' },
  { label: '生成一周菜单', message: '帮我生成一周减脂菜单，每天不重样' },
  { label: '冰箱模式', message: '帮我看看冰箱里有什么可以做的菜' },
  { label: '减脂建议', message: '最近减脂停滞了怎么办？给我一些建议' },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi~ 我是你的AI营养师! 我可以帮你:\n- 推荐今天吃什么\n- 智能生成一周菜单\n- 冰箱模式(根据现有食材推荐)\n- 分析营养摄入\n- 提供减脂建议\n- 教你怎么做菜\n\n直接告诉我你的需求吧!',
      timestamp: new Date(),
      data: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await ai.chat(text.trim());
      const data: AIChatResponse = res.data.data;
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, data: data.data, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI 暂不可用');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    try {
      await ai.clearHistory();
      setMessages([{ id: 'welcome', role: 'assistant', content: '对话已清除，有什么可以帮你的？', timestamp: new Date(), data: null }]);
      toast.success('已清除');
    } catch { toast.error('清除失败'); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const renderLine = (line: string, i: number, isLast: boolean) => {
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[•\-]\s?/, '<span class="text-primary-500">•</span> ');
    return <div key={i} className={isLast ? '' : 'mb-1'} dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-primary-500 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800 text-sm">AI 营养师</h1>
              <p className="text-xs text-gray-400">智能减脂饮食助手</p>
            </div>
          </div>
          <button onClick={handleClear} className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50" title="清除对话">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-2xl rounded-br-md px-4 py-2.5'
                : 'bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {msg.content.split('\n').map((line, i, arr) => renderLine(line, i, i === arr.length - 1))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
              {/* Data Cards */}
              {msg.data?.type === 'recommendation' && (
                <div className="mt-3 space-y-2">
                  {msg.data.result.recommendations?.map((r: any, i: number) => (
                    <div key={r.id} className="bg-white/60 rounded-xl p-3 border border-green-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm">
                          {i === 0 && '1st '}{i === 1 && '2nd '}{i === 2 && '3rd '}{r.name}
                        </span>
                        <span className="text-xs text-green-600 font-medium">{r.calories} kcal</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>P {r.protein}g</span><span>C {r.carbs}g</span><span>F {r.fat}g</span><span>{r.cookTime}min</span>
                      </div>
                      {r.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {r.tags.map((tag: string) => (
                            <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {msg.data?.type === 'weekly_plan' && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500 mb-1">
                    每日目标 {msg.data.result.dailyTarget} kcal | 周均 {msg.data.result.weeklyTotals.avgCalories} kcal
                  </div>
                  {msg.data.result.days?.map((day: any) => (
                    <div key={day.date} className="bg-white/60 rounded-lg p-2 border border-gray-100">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-xs text-gray-700">{day.dayLabel}</span>
                        <span className="text-xs text-primary-600">{day.dayCalories}kcal P{day.dayProtein}g</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="bg-amber-50 rounded p-1 text-center">
                          <span className="text-amber-600">早</span>
                          <div className="text-gray-700 truncate">{day.breakfast?.name || '-'}</div>
                        </div>
                        <div className="bg-orange-50 rounded p-1 text-center">
                          <span className="text-orange-600">午</span>
                          <div className="text-gray-700 truncate">{day.lunch?.name || '-'}</div>
                        </div>
                        <div className="bg-indigo-50 rounded p-1 text-center">
                          <span className="text-indigo-600">晚</span>
                          <div className="text-gray-700 truncate">{day.dinner?.name || '-'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {msg.data?.type === 'fridge' && msg.data.result && !msg.data.result.error && (
                <div className="mt-3 space-y-2">
                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-100 text-xs text-amber-700">
                    已有 {msg.data.result.ingredients?.length || 0} 种食材
                    {msg.data.result.analysis?.suggestions?.map((s: string, i: number) => (
                      <div key={i} className="mt-1">{s}</div>
                    ))}
                  </div>
                  {msg.data.result.recommendations?.map((r: any, i: number) => (
                    <div key={r.id} className="bg-white/60 rounded-lg p-2.5 border border-green-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm text-gray-800">{i === 0 && 'Star '}{r.name}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">match {r.matchRate}%</span>
                      </div>
                      <div className="text-xs text-gray-500">{r.calories} kcal | {r.cookTime}min</div>
                      {r.matchedIngredients?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {r.matchedIngredients.map((ing: string, j: number) => (
                            <span key={j} className="text-xs bg-green-50 text-green-600 px-1 py-0.5 rounded">OK {ing}</span>
                          ))}
                        </div>
                      )}
                      {r.missingIngredients?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {r.missingIngredients.map((ing: string, j: number) => (
                            <span key={j} className="text-xs bg-red-50 text-red-400 px-1 py-0.5 rounded">missing {ing}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-400">AI thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2 max-w-lg mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.message)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，如：今天吃什么..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
