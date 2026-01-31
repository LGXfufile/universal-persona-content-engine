#!/bin/bash

# UPCE 快速使用脚本
# 使用方法: ./quick-start.sh

echo "🚀 UPCE万能虚拟产品生成系统 - 快速开始"
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
else
    echo "✅ 依赖已存在"
fi

# 添加执行权限
chmod +x upce-demo.js upce-quick.js upce.js

echo ""
echo "🎯 选择运行模式:"
echo "1. 演示版本 (推荐新手，无需API，速度最快)"
echo "2. 快速版本 (需要DeepSeek API)"
echo "3. 完整版本 (需要DeepSeek + 阿里云API)"
echo ""

read -p "请选择模式 (1-3): " mode

case $mode in
    1)
        script="upce-demo.js"
        echo "✅ 选择演示版本"
        ;;
    2)
        script="upce-quick.js"
        echo "✅ 选择快速版本"
        ;;
    3)
        script="upce.js"
        echo "✅ 选择完整版本"
        ;;
    *)
        echo "❌ 无效选择，使用默认演示版本"
        script="upce-demo.js"
        ;;
esac

echo ""
echo "📝 请输入角色描述 (例如: 三线城市32岁健身教练，月入6000，想做线上私教):"
read -p "> " role_description

if [ -z "$role_description" ]; then
    echo "❌ 角色描述不能为空"
    exit 1
fi

echo ""
echo "🚀 开始生成内容..."
echo "=================================================="

# 运行脚本
node "$script" "$role_description"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 生成完成！"
    echo "📁 输出目录: upce_output/"
    echo ""
    echo "🎯 下一步操作:"
    echo "1. 查看生成内容: open upce_output/"
    echo "2. 阅读使用说明: open upce_output/*/README.md"
    echo "3. 开始发布内容到各大平台"
    echo ""
    echo "💡 提示: 可以重复运行此脚本生成更多角色的内容"
else
    echo "❌ 生成失败，请检查错误信息"
    exit 1
fi