/**
 * 游戏站工具函数库
 */

/**
 * 创建游戏卡片HTML
 * @param {Object} game 游戏数据对象
 * @param {boolean} isFavorite 是否已收藏
 * @returns {string} 卡片HTML字符串
 */
function createGameCard(game, isFavorite = false) {
    if (!game) return '';
    
    return `
        <div class="game-card" data-id="${game.id}" tabindex="0">
            <div class="game-cover">
                <img src="img/screenshots/${game.id}.png" 
                     alt="${escapeHtml(game.title)}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='img/placeholder.svg';">
                ${game.isNew ? '<span class="badge new">新游戏</span>' : ''}
                ${game.playCount > 200000 ? '<span class="badge popular">热门</span>' : ''}
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" aria-label="${isFavorite ? '取消收藏' : '收藏'} ${escapeHtml(game.title)}">
                    <i class="fas fa-heart" aria-hidden="true"></i>
                </button>
            </div>
            <div class="game-info">
                <h3>${escapeHtml(game.title)}</h3>
                <div class="game-meta">
                    <span class="game-rating">
                        <i class="fas fa-star" aria-hidden="true"></i> ${game.rating || '4.0'}
                    </span>
                    <span>${window.categories && window.categories[game.category]?.name || game.category}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * 过滤游戏列表
 * @param {Array} games 游戏数据数组
 * @param {Object} filters 过滤条件
 * @returns {Array} 过滤后的游戏数组
 */
function filterGames(games, filters) {
    if (!games || !Array.isArray(games)) return [];
    
    return games.filter(game => {
        // 分类过滤
        if (filters.category && filters.category !== 'all' && game.category !== filters.category) {
            return false;
        }
        
        // 难度过滤
        if (filters.difficulty && game.difficulty !== filters.difficulty) {
            return false;
        }
        
        // 搜索过滤
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            return game.title.toLowerCase().includes(searchTerm) ||
                   (game.description && game.description.toLowerCase().includes(searchTerm)) ||
                   (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        }
        
        return true;
    });
}

/**
 * 排序游戏列表
 * @param {Array} games 游戏数据数组
 * @param {string} sortBy 排序方式
 * @returns {Array} 排序后的游戏数组
 */
function sortGames(games, sortBy) {
    if (!games || !Array.isArray(games)) return [];
    
    const sortedGames = [...games]; // 创建副本以避免修改原数组
    
    switch(sortBy) {
        case 'newest':
            return sortedGames.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
        case 'rating':
            return sortedGames.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'popular':
        default:
            return sortedGames.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    }
}

/**
 * 格式化数字(本地化)
 * @param {number} num 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
    if (!num) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + '百万';
    }
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + '千';
    }
    return num.toString();
}

/**
 * 格式化日期(本地化)
 * @param {string} dateString 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateString) {
    if (!dateString) return '未知';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '未知';
    
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 生成游戏描述
 * @param {Object} game 游戏数据对象
 * @returns {string} 生成的描述
 */
function generateGameDescription(game) {
    if (!game) return '';
    
    // 如果游戏已有描述，直接返回
    if (game.description) return game.description;
    
    const descriptions = {
        action: [
            `体验《${game.title}》中的激烈动作，挑战你的反应能力和技巧。`,
            `跳入《${game.title}》的刺激世界，测试你的反应速度。`,
            `在这款动作冒险游戏中挑战自我，享受游戏乐趣。`
        ],
        puzzle: [
            `用《${game.title}》训练你的大脑，一款富有挑战性的益智游戏。`,
            `在这款令人着迷的游戏中解决越来越难的谜题。`,
            `测试你的解决问题能力，享受这款上瘾的益智体验。`
        ],
        strategy: [
            `在《${game.title}》中发挥你的策略思维，建立帝国并征服对手。`,
            `制定完美的策略，在这款挑战性的游戏中取得胜利。`,
            `测试你的战略眼光，在这款深度策略游戏中成为最强者。`
        ],
        // 默认使用通用描述
        default: [
            `享受《${game.title}》带来的精彩体验。`,
            `立即开始《${game.title}》的冒险之旅。`,
            `发现《${game.title}》中的乐趣，随时随地尽情游戏。`
        ]
    };

    const categoryKey = game.category ? game.category.toLowerCase() : 'default';
    const categoryDescriptions = descriptions[categoryKey] || descriptions['default'];
    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}

/**
 * 获取游戏的推荐游戏列表
 * @param {string} gameId 当前游戏ID
 * @param {number} count 推荐数量
 * @returns {Array} 推荐游戏列表
 */
function getRecommendedGames(gameId, count = 6) {
    if (!gameId || !window.gameData) return [];
    
    const currentGame = window.gameData.find(g => g.id === gameId);
    if (!currentGame) return [];
    
    return window.gameData
        .filter(g => g.id !== gameId) // 排除当前游戏
        .filter(g => g.category === currentGame.category || // 同类游戏
                  (g.tags && currentGame.tags && // 有相同标签的游戏
                   g.tags.some(t => currentGame.tags.includes(t))))
        .sort((a, b) => b.rating - a.rating) // 按评分排序
        .slice(0, count); // 限制数量
}

/**
 * 优化图片URL(转换为WebP格式)
 * @param {string} url 原始图片URL
 * @returns {string} 优化后的URL
 */
function optimizeImageUrl(url) {
    if (!url) return '';
    
    // 检查URL是否已经是WebP格式
    if (url.toLowerCase().endsWith('.webp')) {
        return url;
    }
    
    // 将常见图片格式转换为WebP
    return url.replace(/\.(jpe?g|png|gif)$/i, '.webp');
}

/**
 * 延迟加载图片
 * @param {HTMLImageElement} imgElement 图片元素
 */
function lazyLoadImage(imgElement) {
    if (!imgElement) return;
    
    // 使用IntersectionObserver API
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        delete img.dataset.src;
                    }
                    observer.unobserve(img);
                }
            });
        });
        observer.observe(imgElement);
    } else {
        // 兼容性处理
        setTimeout(() => {
            if (imgElement.dataset.src) {
                imgElement.src = imgElement.dataset.src;
                delete imgElement.dataset.src;
            }
        }, 300);
    }
}

/**
 * 防止XSS攻击的HTML转义函数
 * @param {string} text 要转义的文本
 * @returns {string} 转义后的安全文本
 */
function escapeHtml(text) {
    if (!text) return '';
    
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 保存数据到本地存储
 * @param {string} key 存储键名
 * @param {any} data 要存储的数据
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('保存到本地存储失败:', e);
    }
}

/**
 * 从本地存储加载数据
 * @param {string} key 存储键名
 * @param {any} defaultValue 默认值
 * @returns {any} 加载的数据或默认值
 */
function loadFromLocalStorage(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('从本地存储加载失败:', e);
        return defaultValue;
    }
}

// 将所有函数挂载到 window 对象上，使其全局可用
window.createGameCard = createGameCard;
window.filterGames = filterGames;
window.sortGames = sortGames;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.generateGameDescription = generateGameDescription;
window.getRecommendedGames = getRecommendedGames;
window.optimizeImageUrl = optimizeImageUrl;
window.lazyLoadImage = lazyLoadImage;
window.escapeHtml = escapeHtml;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
