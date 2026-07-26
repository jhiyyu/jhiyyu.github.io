# xyfk-hltx3 静态独立站

从 [xyfk-hltx3](https://github.com/zxmail/xyfk-hltx3) 项目抓取商品分类和商品数据，生成一个纯静态的独立站点。支持每12小时自动更新数据。

## 📦 项目结构

```
xyfk-static-site/
├── fetch-data.js       # 数据抓取脚本（调用源站 API）
├── generate-site.js    # 静态站生成器（JSON → HTML）
├── build.sh            # 一键构建脚本
├── .env.example        # 环境变量模板
├── .env                # 你的环境变量（需创建）
├── data/               # 抓取的 JSON 数据（自动生成）
│   ├── config.json     # 站点配置
│   ├── categories.json # 商品分类
│   ├── products.json   # 商品列表
│   └── meta.json       # 元数据
└── dist/               # 生成的静态站（可直接部署）
    ├── index.html      # 首页（商品列表+分类过滤+搜索）
    ├── favicon.svg
    └── products/
        ├── 1.html      # 商品详情页
        ├── 2.html
        └── ...
```

## 🚀 快速开始

### 方式一：GitHub Pages（推荐）

1. Fork 或上传本项目到你的 GitHub
2. 进入仓库 Settings → Pages → Source 选择 `gh-pages` 分支
3. 每12小时自动构建部署（GitHub Actions）
4. 手动触发：Actions → Build & Deploy → Run workflow

### 方式二：本地构建

```bash
SITE_URL=https://hltx.eu.cc ./build.sh
cd dist && python3 -m http.server 8080
```

## ⏰ 每12小时自动更新

### 方式一：Crontab（推荐）

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每12小时执行一次，0点和12点）
0 0,12 * * * cd /path/to/xyfk-static-site && SITE_URL=https://your-domain.com ./build.sh >> /tmp/xyfk-build.log 2>&1
```

### 方式二：Systemd Timer

```bash
# 创建 service 文件
sudo cat > /etc/systemd/system/xyfk-rebuild.service << 'EOF'
[Unit]
Description=Rebuild xyfk static site

[Service]
Type=oneshot
WorkingDirectory=/path/to/xyfk-static-site
ExecStart=/path/to/xyfk-static-site/build.sh
Environment=SITE_URL=https://your-domain.com
EOF

# 创建 timer 文件
sudo cat > /etc/systemd/system/xyfk-rebuild.timer << 'EOF'
[Unit]
Description=Rebuild xyfk static site every 12 hours

[Timer]
OnCalendar=*-*-* 00,12:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 启用
sudo systemctl enable --now xyfk-rebuild.timer
```

## 🌐 部署建议

生成的 `dist/` 目录是纯静态文件，可以部署到任何静态托管服务：

- **Cloudflare Pages** — 直接拖拽上传或 Git 集成
- **Vercel** — `vercel --prod dist/`
- **Netlify** — 拖拽 `dist/` 文件夹
- **GitHub Pages** — 推送到 `gh-pages` 分支
- **Nginx** — `root /path/to/dist;`
- **阿里云 OSS / 腾讯云 COS** — 静态网站托管

## 🔧 API 接口说明

本项目使用 xyfk-hltx3 的以下公开 API：

| 接口 | 说明 |
|------|------|
| `GET /api/shop/config` | 站点配置（名称、Logo等） |
| `GET /api/shop/categories` | 商品分类列表 |
| `GET /api/shop/products` | 所有上架商品（含规格和价格） |
| `GET /api/shop/product?id=X` | 单个商品详情 |

## 📝 注意事项

- 数据来源于原站 API，静态站不包含购买/支付功能
- 图片仍从原站加载（使用绝对路径），如需本地化图片可自行扩展
- 建议配合 CDN 使用以提升加载速度
- 生成的 HTML 文件支持 SEO（包含 OG 标签）
