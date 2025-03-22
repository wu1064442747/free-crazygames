import { gameData, categories } from './gameData.js';
import { createGameCard, filterGames, sortGames, formatNumber, formatDate } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // 初始化状态
    let currentFilters = {
        category: null,
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
        const categoryList = document.getElementById('categoryList');
        Object.entries(categories).forEach(([name, data]) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#" data-category="${data.id}">
                    <span class="category-icon">${data.icon}</span>
                    ${name}
                </a>
            `;
            categoryList.appendChild(li);
        });
    }

    function updateGameDisplay() {
        // 筛选游戏
        let filteredGames = filterGames(gameData, currentFilters);
        
        // 排序游戏
        filteredGames = sortGames(filteredGames, currentFilters.sort);

        // 更新显示
        const gamesGrid = document.querySelector('.games-grid');
        gamesGrid.innerHTML = filteredGames.map(game => createGameCard(game)).join('');
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

        // 分类点击
        document.getElementById('categoryList').addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                e.preventDefault();
                const category = e.target.closest('a').dataset.category;
                currentFilters.category = category === currentFilters.category ? null : category;
                updateGameDisplay();
            }
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
