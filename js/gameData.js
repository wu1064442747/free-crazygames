// 游戏分类定义
const categories = {
    action: {
        id: 'action',
        name: '动作游戏',
        icon: '<i class="fas fa-gamepad"></i>',
        keywords: ['action', 'fight', 'battle', 'run', 'jump', 'shooter']
    },
    adventure: {
        id: 'adventure',
        name: '冒险游戏',
        icon: '<i class="fas fa-compass"></i>',
        keywords: ['adventure', 'explore', 'quest', 'journey', 'story']
    },
    puzzle: {
        id: 'puzzle',
        name: '益智游戏',
        icon: '<i class="fas fa-puzzle-piece"></i>',
        keywords: ['puzzle', 'brain', 'logic', 'match', 'solve', 'think']
    },
    strategy: {
        id: 'strategy',
        name: '策略游戏',
        icon: '<i class="fas fa-chess"></i>',
        keywords: ['strategy', 'build', 'manage', 'plan', 'tower']
    },
    sports: {
        id: 'sports',
        name: '体育游戏',
        icon: '<i class="fas fa-futbol"></i>',
        keywords: ['sports', 'ball', 'race', 'soccer', 'basketball']
    },
    racing: {
        id: 'racing',
        name: '赛车游戏',
        icon: '<i class="fas fa-car"></i>',
        keywords: ['racing', 'car', 'drive', 'speed', 'vehicle']
    },
    shooting: {
        id: 'shooting',
        name: '射击游戏',
        icon: '<i class="fas fa-crosshairs"></i>',
        keywords: ['shooting', 'gun', 'sniper', 'aim', 'target']
    },
    casual: {
        id: 'casual',
        name: '休闲游戏',
        icon: '<i class="fas fa-smile"></i>',
        keywords: ['casual', 'simple', 'relax', 'easy', 'fun']
    },
    multiplayer: {
        id: 'multiplayer',
        name: '多人游戏',
        icon: '<i class="fas fa-users"></i>',
        keywords: ['multiplayer', 'cooperative', 'competitive', 'social']
    }
};

// 自动分类函数
function autoCategorizegame(game) {
    // 基于游戏标题、描述和标签进行分类
    const gameText = `${game.title} ${game.description} ${game.tags.join(' ')} ${game.subCategory || ''}`.toLowerCase();
    
    // 记录每个分类的匹配分数
    const scores = {};
    
    // 计算每个分类的匹配度
    Object.entries(categories).forEach(([categoryId, category]) => {
        // 基础分数
        let score = category.keywords.reduce((total, keyword) => {
            const regex = new RegExp(keyword, 'gi');
            const matches = (gameText.match(regex) || []).length;
            return total + matches;
        }, 0);
        
        // 额外规则
        if (game.subCategory) {
            // 子分类匹配加分
            if (category.keywords.some(keyword => game.subCategory.toLowerCase().includes(keyword))) {
                score += 2;
            }
        }
        
        // 特定类型判断
        if (categoryId === 'action' && gameText.includes('combat')) score += 1;
        if (categoryId === 'puzzle' && gameText.includes('solve')) score += 1;
        if (categoryId === 'strategy' && gameText.includes('manage')) score += 1;
        if (categoryId === 'casual' && gameText.includes('relax')) score += 1;
        
        scores[categoryId] = score;
    });
    
    // 找出匹配度最高的分类
    const bestMatch = Object.entries(scores).reduce((best, [categoryId, score]) => {
        return score > best.score ? { categoryId, score } : best;
    }, { categoryId: 'casual', score: 0 });
    
    return bestMatch.score > 0 ? bestMatch.categoryId : 'casual';
}

