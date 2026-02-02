#!/bin/bash

# UPCE 一键启动脚本
# 使用方法: ./start-upce.sh

echo "🚀 UPCE内容生成系统"
echo "=================================================="
echo ""

# 显示系统状态
echo "📊 系统状态检查..."
if [ -d "node_modules" ]; then
    echo "✅ 依赖已安装"
else
    echo "⚠️ 依赖未安装，正在安装..."
    npm install
fi

if [ -f "upce-demo.js" ]; then
    echo "✅ 核心文件完整"
else
    echo "❌ 核心文件缺失"
    exit 1
fi

echo ""
echo "🎯 选择生成模式："
echo "   1. 演示模式 (推荐新手) - 快速稳定，无需API"
echo "   2. 快速模式 (推荐日常) - 真实AI生成，仅文本"
echo "   3. 完整模式 (专业版) - 包含图片生成"
echo "   4. 批量生成模式 - 多个角色批量处理"
echo "   5. 查看历史生成 - 浏览已生成内容"
echo ""

read -p "请选择模式 (1-5): " mode

case $mode in
    1)
        echo ""
        echo "📝 演示模式 - 快速体验完整功能"
        read -p "请输入角色描述: " role
        if [ -z "$role" ]; then
            role="十八线小城市宝妈，想买车"
            echo "使用默认角色: $role"
        fi
        echo "🚀 开始生成..."
        node upce-demo.js "$role"
        ;;
    2)
        echo ""
        echo "🤖 快速模式 - 真实AI生成"
        if [ -z "$DEEPSEEK_API_KEY" ]; then
            echo "⚠️ 未检测到DEEPSEEK_API_KEY环境变量"
            read -p "是否继续使用内置API Key? (y/n): " continue
            if [ "$continue" != "y" ]; then
                echo "请设置环境变量: export DEEPSEEK_API_KEY='your_key'"
                exit 1
            fi
        fi
        read -p "请输入角色描述: " role
        if [ -z "$role" ]; then
            role="25岁程序员，想做技术自媒体"
            echo "使用默认角色: $role"
        fi
        echo "🚀 开始生成..."
        node upce-quick.js "$role"
        ;;
    3)
        echo ""
        echo "🎨 完整模式 - 包含图片生成"
        echo "⚠️ 此模式需要较长时间，建议先测试图片API"
        read -p "是否先测试图片API? (y/n): " test_api
        if [ "$test_api" = "y" ]; then
            ./test-images.sh
            read -p "API测试完成，是否继续完整生成? (y/n): " continue
            if [ "$continue" != "y" ]; then
                exit 0
            fi
        fi
        read -p "请输入角色描述: " role
        if [ -z "$role" ]; then
            role="32岁健身教练，想做线上私教"
            echo "使用默认角色: $role"
        fi
        echo "🚀 开始生成（预计需要5-10分钟）..."
        node upce.js "$role"
        ;;
    4)
        echo ""
        echo "📦 批量生成模式"
        ./batch-generate.sh
        ;;
    5)
        echo ""
        echo "📁 历史生成内容："
        ls -la upce_output/ | grep "^d" | tail -10
        echo ""
        read -p "请输入要查看的目录名（或按回车查看最新）: " dir_name
        if [ -z "$dir_name" ]; then
            latest_dir=$(ls -t upce_output/ | head -1)
            dir_name=$latest_dir
        fi
        
        if [ -d "upce_output/$dir_name" ]; then
            echo "📋 目录内容："
            ls -la "upce_output/$dir_name/"
            echo ""
            echo "🌐 打开目录："
            open "upce_output/$dir_name/" 2>/dev/null || echo "请手动打开: upce_output/$dir_name/"
        else
            echo "❌ 目录不存在: $dir_name"
        fi
        ;;
    *)
        echo "❌ 无效选择，使用演示模式"
        node upce-demo.js "十八线小城市宝妈，想买车"
        ;;
esac

echo ""
echo "✅ 操作完成！"
echo ""
echo "💡 下次使用提示："
echo "   - 快速启动: ./start-upce.sh"
echo "   - 查看输出: ls upce_output/"
echo "   - 打开目录: open upce_output/"
echo ""
echo "📚 更多功能："
echo "   - 批量处理: ./batch-generate.sh"
echo "   - API测试: ./test-images.sh"
echo "   - 查看文档: open README.md"