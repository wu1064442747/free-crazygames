'use strict';

import { gameData, categories } from './gameData.js';
import { createGameCard, filterGames, sortGames, formatNumber, formatDate } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // 导入游戏数据和工具函数
    const { gameData, categories } = window;
    let currentPage = 1;
    const gamesPerPage = 12;
    
    // 初始化状态
    const state = {
        filters: {
            category: 'all',
            difficulty: null,
            search: '',
            sort: 'popular'
        },
        favorites: loadFromLocalStorage('favorites', []),
        recentGames: loadFromLocalStorage('recentGames', []),
        isLoading: false
    };

    // ------------------------
    // 初始化页面
    // ------------------------
    initializePage();
    
    // ------------------------
    // 主要函数
    // ------------------------
    function initializePage() {
        // 初始化移动端菜单
        initMobileMenu();
        
        // 加载分类列表
        loadCategories();
        
        // 设置搜索功能
        setupSearch();
        
        // 加载游戏
        updateGameDisplay();
        
        // 加载收藏夹
        updateFavoriteButtons();
        
        // 设置模态框
        setupModal();
        
        // 设置加载更多按钮
        setupLoadMoreButton();
    }
    
    function initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (!menuToggle || !sidebar) return;
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // 点击主内容区域关闭菜单
        document.querySelector('.main-content').addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !e.target.closest('.sidebar')) {
                sidebar.classList.remove('active');
            }
        });
        
        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }

    function loadCategories() {
        // 更新侧边栏分类
        const categoryList = document.querySelector('.nav-section[aria-label="游戏分类导航"]');
        if (!categoryList) return;
        
        categoryList.innerHTML = '<h3>游戏分类</h3>';
        
        // 添加"全部"分类
        const allCategoryLink = document.createElement('a');
        allCategoryLink.href = '#';
        allCategoryLink.className = 'nav-item active';
        allCategoryLink.setAttribute('data-category', 'all');
        allCategoryLink.innerHTML = '<i class="fas fa-th-large" aria-hidden="true"></i><span>全部游戏</span>';
        categoryList.appendChild(allCategoryLink);
        
        // 添加其他分类
        Object.entries(categories).forEach(([id, category]) => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-item';
            link.setAttribute('data-category', id);
            link.innerHTML = `<i class="${category.icon}" aria-hidden="true"></i><span>${category.name}</span>`;
            categoryList.appendChild(link);
        });

        // 更新顶部分类标签
        const categoriesBar = document.querySelector('.categories-bar');
        if (!categoriesBar) return;
        
        categoriesBar.innerHTML = `
            <a href="#" class="category-tag active" data-category="all" role="tab" aria-selected="true">全部</a>
            ${Object.entries(categories)
                .map(([id, category]) => 
                    `<a href="#" class="category-tag" data-category="${id}" role="tab" aria-selected="false">${category.name.replace('游戏', '')}</a>`
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
                    
                    // 更新ARIA状态
                    if (el.hasAttribute('role') && el.getAttribute('role') === 'tab') {
                        el.setAttribute('aria-selected', el.getAttribute('data-category') === category);
                    }
                });
                
                // 重置分页
                currentPage = 1;
                
                // 更新过滤器并显示游戏
                state.filters.category = category;
                updateGameDisplay();
            });
        });
    }
    
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (!searchInput || !suggestionsContainer) return;
        
        let searchTimeout;
        
        // 输入搜索词事件
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value.trim().toLowerCase();
                state.filters.search = query;
                
                // 更新游戏显示
                updateGameDisplay();
                
                // 显示搜索建议
                if (query.length > 1) {
                    showSearchSuggestions(query);
                } else {
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.classList.remove('active');
                }
            }, 300);
        });
        
        // 搜索框获得焦点时显示最近搜索
        searchInput.addEventListener('focus', function() {
            if (this.value.trim().length < 2) {
                showRecentSearches();
            }
        });
        
        // 点击其他区域关闭搜索建议
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-bar')) {
                suggestionsContainer.classList.remove('active');
            }
        });
        
        // ESC键关闭搜索建议
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                suggestionsContainer.classList.remove('active');
                this.blur();
            }
        });
    }
    
    function showSearchSuggestions(query) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer) return;
        
        // 从游戏数据中找出匹配的标题
        const matchingGames = gameData.filter(game => 
            game.title.toLowerCase().includes(query) ||
            game.description.toLowerCase().includes(query) ||
            (game.tags && game.tags.some(tag => tag.toLowerCase().includes(query)))
        ).slice(0, 5);
        
        if (matchingGames.length === 0) {
            suggestionsContainer.innerHTML = '<div class="search-suggestion-item">没有找到匹配的游戏</div>';
        } else {
            suggestionsContainer.innerHTML = matchingGames.map(game => `
                <div class="search-suggestion-item" data-game-id="${game.id}">
                    ${game.title}
                </div>
            `).join('');
            
            // 添加点击事件
            suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const gameId = item.getAttribute('data-game-id');
                    if (gameId) {
                        // 显示游戏预览
                        showGamePreview(gameId);
                        suggestionsContainer.classList.remove('active');
                    } else {
                        // 更新搜索框
                        document.getElementById('searchInput').value = item.textContent.trim();
                        state.filters.search = item.textContent.trim();
                        updateGameDisplay();
                        suggestionsContainer.classList.remove('active');
                    }
                });
            });
        }
        
        suggestionsContainer.classList.add('active');
    }
    
    function showRecentSearches() {
        const recentSearches = loadFromLocalStorage('recentSearches', []);
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (!suggestionsContainer || recentSearches.length === 0) return;
        
        suggestionsContainer.innerHTML = `
            <div class="search-suggestion-header">最近搜索</div>
            ${recentSearches.map(search => `
                <div class="search-suggestion-item">${search}</div>
            `).join('')}
        `;
        
        // 添加点击事件
        suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('searchInput').value = item.textContent.trim();
                state.filters.search = item.textContent.trim();
                updateGameDisplay();
                suggestionsContainer.classList.remove('active');
            });
        });
        
        suggestionsContainer.classList.add('active');
    }

    function updateGameDisplay() {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;
        
        // 显示加载状态
        if (currentPage === 1) {
            gamesGrid.innerHTML = '<div class="loading-placeholder"><div class="spinner" aria-hidden="true"></div><p>加载游戏中...</p></div>';
        }
        
        // 防止重复加载
        if (state.isLoading) return;
        state.isLoading = true;
        
        // 过滤游戏
        let filteredGames = filterGames(gameData, state.filters);
        
        // 应用排序
        filteredGames = sortGames(filteredGames, state.filters.sort);
        
        // 分页
        const startIndex = (currentPage - 1) * gamesPerPage;
        const endIndex = currentPage * gamesPerPage;
        const paginatedGames = filteredGames.slice(startIndex, endIndex);
        
        // 保存搜索词
        if (state.filters.search) {
            saveRecentSearch(state.filters.search);
        }
        
        // 延迟显示以展示加载动画
        setTimeout(() => {
            renderGames(paginatedGames, currentPage === 1);
            
            // 更新加载更多按钮状态
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = endIndex < filteredGames.length ? 'block' : 'none';
            }
            
            state.isLoading = false;
        }, 300);
    }
    
    function setupLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;
        
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            updateGameDisplay();
        });
    }
    
    function renderGames(games, clearGrid = true) {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;
        
        if (clearGrid) {
            gamesGrid.innerHTML = '';
        }
        
        if (games.length === 0) {
            gamesGrid.innerHTML = '<div class="no-results">没有找到匹配的游戏</div>';
            return;
        }
        
        // 使用文档片段提高性能
        const fragment = document.createDocumentFragment();
        
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.setAttribute('data-id', game.id);
            gameCard.setAttribute('tabindex', '0');
            
            // 使用WebP和响应式图片
            const imageUrl = game.image.replace(/\.(jpg|jpeg|png)$/, '.webp');
            const fallbackUrl = game.image;
            
            gameCard.innerHTML = `
                <div class="game-cover">
                    <picture>
                        <source srcset="${imageUrl}" type="image/webp">
                        <img src="${fallbackUrl}" alt="${game.title}" loading="lazy" width="300" height="169">
                    </picture>
                    ${game.isNew ? '<span class="badge new">新游戏</span>' : ''}
                    ${game.playCount > 200000 ? '<span class="badge popular">热门</span>' : ''}
                    <button class="favorite-btn ${state.favorites.includes(game.id) ? 'active' : ''}" aria-label="${state.favorites.includes(game.id) ? '取消收藏' : '收藏'} ${game.title}">
                        <i class="fas fa-heart" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="game-info">
                    <h3>${game.title}</h3>
                    <div class="game-meta">
                        <span class="game-rating">
                            <i class="fas fa-star" aria-hidden="true"></i> ${game.rating}
                        </span>
                        <span>${categories[game.category]?.name || game.category}</span>
                    </div>
                </div>
            `;
            
            // 添加点击事件处理
            gameCard.addEventListener('click', (e) => {
                // 如果不是点击收藏按钮
                if (!e.target.closest('.favorite-btn')) {
                    showGamePreview(game.id);
                }
            });
            
            // 添加键盘支持
            gameCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showGamePreview(game.id);
                }
            });
            
            // 收藏按钮事件
            const favoriteBtn = gameCard.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(game.id);
                    
                    // 更新按钮状态
                    const isFavorite = state.favorites.includes(game.id);
                    favoriteBtn.classList.toggle('active', isFavorite);
                    favoriteBtn.setAttribute('aria-label', `${isFavorite ? '取消收藏' : '收藏'} ${game.title}`);
                });
            }
            
            fragment.appendChild(gameCard);
        });
        
        gamesGrid.appendChild(fragment);
    }
    
    function setupModal() {
        const modal = document.getElementById('gamePreviewModal');
        if (!modal) return;
        
        // 点击模态框背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // 点击关闭按钮
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
        
        function closeModal() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            
            // 恢复焦点
            const lastFocused = document.querySelector('[data-last-focused]');
            if (lastFocused) {
                lastFocused.focus();
                lastFocused.removeAttribute('data-last-focused');
            }
        }
    }
    
    // ------------------------
    // 工具函数
    // ------------------------
    
    function showGamePreview(gameId) {
        const game = gameData.find(g => g.id === gameId);
        if (!game) return;
        
        const modal = document.getElementById('gamePreviewModal');
        const modalBody = modal.querySelector('.modal-body');
        
        // 保存当前焦点元素
        const currentFocused = document.activeElement;
        currentFocused.setAttribute('data-last-focused', 'true');
        
        // 添加游戏到最近游戏列表
        addToRecentGames(gameId);
        
        // 获取推荐游戏
        const recommendedGames = getRecommendedGames(gameId, 4);
        
        modalBody.innerHTML = `
            <div class="preview-header">
                <h2 id="modalTitle">${game.title}</h2>
                <div class="meta">
                    <span class="category">${categories[game.category]?.name || game.category}</span>
                    <span class="rating"><i class="fas fa-star" aria-hidden="true"></i> ${game.rating}</span>
                    ${game.difficulty ? `<span class="difficulty">${game.difficulty}</span>` : ''}
                </div>
            </div>
            <div class="preview-image">
                <picture>
                    <source srcset="${game.image.replace(/\.(jpg|jpeg|png)$/, '.webp')}" type="image/webp">
                    <img src="${game.image}" alt="${game.title}" width="800" height="450">
                </picture>
            </div>
            <div class="preview-body">
                <p class="description">${game.description}</p>
                ${game.features ? `
                <div class="features">
                    <h3>特点</h3>
                    <ul>
                        ${game.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>` : ''}
                <div class="stats">
                    <div class="stat-item">
                        <span class="label">玩家数</span>
                        <span class="value">${formatNumber(game.playCount)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">发布日期</span>
                        <span class="value">${formatDate(game.releaseDate)}</span>
                    </div>
                </div>
            </div>
            
            ${recommendedGames.length > 0 ? `
            <div class="recommended-games">
                <h3>相似游戏推荐</h3>
                <div class="recommended-grid">
                    ${recommendedGames.map(g => `
                    <div class="recommended-card" data-id="${g.id}" tabindex="0">
                        <img src="${g.image}" alt="${g.title}" loading="lazy" width="120" height="68">
                        <div class="rec-info">
                            <h4>${g.title}</h4>
                            <div class="rec-meta">
                                <span><i class="fas fa-star" aria-hidden="true"></i> ${g.rating}</span>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>` : ''}
            
            <div class="preview-footer">
                <a href="${game.url || '#'}" class="play-button" target="_blank" rel="noopener">开始游戏</a>
                <button class="favorite-btn ${state.favorites.includes(gameId) ? 'active' : ''}" aria-label="${state.favorites.includes(gameId) ? '取消收藏' : '收藏'} ${game.title}">
                    <i class="fas fa-heart" aria-hidden="true"></i> ${state.favorites.includes(gameId) ? '已收藏' : '收藏游戏'}
                </button>
            </div>
        `;
        
        // 添加推荐游戏点击事件
        modalBody.querySelectorAll('.recommended-card').forEach(card => {
            card.addEventListener('click', () => {
                const recommendedGameId = card.getAttribute('data-id');
                showGamePreview(recommendedGameId);
            });
            
            // 键盘支持
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const recommendedGameId = card.getAttribute('data-id');
                    showGamePreview(recommendedGameId);
                }
            });
        });
        
        // 添加收藏按钮事件
        const favoriteBtn = modalBody.querySelector('.favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                toggleFavorite(gameId);
                
                // 更新按钮状态
                const isFavorite = state.favorites.includes(gameId);
                favoriteBtn.classList.toggle('active', isFavorite);
                favoriteBtn.innerHTML = `<i class="fas fa-heart" aria-hidden="true"></i> ${isFavorite ? '已收藏' : '收藏游戏'}`;
                favoriteBtn.setAttribute('aria-label', `${isFavorite ? '取消收藏' : '收藏'} ${game.title}`);
                
                // 更新所有游戏卡片中的收藏按钮
                updateFavoriteButtons();
            });
        }
        
        // 显示模态框
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // 焦点移到关闭按钮
        setTimeout(() => {
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) closeBtn.focus();
        }, 100);
    }
    
    function toggleFavorite(gameId) {
        const index = state.favorites.indexOf(gameId);
        
        if (index === -1) {
            // 添加到收藏
            state.favorites.push(gameId);
        } else {
            // 从收藏中移除
            state.favorites.splice(index, 1);
        }
        
        // 保存到本地存储
        saveToLocalStorage('favorites', state.favorites);
    }
    
    function updateFavoriteButtons() {
        document.querySelectorAll('.game-card').forEach(card => {
            const gameId = card.getAttribute('data-id');
            const btn = card.querySelector('.favorite-btn');
            
            if (gameId && btn) {
                const isFavorite = state.favorites.includes(gameId);
                btn.classList.toggle('active', isFavorite);
                
                // 更新aria标签
                const game = gameData.find(g => g.id === gameId);
                if (game) {
                    btn.setAttribute('aria-label', `${isFavorite ? '取消收藏' : '收藏'} ${game.title}`);
                }
            }
        });
    }
    
    function addToRecentGames(gameId) {
        // 从列表中移除该游戏(如果已存在)
        const index = state.recentGames.indexOf(gameId);
        if (index !== -1) {
            state.recentGames.splice(index, 1);
        }
        
        // 添加到列表开头
        state.recentGames.unshift(gameId);
        
        // 限制列表长度
        if (state.recentGames.length > 10) {
            state.recentGames = state.recentGames.slice(0, 10);
        }
        
        // 保存到本地存储
        saveToLocalStorage('recentGames', state.recentGames);
    }
    
    function saveRecentSearch(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) return;
        
        let recentSearches = loadFromLocalStorage('recentSearches', []);
        
        // 从列表中移除该搜索词(如果已存在)
        const index = recentSearches.indexOf(searchTerm);
        if (index !== -1) {
            recentSearches.splice(index, 1);
        }
        
        // 添加到列表开头
        recentSearches.unshift(searchTerm);
        
        // 限制列表长度
        if (recentSearches.length > 5) {
            recentSearches = recentSearches.slice(0, 5);
        }
        
        // 保存到本地存储
        saveToLocalStorage('recentSearches', recentSearches);
    }
    
    function getRecommendedGames(gameId, count = 6) {
        const currentGame = gameData.find(g => g.id === gameId);
        if (!currentGame) return [];
        
        return gameData
            .filter(g => g.id !== gameId)
            .filter(g => g.category === currentGame.category || 
                       (g.tags && currentGame.tags && g.tags.some(t => currentGame.tags.includes(t))))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, count);
    }
    
    function filterGames(games, filters) {
        return games.filter(game => {
            // 分类过滤
            if (filters.category !== 'all' && game.category !== filters.category) {
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
    
    function sortGames(games, sortBy) {
        switch(sortBy) {
            case 'newest':
                return [...games].sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
            case 'rating':
                return [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'popular':
            default:
                return [...games].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        }
    }
    
    // 数字格式化
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
    
    // 日期格式化
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
    
    // 本地存储操作
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('本地存储保存失败:', e);
        }
    }
    
    function loadFromLocalStorage(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('本地存储读取失败:', e);
            return defaultValue;
        }
    }
});
