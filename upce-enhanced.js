#!/usr/bin/env node

/**
 * UPCE 智能优化增强版 - 方案二主程序
 * 集成所有优化组件的完整实现
 */

const SmartAPIScheduler = require('./SmartAPIScheduler');
const ProgressiveGenerator = require('./ProgressiveGenerator');
const { CacheManager } = require('./CacheManager');
const UserExperienceOptimizer = require('./UserExperienceOptimizer');
const fs = require('fs-extra');
const path = require('path');

class UPCEEnhanced {
  constructor() {
    // 初始化核心组件
    this.apiScheduler = new SmartAPIScheduler();
    this.generator = new ProgressiveGenerator();
    this.cacheManager = new CacheManager();
    this.uiOptimizer = new UserExperienceOptimizer();
    
    // 系统配置
    this.config = {
      version: '2.0.0',
      mode: 'enhanced',
      features: {
        smartAPIScheduling: true,
        progressiveGeneration: true,
        localCache: true,
        offlineMode: true,
        realTimeProgress: true,
        interactiveUI: true
      }
    };
    
    this.outputDir = path.join(__dirname, 'upce_output');
    this.logger = null;
    
    this.initializeSystem();
  }

  async initializeSystem() {
    try {
      // 确保输出目录存在
      await fs.ensureDir(this.outputDir);
      
      // 初始化缓存系统
      await this.cacheManager.initializeCache();
      
      // 缓存预热（常用模板）
      await this.warmupCache();
      
      console.log('✅ UPCE智能优化增强版初始化完成');
    } catch (error) {
      console.log('⚠️ 系统初始化警告:', error.message);
    }
  }

  /**
   * 缓存预热
   */
  async warmupCache() {
    const commonQueries = [
      {
        key: '程序员转型做自媒体',
        generator: () => this.generateFallbackAnalysis('程序员转型做自媒体'),
        options: { type: 'analysis' }
      },
      {
        key: '宝妈想做副业创业',
        generator: () => this.generateFallbackAnalysis('宝妈想做副业创业'),
        options: { type: 'analysis' }
      }
    ];

    try {
      await this.cacheManager.warmupCache(commonQueries);
    } catch (error) {
      console.log('⚠️ 缓存预热失败，但不影响使用');
    }
  }

  /**
   * 主要生成方法 - 智能优化版本
   */
  async generateContent(roleDescription, options = {}) {
    const startTime = Date.now();
    
    try {
      // 启动优化的用户界面
      const result = await this.uiOptimizer.startOptimizedUI(
        this.generator,
        roleDescription,
        {
          titleCount: options.titleCount || 50,
          articleCount: options.articleCount || 3,
          includeImages: options.includeImages !== false,
          enableCache: options.enableCache !== false,
          ...options
        }
      );

      // 生成性能报告
      await this.generatePerformanceReport(result, startTime);
      
      return result;

    } catch (error) {
      console.error('❌ 生成过程出错:', error.message);
      
      // 尝试部分恢复
      const partialResult = await this.handlePartialFailure(roleDescription, error);
      return partialResult;
    }
  }

  /**
   * 处理部分失败情况
   */
  async handlePartialFailure(roleDescription, error) {
    console.log('🔄 尝试部分恢复...');
    
    try {
      // 使用缓存和离线模式生成基础内容
      const analysis = await this.cacheManager.getOrGenerate(
        `analysis_${roleDescription}`,
        () => this.generateFallbackAnalysis(roleDescription),
        { type: 'analysis', roleDescription }
      );

      const titles = await this.cacheManager.getOrGenerate(
        `titles_${roleDescription}`,
        () => this.generateFallbackTitles(roleDescription, 10),
        { type: 'titles', roleDescription, count: 10 }
      );

      const articles = await this.cacheManager.getOrGenerate(
        `articles_${roleDescription}`,
        () => this.generateFallbackArticles(titles.slice(0, 3), roleDescription),
        { type: 'articles', titles: titles.slice(0, 3), roleDescription }
      );

      // 创建部分成功的结果
      const partialResult = {
        sessionId: 'partial_' + Date.now(),
        roleDescription,
        status: 'partial_success',
        error: error.message,
        stages: {
          analysis,
          titles,
          articles,
          images: { successful: [], failed: [], total: 0 }
        },
        duration: 0,
        fallback: true
      };

      // 导出部分结果
      await this.exportPartialResult(partialResult);
      
      return partialResult;

    } catch (fallbackError) {
      throw new Error(`完全失败: ${error.message} | 恢复失败: ${fallbackError.message}`);
    }
  }

