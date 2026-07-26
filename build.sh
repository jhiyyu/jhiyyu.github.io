#!/bin/bash
# ============================================================
# 静态站构建脚本 - 抓取数据 + 生成静态页面
# 用法: SITE_URL=https://xxx.com ./build.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  🛍️  xyfk 静态站生成器${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 SITE_URL
if [ -z "$SITE_URL" ]; then
    # 尝试从配置文件读取
    if [ -f ".env" ]; then
        source .env
    fi
fi

if [ -z "$SITE_URL" ]; then
    echo -e "${RED}❌ 请设置 SITE_URL 环境变量${NC}"
    echo -e "   用法: SITE_URL=https://xxx.com ./build.sh"
    echo -e "   或者: 创建 .env 文件写入 SITE_URL=https://xxx.com"
    exit 1
fi

echo -e "${YELLOW}📡 数据源: ${SITE_URL}${NC}"
echo ""

# Step 1: 抓取数据
echo -e "${BLUE}[1/2] 抓取商品数据...${NC}"
node fetch-data.js
echo ""

# Step 2: 生成静态站
echo -e "${BLUE}[2/2] 生成静态页面...${NC}"
node generate-site.js
echo ""

# 完成
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ 构建完成！${NC}"
echo -e "${GREEN}  📁 输出目录: ${SCRIPT_DIR}/dist/${NC}"
echo -e "${GREEN}  🔢 文件数: $(find dist -type f | wc -l)${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "预览: cd dist && python3 -m http.server 8080"
