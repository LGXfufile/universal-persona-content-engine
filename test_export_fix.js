#!/usr/bin/env node

const FileExporter = require('./FileExporter');
const path = require('path');

// 测试修复后的导出功能
async function testExportFix() {
  console.log('🧪 测试修复后的导出功能...\n');
  
  const fileExporter = new FileExporter();
  
  // 模拟可能导致错误的数据结构
  const testCases = [
    {
      name: '完整数据测试',
      roleData: {
        roleId: 'test_001',
        roleDescription: '测试角色',
        analysis: {
          emotions: { 焦虑: '高', 期待: '中' },
          coreNeeds: ['需求1', '需求2'],
          contentAngles: ['角度1', '角度2'],
          keywords: ['关键词1', '关键词2'],
          productModel: {
            基础版: { 产品: '基础产品', 价格: 99, 转化率: '5%' }
          }
        }
      },
      titles: ['标题1', '标题2'],
      articles: [
        {
          title: '文章1',
          content: '这是测试内容',
          wordCount: 100,
          imagePrompts: [
            { filename: 'test1.jpg', description: '测试图片', prompt: '测试提示词' }
          ]
        }
      ],
      stats: {
        statistics: {
          totalWords: 100,
          avgWordsPerArticle: 100
        }
      }
    },
    {
      name: '空数据测试',
      roleData: null,
      titles: null,
      articles: null,
      stats: null
    },
    {
      name: '部分空数据测试',
      roleData: {
        roleId: 'test_002',
        analysis: {} // 空的analysis对象
      },
      titles: [],
      articles: [
        {
          title: null,
          content: null,
          imagePrompts: null
        }
      ],
      stats: {}
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 测试案例: ${testCase.name}`);
    
    try {
      const outputPath = path.join(__dirname, 'test_output', testCase.name.replace(/\s+/g, '_'));
      
      // 确保输出目录存在
      await require('fs-extra').ensureDir(outputPath);
      
      // 测试Markdown报告生成
      console.log('  - 测试Markdown报告生成...');
      await fileExporter.generateMarkdownReport(
        testCase.roleData,
        testCase.titles,
        testCase.articles,
        testCase.stats,
        outputPath
      );
      console.log('  ✅ Markdown报告生成成功');
      
      // 测试JSON导出
      console.log('  - 测试JSON导出...');
      await fileExporter.generateJsonExport(
        testCase.roleData,
        testCase.titles,
        testCase.articles,
        testCase.stats,
        outputPath
      );
      console.log('  ✅ JSON导出成功');
      
      // 测试文本导出
      console.log('  - 测试文本导出...');
      await fileExporter.generateTextExport(
        testCase.roleData,
        testCase.titles,
        testCase.articles,
        outputPath
      );
      console.log('  ✅ 文本导出成功');
      
      console.log(`  🎉 ${testCase.name} 全部通过!\n`);
      
    } catch (error) {
      console.error(`  ❌ ${testCase.name} 失败:`, error.message);
      console.error(`  错误堆栈:`, error.stack);
      console.log('');
    }
  }
  
  console.log('🏁 测试完成!');
}

// 运行测试
if (require.main === module) {
  testExportFix().catch(console.error);
}

module.exports = { testExportFix };