  /**
   * 导出部分结果
   */
  async exportPartialResult(result) {
    try {
      const outputPath = path.join(this.outputDir, result.stages.analysis.roleId);
      await fs.ensureDir(outputPath);
      await fs.ensureDir(path.join(outputPath, 'articles'));

      // 保存分析报告
      await fs.writeFile(
        path.join(outputPath, 'analysis_report.md'),
        this.formatAnalysisReport(result.stages.analysis)
      );

      // 保存标题列表
      await fs.writeFile(
        path.join(outputPath, 'titles.txt'),
        result.stages.titles.map((title, index) => `${index + 1}. ${title}`).join('\n')
      );

      // 保存文章
      for (let i = 0; i < result.stages.articles.length; i++) {
        const article = result.stages.articles[i];
        await fs.writeFile(
          path.join(outputPath, 'articles', `article_${String(i + 1).padStart(3, '0')}.md`),
          article.content
        );
      }

      // 保存状态信息
      await fs.writeJson(
        path.join(outputPath, 'generation_status.json'),
        {
          status: result.status,
          error: result.error,
          generatedAt: new Date().toISOString(),
          fallback: true
        },
        { spaces: 2 }
      );

      console.log(`📁 部分结果已保存到: ${outputPath}`);
      
    } catch (error) {
      console.log('⚠️ 部分结果保存失败:', error.message);
    }
  }

  /**
   * 生成性能报告
   */
  async generatePerformanceReport(result, startTime) {
    try {
      const performanceData = {
        sessionId: result.sessionId,
        totalDuration: Date.now() - startTime,
        generationDuration: result.duration,
        systemOverhead: (Date.now() - startTime) - result.duration,
        
        // API性能
        apiStats: this.apiScheduler.getStatusReport(),
        
        // 缓存性能
        cacheStats: this.cacheManager.getCacheReport(),
        
        // 内容统计
        contentStats: {
          titlesGenerated: result.stages.titles?.length || 0,
          articlesGenerated: result.stages.articles?.length || 0,
          imagesGenerated: result.stages.images?.successful?.length || 0,
          totalWords: this.calculateTotalWords(result.stages.articles),
          avgWordsPerArticle: this.calculateAvgWords(result.stages.articles)
        },
        
        // 系统资源
        systemStats: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          nodeVersion: process.version
        },
        
        timestamp: new Date().toISOString()
      };

      // 保存性能报告
      const reportPath = path.join(this.outputDir, result.stages.analysis.roleId, 'performance_report.json');
      await fs.writeJson(reportPath, performanceData, { spaces: 2 });
      
      console.log(`📊 性能报告已保存: ${reportPath}`);
      
    } catch (error) {
      console.log('⚠️ 性能报告生成失败:', error.message);
    }
  }

  // 辅助方法
  generateFallbackAnalysis(roleDescription) {
    const crypto = require('crypto');
    const roleId = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 8);
    
    return {
      roleId: `role_${roleId}`,
      roleDescription,
      analysis: {
        emotions: { 期待: "高", 焦虑: "中等", 兴奋: "中等" },
        coreNeeds: [
          "获得实用的解决方案",
          "得到他人的认同和支持", 
          "实现个人价值和成长"
        ],
        contentAngles: [
          "真实经历分享",
          "实用方法介绍",
          "心路历程记录",
          "成功案例展示"
        ],
        keywords: roleDescription.split(/[，。、\s]+/).filter(w => w.length > 1),
        productModel: {
          "入门级": { 产品: "基础指导", 价格: "99", 转化率: "15%" },
          "进阶级": { 产品: "深度咨询", 价格: "599", 转化率: "8%" },
          "专业级": { 产品: "一对一服务", 价格: "1999", 转化率: "3%" },
          "VIP级": { 产品: "全程陪伴", 价格: "9999", 转化率: "1%" }
        }
      },
      generatedAt: new Date().toISOString(),
      fallback: true
    };
  }

  generateFallbackTitles(roleDescription, count = 10) {
    const titleTemplates = [
      `${roleDescription}的真实经历分享`,
      `从零开始：${roleDescription}的成长之路`,
      `${roleDescription}必看的实用指南`,
      `${roleDescription}如何实现突破`,
      `${roleDescription}的成功秘诀大公开`,
      `${roleDescription}踩过的坑，你别再踩`,
      `${roleDescription}三个月的蜕变记录`,
      `${roleDescription}最全攻略，建议收藏`,
      `${roleDescription}的实战经验分享`,
      `${roleDescription}如何突破瓶颈期`
    ];

    const titles = [];
    for (let i = 0; i < count; i++) {
      const template = titleTemplates[i % titleTemplates.length];
      titles.push(i > 9 ? `${template} (${Math.floor(i/10) + 1})` : template);
    }

    return titles;
  }

  generateFallbackArticles(titles, roleDescription) {
    return titles.map((title, index) => ({
      title,
      content: this.generateFallbackArticleContent(title, roleDescription),
      wordCount: 1200 + Math.floor(Math.random() * 400),
      imagePrompts: [
        {
          filename: `image_${index + 1}_1.jpg`,
          description: `${title}相关场景图`,
          prompt: `真实生活场景，${roleDescription}，温暖色调，自然光线，高清摄影`
        }
      ],
      fallback: true
    }));
  }

  generateFallbackArticleContent(title, roleDescription) {
    return `# ${title}

## 写在前面

大家好，我是一个普通的${roleDescription}。

今天想和大家分享一下我的真实经历，希望能对有同样想法的朋友有所帮助。

## 我的故事

三个月前，我还在为各种问题发愁。那时候的我，每天都在思考如何改变现状。

### 第一步：明确目标

一开始我也很迷茫，不知道从哪里开始。后来通过学习和思考，我逐渐找到了方向。

### 第二步：制定计划

有了目标后，我开始制定具体的行动计划。这个过程虽然困难，但非常重要。

### 第三步：坚持执行

计划制定好后，最重要的就是坚持执行。这期间遇到了很多困难，但我都一一克服了。

## 我的收获

经过这段时间的努力，我获得了很多：

1. **技能提升** - 学会了很多实用的方法
2. **心态转变** - 变得更加积极主动
3. **收入增长** - 实现了经济状况的改善
4. **人际关系** - 认识了很多志同道合的朋友

## 给大家的建议

基于我的经验，给大家几点建议：

1. **要有耐心** - 任何改变都需要时间
2. **要坚持学习** - 不断提升自己的能力
3. **要勇于尝试** - 不要害怕失败
4. **要保持初心** - 记住自己的目标

## 写在最后

这就是我的经历分享，希望能对大家有所启发。

如果你也有类似的想法，不妨从今天开始行动。记住，最好的时机就是现在！

---

*本文为真实经历分享，仅供参考。每个人的情况不同，请结合自身实际情况进行判断。*`;
  }

  formatAnalysisReport(analysis) {
    return `# 角色深度分析报告

## 基本信息
- **角色描述**: ${analysis.roleDescription}
- **角色ID**: ${analysis.roleId}
- **生成时间**: ${analysis.generatedAt}

## 情绪分析
${Object.entries(analysis.analysis.emotions).map(([emotion, level]) => `- **${emotion}**: ${level}`).join('\n')}

## 核心需求
${analysis.analysis.coreNeeds.map((need, index) => `${index + 1}. ${need}`).join('\n')}

## 内容切入点
${analysis.analysis.contentAngles.map((angle, index) => `${index + 1}. ${angle}`).join('\n')}

## 关键词库
${analysis.analysis.keywords.map(keyword => `\`${keyword}\``).join(' | ')}

