const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');
const INDEX_HTML = path.join(__dirname, '..', 'index.html');
const ARTICLES_INDEX_HTML = path.join(ARTICLES_DIR, 'index.html');
const MANIFEST_PATH = path.join(ARTICLES_DIR, 'manifest.json');

/**
 * Scan a series directory and extract article metadata
 */
function scanSeries(seriesDir) {
    const seriesJsonPath = path.join(seriesDir, 'series.json');
    if (!fs.existsSync(seriesJsonPath)) {
        return null;
    }

    const seriesConfig = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf-8'));
    const articles = [];

    const files = fs.readdirSync(seriesDir)
        .filter(f => f.endsWith('.html') && f !== 'index.html')
        .sort();

    for (const file of files) {
        const filePath = path.join(seriesDir, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        const meta = {
            file: file,
            path: `/articles/${seriesConfig.id}/${file}`,
            title: $('meta[name="article:title"]').attr('content') || $('title').text().split(' - ')[0],
            description: $('meta[name="article:description"]').attr('content') || '',
            level: $('meta[name="article:level"]').attr('content') || 'intermediate',
            tags: ($('meta[name="article:tags"]').attr('content') || '').split(',').map(t => t.trim()).filter(Boolean)
        };

        articles.push(meta);
    }

    return {
        ...seriesConfig,
        articles
    };
}

/**
 * Scan all series directories
 */
function scanAllSeries() {
    const series = [];
    const entries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const seriesData = scanSeries(path.join(ARTICLES_DIR, entry.name));
            if (seriesData) {
                series.push(seriesData);
            }
        }
    }

    // Sort by order
    series.sort((a, b) => (a.order || 999) - (b.order || 999));
    return series;
}

/**
 * Generate manifest.json
 */
function generateManifest(series) {
    const manifest = {
        generated: new Date().toISOString(),
        series: series
    };

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`Generated: ${MANIFEST_PATH}`);
}

/**
 * Update homepage categories section
 */
function updateHomepage(series) {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Find the category-list div and update it
    const categoryList = $('.category-list');
    if (categoryList.length === 0) {
        console.warn('Warning: .category-list not found in index.html');
        return;
    }

    // Generate category items
    const categoryItems = series.map(s => `
                <a href="/articles/${s.id}/" class="category-item">
                    <h4>${s.title}</h4>
                    <span>${s.description}</span>
                </a>`).join('\n');

    categoryList.html(categoryItems);

    fs.writeFileSync(INDEX_HTML, $.html(), 'utf-8');
    console.log(`Updated: ${INDEX_HTML}`);
}

/**
 * Get level tag class
 */
function getLevelClass(level) {
    switch (level) {
        case 'beginner': return 'tag beginner';
        case 'intermediate': return 'tag intermediate';
        case 'advanced': return 'tag advanced';
        default: return 'tag';
    }
}

/**
 * Get level display name
 */
function getLevelName(level) {
    switch (level) {
        case 'beginner': return '入门';
        case 'intermediate': return '进阶';
        case 'advanced': return '高级';
        default: return level;
    }
}

/**
 * Filter out level-related tags to avoid duplication
 */
function filterLevelTags(tags) {
    const levelNames = ['入门', '进阶', '高级', 'beginner', 'intermediate', 'advanced'];
    return tags.filter(t => !levelNames.includes(t.toLowerCase()));
}

/**
 * Update articles index page
 */
function updateArticlesIndex(series) {
    const html = fs.readFileSync(ARTICLES_INDEX_HTML, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Find the container and clear existing category sections (but keep page-header)
    const container = $('.container');
    const pageHeader = $('.page-header').clone();

    // Remove all category sections
    $('.category-section').remove();

    // Generate new category sections
    const sectionsHtml = series.map(s => {
        const articleCount = s.articles.length;
        const articleItems = s.articles.map(a => `
                <li class="article-item">
                    <a href="${a.path}">
                        <h3>${a.title}</h3>
                        <p>${a.description}</p>
                        <div class="article-meta">
                            <span class="${getLevelClass(a.level)}">${getLevelName(a.level)}</span>
                            ${filterLevelTags(a.tags).map(t => `<span class="tag">${t}</span>`).join('\n                            ')}
                        </div>
                    </a>
                </li>`).join('\n');

        return `
        <section class="category-section">
            <h2>${s.title}${articleCount > 1 ? ` (${articleCount}篇)` : ''}</h2>
            <ul class="article-list">${articleItems}
            </ul>
        </section>`;
    }).join('\n');

    // Append sections after page-header
    container.find('.page-header').after(sectionsHtml);

    fs.writeFileSync(ARTICLES_INDEX_HTML, $.html(), 'utf-8');
    console.log(`Updated: ${ARTICLES_INDEX_HTML}`);
}

// Main execution
console.log('Scanning articles...');
const series = scanAllSeries();
console.log(`Found ${series.length} series with ${series.reduce((sum, s) => sum + s.articles.length, 0)} articles total.`);

generateManifest(series);
updateHomepage(series);
updateArticlesIndex(series);

console.log('Build complete!');
