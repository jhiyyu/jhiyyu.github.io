#!/usr/bin/env node
/**
 * 独立站风格静态站生成器 - SEO优化 + 商品展示 + 跳转原站
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DIST_DIR = path.join(__dirname, 'dist');

function loadJSON(name) {
    const fp = path.join(DATA_DIR, name);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function stripHtml(h) { return (h || '').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim(); }
function fixImg(url, base) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return base + url;
    return url;
}

// ── 全站 SEO 关键词（隐藏在 meta 中，页面不显示）──
const SEO_KEYWORDS = 'Gmail账号,Google Voice,GV靓号,苹果Apple ID,AppStore账号,Telegram账号,发卡网搭建,图床搭建服务,谷歌账号出售,Gmail邮箱,Google Voice靓号';
const SEO_DESC = '提供优质Google谷歌账号、Gmail邮箱账号、Google Voice谷歌语音电话号(GV)靓号、苹果Apple ID、AppStore账号及Telegram账号出售，同时提供发卡网搭建、图床搭建、域名邮箱部署等服务，一站式解决账号与网站需求，稳定可靠，自动发货，支持长期使用。';
const SITE_TITLE = '号令天下账号专卖店';

// ── CSS ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #0a0a0f;
  --bg2: #12121a;
  --card: #16161f;
  --card-hover: #1c1c28;
  --border: #23233a;
  --primary: #6366f1;
  --primary-light: #818cf8;
  --accent: #22d3ee;
  --text: #e2e8f0;
  --text2: #94a3b8;
  --text3: #64748b;
  --radius: 16px;
  --max-w: 1280px;
  --glow: 0 0 30px rgba(99,102,241,.15);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.6;
  min-height: 100vh; overflow-x: hidden;
}

/* ── 背景装饰 ── */
body::before {
  content: ''; position: fixed; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at 20% 20%, rgba(99,102,241,.06) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(34,211,238,.04) 0%, transparent 50%);
  pointer-events: none; z-index: 0;
}

a { color: var(--primary-light); text-decoration: none; }
img { max-width: 100%; height: auto; }

.container { max-width: var(--max-w); margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

/* ── Header ── */
.header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,15,.85); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  max-width: var(--max-w); margin: 0 auto; padding: 16px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.logo-area { display: flex; align-items: center; gap: 14px; }
.logo-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; font-weight: 800; color: #fff;
}
.logo-text { font-size: 1.15rem; font-weight: 700; letter-spacing: -.5px; }
.header-badge {
  padding: 6px 14px; border-radius: 20px; font-size: .75rem; font-weight: 600;
  background: rgba(34,211,238,.1); color: var(--accent); border: 1px solid rgba(34,211,238,.2);
}