// 游戏数据
const gameData = [
    {
        id: 'chess',
        title: 'Chess',
        category: 'strategy',
        image: 'img/placeholder.svg',
        url: 'https://www.chess.com/play/online',
        description: '体验经典国际象棋游戏，提高你的战略思维和计划能力。支持与AI或其他玩家对战。',
        rating: 4.8,
        difficulty: 'medium',
        releaseDate: '2022-01-15',
        playCount: 120000,
        isNew: false,
        features: ['AI对战', '多人游戏', '排行榜'],
        tags: ['strategy', 'board', 'classic']
    },
    {
        id: 'angry-birds',
        title: 'Angry Birds',
        category: 'strategy',
        image: 'img/placeholder.svg',
        url: 'https://www.angrybirds.com/games/',
        description: '使用弹弓发射愤怒的小鸟，摧毁猪的堡垒。解决物理难题并收集星星。',
        rating: 4.9,
        releaseDate: '2022-02-20',
        playCount: 180000,
        isNew: false,
        features: ['物理引擎', '关卡挑战', '角色多样'],
        tags: ['strategy', 'puzzle', 'physics']
    },
    {
        id: 'subway-surfers',
        title: 'Subway Surfers',
        category: 'action',
        image: 'img/placeholder.svg',
        url: 'https://poki.com/en/g/subway-surfers',
        description: '在地铁轨道上奔跑，躲避列车和障碍物。收集金币并使用道具增加分数。',
        rating: 4.7,
        releaseDate: '2022-03-10',
        playCount: 230000,
        isNew: false,
        features: ['无尽奔跑', '角色收集', '挑战任务'],
        tags: ['action', 'endless runner', 'arcade']
    },
    {
        id: 'tetris',
        title: 'Tetris',
        category: 'puzzle',
        image: 'img/placeholder.svg',
        url: 'https://tetris.com/play-tetris',
        description: '经典方块益智游戏。旋转并移动下落的方块，创建完整的行以清除它们。',
        rating: 4.8,
        releaseDate: '2022-04-05',
        playCount: 150000,
        features: ['经典玩法', '分数系统', '难度递增'],
        tags: ['puzzle', 'classic', 'arcade']
    },
    {
        id: 'rise-up',
        title: 'Rise Up',
        category: 'action',
        image: 'img/placeholder.svg',
        url: 'https://poki.com/en/g/rise-up',
        description: '保护你的气球上升，同时防止各种障碍物击中它。测试你的反应能力和精确度。',
        rating: 4.5,
        releaseDate: '2022-05-12',
        playCount: 100000,
        isNew: true,
        features: ['简单操作', '挑战关卡', '独特美术风格'],
        tags: ['action', 'arcade', 'casual']
    },
    {
        id: 'candy-crush',
        title: 'Candy Crush',
        category: 'puzzle',
        image: 'img/placeholder.svg',
        url: 'https://king.com/game/candycrush',
        description: '经典三消游戏，交换相邻的糖果创建匹配组合。完成目标并解锁新关卡。',
        rating: 4.6,
        releaseDate: '2022-06-18',
        playCount: 280000,
        features: ['超过1000关', '特殊糖果', '助推器'],
        tags: ['puzzle', 'match3', 'casual']
    },
    {
        id: 'pac-man',
        title: 'Pac-Man',
        category: 'multiplayer',
        image: 'img/placeholder.svg',
        url: 'https://www.bandainamcoent.com/games/pac-man',
        description: '控制Pac-Man吃掉迷宫中的所有豆子，同时避开鬼怪。吃下能量豆可以暂时捕食鬼怪。',
        rating: 4.7,
        releaseDate: '2022-07-22',
        playCount: 200000,
        features: ['经典迷宫', '鬼怪AI', '高分挑战'],
        tags: ['arcade', 'classic', 'maze']
    },
    {
        id: 'neon-rider',
        title: 'Neon Rider',
        category: 'action',
        image: 'img/placeholder.svg',
        url: 'https://www.crazygames.com/game/neon-rider',
        description: '在霓虹灯闪烁的未来世界中骑摩托车，避开障碍物并完成特技动作获得分数。',
        rating: 4.6,
        releaseDate: '2022-08-09',
        playCount: 95000,
        features: ['霓虹视觉风格', '物理特技', '多种赛道'],
        tags: ['action', 'racing', 'arcade']
    },
    {
        id: 'jewel-match',
        title: 'Jewel Match',
        category: 'puzzle',
        image: 'img/placeholder.svg',
        url: 'https://www.jewelgames.com/',
        description: '配对宝石创建匹配组合，在时间限制内完成目标。多种游戏模式带来不同挑战。',
        rating: 4.7,
        releaseDate: '2022-09-14',
        playCount: 120000,
        features: ['多种宝石类型', '助推器', '关卡设计多样'],
        tags: ['puzzle', 'match3', 'casual']
    },
    {
        id: 'color-water-sort',
        title: 'Color Water Sort',
        category: 'puzzle',
        image: 'img/placeholder.svg',
        url: 'https://www.crazygames.com/game/water-sort-puzzle',
        description: '通过在瓶子之间倒水将相同颜色的水集合在一起。需要策略思考来解决难题。',
        rating: 4.7,
        releaseDate: '2022-10-20',
        playCount: 110000,
        features: ['简单规则', '大脑挑战', '无限关卡'],
        tags: ['puzzle', 'logic', 'sorting']
    },
    {
        id: 'space-shooter',
        title: 'Space Shooter',
        category: 'action',
        image: 'img/placeholder.svg',
        url: 'https://www.crazygames.com/game/space-shooter',
        description: 'Defend the galaxy in this classic space shooter. Upgrade your ship and face waves of alien enemies in epic battles.',
        rating: 4.7,
        releaseDate: '2022-11-25',
        playCount: 130000,
        features: ['Ship Upgrades', 'Boss Battles', 'Power-ups'],
        tags: ['action', 'shooting', 'space']
    }
];

// 处理未分类游戏
function validateGameCategories(games) {
    return games.map(game => {
        if (!game.category) {
            game.category = autoCategorizegame(game);
        }
        return game;
    });
}

// 游戏难度定义
const difficulties = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
};

// 将数据暴露为全局变量
window.gameData = validateGameCategories(gameData);
window.categories = categories;
window.difficulties = difficulties;
