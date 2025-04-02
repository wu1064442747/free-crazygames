'use strict';

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM完全加载');
    console.log(`游戏数据数量: ${window.gameData ? window.gameData.length : '未加载'}`);
    console.log(`分类数量: ${window.categories ? Object.keys(window.categories).length : '未加载'}`);
    
    try {
        initializePage();
    } catch (e) {
        console.error('初始化页面时出错:', e);
    }
});

// 全局变量和初始设置
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

function updateGameDisplay() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) {
        console.error('找不到游戏网格元素');
        return;
    }
    
    // 显示加载状态
    if (currentPage === 1) {
        gamesGrid.innerHTML = '<div class="loading-placeholder"><div class="spinner" aria-hidden="true"></div><p>加载游戏中...</p></div>';
    }
    
    // 防止重复加载
    if (state.isLoading) return;
    state.isLoading = true;
    
    // 调试：检查游戏数据是否可用
    console.log('总游戏数量:', window.gameData ? window.gameData.length : '游戏数据未加载');
    console.log('游戏数据示例:', window.gameData ? window.gameData.slice(0, 2) : '无数据');
    
    if (!window.gameData || !Array.isArray(window.gameData)) {
        console.error('游戏数据无效');
        gamesGrid.innerHTML = '<div class="error-message">加载游戏数据失败</div>';
        state.isLoading = false;
        return;
    }
    
    // 过滤游戏
    let filteredGames = filterGames(window.gameData, state.filters);
    
    // 调试：检查过滤后的游戏数量
    console.log('过滤后游戏数量:', filteredGames.length);
    console.log('过滤条件:', state.filters);
    
    // 应用排序
    filteredGames = sortGames(filteredGames, state.filters.sort);
    
    // 分页
    const startIndex = (currentPage - 1) * gamesPerPage;
    const endIndex = currentPage * gamesPerPage;
    const paginatedGames = filteredGames.slice(startIndex, endIndex);
    
    // 调试：检查分页后的游戏数量
    console.log('分页后游戏数量:', paginatedGames.length);
    
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

function filterGames(games, filters) {
    if (!games || !Array.isArray(games)) {
        console.error('游戏数据无效:', games);
        return [];
    }
    
    console.log('过滤前游戏数量:', games.length);
    
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
    if (!games || !Array.isArray(games)) {
        console.error('排序的游戏数据无效:', games);
        return [];
    }
    
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

function renderGames(games, clearGrid = true) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) {
        console.error('Game grid element not found');
        return;
    }
    
    if (clearGrid) {
        gamesGrid.innerHTML = '';
    }
    
    console.log('Rendering games count:', games ? games.length : 0);
    
    if (!games || games.length === 0) {
        gamesGrid.innerHTML = '<div class="no-results">No matching games found</div>';
        return;
    }
    
    // Debug info: output first three game objects to console
    console.log('Game data example:', games.slice(0, 3));
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    games.forEach((game, index) => {
        if (!game || !game.id) {
            console.error('Invalid game data:', game);
            return;
        }
        
        // Output each game ID to console
        console.log(`Game ID: ${game.id}, Title: ${game.title}, Image path: ${game.image}`);
        
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.setAttribute('data-id', game.id);
        gameCard.setAttribute('tabindex', '0');
        
        // Use game.image as main image path
        const imagePath = game.image || 'img/placeholder.svg';
        console.log(`Using image path: ${imagePath}`);
        
        gameCard.innerHTML = `
            <div class="game-cover">
                <img src="${imagePath}" alt="${escapeHtml(game.title)}" loading="lazy" 
                     onerror="this.onerror=null; this.src='img/placeholder.svg'; console.log('Image load failed, using placeholder');">
                ${game.isNew ? '<span class="badge new">New</span>' : ''}
                ${game.playCount > 200000 ? '<span class="badge popular">Popular</span>' : ''}
                <button class="favorite-btn ${state.favorites.includes(game.id) ? 'active' : ''}" aria-label="${state.favorites.includes(game.id) ? 'Remove from favorites' : 'Add to favorites'} ${escapeHtml(game.title)}">
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
        `;
        
        // Add click event handler
        gameCard.addEventListener('click', (e) => {
            // If not clicking favorite button
            if (!e.target.closest('.favorite-btn')) {
                showGamePreview(game.id);
            }
        });
        
        // Add keyboard support
        gameCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showGamePreview(game.id);
            }
        });
        
        fragment.appendChild(gameCard);
    });
    
    gamesGrid.appendChild(fragment);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!menuToggle || !sidebar) {
        console.error('找不到菜单切换或侧边栏元素');
        return;
    }
    
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
    if (!categoryList) {
        console.error('找不到分类导航元素');
        return;
    }

        // 更新顶部分类标签
        const categoriesBar = document.querySelector('.categories-bar');
    if (!categoriesBar) {
        console.error('找不到分类标签栏');
        return;
    }

        // 添加分类点击事件
        document.querySelectorAll('[data-category]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.currentTarget.getAttribute('data-category');
            
            console.log('选择分类:', category);
                
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
    
    if (!searchInput) {
        console.error('找不到搜索输入框');
        return;
    }
    
    let searchTimeout;
    
    // 输入搜索词事件
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim().toLowerCase();
            console.log('搜索查询:', query);
            
            state.filters.search = query;
            
            // 更新游戏显示
            updateGameDisplay();
            
            // 显示搜索建议
            if (query.length > 1 && suggestionsContainer) {
                showSearchSuggestions(query);
            } else if (suggestionsContainer) {
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.classList.remove('active');
            }
        }, 300);
    });
}