/* ── Hero ── */
.hero {
  text-align: center; padding: 80px 24px 60px; position: relative;
}
.hero::before {
  content: ''; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%);
  pointer-events: none;
}
.hero h1 {
  font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800;
  background: linear-gradient(135deg, #e2e8f0 0%, #818cf8 50%, #22d3ee 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; margin-bottom: 16px; letter-spacing: -1px;
}
.hero p {
  font-size: 1.05rem; color: var(--text2); max-width: 640px; margin: 0 auto 28px;
}
.hero-stats {
  display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;
}
.stat-item { text-align: center; }
.stat-num {
  font-size: 2rem; font-weight: 800; color: var(--primary-light);
  display: block; line-height: 1.2;
}
.stat-label { font-size: .8rem; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }

/* ── Category Filter ── */
.filter-bar {
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
  margin-bottom: 40px; padding: 0 16px;
}
.filter-btn {
  padding: 10px 22px; border-radius: 10px; cursor: pointer;
  font-size: .88rem; font-weight: 600; transition: all .25s;
  background: var(--card); color: var(--text2); border: 1px solid var(--border);
}
.filter-btn:hover { background: var(--card-hover); color: var(--text); border-color: var(--primary); }
.filter-btn.active {
  background: linear-gradient(135deg, var(--primary), #4f46e5);
  color: #fff; border-color: transparent; box-shadow: 0 4px 15px rgba(99,102,241,.3);
}

/* ── Product Grid ── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px; margin-bottom: 60px;
}

.product-card {
  background: var(--card); border-radius: var(--radius); overflow: hidden;
  border: 1px solid var(--border); transition: all .35s ease;
  cursor: pointer; position: relative;
}
.product-card:hover {
  transform: translateY(-6px); border-color: var(--primary);
  box-shadow: var(--glow), 0 20px 40px rgba(0,0,0,.3);
}
.product-card::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(99,102,241,.05), transparent);
  opacity: 0; transition: opacity .3s; pointer-events: none;
}
.product-card:hover::after { opacity: 1; }

.card-img-wrap {
  position: relative; overflow: hidden;
  height: 200px; background: var(--bg2);
}
.card-img-wrap img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform .4s ease;
}
.product-card:hover .card-img-wrap img { transform: scale(1.05); }

.card-tag {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; border-radius: 6px; font-size: .7rem; font-weight: 700;
  background: rgba(99,102,241,.9); color: #fff; backdrop-filter: blur(4px);
  text-transform: uppercase; letter-spacing: .5px;
}

.card-body { padding: 18px; }
.card-cat {
  font-size: .72rem; color: var(--accent); font-weight: 600;
  text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px;
}
.card-title {
  font-size: .95rem; font-weight: 700; line-height: 1.4; margin-bottom: 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; color: var(--text);
}
.card-price-row {
  display: flex; align-items: center; justify-content: space-between;
}
.card-price {
  font-size: 1.15rem; font-weight: 800; color: #f472b6;
}
.card-price .from { font-size: .7rem; font-weight: 500; color: var(--text3); margin-right: 2px; }
.card-arrow {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(99,102,241,.1); display: flex;
  align-items: center; justify-content: center;
  color: var(--primary-light); font-size: .9rem;
  transition: all .25s;
}
.product-card:hover .card-arrow {
  background: var(--primary); color: #fff;
}

/* ── Features ── */
.features {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px; margin: 60px 0;
}
.feature-card {
  background: var(--card); border-radius: var(--radius); padding: 28px;
  border: 1px solid var(--border); text-align: center;
  transition: all .3s;
}
.feature-card:hover { border-color: var(--primary); transform: translateY(-3px); }
.feature-icon {
  width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(99,102,241,.15), rgba(34,211,238,.1));
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.feature-card h3 { font-size: .95rem; font-weight: 700; margin-bottom: 6px; }
.feature-card p { font-size: .82rem; color: var(--text2); }

/* ── Footer ── */
.footer {
  text-align: center; padding: 40px 24px;
  border-top: 1px solid var(--border); color: var(--text3); font-size: .8rem;
}
.footer a { color: var(--text3); }
.footer a:hover { color: var(--primary-light); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero { padding: 50px 16px 40px; }
  .hero h1 { font-size: 1.6rem; }
  .hero-stats { gap: 24px; }
  .stat-num { font-size: 1.5rem; }
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .card-img-wrap { height: 150px; }
  .card-body { padding: 12px; }
  .card-title { font-size: .85rem; }
  .header-badge { display: none; }
  .container { padding: 0 16px; }
  .features { grid-template-columns: 1fr 1fr; gap: 12px; }
}
@media (max-width: 480px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .card-img-wrap { height: 130px; }
  .card-body { padding: 10px; }
}

/* ── Animations ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.animate { animation: fadeUp .5s ease forwards; opacity: 0; }
`;

// ── JS ──
const JS = `
function filterCategory(id, el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.product-card').forEach((c, i) => {
    if (id === 'all' || c.dataset.cat == id) {
      c.style.display = '';
      c.style.animation = 'fadeUp .35s ease forwards';
      c.style.animationDelay = (i * 0.04) + 's';
    } else {
      c.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fadeUp .5s ease forwards';
        e.target.style.animationDelay = (i * 0.06) + 's';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(c => observer.observe(c));
});
`;

function main() {
    const config = loadJSON('config.json') || {};
    const categories = loadJSON('categories.json') || [];
    const products = loadJSON('products.json') || [];
    const meta = loadJSON('meta.json') || {};

    if (!products.length) { console.error('❌ 没有商品数据'); process.exit(1); }

    const siteUrl = meta.siteUrl || 'https://hltx.eu.cc';
    const siteName = SITE_TITLE;

    // 确保输出目录存在
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

    // ── 分类按钮 ──
    const activeCats = categories.filter(c => products.some(p => p.category_id === c.id));
    const catBtns = activeCats
        .sort((a, b) => (b.sort || 0) - (a.sort || 0))
        .map(c => `<div class="filter-btn" onclick="filterCategory(${c.id}, this)">${esc(c.name)}</div>`)
        .join('\n            ');

    // ── 商品卡片 ──
    const cards = products.filter(p => p.active !== 0).sort((a, b) => (b.sort||0) - (a.sort||0)).map((p, i) => {
        const cat = categories.find(c => c.id === p.category_id);
        const catName = cat ? cat.name : '';
        const img = p.image_url ? fixImg(p.image_url, siteUrl) : '';
        const variants = p.variants || [];
        const minPrice = variants.length ? Math.min(...variants.map(v => v.price)) : 0;
        const tags = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        const tagLabel = tags[0] || '';

        return `
        <a class="product-card animate" href="${siteUrl}/product?id=${p.id}" target="_blank" rel="noopener"
           data-cat="${p.category_id}" style="animation-delay:${i*0.06}s;text-decoration:none;color:inherit;">
            <div class="card-img-wrap">
                ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy"
                    onerror="this.parentElement.style.background='var(--bg2)'">` : ''}
                ${tagLabel ? `<div class="card-tag">${esc(tagLabel)}</div>` : ''}
            </div>
            <div class="card-body">
                <div class="card-cat">${esc(catName)}</div>
                <div class="card-title">${esc(p.name)}</div>
                <div class="card-price-row">
                    <div class="card-price"><span class="from">起</span>¥${minPrice.toFixed(2)}</div>
                    <div class="card-arrow">→</div>
                </div>
            </div>
        </a>`;
    }).join('\n');

    // ── OG 图片（用第一个商品图或站点logo）──
    const ogImage = products[0]?.image_url
        ? fixImg(products[0].image_url, siteUrl)
        : (meta.siteLogo ? fixImg(meta.siteLogo, siteUrl) : '');

    // ── 结构化数据 (JSON-LD) ──
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "description": SEO_DESC,
        "url": `https://jhiyyu.github.io`,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/product?id={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    const itemListLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": products.filter(p => p.active !== 0).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "Product",
                "name": p.name,
                "url": `${siteUrl}/product?id=${p.id}`,
                "image": p.image_url ? fixImg(p.image_url, siteUrl) : '',
                "offers": {
                    "@type": "Offer",
                    "price": p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : 0,
                    "priceCurrency": "CNY"
                }
            }
        }))
    };

    // ── 首页 HTML ──
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- SEO Meta (隐藏，不显示在页面上) -->
    <title>${esc(siteName)} - Gmail账号 | Google Voice(GV)靓号 | 苹果Apple ID | Telegram账号</title>
    <meta name="description" content="${esc(SEO_DESC)}">
    <meta name="keywords" content="${esc(SEO_KEYWORDS)}">
    <meta name="author" content="${esc(siteName)}">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    <link rel="canonical" href="https://jhiyyu.github.io">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://jhiyyu.github.io">
    <meta property="og:title" content="${esc(siteName)}">
    <meta property="og:description" content="${esc(SEO_DESC)}">
    ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
    <meta property="og:locale" content="zh_CN">
    <meta property="og:site_name" content="${esc(siteName)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(siteName)}">
    <meta name="twitter:description" content="${esc(SEO_DESC)}">
    ${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}

    <!-- Structured Data -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <script type="application/ld+json">${JSON.stringify(itemListLd)}</script>

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏪</text></svg>">

    <style>${CSS}</style>
</head>
<body>

<header class="header">
    <div class="header-inner">
        <div class="logo-area">
            <div class="logo-icon">🏪</div>
            <div class="logo-text">${esc(siteName)}</div>
        </div>
        <div class="header-badge">🔒 自动发货 · 安全可靠</div>
    </div>
</header>

<section class="hero">
    <div class="container">
        <h1>精选优质账号资源</h1>
        <p>自动发货，安全快捷，一站式解决账号与网站需求，稳定可靠，支持长期使用。</p>
        <div class="hero-stats">
            <div class="stat-item">
                <span class="stat-num">${categories.length}</span>
                <span class="stat-label">商品分类</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${products.filter(p=>p.active!==0).length}</span>
                <span class="stat-label">在售商品</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${products.reduce((s,p) => s + (p.variants?.length||0), 0)}</span>
                <span class="stat-label">可选规格</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">24h</span>
                <span class="stat-label">自动发货</span>
            </div>
        </div>
    </div>
</section>

<div class="container">

    <!-- 分类过滤 -->
    <div class="filter-bar">
            <div class="filter-btn active" onclick="filterCategory('all', this)">全部商品</div>
            ${catBtns}
    </div>

    <!-- 商品网格 -->
    <div class="products-grid">
        ${cards}
    </div>

    <!-- 特性介绍 -->
    <div class="features">
        <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>即时发货</h3>
            <p>付款后自动发货，无需等待</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h3>品质保障</h3>
            <p>质保期内首登有问题可换</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>价格实惠</h3>
            <p>源头资源，性价比高</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>可选号码</h3>
            <p>支持自选靓号，精准匹配</p>
        </div>
    </div>

</div>

<footer class="footer">
    <div class="container">
        <p style="margin-bottom:8px">© ${new Date().getFullYear()} ${esc(siteName)} · 所有商品均为虚拟数字商品</p>
        <p>
            <a href="${siteUrl}" target="_blank" rel="noopener">进入商城</a>
        </p>
    </div>
</footer>

<script>${JS}</script>
</body>
</html>`;

    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
    console.log(`✅ dist/index.html (${(Buffer.byteLength(html)/1024).toFixed(1)}KB)`);
    console.log(`   商品: ${products.filter(p=>p.active!==0).length} 个`);
    console.log(`   分类: ${activeCats.length} 个`);
    console.log(`   SEO: keywords + description + OG + JSON-LD`);
    console.log(`   链接: 全部指向 ${siteUrl}/product?id=xxx`);
}

main();
