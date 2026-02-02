#!/bin/bash

# UPCE 图片生成测试脚本
# 使用方法: ./test-images.sh

echo "🧪 UPCE图片生成API测试工具"
echo "=================================================="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 18+"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js环境检查通过"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络连接"
        exit 1
    fi
    echo "✅ 依赖安装完成"
fi

# 添加执行权限
chmod +x test-image-api.js

echo ""
echo "🎯 选择测试模式:"
echo "1. 快速测试 (推荐，只测试一个提示词)"
echo "2. 完整测试 (测试所有API和提示词)"
echo "3. 查看配置说明"
echo "4. 查看帮助信息"
echo ""

read -p "请选择模式 (1-4): " mode

case $mode in
    1)
        echo "⚡ 运行快速测试..."
        node test-image-api.js --quick
        ;;
    2)
        echo "🔍 运行完整测试..."
        node test-image-api.js
        ;;
    3)
        node test-image-api.js --config
        ;;
    4)
        node test-image-api.js --help
        ;;
    *)
        echo "❌ 无效选择，运行快速测试"
        node test-image-api.js --quick
        ;;
esac

echo ""
echo "💡 测试完成后的建议:"
echo "- 如果所有API都失败，使用演示版本: node upce-demo.js"
echo "- 如果有API成功，可以使用完整版本: node upce.js"
echo "- 查看详细报告: cat image_api_test_report.json"