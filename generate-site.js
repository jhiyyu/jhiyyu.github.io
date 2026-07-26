#!/usr/bin/env node
/**
 * 静态站生成器 - 从抓取的 JSON 数据生成独立 HTML 站点
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DIST_DIR = path.join(__dirname, 'dist');

// 读取数据
function loadJSON(name) {
    const fp = path.join(DATA_DIR, name);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

// HTML 转义
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 清理 HTML 标签（取纯文本摘要）
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().substring(0, 160);
}

// 修复图片 URL（相对路径加上源站域名）
function fixImageUrl(url, siteUrl) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return siteUrl + url;
    return url;
}

// 获取分类名
function getCategoryName(categories, categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : '未分类';
}

// CSS 样式
const CSS = `
:root {
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --accent: #f59e0b;
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --text: #1e293b;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1);
    --radius: 12px;
    --radius-sm: 8px;
    --max-width: 1200px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    background: var(--bg); color: var(--text); line-height: 1.6; min-height: 100vh;
}
a { color: var(--primary); text-decoration: none; transition: color .2s; }
a:hover { color: var(--primary-dark); }
img { max-width: 100%; height: auto; }

/* Header */
.site-header {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: #fff; padding: 0; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,.15);
}
.header-inner {
    max-width: var(--max-width); margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px;
}
.site-logo { height: 36px; margin-right: 12px; border-radius: 6px; }
.site-title { font-size: 1.35rem; font-weight: 700; letter-spacing: .5px; }
.header-nav { display: flex; gap: 8px; }
.header-nav a {
    color: rgba(255,255,255,.85); padding: 8px 16px; border-radius: 8px;
    font-size: .9rem; transition: all .2s;
}
.header-nav a:hover, .header-nav a.active { background: rgba(255,255,255,.15); color: #fff; }

/* Hero */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff; text-align: center; padding: 60px 24px 50px;
}
.hero h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; }
.hero p { font-size: 1.1rem; opacity: .9; max-width: 600px; margin: 0 auto; }

/* Container */
.container { max-width: var(--max-width); margin: 0 auto; padding: 32px 24px; }

/* Category filter */
.category-bar {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px;
    padding: 16px; background: var(--card-bg); border-radius: var(--radius);
    box-shadow: var(--shadow);
}
.cat-pill {
    padding: 8px 18px; border-radius: 20px; cursor: pointer;
    font-size: .88rem; font-weight: 500; transition: all .2s;
    background: #f1f5f9; color: var(--text-secondary); border: 1px solid transparent;
}
.cat-pill:hover { background: #e2e8f0; color: var(--text); }
.cat-pill.active {
    background: var(--primary); color: #fff;
    box-shadow: 0 2px 6px rgba(37,99,235,.3);
}

/* Product grid */
.product-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px; margin-bottom: 40px;
}
.product-card {
    background: var(--card-bg); border-radius: var(--radius); overflow: hidden;
    box-shadow: var(--shadow); transition: all .3s ease; cursor: pointer;
    border: 1px solid var(--border); position: relative;
}
.product-card:hover {
    transform: translateY(-4px); box-shadow: var(--shadow-lg);
    border-color: var(--primary);
}
.product-card .card-img {
    width: 100%; height: 200px; object-fit: cover; display: block;
    background: #f1f5f9;
}
.product-card .card-body { padding: 16px; }
.product-card .card-title {
    font-size: 1rem; font-weight: 600; margin-bottom: 6px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; line-height: 1.4;
}
.product-card .card-desc {
    font-size: .82rem; color: var(--text-secondary); margin-bottom: 10px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
}
.product-card .card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-top: 1px solid var(--border);
}
.product-card .price {
    font-size: 1.2rem; font-weight: 700; color: #ef4444;
}
.product-card .price .from { font-size: .75rem; font-weight: 400; color: var(--text-secondary); }
.product-card .btn-buy {
    padding: 6px 16px; background: var(--primary); color: #fff;
    border-radius: 6px; font-size: .82rem; font-weight: 500;
    transition: background .2s; border: none; cursor: pointer;
}
.product-card .btn-buy:hover { background: var(--primary-dark); }