## 产品变现模型
${Object.entries(analysis.analysis.productModel).map(([tier, details]) => 
`### ${tier}
- **产品**: ${details.产品}
- **价格**: ${details.价格}元
- **转化率**: ${details.转化率}`).join('\n\n')}
`;
  }

  calculateTotalWords(articles) {
    if (!articles || !Array.isArray(articles)) return 0;
    return articles.reduce((total, article) => total + (article.wordCount || 0), 0);
  }

  calculateAvgWords(articles) {
    if (!articles || !Array.isArray(articles) || articles.length === 0) return 0;
    return Math.round(this.calculateTotalWords(articles) / articles.length);
  }
}

// 主程序入口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 UPCE智能优化增强版 v2.0

使用方法:
  node upce-enhanced.js "角色描述" [选项]

选项:
  --titles=N          生成N个标题 (默认: 50)
  --articles=N        生成N篇文章 (默认: 3)
  --no-images         不生成图片
  --no-cache          不使用缓存
  --no-ui             不使用交互式界面
  --help, -h          显示此帮助信息

示例:
  node upce-enhanced.js "程序员转型做自媒体"
  node upce-enhanced.js "宝妈想做副业" --titles=30 --articles=5
  node upce-enhanced.js "健身教练做线上私教" --no-images

新特性:
  ✨ 智能API调度和负载均衡
  ✨ 渐进式内容生成和断点续传
  ✨ 本地缓存和离线模式
  ✨ 实时进度显示和交互式界面
`);
    return;
  }

  const roleDescription = args[0];
  if (!roleDescription) {
    console.error('❌ 请提供角色描述');
    console.log('示例: node upce-enhanced.js "程序员转型做自媒体"');
    process.exit(1);
  }

  // 解析选项
  const options = {};
  args.forEach(arg => {
    if (arg.startsWith('--titles=')) {
      options.titleCount = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--articles=')) {
      options.articleCount = parseInt(arg.split('=')[1]);
    } else if (arg === '--no-images') {
      options.includeImages = false;
    } else if (arg === '--no-cache') {
      options.enableCache = false;
    } else if (arg === '--no-ui') {
      options.enableUI = false;
    }
  });

  try {
    const upce = new UPCEEnhanced();
    const result = await upce.generateContent(roleDescription, options);
    
    if (result.status === 'partial_success') {
      console.log('\n⚠️ 生成部分完成，请查看输出目录获取可用内容');
      process.exit(1);
    } else {
      console.log('\n🎉 内容生成完全成功！');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ 生成失败:', error.message);
    console.log('\n💡 建议:');
    console.log('1. 检查网络连接和API配置');
    console.log('2. 尝试使用演示版本: node upce-demo.js');
    console.log('3. 查看详细错误日志');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('程序执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = UPCEEnhanced;