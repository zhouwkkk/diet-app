/**
 * 数据库种子：内置减脂菜谱数据
 * 运行: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种内置菜谱...\n');

  // 检查是否已有系统菜谱
  const existing = await prisma.recipe.count({ where: { isSystem: true } });
  if (existing > 0) {
    console.log(`  ℹ️  已有 ${existing} 道系统菜谱，跳过播种。`);
    return;
  }

  const recipes = [
    // ==================== 早餐 ====================
    {
      name: '水煮蛋 + 全麦吐司', category: 'breakfast', emoji: '🥚',
      tags: ['快手', '高蛋白'], cookTime: 10, difficulty: 'easy',
      calories: 285, protein: 18, carbs: 30, fat: 10, fiber: 4,
      ingredients: [{ name: '鸡蛋', amount: 2, unit: '个' }, { name: '全麦吐司', amount: 2, unit: '片' }],
      seasonings: [{ name: '黑胡椒', amount: '少许' }],
      instructions: '鸡蛋冷水下锅，水开后煮7分钟捞出过凉水。全麦吐司烤至微黄。搭配食用。',
      isFavorited: true,
    },
    {
      name: '燕麦牛奶粥', category: 'breakfast', emoji: '🥣',
      tags: ['快手', '高纤维'], cookTime: 5, difficulty: 'easy',
      calories: 320, protein: 14, carbs: 48, fat: 8, fiber: 6,
      ingredients: [{ name: '即食燕麦', amount: 40, unit: 'g' }, { name: '脱脂牛奶', amount: 250, unit: 'ml' }, { name: '蓝莓', amount: 50, unit: 'g' }],
      seasonings: [],
      instructions: '牛奶加热后倒入燕麦，焖3分钟。撒上蓝莓和坚果碎即可。',
    },
    {
      name: '鸡胸肉蔬菜卷饼', category: 'breakfast', emoji: '🌯',
      tags: ['高蛋白'], cookTime: 15, difficulty: 'easy',
      calories: 350, protein: 28, carbs: 35, fat: 9, fiber: 3,
      ingredients: [{ name: '全麦卷饼', amount: 1, unit: '张' }, { name: '鸡胸肉', amount: 80, unit: 'g' }, { name: '生菜', amount: 2, unit: '片' }, { name: '番茄', amount: 0.5, unit: '个' }],
      seasonings: [{ name: '低脂沙拉酱', amount: '少许' }],
      instructions: '鸡胸肉煎熟切片。卷饼加热，铺上生菜、鸡胸肉、番茄片，淋少许沙拉酱卷起。',
    },
    {
      name: '牛油果鸡蛋三明治', category: 'breakfast', emoji: '🥪',
      tags: ['健康脂肪'], cookTime: 10, difficulty: 'easy',
      calories: 380, protein: 16, carbs: 32, fat: 20, fiber: 7,
      ingredients: [{ name: '全麦面包', amount: 2, unit: '片' }, { name: '牛油果', amount: 0.5, unit: '个' }, { name: '鸡蛋', amount: 1, unit: '个' }],
      seasonings: [{ name: '黑胡椒', amount: '少许' }, { name: '盐', amount: '少许' }],
      instructions: '牛油果压泥抹在面包上。鸡蛋煎熟放在上面，撒黑胡椒和盐。',
    },
    {
      name: '酸奶水果碗', category: 'breakfast', emoji: '🍓',
      tags: ['快手', '高纤维'], cookTime: 3, difficulty: 'easy',
      calories: 260, protein: 12, carbs: 38, fat: 6, fiber: 5,
      ingredients: [{ name: '无糖酸奶', amount: 200, unit: 'g' }, { name: '草莓', amount: 80, unit: 'g' }, { name: '香蕉', amount: 0.5, unit: '根' }, { name: '奇亚籽', amount: 10, unit: 'g' }],
      seasonings: [],
      instructions: '酸奶倒入碗中，铺上切好的水果，撒奇亚籽。',
    },
    {
      name: '紫薯鸡蛋羹', category: 'breakfast', emoji: '🍠',
      tags: ['高纤维'], cookTime: 20, difficulty: 'easy',
      calories: 290, protein: 15, carbs: 42, fat: 7, fiber: 5,
      ingredients: [{ name: '紫薯', amount: 100, unit: 'g' }, { name: '鸡蛋', amount: 2, unit: '个' }],
      seasonings: [{ name: '盐', amount: '少许' }, { name: '葱花', amount: '少许' }],
      instructions: '紫薯蒸熟压泥铺碗底。鸡蛋加温水打散过筛倒入，上锅蒸10分钟，撒葱花。',
    },
    {
      name: '虾仁蔬菜烘蛋', category: 'breakfast', emoji: '🍳',
      tags: ['高蛋白'], cookTime: 12, difficulty: 'medium',
      calories: 310, protein: 25, carbs: 12, fat: 18, fiber: 2,
      ingredients: [{ name: '虾仁', amount: 80, unit: 'g' }, { name: '鸡蛋', amount: 2, unit: '个' }, { name: '菠菜', amount: 50, unit: 'g' }, { name: '小番茄', amount: 5, unit: '颗' }],
      seasonings: [{ name: '橄榄油', amount: '5ml' }, { name: '盐', amount: '少许' }],
      instructions: '虾仁煎至变色。蛋液加盐打散入锅，铺虾仁菠菜番茄，小火焖熟。',
    },
    {
      name: '南瓜小米粥', category: 'breakfast', emoji: '🎃',
      tags: ['养胃', '可预约'], cookTime: 40, difficulty: 'easy',
      calories: 250, protein: 8, carbs: 45, fat: 4, fiber: 4,
      ingredients: [{ name: '南瓜', amount: 150, unit: 'g' }, { name: '小米', amount: 50, unit: 'g' }, { name: '枸杞', amount: 10, unit: '颗' }],
      seasonings: [],
      instructions: '南瓜切块和小米加水煮至软烂，出锅前加枸杞。可电饭煲预约。',
    },
    {
      name: '金枪鱼饭团', category: 'breakfast', emoji: '🍙',
      tags: ['高蛋白', '可外带'], cookTime: 10, difficulty: 'easy',
      calories: 340, protein: 22, carbs: 40, fat: 8, fiber: 2,
      ingredients: [{ name: '糙米饭', amount: 150, unit: 'g' }, { name: '水浸金枪鱼', amount: 80, unit: 'g' }, { name: '海苔', amount: 2, unit: '片' }, { name: '黄瓜', amount: 30, unit: 'g' }],
      seasonings: [],
      instructions: '金枪鱼沥干与黄瓜丁混合。米饭铺平放馅料，捏成三角饭团，包海苔。',
    },
    {
      name: '藜麦蔬菜沙拉', category: 'breakfast', emoji: '🥗',
      tags: ['高纤维', '素食'], cookTime: 15, difficulty: 'easy',
      calories: 280, protein: 12, carbs: 35, fat: 10, fiber: 6,
      ingredients: [{ name: '藜麦', amount: 30, unit: 'g' }, { name: '混合生菜', amount: 100, unit: 'g' }, { name: '樱桃萝卜', amount: 3, unit: '颗' }],
      seasonings: [{ name: '油醋汁', amount: '少许' }],
      instructions: '藜麦煮15分钟沥干。生菜铺底，放藜麦和切片萝卜，淋油醋汁。',
    },

    // ==================== 午餐 ====================
    {
      name: '香煎鸡胸肉配杂粮饭', category: 'lunch', emoji: '🍗',
      tags: ['高蛋白', '经典'], cookTime: 25, difficulty: 'medium',
      calories: 420, protein: 35, carbs: 45, fat: 10, fiber: 5,
      ingredients: [{ name: '鸡胸肉', amount: 150, unit: 'g' }, { name: '杂粮饭', amount: 150, unit: 'g' }, { name: '西兰花', amount: 100, unit: 'g' }],
      seasonings: [{ name: '料酒', amount: '少许' }, { name: '生抽', amount: '少许' }, { name: '黑胡椒', amount: '少许' }],
      instructions: '鸡胸肉用料酒生抽腌制15分钟，少油煎至两面金黄。西兰花焯水。搭配杂粮饭。',
    },
    {
      name: '蒜蓉虾仁意面', category: 'lunch', emoji: '🍝',
      tags: ['高蛋白'], cookTime: 20, difficulty: 'medium',
      calories: 400, protein: 28, carbs: 48, fat: 10, fiber: 5,
      ingredients: [{ name: '全麦意面', amount: 70, unit: 'g' }, { name: '虾仁', amount: 120, unit: 'g' }, { name: '蒜', amount: 3, unit: '瓣' }, { name: '小番茄', amount: 8, unit: '颗' }],
      seasonings: [{ name: '橄榄油', amount: '8ml' }, { name: '罗勒叶', amount: '少许' }],
      instructions: '意面煮至8分熟。蒜末橄榄油爆香，加虾仁煎熟，放小番茄和意面翻炒，罗勒叶点缀。',
    },
    {
      name: '照烧三文鱼丼', category: 'lunch', emoji: '🐟',
      tags: ['健康脂肪', '高蛋白'], cookTime: 20, difficulty: 'medium',
      calories: 450, protein: 30, carbs: 50, fat: 14, fiber: 3,
      ingredients: [{ name: '三文鱼', amount: 120, unit: 'g' }, { name: '糙米饭', amount: 150, unit: 'g' }, { name: '毛豆', amount: 50, unit: 'g' }],
      seasonings: [{ name: '照烧汁', amount: '少许' }, { name: '海苔丝', amount: '少许' }],
      instructions: '三文鱼抹照烧汁煎至表面微焦约4分钟。饭上铺三文鱼、毛豆，撒海苔丝。',
      isFavorited: true,
    },
    {
      name: '豆腐牛肉锅', category: 'lunch', emoji: '🍲',
      tags: ['高蛋白', '暖身'], cookTime: 20, difficulty: 'easy',
      calories: 380, protein: 30, carbs: 30, fat: 16, fiber: 3,
      ingredients: [{ name: '牛里脊', amount: 100, unit: 'g' }, { name: '嫩豆腐', amount: 200, unit: 'g' }, { name: '金针菇', amount: 100, unit: 'g' }, { name: '白菜', amount: 100, unit: 'g' }],
      seasonings: [{ name: '韩式辣酱', amount: '少许' }],
      instructions: '锅中少油炒牛肉至变色，加水辣酱煮开，放豆腐金针菇白菜煮5分钟。',
    },
    {
      name: '鸡胸肉藜麦沙拉碗', category: 'lunch', emoji: '🥙',
      tags: ['高蛋白', '高纤维'], cookTime: 20, difficulty: 'easy',
      calories: 390, protein: 33, carbs: 42, fat: 10, fiber: 7,
      ingredients: [{ name: '鸡胸肉', amount: 120, unit: 'g' }, { name: '藜麦', amount: 40, unit: 'g' }, { name: '混合生菜', amount: 80, unit: 'g' }, { name: '玉米粒', amount: 50, unit: 'g' }, { name: '黄瓜', amount: 0.5, unit: '根' }],
      seasonings: [{ name: '柠檬汁', amount: '少许' }],
      instructions: '藜麦煮好、鸡胸肉煎熟切片。所有食材混合，挤柠檬汁调味。',
    },
    {
      name: '番茄牛肉烩饭', category: 'lunch', emoji: '🍛',
      tags: ['高蛋白'], cookTime: 40, difficulty: 'medium',
      calories: 440, protein: 28, carbs: 52, fat: 11, fiber: 4,
      ingredients: [{ name: '牛腱肉', amount: 100, unit: 'g' }, { name: '番茄', amount: 2, unit: '个' }, { name: '糙米饭', amount: 150, unit: 'g' }, { name: '洋葱', amount: 0.5, unit: '个' }],
      seasonings: [{ name: '番茄膏', amount: '少许' }],
      instructions: '牛肉切块焯水。番茄炒出汁，加牛肉、洋葱炖30分钟至软烂，浇在饭上。',
    },
    {
      name: '青椒鸡丁荞麦面', category: 'lunch', emoji: '🍜',
      tags: ['高蛋白', '低GI'], cookTime: 15, difficulty: 'easy',
      calories: 370, protein: 28, carbs: 45, fat: 8, fiber: 3,
      ingredients: [{ name: '鸡胸肉', amount: 120, unit: 'g' }, { name: '青椒', amount: 2, unit: '个' }, { name: '荞麦面', amount: 70, unit: 'g' }],
      seasonings: [{ name: '生抽', amount: '少许' }, { name: '蚝油', amount: '少许' }],
      instructions: '鸡胸肉切丁腌制。荞麦面煮熟过凉。少油炒鸡丁变色，加青椒翻炒，拌入荞麦面。',
    },
    {
      name: '烤蔬菜鸡腿套餐', category: 'lunch', emoji: '🍖',
      tags: ['高蛋白', '烤箱'], cookTime: 35, difficulty: 'easy',
      calories: 420, protein: 32, carbs: 38, fat: 13, fiber: 6,
      ingredients: [{ name: '去皮鸡腿', amount: 1, unit: '只' }, { name: '南瓜', amount: 100, unit: 'g' }, { name: '西葫芦', amount: 100, unit: 'g' }, { name: '红薯', amount: 100, unit: 'g' }],
      seasonings: [{ name: '迷迭香', amount: '少许' }, { name: '橄榄油', amount: '10ml' }],
      instructions: '蔬菜切块和鸡腿一起抹橄榄油、盐、迷迭香，200°C烤25分钟。',
    },
    {
      name: '低脂版麻婆豆腐饭', category: 'lunch', emoji: '🍚',
      tags: ['高蛋白', '低脂'], cookTime: 15, difficulty: 'easy',
      calories: 360, protein: 22, carbs: 48, fat: 9, fiber: 3,
      ingredients: [{ name: '嫩豆腐', amount: 200, unit: 'g' }, { name: '瘦猪肉末', amount: 60, unit: 'g' }, { name: '糙米饭', amount: 150, unit: 'g' }],
      seasonings: [{ name: '豆瓣酱', amount: '少许' }, { name: '花椒粉', amount: '少许' }],
      instructions: '少油炒肉末变色，加豆瓣酱炒香，加水放豆腐煮5分钟，勾薄芡撒花椒粉，配饭。',
    },
    {
      name: '虾仁滑蛋盖饭', category: 'lunch', emoji: '🦐',
      tags: ['高蛋白', '快手'], cookTime: 12, difficulty: 'easy',
      calories: 400, protein: 28, carbs: 48, fat: 10, fiber: 2,
      ingredients: [{ name: '虾仁', amount: 120, unit: 'g' }, { name: '鸡蛋', amount: 2, unit: '个' }, { name: '糙米饭', amount: 150, unit: 'g' }],
      seasonings: [{ name: '料酒', amount: '少许' }, { name: '盐', amount: '少许' }, { name: '葱花', amount: '少许' }],
      instructions: '虾仁用料酒腌制。蛋液加盐打散，虾仁滑入锅中，倒蛋液小火滑熟。盖饭。',
    },

    // ==================== 晚餐 ====================
    {
      name: '清蒸鲈鱼配时蔬', category: 'dinner', emoji: '🐠',
      tags: ['高蛋白', '低脂', '清蒸'], cookTime: 20, difficulty: 'medium',
      calories: 320, protein: 30, carbs: 18, fat: 14, fiber: 3,
      ingredients: [{ name: '鲈鱼', amount: 300, unit: 'g' }, { name: '姜', amount: 1, unit: '块' }, { name: '葱', amount: 2, unit: '根' }, { name: '西兰花', amount: 100, unit: 'g' }],
      seasonings: [{ name: '蒸鱼豉油', amount: '少许' }],
      instructions: '鱼身划刀放姜丝，上汽蒸8分钟，倒掉汁水，放葱丝淋热油和蒸鱼豉油。西兰花焯水配食。',
      isFavorited: true,
    },
    {
      name: '番茄菌菇汤 + 蒸红薯', category: 'dinner', emoji: '🍅',
      tags: ['低脂', '高纤维', '素食'], cookTime: 25, difficulty: 'easy',
      calories: 280, protein: 10, carbs: 48, fat: 4, fiber: 8,
      ingredients: [{ name: '番茄', amount: 2, unit: '个' }, { name: '金针菇', amount: 100, unit: 'g' }, { name: '白玉菇', amount: 50, unit: 'g' }, { name: '鸡蛋', amount: 1, unit: '个' }, { name: '红薯', amount: 150, unit: 'g' }],
      seasonings: [],
      instructions: '番茄炒出汁加水煮开，放菌菇煮5分钟，淋蛋花。红薯蒸熟搭配。',
    },
    {
      name: '香煎豆腐配凉拌黄瓜', category: 'dinner', emoji: '🫘',
      tags: ['素食', '高蛋白'], cookTime: 15, difficulty: 'easy',
      calories: 300, protein: 20, carbs: 22, fat: 14, fiber: 3,
      ingredients: [{ name: '老豆腐', amount: 200, unit: 'g' }, { name: '黄瓜', amount: 1, unit: '根' }],
      seasonings: [{ name: '蒜末', amount: '少许' }, { name: '生抽', amount: '少许' }, { name: '醋', amount: '少许' }, { name: '香油', amount: '几滴' }],
      instructions: '豆腐切片煎至两面金黄。黄瓜拍碎切段，加蒜末生抽醋香油凉拌。',
    },
    {
      name: '虾仁冬瓜汤 + 杂粮饭', category: 'dinner', emoji: '🍈',
      tags: ['低脂', '清淡'], cookTime: 15, difficulty: 'easy',
      calories: 340, protein: 22, carbs: 48, fat: 5, fiber: 3,
      ingredients: [{ name: '虾仁', amount: 100, unit: 'g' }, { name: '冬瓜', amount: 200, unit: 'g' }, { name: '杂粮饭', amount: 120, unit: 'g' }],
      seasonings: [{ name: '姜片', amount: '2片' }, { name: '香菜', amount: '少许' }],
      instructions: '冬瓜切片，水开加姜片和冬瓜煮5分钟，放虾仁煮至变红，加盐香菜。配杂粮饭。',
    },
    {
      name: '鸡胸肉蔬菜沙拉', category: 'dinner', emoji: '🥬',
      tags: ['高蛋白', '低脂'], cookTime: 15, difficulty: 'easy',
      calories: 310, protein: 30, carbs: 20, fat: 12, fiber: 5,
      ingredients: [{ name: '鸡胸肉', amount: 120, unit: 'g' }, { name: '混合生菜', amount: 100, unit: 'g' }, { name: '黄瓜', amount: 0.5, unit: '根' }, { name: '玉米粒', amount: 50, unit: 'g' }],
      seasonings: [{ name: '橄榄油', amount: '5ml' }, { name: '苹果醋', amount: '少许' }],
      instructions: '鸡胸肉煮熟撕成丝。所有食材混合，加油醋汁拌匀。',
    },
    {
      name: '西葫芦鸡蛋饼 + 味噌汤', category: 'dinner', emoji: '🥞',
      tags: ['快手', '低脂'], cookTime: 15, difficulty: 'easy',
      calories: 290, protein: 18, carbs: 28, fat: 12, fiber: 3,
      ingredients: [{ name: '西葫芦', amount: 1, unit: '根' }, { name: '鸡蛋', amount: 2, unit: '个' }, { name: '全麦粉', amount: 30, unit: 'g' }],
      seasonings: [{ name: '味噌', amount: '10g' }, { name: '海带', amount: '少许' }],
      instructions: '西葫芦擦丝加鸡蛋全麦粉拌匀，少油煎成小饼。海带煮水加味噌做汤。',
    },
    {
      name: '金针菇牛肉卷', category: 'dinner', emoji: '🥩',
      tags: ['高蛋白', '快手'], cookTime: 15, difficulty: 'medium',
      calories: 350, protein: 28, carbs: 15, fat: 18, fiber: 2,
      ingredients: [{ name: '肥牛卷', amount: 100, unit: 'g' }, { name: '金针菇', amount: 150, unit: 'g' }, { name: '生菜', amount: 50, unit: 'g' }],
      seasonings: [{ name: '生抽', amount: '少许' }, { name: '蚝油', amount: '少许' }],
      instructions: '金针菇卷入肥牛片中，少油煎至变色，加生抽蚝油调味。生菜垫底。',
    },
    {
      name: '菌菇豆腐煲', category: 'dinner', emoji: '🍄',
      tags: ['素食', '高蛋白'], cookTime: 20, difficulty: 'easy',
      calories: 260, protein: 18, carbs: 20, fat: 12, fiber: 4,
      ingredients: [{ name: '嫩豆腐', amount: 200, unit: 'g' }, { name: '香菇', amount: 3, unit: '朵' }, { name: '杏鲍菇', amount: 1, unit: '根' }, { name: '娃娃菜', amount: 1, unit: '棵' }],
      seasonings: [{ name: '生抽', amount: '少许' }, { name: '白胡椒粉', amount: '少许' }],
      instructions: '菌菇炒香加水煮开，放豆腐和娃娃菜煮8分钟，加生抽白胡椒调味。',
    },
    {
      name: '番茄鸡蛋荞麦面', category: 'dinner', emoji: '🍜',
      tags: ['快手', '低脂'], cookTime: 12, difficulty: 'easy',
      calories: 320, protein: 18, carbs: 42, fat: 9, fiber: 4,
      ingredients: [{ name: '番茄', amount: 2, unit: '个' }, { name: '鸡蛋', amount: 2, unit: '个' }, { name: '荞麦面', amount: 60, unit: 'g' }],
      seasonings: [{ name: '番茄酱', amount: '少许' }, { name: '葱花', amount: '少许' }],
      instructions: '番茄炒出汁加番茄酱和水煮开。荞麦面煮熟入碗，浇番茄汤，放煎蛋和葱花。',
    },
    {
      name: '蒜蓉蒸虾 + 蒸玉米', category: 'dinner', emoji: '🧄',
      tags: ['高蛋白', '低脂'], cookTime: 15, difficulty: 'easy',
      calories: 300, protein: 28, carbs: 32, fat: 6, fiber: 4,
      ingredients: [{ name: '大虾', amount: 200, unit: 'g' }, { name: '蒜', amount: 5, unit: '瓣' }, { name: '玉米', amount: 1, unit: '根' }],
      seasonings: [{ name: '蒸鱼豉油', amount: '少许' }, { name: '葱花', amount: '少许' }],
      instructions: '虾开背去虾线，铺蒜蓉上汽蒸5分钟。玉米同锅蒸15分钟。淋蒸鱼豉油撒葱花。',
    },
  ];

  for (const recipe of recipes) {
    const { emoji, ...rest } = recipe as any;
    await prisma.recipe.create({
      data: {
        ...rest,
        userId: null,
        isSystem: true,
        tags: JSON.stringify(rest.tags),
        ingredients: JSON.stringify(rest.ingredients),
        seasonings: rest.seasonings ? JSON.stringify(rest.seasonings) : null,
      } as any,
    });
  }

  console.log(`  ✅ 成功播种 ${recipes.length} 道系统菜谱`);
  console.log(`     - 早餐: ${recipes.filter(r => r.category === 'breakfast').length} 道`);
  console.log(`     - 午餐: ${recipes.filter(r => r.category === 'lunch').length} 道`);
  console.log(`     - 晚餐: ${recipes.filter(r => r.category === 'dinner').length} 道\n`);
}

main()
  .catch(e => {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
