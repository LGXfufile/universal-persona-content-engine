#!/bin/bash

# UPCE 智能批处理脚本
# 使用方法: ./batch-generate.sh

echo "🚀 UPCE智能批处理工具"
echo "=================================================="

# 预定义角色库
roles=(
    "十八线小城市宝妈，想买车"
    "25岁程序员，想做技术自媒体"
    "32岁健身教练，想做线上私教"
    "35岁宝妈，想通过小红书做副业"
    "28岁设计师，想做独立工作室"
)

echo "📋 可选角色："
for i in "${!roles[@]}"; do
    echo "   $((i+1)). ${roles[i]}"
done
echo "   6. 自定义角色"
echo ""

read -p "请选择角色 (1-6): " choice

case $choice in
    [1-5])
        selected_role="${roles[$((choice-1))]}"
        ;;
    6)
        read -p "请输入自定义角色描述: " selected_role
        ;;
    *)
        echo "❌ 无效选择，使用默认角色"
        selected_role="${roles[0]}"
        ;;
esac

echo ""
echo "🎯 选择生成模式："
echo "   1. 演示模式 (快速，无API依赖)"
echo "   2. 快速模式 (真实AI，仅文本)"
echo "   3. 完整模式 (包含图片生成)"
echo ""

read -p "请选择模式 (1-3): " mode

echo ""
echo "🚀 开始生成内容..."
echo "角色: $selected_role"

case $mode in
    1)
        echo "📝 使用演示模式..."
        node upce-demo.js "$selected_role"
        ;;
    2)
        echo "🤖 使用快速模式..."
        node upce-quick.js "$selected_role"
        ;;
    3)
        echo "🎨 使用完整模式..."
        node upce.js "$selected_role"
        ;;
    *)
        echo "❌ 无效选择，使用演示模式"
        node upce-demo.js "$selected_role"
        ;;
esac

echo ""
echo "✅ 生成完成！"
echo "📁 查看输出目录: ls upce_output/"
echo "🌐 打开输出目录: open upce_output/"