/* Tags */
.tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: .7rem; font-weight: 500; margin-right: 4px;
}
.tag-hot { background: #fef2f2; color: #dc2626; }
.tag-new { background: #f0fdf4; color: #16a34a; }

/* Product detail */
.product-detail { background: var(--card-bg); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.product-detail .detail-top { display: flex; gap: 32px; padding: 32px; }
.product-detail .detail-img {
    width: 400px; height: 400px; object-fit: cover; border-radius: var(--radius-sm);
    flex-shrink: 0; background: #f1f5f9;
}
.product-detail .detail-info { flex: 1; }
.product-detail .detail-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
.product-detail .detail-desc { color: var(--text-secondary); margin-bottom: 20px; line-height: 1.8; }
.variant-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.variant-table th, .variant-table td {
    padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); font-size: .9rem;
}
.variant-table th { background: #f8fafc; font-weight: 600; color: var(--text-secondary); font-size: .82rem; }
.variant-table .vp { color: #ef4444; font-weight: 700; font-size: 1.05rem; }
.back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px; color: var(--primary); font-size: .9rem; }

/* Footer */
.site-footer {
    text-align: center; padding: 32px 24px; color: var(--text-secondary);
    font-size: .82rem; border-top: 1px solid var(--border); margin-top: 40px;
}
.site-footer a { color: var(--text-secondary); }
.site-footer a:hover { color: var(--primary); }

/* Update badge */
.update-badge {
    display: inline-block; padding: 4px 12px; border-radius: 12px;
    background: #f0fdf4; color: #16a34a; font-size: .75rem; font-weight: 500;
    margin-top: 8px;
}

/* Responsive */
@media (max-width: 768px) {
    .header-inner { flex-direction: column; gap: 10px; }
    .hero h1 { font-size: 1.6rem; }
    .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .product-card .card-img { height: 150px; }
    .product-detail .detail-top { flex-direction: column; }
    .product-detail .detail-img { width: 100%; height: 280px; }
    .container { padding: 20px 16px; }
}
@media (max-width: 480px) {
    .product-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .product-card .card-body { padding: 10px; }
    .product-card .card-title { font-size: .88rem; }
}

/* Animations */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeInUp .4s ease forwards; }
`;

// JS 逻辑
const JS = `
// 分类过滤
function filterCategory(catId, el) {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.product-card').forEach(card => {
        if (catId === 'all' || card.dataset.category == catId) {
            card.style.display = '';
            card.style.animation = 'fadeInUp .3s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

// 搜索
function searchProducts() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    document.querySelectorAll('.product-card').forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        const desc = (card.dataset.desc || '').toLowerCase();
        if (!q || name.includes(q) || desc.includes(q)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// 回到顶部
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
window.addEventListener('scroll', function() {
    const btn = document.getElementById('back-to-top');
    if (btn) btn.style.display = window.scrollY > 300 ? 'block' : 'none';
});
`;

// 生成首页
function generateIndex(config, categories, products, meta) {
    const siteUrl = meta.siteUrl || '';
    const siteName = esc(meta.siteName || '商品商城');
    const siteDesc = esc(meta.siteDescription || '精选商品，自动发货，安全快捷');
    const logoHtml = meta.siteLogo
        ? `<img src="${esc(fixImageUrl(meta.siteLogo, siteUrl))}" class="site-logo" alt="${siteName}">`
        : '';

    // 分类按钮
    const catPills = categories
        .filter(c => products.some(p => p.category_id === c.id))
        .sort((a, b) => (b.sort || 0) - (a.sort || 0))
        .map(c => `<div class="cat-pill" onclick="filterCategory(${c.id}, this)">${esc(c.name)}</div>`)
        .join('\n                        ');

    // 商品卡片
    const productCards = products
        .filter(p => p.active !== 0)
        .sort((a, b) => (b.sort || 0) - (a.sort || 0))
        .map((p, i) => {
            const catName = getCategoryName(categories, p.category_id);
            const img = p.image_url
                ? fixImageUrl(p.image_url, siteUrl)
                : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="%23f1f5f9" width="400" height="300"/><text fill="%2394a3b8" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle" dy=".3em">暂无图片</text></svg>';
            const variants = p.variants || [];
            const minPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
            const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => v.price)) : 0;
            const priceText = minPrice === maxPrice
                ? `¥${minPrice.toFixed(2)}`
                : `<span class="from">起</span> ¥${minPrice.toFixed(2)}`;
            const desc = stripHtml(p.description);
            const tags = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            const tagsHtml = tags.map(t => {
                const cls = t.includes('热') || t.includes('火') ? 'tag-hot' : t.includes('新') ? 'tag-new' : 'tag-hot';
                return `<span class="tag ${cls}">${esc(t)}</span>`;
            }).join('');

            return `
                <div class="product-card animate-in" style="animation-delay:${i * 0.05}s"
                     data-category="${p.category_id}" data-name="${esc(p.name)}" data-desc="${esc(desc)}"
                     onclick="window.location.href='products/${p.id}.html'">
                    <img class="card-img" src="${esc(img)}" alt="${esc(p.name)}" loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23f1f5f9%22 width=%22400%22 height=%22300%22/><text fill=%22%2394a3b8%22 font-family=%22sans-serif%22 font-size=%2220%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22>暂无图片</text></svg>'">
                    <div class="card-body">
                        <div class="card-title">${esc(p.name)}</div>
                        ${tagsHtml ? `<div style="margin-bottom:6px">${tagsHtml}</div>` : ''}
                        <div class="card-desc">${esc(desc) || catName}</div>
                    </div>
                    <div class="card-footer">
                        <div class="price">${priceText}</div>
                        <button class="btn-buy" onclick="event.stopPropagation();window.location.href='products/${p.id}.html'">查看详情</button>
                    </div>
                </div>`;
        }).join('\n');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${siteDesc}">
    <meta property="og:title" content="${siteName}">
    <meta property="og:description" content="${siteDesc}">
    <meta property="og:type" content="website">
    <title>${siteName}</title>
    <style>${CSS}</style>
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <div style="display:flex;align-items:center">
                ${logoHtml}
                <span class="site-title">${siteName}</span>
            </div>
            <div class="header-nav">
                <a href="index.html" class="active">首页</a>
            </div>
        </div>
    </header>

    <section class="hero">
        <h1>🛍️ ${siteName}</h1>
        <p>${siteDesc}</p>
        <div class="update-badge">🕐 数据更新于 ${new Date(meta.fetchedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
    </section>

    <div class="container">
        <!-- 搜索栏 -->
        <div style="margin-bottom:20px">
            <div style="position:relative;max-width:480px">
                <input id="search-input" type="text" placeholder="🔍 搜索商品名称..."
                    style="width:100%;padding:12px 16px 12px 44px;border:2px solid var(--border);border-radius:var(--radius);font-size:.95rem;outline:none;transition:border-color .2s"
                    oninput="searchProducts()" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'">
                <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:1.2rem;pointer-events:none">🔍</span>
            </div>
        </div>

        <!-- 分类过滤 -->
        <div class="category-bar">
                            <div class="cat-pill active" onclick="filterCategory('all', this)">全部商品</div>
                            ${catPills}
                        </div>

        <!-- 商品列表 -->
        <div class="product-grid">
            ${productCards}
        </div>
    </div>

    <footer class="site-footer">
        <p>© ${new Date().getFullYear()} ${siteName} · 数据来源于原站，每12小时自动更新</p>
        <p style="margin-top:6px"><a href="index.html">返回首页</a></p>
    </footer>

    <button id="back-to-top" onclick="scrollToTop()"
        style="display:none;position:fixed;bottom:24px;right:24px;width:44px;height:44px;border-radius:50%;background:var(--primary);color:#fff;border:none;font-size:1.2rem;cursor:pointer;box-shadow:var(--shadow-lg);z-index:99;transition:opacity .2s">
        ↑
    </button>

    <script>${JS}</script>
</body>
</html>`;
}

// 生成商品详情页
function generateProductPage(product, categories, meta) {
    const siteUrl = meta.siteUrl || '';
    const siteName = esc(meta.siteName || '商品商城');
    const catName = getCategoryName(categories, product.category_id);
    const img = product.image_url
        ? fixImageUrl(product.image_url, siteUrl)
        : '';

    const variants = product.variants || [];
    const variantRows = variants.map(v => {
        const price = `¥${v.price.toFixed(2)}`;
        const stockText = v.stock > 0 ? `${v.stock} 件` : '<span style="color:#ef4444">已售罄</span>';
        return `<tr>
            <td>${esc(v.name)}</td>
            <td class="vp">${price}</td>
            <td>${stockText}</td>
        </tr>`;
    }).join('\n                    ');

    const descHtml = product.description || '<p>暂无详细描述</p>';
    const tags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tagsHtml = tags.map(t => `<span class="tag tag-hot">${esc(t)}</span>`).join(' ');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${esc(stripHtml(product.description) || product.name)}">
    <meta property="og:title" content="${esc(product.name)} - ${siteName}">
    <meta property="og:description" content="${esc(stripHtml(product.description))}">
    ${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
    <title>${esc(product.name)} - ${siteName}</title>
    <style>${CSS}</style>
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <div style="display:flex;align-items:center">
                ${meta.siteLogo ? `<img src="${esc(fixImageUrl(meta.siteLogo, siteUrl))}" class="site-logo" alt="${siteName}">` : ''}
                <span class="site-title">${siteName}</span>
            </div>
            <div class="header-nav">
                <a href="../index.html">首页</a>
                <a href="../index.html#${product.category_id}">${esc(catName)}</a>
            </div>
        </div>
    </header>

    <div class="container">
        <a href="../index.html" class="back-link">← 返回商品列表</a>

        <div class="product-detail">
            <div class="detail-top">
                ${img ? `<img class="detail-img" src="${esc(img)}" alt="${esc(product.name)}"
                    onerror="this.style.display='none'">` : ''}
                <div class="detail-info">
                    <h1 class="detail-title">${esc(product.name)}</h1>
                    ${tagsHtml ? `<div style="margin-bottom:12px">${tagsHtml}</div>` : ''}
                    <div style="color:var(--text-secondary);font-size:.88rem;margin-bottom:8px">分类: ${esc(catName)}</div>
                    <div class="detail-desc">${descHtml}</div>

                    ${variants.length > 0 ? `
                    <h3 style="margin:20px 0 12px;font-size:1rem">📋 规格与价格</h3>
                    <table class="variant-table">
                        <thead>
                            <tr>
                                <th>规格名称</th>
                                <th>价格</th>
                                <th>库存</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${variantRows}
                        </tbody>
                    </table>` : '<p style="color:var(--text-secondary)">暂无可选规格</p>'}
                </div>
            </div>
        </div>
    </div>

    <footer class="site-footer">
        <p>© ${new Date().getFullYear()} ${siteName} · 数据来源于原站，每12小时自动更新</p>
        <p style="margin-top:6px"><a href="../index.html">返回首页</a></p>
    </footer>

    <button onclick="window.scrollTo({top:0,behavior:'smooth'})"
        style="position:fixed;bottom:24px;right:24px;width:44px;height:44px;border-radius:50%;background:var(--primary);color:#fff;border:none;font-size:1.2rem;cursor:pointer;box-shadow:var(--shadow-lg);z-index:99">
        ↑
    </button>
</body>
</html>`;
}

// 主流程
function main() {
    const config = loadJSON('config.json') || {};
    const categories = loadJSON('categories.json') || [];
    const products = loadJSON('products.json') || [];
    const meta = loadJSON('meta.json') || {};

    if (products.length === 0) {
        console.error('❌ 没有找到商品数据，请先运行 fetch-data.js');
        process.exit(1);
    }

    console.log(`\n🏗️  开始生成静态站...`);
    console.log(`   分类: ${categories.length} 个`);
    console.log(`   商品: ${products.length} 个\n`);

    // 确保输出目录存在
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
    const prodDir = path.join(DIST_DIR, 'products');
    if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });

    // 生成首页
    const indexHtml = generateIndex(config, categories, products, meta);
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
    console.log('   ✅ index.html');

    // 生成商品详情页
    products.forEach(p => {
        const html = generateProductPage(p, categories, meta);
        fs.writeFileSync(path.join(prodDir, `${p.id}.html`), html);
        console.log(`   ✅ products/${p.id}.html — ${p.name}`);
    });

    // 复制一个简单的 favicon
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛍️</text></svg>`;
    fs.writeFileSync(path.join(DIST_DIR, 'favicon.svg'), faviconSvg);

    console.log(`\n✅ 静态站已生成到 ${DIST_DIR}/`);
    console.log(`   文件数: ${2 + products.length} 个\n`);
}

main();
