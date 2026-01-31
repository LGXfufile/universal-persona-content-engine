#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

class FileExporter {
  constructor() {
    this.exportFormats = ['zip', 'markdown', 'json', 'txt'];
  }

  // 创建ZIP压缩包
  async createZipArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`✅ ZIP文件创建完成: ${path.basename(outputPath)} (${archive.pointer()} bytes)`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  // 生成Markdown格式的完整报告
  async generateMarkdownReport(roleData, titles, articles, stats, outputPath) {
    const reportContent = `# UPCE内容生成报告

## 📊 生成概览

- **角色描述**: ${roleData.roleDescription}
- **角色ID**: ${roleData.roleId}
- **生成时间**: ${new Date().toLocaleString('zh-CN')}
- **标题数量**: ${titles.length}
- **文章数量**: ${articles.length}
- **总字数**: ${stats.statistics.totalWords.toLocaleString()}
- **平均字数**: ${stats.statistics.avgWordsPerArticle}

## 🧠 角色分析

### 深层情绪分析
${Object.entries(roleData.analysis.emotions).map(([emotion, level]) => 
  `- **${emotion}**: ${level}`
).join('\n')}

### 核心需求
${roleData.analysis.coreNeeds.map((need, index) => `${index + 1}. ${need}`).join('\n')}

### 内容切入点
${roleData.analysis.contentAngles.map((angle, index) => `${index + 1}. ${angle}`).join('\n')}

### 关键词库
${roleData.analysis.keywords.map(keyword => `\`${keyword}\``).join(' | ')}

### 产品变现模型

${Object.entries(roleData.analysis.productModel).map(([tier, details]) => 
  `#### ${tier}
- **产品**: ${details.产品}
- **价格**: ${details.价格}元
- **转化率**: ${details.转化率}
`
).join('\n')}

## 📝 标题列表

${titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

## 📚 文章预览

${articles.slice(0, 5).map((article, index) => `
### 文章 ${index + 1}: ${article.title}

**字数**: ${article.wordCount}
**配图数量**: ${article.imagePrompts.length}

**内容预览**:
${article.content.substring(0, 200)}...

---
`).join('\n')}

${articles.length > 5 ? `\n*还有 ${articles.length - 5} 篇文章，请查看articles目录获取完整内容*\n` : ''}

## 🎨 配图信息

本次生成共包含 ${articles.reduce((sum, article) => sum + article.imagePrompts.length, 0)} 张配图，涵盖以下场景：

${articles.slice(0, 3).map((article, index) => `
### 文章 ${index + 1} 配图
${article.imagePrompts.map(img => `- ${img.description}: \`${img.filename}\``).join('\n')}
`).join('\n')}

## 📁 文件结构

\`\`\`
${roleData.roleId}/
├── analysis_report.md          # 角色分析报告
├── titles.txt                  # 标题列表
├── complete_report.md          # 完整报告（本文件）
├── generation_stats.json      # 统计数据
├── image_prompts.json         # 配图提示词
├── image_generation_report.json # 配图生成报告
├── articles/                   # 文章目录
│   ├── article_001.md
│   ├── article_002.md
│   └── ...
└── images/                     # 配图目录
    ├── image_xxx_001_1.jpg
    ├── image_xxx_001_2.jpg
    └── ...
\`\`\`

## 🚀 使用建议

### 发布平台推荐
1. **小红书**: 适合生活化内容，配图丰富
2. **抖音**: 可制作短视频，配合文案
3. **微信公众号**: 长文形式，深度内容
4. **知乎**: 专业性内容，问答形式

### 发布策略
1. **频率控制**: 每天1-2篇，避免刷屏
2. **时间选择**: 晚上7-9点，周末效果更佳
3. **标题优化**: 根据平台特点调整标题
4. **互动引导**: 文末添加互动问题

### 变现路径
1. **引流**: 通过优质内容吸引关注
2. **信任**: 持续输出价值建立信任
3. **转化**: 适时推出付费产品
4. **复购**: 提供持续价值服务

---

*本报告由UPCE万能虚拟产品生成系统自动生成*
*生成时间: ${new Date().toLocaleString('zh-CN')}*
`;

    const reportPath = path.join(outputPath, 'complete_report.md');
    await fs.writeFile(reportPath, reportContent);
    return reportPath;
  }

  // 生成JSON格式的结构化数据
  async generateJsonExport(roleData, titles, articles, stats, outputPath) {
    const jsonData = {
      metadata: {
        roleId: roleData.roleId,
        roleDescription: roleData.roleDescription,
        generatedAt: new Date().toISOString(),
        version: "1.0.0",
        generator: "UPCE"
      },
      analysis: roleData.analysis,
      content: {
        titles: titles,
        articles: articles.map(article => ({
          title: article.title,
          content: article.content,
          wordCount: article.wordCount,
          images: article.imagePrompts.map(img => ({
            filename: img.filename,
            description: img.description,
            prompt: img.prompt
          }))
        }))
      },
      statistics: stats.statistics
    };

    const jsonPath = path.join(outputPath, 'export_data.json');
    await fs.writeJson(jsonPath, jsonData, { spaces: 2 });
    return jsonPath;
  }

  // 生成纯文本格式
  async generateTextExport(roleData, titles, articles, outputPath) {
    let textContent = `UPCE内容生成导出\n`;
    textContent += `${'='.repeat(50)}\n\n`;
    textContent += `角色描述: ${roleData.roleDescription}\n`;
    textContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    textContent += `标题数量: ${titles.length}\n`;
    textContent += `文章数量: ${articles.length}\n\n`;

    textContent += `标题列表:\n`;
    textContent += `${'-'.repeat(30)}\n`;
    titles.forEach((title, index) => {
      textContent += `${index + 1}. ${title}\n`;
    });

    textContent += `\n\n文章内容:\n`;
    textContent += `${'-'.repeat(30)}\n`;
    articles.forEach((article, index) => {
      textContent += `\n[文章 ${index + 1}] ${article.title}\n`;
      textContent += `字数: ${article.wordCount}\n`;
      textContent += `${'-'.repeat(20)}\n`;
      textContent += article.content.replace(/!\[.*?\]\(.*?\)/g, '[图片]');
      textContent += `\n${'='.repeat(50)}\n`;
    });

    const textPath = path.join(outputPath, 'export_content.txt');
    await fs.writeFile(textPath, textContent);
    return textPath;
  }

  // 创建发布就绪的文件包
  async createPublishPackage(roleData, titles, articles, stats, outputPath) {
    const publishDir = path.join(outputPath, 'publish_ready');
    await fs.ensureDir(publishDir);

    console.log('📦 创建发布就绪包...');

    // 为每个平台创建优化版本
    const platforms = {
      xiaohongshu: '小红书',
      douyin: '抖音',
      weixin: '微信公众号',
      zhihu: '知乎'
    };

    for (const [platform, name] of Object.entries(platforms)) {
      const platformDir = path.join(publishDir, platform);
      await fs.ensureDir(platformDir);

      // 根据平台特点优化内容
      const optimizedArticles = await this.optimizeForPlatform(articles, platform);
      
      // 保存优化后的内容
      for (let i = 0; i < Math.min(optimizedArticles.length, 10); i++) {
        const article = optimizedArticles[i];
        const filename = `${platform}_article_${String(i + 1).padStart(2, '0')}.md`;
        await fs.writeFile(path.join(platformDir, filename), article.content);
      }

      // 创建平台说明文件
      const platformGuide = this.generatePlatformGuide(platform, name);
      await fs.writeFile(path.join(platformDir, 'README.md'), platformGuide);
    }

    return publishDir;
  }

  // 根据平台优化内容
  async optimizeForPlatform(articles, platform) {
    return articles.map(article => {
      let optimizedContent = article.content;

      switch (platform) {
        case 'xiaohongshu':
          // 小红书：添加emoji，缩短段落
          optimizedContent = this.addEmojis(optimizedContent);
          optimizedContent = this.shortenParagraphs(optimizedContent);
          break;
        
        case 'douyin':
          // 抖音：提取关键点，适合短视频
          optimizedContent = this.extractKeyPoints(optimizedContent);
          break;
        
        case 'weixin':
          // 微信：保持原格式，添加引导关注
          optimizedContent += '\n\n---\n\n💡 **觉得有用请点赞关注，更多干货持续分享！**';
          break;
        
        case 'zhihu':
          // 知乎：增加专业性，添加数据支撑
          optimizedContent = this.addProfessionalTone(optimizedContent);
          break;
      }

      return {
        ...article,
        content: optimizedContent
      };
    });
  }

  // 添加emoji
  addEmojis(content) {
    const emojiMap = {
      '第一': '1️⃣',
      '第二': '2️⃣', 
      '第三': '3️⃣',
      '重要': '⚠️',
      '建议': '💡',
      '经验': '✨',
      '收入': '💰',
      '成功': '🎉'
    };

    let result = content;
    Object.entries(emojiMap).forEach(([text, emoji]) => {
      result = result.replace(new RegExp(text, 'g'), `${emoji} ${text}`);
    });

    return result;
  }

  // 缩短段落
  shortenParagraphs(content) {
    return content.split('\n\n').map(paragraph => {
      if (paragraph.length > 100) {
        const sentences = paragraph.split('。');
        return sentences.slice(0, 2).join('。') + '。';
      }
      return paragraph;
    }).join('\n\n');
  }

  // 提取关键点
  extractKeyPoints(content) {
    const lines = content.split('\n');
    const keyPoints = [];
    
    lines.forEach(line => {
      if (line.includes('第一') || line.includes('第二') || line.includes('第三') ||
          line.includes('重要') || line.includes('建议') || line.includes('关键')) {
        keyPoints.push(line.trim());
      }
    });

    return `# 核心要点\n\n${keyPoints.join('\n\n')}\n\n*详细内容请查看完整文章*`;
  }

  // 添加专业语调
  addProfessionalTone(content) {
    const professionalPhrases = [
      '根据市场调研数据显示',
      '从用户行为分析来看',
      '基于实际案例验证',
      '通过数据对比发现'
    ];

    let result = content;
    const randomPhrase = professionalPhrases[Math.floor(Math.random() * professionalPhrases.length)];
    result = result.replace(/^## /, `## ${randomPhrase}，`);

    return result;
  }

  // 生成平台发布指南
  generatePlatformGuide(platform, name) {
    const guides = {
      xiaohongshu: `# ${name}发布指南

## 📱 平台特点
- 用户群体：18-35岁女性为主
- 内容偏好：生活化、实用性强
- 发布时间：晚上8-10点效果最佳

## 📝 内容优化
- 标题控制在20字以内
- 多使用emoji增加亲和力
- 配图要求高质量、生活化
- 文案要有代入感

## 🎯 发布策略
1. 首图要吸引眼球
2. 前3行文字要有钩子
3. 适当使用话题标签
4. 引导用户互动评论`,

      douyin: `# ${name}发布指南

## 📱 平台特点
- 短视频为主，文字为辅
- 算法推荐机制
- 用户停留时间短

## 📝 内容优化
- 提取核心观点制作视频
- 文案简洁有力
- 前3秒要抓住注意力
- 配合热门音乐

## 🎯 发布策略
1. 黄金3秒法则
2. 使用热门话题
3. 发布时间：中午12点、晚上7-9点
4. 持续更新保持活跃度`,

      weixin: `# ${name}发布指南

## 📱 平台特点
- 长文阅读习惯
- 用户粘性高
- 转发分享率高

## 📝 内容优化
- 保持原文完整性
- 添加引导关注语句
- 适当插入相关链接
- 文末添加互动问题

## 🎯 发布策略
1. 标题要有吸引力
2. 开头要有钩子
3. 中间要有干货
4. 结尾要有行动指引`,

      zhihu: `# ${name}发布指南

## 📱 平台特点
- 专业性要求高
- 用户喜欢深度内容
- 数据和案例很重要

## 📝 内容优化
- 增加数据支撑
- 提供具体案例
- 逻辑结构清晰
- 专业术语适度

## 🎯 发布策略
1. 回答相关问题
2. 发布专栏文章
3. 参与话题讨论
4. 建立专业形象`
    };

    return guides[platform] || `# ${name}发布指南\n\n请根据平台特点优化内容发布。`;
  }

  // 主导出功能
  async exportAll(roleData, titles, articles, stats, outputPath) {
    console.log('📦 开始导出所有格式...');

    const exports = {};

    try {
      // 生成Markdown完整报告
      exports.markdown = await this.generateMarkdownReport(roleData, titles, articles, stats, outputPath);
      console.log('✅ Markdown报告生成完成');

      // 生成JSON数据
      exports.json = await this.generateJsonExport(roleData, titles, articles, stats, outputPath);
      console.log('✅ JSON数据导出完成');

      // 生成纯文本
      exports.text = await this.generateTextExport(roleData, titles, articles, outputPath);
      console.log('✅ 纯文本导出完成');

      // 创建发布就绪包
      exports.publishPackage = await this.createPublishPackage(roleData, titles, articles, stats, outputPath);
      console.log('✅ 发布就绪包创建完成');

      // 创建ZIP压缩包
      const zipPath = path.join(path.dirname(outputPath), `${roleData.roleId}_complete.zip`);
      exports.zip = await this.createZipArchive(outputPath, zipPath);
      console.log('✅ ZIP压缩包创建完成');

      // 生成导出清单
      const manifest = {
        导出时间: new Date().toLocaleString('zh-CN'),
        角色ID: roleData.roleId,
        文件清单: {
          完整报告: path.basename(exports.markdown),
          结构化数据: path.basename(exports.json),
          纯文本版本: path.basename(exports.text),
          发布就绪包: path.relative(outputPath, exports.publishPackage),
          压缩包: path.basename(exports.zip)
        },
        使用说明: {
          完整报告: '包含所有分析和内容的详细报告',
          结构化数据: '可用于程序处理的JSON格式数据',
          纯文本版本: '纯文本格式，便于复制粘贴',
          发布就绪包: '针对不同平台优化的发布版本',
          压缩包: '包含所有文件的完整压缩包'
        }
      };

      await fs.writeJson(path.join(outputPath, 'export_manifest.json'), manifest, { spaces: 2 });

      console.log('\n📋 导出清单:');
      Object.entries(exports).forEach(([type, filePath]) => {
        console.log(`   - ${type}: ${path.basename(filePath)}`);
      });

      return exports;

    } catch (error) {
      console.error('❌ 导出过程出错:', error);
      throw error;
    }
  }
}

module.exports = FileExporter;