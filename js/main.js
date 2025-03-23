import { gameData, categories } from './gameData.js';
import { createGameCard, filterGames, sortGames, formatNumber, formatDate } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // 初始化状态
    let currentFilters = {
        category: 'all',
        difficulty: null,
        search: '',
        sort: 'popular'
    };

    // 初始化页面
    initializePage();

    // 事件监听器
    setupEventListeners();

    function initializePage() {
        // 加载分类列表
        loadCategories();
        
        // 加载游戏
        updateGameDisplay();
        
        // 加载收藏夹
        loadFavorites();
    }

    function loadCategories() {
        // 更新侧边栏分类
        const categoryList = document.querySelector('.nav-section:last-child');
        categoryList.innerHTML = '<h3>游戏分类</h3>';
        
        // 添加"全部"分类
        const allCategoryLink = document.createElement('a');
        allCategoryLink.href = '#';
        allCategoryLink.className = 'nav-item active';
        allCategoryLink.setAttribute('data-category', 'all');
        allCategoryLink.innerHTML = '<i class="fas fa-th-large"></i><span>全部游戏</span>';
        categoryList.appendChild(allCategoryLink);
        
        // 添加其他分类
        Object.entries(categories).forEach(([id, category]) => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-item';
            link.setAttribute('data-category', id);
            link.innerHTML = `${category.icon}<span>${category.name}</span>`;
            categoryList.appendChild(link);
        });

        // 更新顶部分类标签
        const categoriesBar = document.querySelector('.categories-bar');
        categoriesBar.innerHTML = `
            <a href="#" class="category-tag active" data-category="all">全部</a>
            ${Object.entries(categories)
                .map(([id, category]) => 
                    `<a href="#" class="category-tag" data-category="${id}">${category.name.replace('游戏', '')}</a>`
                ).join('')}
        `;

        // 添加分类点击事件
        document.querySelectorAll('[data-category]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.currentTarget.getAttribute('data-category');
                
                // 更新激活状态
                document.querySelectorAll('[data-category]').forEach(el => {
                    el.classList.toggle('active', el.getAttribute('data-category') === category);
                });
                
                // 更新过滤器并显示游戏
                currentFilters.category = category;
                updateGameDisplay();
            });
        });
    }

    function updateGameDisplay() {
        const gamesGrid = document.getElementById('gamesGrid');
        
        // 显示加载状态
        gamesGrid.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div><p>加载游戏中...</p></div>';
        
        // 过滤游戏
        let filteredGames = gameData;
        
        // 应用分类过滤
        if (currentFilters.category !== 'all') {
            filteredGames = filteredGames.filter(game => game.category === currentFilters.category);
        }
        
        // 应用搜索过滤
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filteredGames = filteredGames.filter(game => 
                game.title.toLowerCase().includes(searchTerm) ||
                game.description.toLowerCase().includes(searchTerm) ||
                (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        // 延迟显示以展示加载动画
        setTimeout(() => {
            renderGames(filteredGames);
        }, 300);
    }

    function setupEventListeners() {
        // 搜索
        document.getElementById('searchInput').addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            updateGameDisplay();
        });

        // 排序
        document.getElementById('sortFilter').addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            updateGameDisplay();
        });

        // 难度筛选
        document.getElementById('difficultyFilter').addEventListener('change', (e) => {
            currentFilters.difficulty = e.target.value === 'all' ? null : e.target.value;
            updateGameDisplay();
        });

        // 游戏预览功能
        setupGamePreview();
    }

    function loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        favorites.forEach(gameId => {
            const btn = document.querySelector(`.game-card[data-id="${gameId}"] .favorite-btn`);
            if (btn) btn.classList.add('active');
        });
    }

    // 游戏预览功能
    function setupGamePreview() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.play-button') && !e.target.closest('.favorite-btn')) {
                    showGamePreview(card.dataset.id);
                }
            });
        });
    }

    // 游戏预览模态框
    function showGamePreview(gameId) {
        const game = gameData.find(g => g.id === gameId);
        const modal = document.createElement('div');
        modal.className = 'game-preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <button class="close-btn">&times;</button>
                <div class="preview-header">
                    <img src="${game.image}" alt="${game.title}">
                    <div class="preview-info">
                        <h2>${game.title}</h2>
                        <div class="meta">
                            <span class="category">${game.category}</span>
                            <span class="rating">★ ${game.rating}</span>
                            <span class="difficulty">${game.difficulty}</span>
                        </div>
                    </div>
                </div>
                <div class="preview-body">
                    <p class="description">${game.description}</p>
                    <div class="features">
                        <h3>Features</h3>
                        <ul>
                            ${game.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="stats">
                        <div class="stat-item">
                            <span class="label">Players</span>
                            <span class="value">${formatNumber(game.playCount)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Released</span>
                            <span class="value">${formatDate(game.releaseDate)}</span>
                        </div>
                    </div>
                </div>
                <div class="preview-footer">
                    <a href="${game.url}" class="play-button" target="_blank">Play Now</a>
                    <button class="favorite-btn ${isFavorite(gameId) ? 'active' : ''}">
                        <i class="fas fa-heart"></i> Favorite
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 关闭按钮事件
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    // 最近玩过的游戏
    function trackRecentGames(gameId) {
        let recentGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
        recentGames = [gameId, ...recentGames.filter(id => id !== gameId)].slice(0, 10);
        localStorage.setItem('recentGames', JSON.stringify(recentGames));
        updateRecentGames();
    }

    // 游戏推荐系统
    function getRecommendedGames(gameId) {
        const currentGame = gameData.find(g => g.id === gameId);
        return gameData
            .filter(g => g.id !== gameId)
            .filter(g => g.category === currentGame.category || 
                        g.tags.some(t => currentGame.tags.includes(t)))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
    }

    // 添加游戏评分功能
    function setupRatingSystem() {
        document.querySelectorAll('.rate-game').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.target.closest('.game-card').dataset.id;
                showRatingModal(gameId);
            });
        });
    }

    // 游戏统计
    function updateGameStats(gameId) {
        const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
        if (!stats[gameId]) {
            stats[gameId] = { plays: 0, lastPlayed: null };
        }
        stats[gameId].plays++;
        stats[gameId].lastPlayed = new Date().toISOString();
        localStorage.setItem('gameStats', JSON.stringify(stats));
    }

    // 渲染游戏卡片
    function renderGames(games) {
        const gamesGrid = document.querySelector('.games-grid');
        if (!gamesGrid) return;
        
        gamesGrid.innerHTML = '';
        
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-cover">
                    <img src="${game.image}" alt="${game.title}" loading="lazy">
                    ${game.isNew ? '<span class="badge new">新游戏</span>' : ''}
                    ${game.playCount > 200000 ? '<span class="badge popular">热门</span>' : ''}
                </div>
                <div class="game-info">
                    <h3>${game.title}</h3>
                    <div class="game-meta">
                        <span class="rating">
                            <i class="fas fa-star"></i> ${game.rating}
                        </span>
                        <span class="category">${categories[game.category].name}</span>
                    </div>
                </div>
            `;
            
            // 添加点击事件处理
            gameCard.addEventListener('click', () => {
                // 如果有游戏URL，则跳转到游戏页面
                if (game.url) {
                    window.location.href = game.url;
                }
            });
            
            // 添加鼠标悬停效果
            gameCard.style.cursor = 'pointer';
            gameCard.addEventListener('mouseenter', () => {
                gameCard.style.transform = 'translateY(-5px)';
                gameCard.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            });
            
            gameCard.addEventListener('mouseleave', () => {
                gameCard.style.transform = 'translateY(0)';
                gameCard.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            });
            
            gamesGrid.appendChild(gameCard);
        });
    }

    // 处理搜索功能
    const searchInput = document.querySelector('.search-bar input');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = this.value.trim();
                updateGameDisplay();
            }, 300);
        });
    }
});

// 添加移动端菜单切换功能
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // 点击主内容区域时关闭移动端菜单
    document.querySelector('.main-content').addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
});