function setupModal() {
    const modal = document.getElementById('gamePreviewModal');
    if (!modal) {
        console.error('找不到游戏预览模态框');
        return;
    }
    
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
    }
}

function setupLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) {
        console.error('找不到加载更多按钮');
        return;
    }
    
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        updateGameDisplay();
    });
}

function updateFavoriteButtons() {
        document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.getAttribute('data-id');
        const btn = card.querySelector('.favorite-btn');
        
        if (gameId && btn) {
            const isFavorite = state.favorites.includes(gameId);
            btn.classList.toggle('active', isFavorite);
        }
    });
}

function showGamePreview(gameId) {
    const game = findGameById(gameId);
    if (!game) {
        console.error('Game not found:', gameId);
        return;
    }
    
    const modal = document.getElementById('gamePreviewModal');
    const modalBody = modal.querySelector('.modal-body');
    
    if (!modal || !modalBody) {
        console.error('Modal elements not found');
        return;
    }
    
    console.log('Showing game preview:', gameId);
    
    // Add game to recent games list
    addToRecentGames(gameId);
    
    // Get recommended games
    const recommendedGames = getRecommendedGames(gameId, 4);
    
    modalBody.innerHTML = `
        <div class="preview-header">
            <h2 id="modalTitle">${game.title}</h2>
            <div class="meta">
                <span class="category">${window.categories && window.categories[game.category]?.name || game.category}</span>
                <span class="rating"><i class="fas fa-star" aria-hidden="true"></i> ${game.rating}</span>
                ${game.difficulty ? `<span class="difficulty">${game.difficulty}</span>` : ''}
            </div>
            <div class="top-play-button">
                <a href="${game.url || '#'}" class="play-button" target="_blank" rel="noopener">Play Now</a>
                <button class="favorite-btn ${state.favorites.includes(gameId) ? 'active' : ''}" aria-label="${state.favorites.includes(gameId) ? 'Remove from favorites' : 'Add to favorites'} ${game.title}">
                    <i class="fas fa-heart" aria-hidden="true"></i> ${state.favorites.includes(gameId) ? 'Favorited' : 'Add to Favorites'}
                </button>
            </div>
        </div>
        <div class="preview-image-container">
            <iframe src="${game.url}" frameborder="0" allowfullscreen loading="lazy" title="${escapeHtml(game.title)}"></iframe>
        </div>
        <div class="preview-body">
            <p class="description">${game.description || generateGameDescription(game)}</p>
            ${game.features ? `
                <div class="features">
                    <h3>Features</h3>
                    <ul>
                        ${game.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>` : ''}
            <div class="stats">
                <div class="stat-item">
                    <span class="label">Players</span>
                    <span class="value">${formatNumber(game.playCount)}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Release Date</span>
                    <span class="value">${formatDate(game.releaseDate)}</span>
                </div>
            </div>
        </div>
        
        ${recommendedGames.length > 0 ? `
        <div class="recommended-games">
            <h3>Similar Games</h3>
            <div class="recommended-grid">
                ${recommendedGames.map(g => {
                    // Use game main image as recommendation image
                    const gameCover = g.image || `img/screenshots/${g.id}.png`;
                    return `
                    <div class="recommended-card" data-id="${g.id}" tabindex="0">
                        <img src="${gameCover}" alt="${g.title}" loading="lazy"
                             onerror="this.onerror=null; this.src='img/placeholder.svg'; console.log('Recommended game image load failed, using placeholder');">
                        <div class="rec-info">
                            <h4>${g.title}</h4>
                            <div class="rec-meta">
                                <span><i class="fas fa-star" aria-hidden="true"></i> ${g.rating}</span>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>` : ''}
    `;
    
    // Add recommended games click events
    modalBody.querySelectorAll('.recommended-card').forEach(card => {
        card.addEventListener('click', () => {
            const recommendedGameId = card.getAttribute('data-id');
            showGamePreview(recommendedGameId);
        });
        
        // Keyboard support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const recommendedGameId = card.getAttribute('data-id');
                showGamePreview(recommendedGameId);
            }
        });
    });
    
    // Add favorite button event
    const favoriteBtn = modalBody.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            toggleFavorite(gameId);
            
            // Update all favorite button states
            const isFavorite = state.favorites.includes(gameId);
            favoriteBtn.classList.toggle('active', isFavorite);
            favoriteBtn.innerHTML = `<i class="fas fa-heart" aria-hidden="true"></i> ${isFavorite ? 'Favorited' : 'Add to Favorites'}`;
            favoriteBtn.setAttribute('aria-label', `${isFavorite ? 'Remove from favorites' : 'Add to favorites'} ${game.title}`);
            
            // Update all game card favorite buttons
            updateFavoriteButtons();
        });
    }
    
    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function findGameById(gameId) {
    return window.gameData ? window.gameData.find(g => g.id === gameId) : null;
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

function showSearchSuggestions(query) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer || !window.gameData) return;
    
    // Find matching titles from game data
    const matchingGames = window.gameData.filter(game => 
        game.title.toLowerCase().includes(query) ||
        (game.description && game.description.toLowerCase().includes(query)) ||
        (game.tags && game.tags.some(tag => tag.toLowerCase().includes(query)))
    ).slice(0, 5);
    
    if (matchingGames.length === 0) {
        suggestionsContainer.innerHTML = '<div class="search-suggestion-item">No matching games found</div>';
    } else {
        suggestionsContainer.innerHTML = matchingGames.map(game => `
            <div class="search-suggestion-item" data-game-id="${game.id}">
                ${escapeHtml(game.title)}
            </div>
        `).join('');
        
        // Add click events
        suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const gameId = item.getAttribute('data-game-id');
                if (gameId) {
                    // Show game preview
                    showGamePreview(gameId);
                    suggestionsContainer.classList.remove('active');
                }
            });
        });
    }
    
    suggestionsContainer.classList.add('active');
}

// 确保创建必要的目录和文件
function checkRequiredResources() {
    console.log('检查必要的目录和文件');
    
    // 检查截图目录
    const screenshotsDir = 'img/screenshots';
    console.log(`截图目录: ${screenshotsDir}`);
    
    // 创建占位图 (简单实现，实际使用时应当检查文件是否存在)
    const placeholderImg = 'img/placeholder.svg';
    console.log(`占位图: ${placeholderImg}`);
}
