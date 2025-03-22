export function createGameCard(game) {
    return `
        <div class="game-card" data-id="${game.id}">
            <div class="game-image-container">
                <img src="${game.image}" alt="${game.title}" loading="lazy">
                <button class="favorite-btn" title="Add to favorites">
                    <i class="fas fa-heart"></i>
                </button>
                ${game.isNew ? '<span class="new-badge">New</span>' : ''}
            </div>
            <div class="game-info">
                <h3>${game.title}</h3>
                <div class="game-meta">
                    <span class="category">${game.category}</span>
                    <span class="rating">★ ${game.rating}</span>
                </div>
                <p class="game-description">${game.description}</p>
                <div class="game-tags">
                    ${game.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <a href="${game.url}" class="play-button" target="_blank">Play Now</a>
                <div class="social-share">
                    <button onclick="shareGame('facebook', '${game.url}')">
                        <i class="fab fa-facebook"></i>
                    </button>
                    <button onclick="shareGame('twitter', '${game.url}')">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button onclick="shareGame('whatsapp', '${game.url}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function filterGames(games, filters) {
    return games.filter(game => {
        if (filters.category && game.category !== filters.category) return false;
        if (filters.difficulty && game.difficulty !== filters.difficulty) return false;
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            return game.title.toLowerCase().includes(searchTerm) ||
                   game.description.toLowerCase().includes(searchTerm) ||
                   game.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        }
        return true;
    });
}

export function sortGames(games, sortBy) {
    switch(sortBy) {
        case 'newest':
            return [...games].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        case 'rating':
            return [...games].sort((a, b) => b.rating - a.rating);
        case 'popular':
            return [...games].sort((a, b) => b.playCount - a.playCount);
        default:
            return games;
    }
}

// 格式化数字
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 格式化日期
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// 生成游戏描述
export function generateGameDescription(game) {
    const descriptions = {
        Action: [
            `Experience intense action in ${game.title}, where you'll ${game.features[0].toLowerCase()}.`,
            `Jump into the exciting world of ${game.title} and test your reflexes.`,
            `Challenge yourself in this action-packed adventure.`
        ],
        Puzzle: [
            `Train your brain with ${game.title}, a challenging puzzle game.`,
            `Solve increasingly difficult puzzles in this mind-bending game.`,
            `Test your problem-solving skills in this addictive puzzle experience.`
        ],
        // ... 更多类别的描述模板
    };

    const categoryDescriptions = descriptions[game.category] || descriptions['Action'];
    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}
