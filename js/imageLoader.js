/**
 * 游戏图片加载器
 * 用于从游戏URL抓取图片并返回
 */

// 检查是否已经有保存的图片缓存
let imageCache = loadFromLocalStorage('imageCache', {});

/**
 * 从游戏URL抓取图片
 * @param {string} gameUrl - 游戏链接
 * @param {string} gameId - 游戏ID
 * @returns {Promise<string>} - 图片URL或默认图片
 */
async function fetchGameImage(gameUrl, gameId) {
    // 如果缓存中已有图片，直接返回
    if (imageCache[gameId]) {
        return imageCache[gameId];
    }
    
    // 如果没有URL或URL无效，返回默认图片
    if (!gameUrl || !isValidUrl(gameUrl)) {
        return getDefaultImage(gameId);
    }
    
    try {
        // 这里我们模拟从URL获取图片的过程
        // 实际生产环境中，这部分应该由服务器端代码（如Node.js）处理
        // 浏览器有跨域限制，无法直接抓取其他域名的图片
        
        // 由于这里不能实际爬取，我们使用一个模拟函数
        const imageUrl = await simulateFetchImage(gameUrl, gameId);
        
        // 保存到缓存
        imageCache[gameId] = imageUrl;
        saveToLocalStorage('imageCache', imageCache);
        
        return imageUrl;
    } catch (error) {
        console.error('获取游戏图片失败:', error);
        return getDefaultImage(gameId);
    }
}

/**
 * 模拟从URL获取图片
 * 实际项目中这应该在服务器端完成
 */
function simulateFetchImage(gameUrl, gameId) {
    return new Promise((resolve) => {
        // 模拟网络延迟
        setTimeout(() => {
            // 根据gameId生成不同的随机图片
            const imageTypes = [
                'https://picsum.photos/id/', // 随机图片API
                'https://loremflickr.com/320/180/', // 另一个随机图片API
                'https://source.unsplash.com/random/320x180/?game,', // Unsplash随机游戏图片
            ];
            
            // 基于gameId选择一个固定的图片源
            const sourceIndex = parseInt(gameId, 36) % imageTypes.length;
            const imageUrl = `${imageTypes[sourceIndex]}${Math.abs(parseInt(gameId, 36) % 1000)}/320/180`;
            
            resolve(imageUrl);
        }, 200); // 200ms延迟模拟网络请求
    });
}

/**
 * 获取默认图片
 */
function getDefaultImage(gameId) {
    // 根据gameId散列值选择不同的默认图片
    const hash = Math.abs(hashCode(gameId.toString()));
    const imageIndex = hash % 5 + 1; // 生成1-5之间的数字
    return `img/placeholder.svg`;
}

/**
 * 检查URL是否有效
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 简单的字符串哈希函数
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // 转换为32位整数
    }
    return hash;
}

// 暴露到全局空间
window.fetchGameImage = fetchGameImage; 