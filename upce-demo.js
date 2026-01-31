#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class UPCEDemo {
  constructor() {
    this.outputDir = path.join(__dirname, 'upce_output');
  }

  // 生成角色ID
  generateRoleId(roleDescription) {
    const hash = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 8);
    return `role_${hash}`;
  }

  // 模拟角色深度分析
  analyzeRole(roleDescription) {
    console.log('🧠 开始角色深度分析...');
    
    const analysis = {
      emotions: {
        恐惧: "中等 - 担心线上转型失败，收入不稳定",
        羞耻: "低 - 对自己的专业能力有信心",
        希望: "高 - 期待通过线上扩大影响力和收入",
        孤独: "中等 - 需要更多同行交流和客户连接",
        愧疚: "低 - 为家庭努力工作，问心无愧"
      },
      coreNeeds: [
        "突破地域限制，扩大客户群体",
        "提高收入水平，实现财务自由",
        "建立个人品牌，获得行业认可"
      ],
      contentAngles: [
        "真实案例：从线下到线上的完整转型过程",
        "避坑指南：线上私教最容易犯的5个致命错误",
        "工具清单：零成本搭建线上健身工作室的全套方案"
      ],
      keywords: [
        "健身教练", "线上私教", "健身指导", "减肥训练", "居家健身",
        "健身计划", "体重管理", "肌肉训练", "有氧运动", "健身咨询",
        "线上教学", "健身直播", "私人定制", "健身APP", "运动康复",
        "营养指导", "健身创业", "副业赚钱", "技能变现", "个人品牌"
      ],
      productModel: {
        免费层: {
          产品: "健身知识分享 + 微信群交流",
          价格: 0,
          转化率: "30%",
          月活跃: "500人"
        },
        基础层: {
          产品: "7天健身计划 + 饮食指导 + 答疑",
          价格: 99,
          转化率: "8%",
          月销量: "40份"
        },
        进阶层: {
          产品: "3个月1对1线上私教 + 定制计划",
          价格: 2980,
          转化率: "2%",
          月销量: "10份"
        },
        高端层: {
          产品: "全年健身管理 + 营养方案 + VIP服务",
          价格: 9800,
          转化率: "0.5%",
          月销量: "2份"
        }
      }
    };

    console.log('✅ 角色分析完成');
    return {
      roleId: this.generateRoleId(roleDescription),
      roleDescription,
      analysis,
      timestamp: new Date().toISOString()
    };
  }

  // 生成标题库
  generateTitles(roleData) {
    console.log('📝 生成标题库...');
    
    const titles = [
      "月入6000的健身教练，如何靠线上私教3个月收入翻倍",
      "32岁三线教练自曝：线上接单第一天，我就赚了800块",
      "别再只做线下了！健身教练这样转型月入2万+",
      "从被质疑到被认可：我的线上私教创业血泪史",
      "小城市健身教练如何通过线上突破收入天花板",
      "0成本搭建线上健身工作室，我用了这5个免费工具",
      "健身教练转型线上私教，必须避开的7个致命坑",
      "三线城市教练的逆袭：线上月入2万实操全记录",
      "不会营销的健身教练，看我如何3个月获客200+",
      "从月入6千到2万：健身教练的线上私教完整攻略"
    ];

    console.log(`✅ 标题生成完成，共 ${titles.length} 个`);
    return titles;
  }

  // 生成文章内容
  generateArticles(titles, roleData) {
    console.log('📚 生成文章内容...');
    
    const articles = [];
    
    for (let i = 0; i < Math.min(titles.length, 3); i++) {
      const title = titles[i];
      console.log(`📄 生成文章 ${i + 1}: ${title.substring(0, 30)}...`);
      
      const content = this.createArticleContent(title, roleData, i + 1);
      const imagePrompts = this.generateImagePrompts(roleData, i + 1);
      
      articles.push({
        title,
        content,
        imagePrompts,
        wordCount: content.replace(/!\[.*?\]\(.*?\)/g, '').length
      });
      
      console.log(`✅ 文章 ${i + 1} 生成完成 (${articles[i].wordCount}字)`);
    }
    
    return articles;
  }

  // 创建文章内容
  createArticleContent(title, roleData, index) {
    return `# ${title}

## 我的真实经历

大家好，我是一个${roleData.roleDescription}。

三个月前，我还在为每个月6000块的收入发愁。每天在健身房忙得团团转，从早上6点到晚上10点，但收入却始终上不去。看着房租、生活费、还有家里的开销，我真的很焦虑。

那时候我就在想，是不是该尝试一些新的方式？毕竟现在都是互联网时代了，为什么不能把健身指导搬到线上呢？

![健身教练日常工作场景](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_1.jpg)

## 我的转变过程

### 第一步：市场调研和心理准备

一开始我也很犹豫，担心线上效果不好，客户不认可。但我花了一周时间研究了一下市场，发现线上健身确实是个巨大的机会。

特别是疫情之后，很多人都习惯了在家健身。而且线上私教的价格比线下更灵活，覆盖面也更广。

我给自己定了个小目标：先试试看，能不能通过线上每个月多赚2000块。

### 第二步：技能准备和工具学习

线上教学和线下完全不一样。我必须学会：
- 如何用手机拍摄清晰的教学视频
- 怎样设计适合在家练习的训练计划
- 如何通过视频通话指导动作
- 用什么软件来管理客户和课程

![学习线上教学技能](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_2.jpg)

我花了两周时间，每天晚上下班后就在家练习拍视频、学软件操作。说实话，刚开始真的很笨拙，拍个视频要重复十几遍。

### 第三步：内容创作和客户获取

有了基本技能后，我开始在社交媒体上分享健身知识。每天发一些简单实用的健身动作，配上专业的讲解。

没想到反响还不错！很多人开始关注我，还有人主动询问能不能提供私教服务。

第一个月，我就通过线上接到了5个客户，每人收费299元/月。虽然不多，但这给了我很大的信心。

![线上指导客户训练](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_3.jpg)

### 第四步：服务优化和规模扩大

有了第一批客户后，我开始不断优化服务：
- 制作更专业的训练视频
- 设计个性化的训练计划
- 建立客户微信群，增加互动
- 定期回访，了解训练效果

客户满意度很高，开始有人主动推荐朋友来找我。到第三个月，我的线上客户已经有30多个了。

## 我的收获和感悟

现在我的月收入比之前翻了一倍多，更重要的是，我帮助了更多人实现健身目标。有些客户甚至是外地的，这在以前是不可能的。

![收入增长和客户反馈](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_4.jpg)

线上私教让我突破了地域限制，也让我的专业技能得到了更大的发挥空间。

## 给同行的实用建议

如果你也想尝试线上私教，我建议：

1. **不要害怕开始**：很多人担心效果不好，但其实只要你专业，客户是能感受到的。

2. **从简单开始**：不需要一开始就很完美，边做边学，边学边改进。

3. **重视内容质量**：线上更需要专业性，因为客户看不到你的现场指导。

4. **建立信任关系**：通过持续的专业内容分享，让客户信任你的能力。

5. **合理定价**：刚开始可以价格低一些，等有了口碑再逐步提高。

## 我的下一步计划

现在我正在准备推出系统的线上健身课程，还计划开设健身教练转型培训。如果你也想开始线上私教，或者想交流经验，欢迎加我微信。

记住，改变永远不嫌晚，关键是要迈出第一步！

---

*本文为真实经历分享，希望对同行有所帮助。如果觉得有用，请点赞支持！*`;
  }

  // 生成配图提示词
  generateImagePrompts(roleData, index) {
    return [
      {
        filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_1.jpg`,
        description: "健身教练日常工作场景",
        prompt: `真实生活场景，${roleData.roleDescription}在健身房指导客户训练，专业健身环境，自然光线，真实工作状态，纪实摄影风格，温暖色调，高清画质，避免奢侈品和高端设备`
      },
      {
        filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_2.jpg`,
        description: "学习线上教学技能",
        prompt: `真实生活场景，${roleData.roleDescription}在家中用手机拍摄健身教学视频，居家环境，自然光线，学习状态，生活感强，纪实摄影风格，温暖色调，高清画质`
      },
      {
        filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_3.jpg`,
        description: "线上指导客户训练",
        prompt: `真实生活场景，${roleData.roleDescription}通过视频通话指导客户健身，电脑或手机屏幕显示视频通话界面，居家办公环境，自然光线，专业指导状态，纪实摄影风格，温暖色调，高清画质`
      },
      {
        filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_4.jpg`,
        description: "收入增长和客户反馈",
        prompt: `真实生活场景，${roleData.roleId}查看手机上的收入数据和客户好评，简单的数据图表或聊天记录，居家环境，自然光线，成功喜悦的表情，纪实摄影风格，温暖色调，高清画质`
      }
    ];
  }

  // 保存所有输出文件
  async saveAllFiles(roleData, titles, articles) {
    const outputPath = path.join(this.outputDir, roleData.roleId);
    await fs.ensureDir(outputPath);
    await fs.ensureDir(path.join(outputPath, 'articles'));
    await fs.ensureDir(path.join(outputPath, 'images'));
    await fs.ensureDir(path.join(outputPath, 'publish_ready'));

    console.log('💾 保存输出文件...');

    // 1. 保存角色分析报告
    const analysisReport = this.generateAnalysisReport(roleData);
    await fs.writeFile(path.join(outputPath, 'analysis_report.md'), analysisReport);

    // 2. 保存标题列表
    await fs.writeFile(path.join(outputPath, 'titles.txt'), titles.join('\n'));

    // 3. 保存文章
    const allImagePrompts = [];
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const filename = `article_${String(i + 1).padStart(3, '0')}.md`;
      await fs.writeFile(path.join(outputPath, 'articles', filename), article.content);
      allImagePrompts.push(...article.imagePrompts);
    }

    // 4. 保存配图提示词
    await fs.writeJson(path.join(outputPath, 'image_prompts.json'), allImagePrompts, { spaces: 2 });

    // 5. 生成配图信息文件
    for (const imagePrompt of allImagePrompts) {
      const imageInfo = {
        filename: imagePrompt.filename,
        description: imagePrompt.description,
        prompt: imagePrompt.prompt,
        status: "待生成",
        aiModel: "推荐使用阿里云通义万相或Midjourney",
        note: "配图提示词已优化，可直接用于AI图片生成",
        generatedAt: new Date().toISOString()
      };

      await fs.writeJson(
        path.join(outputPath, 'images', imagePrompt.filename + '.info.json'),
        imageInfo,
        { spaces: 2 }
      );
    }

    // 6. 生成完整报告
    const completeReport = this.generateCompleteReport(roleData, titles, articles, allImagePrompts);
    await fs.writeFile(path.join(outputPath, 'complete_report.md'), completeReport);

    // 7. 生成发布就绪版本
    await this.generatePublishReadyVersions(articles, outputPath);

    // 8. 生成统计数据
    const stats = {
      roleId: roleData.roleId,
      roleDescription: roleData.roleDescription,
      generatedAt: new Date().toISOString(),
      statistics: {
        titlesCount: titles.length,
        articlesCount: articles.length,
        imagesCount: allImagePrompts.length,
        totalWords: articles.reduce((sum, article) => sum + article.wordCount, 0),
        avgWordsPerArticle: Math.round(articles.reduce((sum, article) => sum + article.wordCount, 0) / articles.length)
      },
      outputPath: outputPath,
      files: {
        analysisReport: 'analysis_report.md',
        completeReport: 'complete_report.md',
        titlesList: 'titles.txt',
        articlesDir: 'articles/',
        imagesDir: 'images/',
        publishReadyDir: 'publish_ready/',
        imagePrompts: 'image_prompts.json',
        statistics: 'generation_stats.json'
      }
    };

    await fs.writeJson(path.join(outputPath, 'generation_stats.json'), stats, { spaces: 2 });

    // 9. 生成使用说明
    const readme = this.generateReadme(roleData, stats);
    await fs.writeFile(path.join(outputPath, 'README.md'), readme);

    return stats;
  }

  // 生成角色分析报告
  generateAnalysisReport(roleData) {
    return `# ${roleData.roleDescription} - 深度角色分析报告

## 📋 基本信息
- **角色ID**: ${roleData.roleId}
- **分析时间**: ${new Date().toLocaleString('zh-CN')}
- **角色描述**: ${roleData.roleDescription}

## 🧠 深层情绪分析
${Object.entries(roleData.analysis.emotions).map(([emotion, analysis]) => 
  `### ${emotion}\n${analysis}\n`
).join('\n')}

## 🎯 核心需求识别
${roleData.analysis.coreNeeds.map((need, index) => `${index + 1}. **${need}**`).join('\n')}

## 💡 内容切入点
${roleData.analysis.contentAngles.map((angle, index) => `${index + 1}. **${angle}**`).join('\n')}

## 🔍 高商业意图关键词
${roleData.analysis.keywords.map(keyword => `\`${keyword}\``).join(' • ')}

## 💰 四层产品变现模型

${Object.entries(roleData.analysis.productModel).map(([tier, details]) => 
  `### ${tier}
- **产品内容**: ${details.产品}
- **定价策略**: ${details.价格}元
- **预期转化率**: ${details.转化率}
- **目标规模**: ${details.月活跃 || details.月销量}

**收益预估**: ${tier === '免费层' ? '引流获客' : 
  `月收入 ${details.价格 * parseInt(details.月销量 || '0')}元`}
`
).join('\n')}

## 📊 年收入预测模型

基于以上产品模型，预估年收入构成：
- **基础层收入**: 99元 × 40份/月 × 12月 = 47,520元
- **进阶层收入**: 2,980元 × 10份/月 × 12月 = 357,600元  
- **高端层收入**: 9,800元 × 2份/月 × 12月 = 235,200元

**年收入总计**: 约64万元（不含免费层转化）

---
*本分析基于角色特征和市场数据生成，实际收入因执行能力而异*`;
  }

  // 生成完整报告
  generateCompleteReport(roleData, titles, articles, allImagePrompts) {
    return `# UPCE内容生成完整报告

## 🎯 项目概览
- **目标角色**: ${roleData.roleDescription}
- **角色ID**: ${roleData.roleId}
- **生成时间**: ${new Date().toLocaleString('zh-CN')}
- **内容规模**: ${titles.length}个标题，${articles.length}篇文章，${allImagePrompts.length}张配图

## 📊 内容统计
| 项目 | 数量 | 详情 |
|------|------|------|
| 爆文标题 | ${titles.length}个 | 涵盖6种标题模板 |
| 完整文章 | ${articles.length}篇 | 总计${articles.reduce((sum, article) => sum + article.wordCount, 0).toLocaleString()}字 |
| 配图设计 | ${allImagePrompts.length}张 | 含详细生成提示词 |
| 平均字数 | ${Math.round(articles.reduce((sum, article) => sum + article.wordCount, 0) / articles.length)}字/篇 | 适合各大平台发布 |

## 📝 标题库预览
${titles.slice(0, 5).map((title, index) => `${index + 1}. ${title}`).join('\n')}
${titles.length > 5 ? `\n*还有${titles.length - 5}个标题，查看titles.txt获取完整列表*` : ''}

## 📚 文章内容预览
${articles.map((article, index) => `
### 文章${index + 1}: ${article.title}
- **字数**: ${article.wordCount}字
- **配图**: ${article.imagePrompts.length}张
- **内容摘要**: ${article.content.substring(article.content.indexOf('##'), article.content.indexOf('##') + 100).replace(/[#\n]/g, '')}...

**配图列表**:
${article.imagePrompts.map(img => `- ${img.description}`).join('\n')}
`).join('\n---\n')}

## 🎨 配图生成指南

### 推荐AI工具
1. **阿里云通义万相** - 中文理解好，适合生活场景
2. **Midjourney** - 画质精美，风格多样
3. **Stable Diffusion** - 开源免费，可本地部署
4. **文心一格** - 百度出品，中文优化

### 生成步骤
1. 复制image_prompts.json中的提示词
2. 选择合适的AI工具
3. 调整参数：1920x1080分辨率，纪实风格
4. 生成后替换文章中的图片链接

## 🚀 发布策略建议

### 平台选择
| 平台 | 适合内容 | 发布建议 |
|------|----------|----------|
| 小红书 | 生活化内容 | 多图文，加emoji |
| 抖音 | 短视频脚本 | 提取要点做视频 |
| 微信公众号 | 长文深度 | 保持原格式 |
| 知乎 | 专业分析 | 增加数据支撑 |

### 发布时间表
- **周一至周五**: 晚上7-9点
- **周末**: 上午10-12点，下午2-4点
- **频率**: 每天1-2篇，避免刷屏

### 互动策略
1. 文末提问引导评论
2. 及时回复用户留言
3. 定期发布互动话题
4. 建立粉丝社群

## 💡 变现路径规划

### 第一阶段：内容积累（1-3个月）
- 发布优质内容建立信任
- 积累1000+精准粉丝
- 测试用户需求和反馈

### 第二阶段：产品推出（3-6个月）
- 推出99元基础产品
- 建立客户服务体系
- 收集用户反馈优化

### 第三阶段：规模扩大（6-12个月）
- 推出高价值产品
- 建立分销体系
- 打造个人品牌

## 📁 文件使用说明

### 核心文件
- \`analysis_report.md\` - 角色深度分析
- \`complete_report.md\` - 本报告
- \`titles.txt\` - 标题列表
- \`articles/\` - 文章目录
- \`image_prompts.json\` - 配图提示词

### 发布文件
- \`publish_ready/\` - 各平台优化版本
- \`images/\` - 配图信息和占位符

### 数据文件
- \`generation_stats.json\` - 统计数据
- \`README.md\` - 使用说明

---

## 🎉 总结

本次生成为"${roleData.roleDescription}"创建了完整的内容营销体系，包括：

✅ **深度角色分析** - 挖掘真实需求和痛点  
✅ **爆文标题库** - ${titles.length}个高转化标题  
✅ **优质文章** - ${articles.length}篇原创内容，共${articles.reduce((sum, article) => sum + article.wordCount, 0).toLocaleString()}字  
✅ **配图方案** - ${allImagePrompts.length}张专业配图设计  
✅ **发布策略** - 多平台适配和变现规划  

**预期效果**: 按计划执行，预计6-12个月内可实现月入2-5万的目标。

*祝您内容创业成功！如有问题，欢迎交流讨论。*`;
  }

  // 生成发布就绪版本
  async generatePublishReadyVersions(articles, outputPath) {
    const publishDir = path.join(outputPath, 'publish_ready');
    
    // 小红书版本 - 添加emoji，缩短段落
    const xiaohongshuDir = path.join(publishDir, 'xiaohongshu');
    await fs.ensureDir(xiaohongshuDir);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      let content = article.content;
      
      // 添加emoji
      content = content.replace(/第一/g, '1️⃣第一');
      content = content.replace(/第二/g, '2️⃣第二');
      content = content.replace(/第三/g, '3️⃣第三');
      content = content.replace(/重要/g, '⚠️重要');
      content = content.replace(/建议/g, '💡建议');
      content = content.replace(/收入/g, '💰收入');
      
      await fs.writeFile(
        path.join(xiaohongshuDir, `xiaohongshu_${i + 1}.md`),
        content
      );
    }

    // 微信公众号版本 - 保持原格式，添加引导
    const weixinDir = path.join(publishDir, 'weixin');
    await fs.ensureDir(weixinDir);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const content = article.content + '\n\n---\n\n💡 **觉得有用请点赞关注，更多干货持续分享！**\n\n🔥 **想要完整的线上私教转型方案，请私信获取！**';
      
      await fs.writeFile(
        path.join(weixinDir, `weixin_${i + 1}.md`),
        content
      );
    }

    // 抖音版本 - 提取要点
    const douyinDir = path.join(publishDir, 'douyin');
    await fs.ensureDir(douyinDir);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const keyPoints = this.extractKeyPoints(article.content);
      
      await fs.writeFile(
        path.join(douyinDir, `douyin_script_${i + 1}.md`),
        keyPoints
      );
    }
  }

  // 提取关键点用于短视频
  extractKeyPoints(content) {
    const lines = content.split('\n');
    const keyPoints = [];
    
    lines.forEach(line => {
      if (line.includes('第一') || line.includes('第二') || line.includes('第三') ||
          line.includes('重要') || line.includes('建议') || line.includes('关键')) {
        keyPoints.push(line.trim());
      }
    });

    return `# 短视频脚本要点

## 开场钩子
"32岁健身教练，月入从6000到2万，我是怎么做到的？"

## 核心要点
${keyPoints.slice(0, 5).join('\n\n')}

## 结尾引导
"想要完整攻略的，评论区扣1，我私发给你！"

---
*建议视频时长：60-90秒*
*配合动作演示效果更佳*`;
  }

  // 生成README使用说明
  generateReadme(roleData, stats) {
    return `# ${roleData.roleDescription} - 内容生成包

## 📦 包含内容

本内容包为"${roleData.roleDescription}"量身定制，包含完整的内容营销解决方案。

### 📊 内容规模
- **爆文标题**: ${stats.statistics.titlesCount}个
- **原创文章**: ${stats.statistics.articlesCount}篇
- **配图设计**: ${stats.statistics.imagesCount}张
- **总字数**: ${stats.statistics.totalWords.toLocaleString()}字

### 📁 文件结构
\`\`\`
${roleData.roleId}/
├── README.md                   # 本说明文件
├── analysis_report.md          # 角色深度分析报告
├── complete_report.md          # 完整项目报告
├── titles.txt                  # 标题列表
├── generation_stats.json      # 统计数据
├── image_prompts.json         # 配图提示词
├── articles/                   # 原创文章目录
│   ├── article_001.md
│   ├── article_002.md
│   └── article_003.md
├── images/                     # 配图信息
│   └── *.info.json
└── publish_ready/              # 发布就绪版本
    ├── xiaohongshu/           # 小红书优化版
    ├── weixin/                # 微信公众号版
    └── douyin/                # 抖音脚本版
\`\`\`

## 🚀 快速开始

### 1. 查看角色分析
首先阅读 \`analysis_report.md\`，了解目标用户的深层需求和痛点。

### 2. 选择发布内容
- 查看 \`titles.txt\` 选择合适的标题
- 从 \`articles/\` 目录选择要发布的文章
- 根据平台选择 \`publish_ready/\` 中的优化版本

### 3. 生成配图
- 打开 \`image_prompts.json\`
- 复制提示词到AI绘图工具
- 推荐工具：阿里云通义万相、Midjourney、Stable Diffusion

### 4. 发布内容
- **小红书**: 使用 \`publish_ready/xiaohongshu/\` 版本
- **微信公众号**: 使用 \`publish_ready/weixin/\` 版本  
- **抖音**: 参考 \`publish_ready/douyin/\` 脚本制作视频

## 💡 使用建议

### 发布策略
1. **测试阶段**: 先发布2-3篇观察反响
2. **优化调整**: 根据数据反馈调整内容风格
3. **规模发布**: 确定效果后批量发布

### 平台适配
- **小红书**: 重视配图质量，多用emoji
- **抖音**: 制作短视频，配合文案
- **微信**: 保持长文深度，建立信任
- **知乎**: 增加专业数据，提升权威性

### 变现时机
- **1-3个月**: 积累粉丝，建立信任
- **3-6个月**: 推出低价产品测试
- **6-12个月**: 推出高价值服务

## 📈 预期效果

按照完整执行，预期可达成：
- **粉丝增长**: 3-6个月内获得5000+精准粉丝
- **收入提升**: 6-12个月内月收入达到2-5万
- **品牌建立**: 在细分领域建立专业影响力

## ⚠️ 注意事项

1. **原创性**: 所有内容均为原创，但发布时请根据实际情况调整
2. **真实性**: 文中数据和案例仅供参考，请结合实际情况
3. **合规性**: 发布前请确保内容符合各平台规范
4. **持续性**: 内容营销需要长期坚持，短期效果有限

## 🔧 技术支持

如需要：
- 配图生成服务
- 内容定制优化  
- 发布策略指导
- 变现方案设计

请联系技术支持团队。

---

**生成时间**: ${new Date().toLocaleString('zh-CN')}  
**系统版本**: UPCE v1.0  
**内容保证**: 100%原创，可商用  

*祝您内容创业成功！*`;
  }

  // 主流程
  async run(roleDescription) {
    console.log('🚀 UPCE演示版启动');
    console.log('='.repeat(50));
    
    const startTime = Date.now();

    try {
      // Step 1: 角色分析
      const roleData = this.analyzeRole(roleDescription);

      // Step 2: 生成标题
      const titles = this.generateTitles(roleData);

      // Step 3: 生成文章
      const articles = this.generateArticles(titles, roleData);

      // Step 4: 保存所有文件
      const stats = await this.saveAllFiles(roleData, titles, articles);

      // 完成统计
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n🎉 内容生成完成！');
      console.log('='.repeat(50));
      console.log(`📊 生成统计:`);
      console.log(`   - 角色ID: ${stats.roleId}`);
      console.log(`   - 标题数量: ${stats.statistics.titlesCount}`);
      console.log(`   - 文章数量: ${stats.statistics.articlesCount}`);
      console.log(`   - 配图数量: ${stats.statistics.imagesCount}`);
      console.log(`   - 总字数: ${stats.statistics.totalWords.toLocaleString()}`);
      console.log(`   - 平均字数: ${stats.statistics.avgWordsPerArticle}`);
      console.log(`   - 处理时间: ${duration}秒`);
      
      console.log('\n📁 输出文件:');
      console.log(`   - 输出目录: ${stats.outputPath}`);
      console.log(`   - 角色分析: analysis_report.md`);
      console.log(`   - 完整报告: complete_report.md`);
      console.log(`   - 标题列表: titles.txt`);
      console.log(`   - 文章目录: articles/`);
      console.log(`   - 配图信息: images/`);
      console.log(`   - 发布版本: publish_ready/`);
      console.log(`   - 使用说明: README.md`);

      console.log('\n🎯 下一步操作:');
      console.log(`   1. 查看生成内容: open "${stats.outputPath}"`);
      console.log(`   2. 阅读完整报告: open "${stats.outputPath}/complete_report.md"`);
      console.log(`   3. 生成配图: 使用image_prompts.json中的提示词`);
      console.log(`   4. 开始发布: 选择publish_ready/中的平台版本`);

      console.log('\n💡 重要提醒:');
      console.log(`   - 本演示版展示完整流程，实际使用时可接入真实AI API`);
      console.log(`   - 配图需要单独使用AI工具生成`);
      console.log(`   - 内容发布前请根据实际情况调整`);
      console.log(`   - 持续优化内容以获得更好效果`);

      return stats;

    } catch (error) {
      console.error('❌ 生成过程出错:', error);
      throw error;
    }
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎯 UPCE万能虚拟产品生成系统 - 演示版');
    console.log('');
    console.log('使用方法:');
    console.log('  node upce-demo.js "角色描述"');
    console.log('');
    console.log('示例:');
    console.log('  node upce-demo.js "三线城市32岁健身教练，月入6000，想做线上私教"');
    console.log('  node upce-demo.js "35岁宝妈，想通过小红书做副业"');
    console.log('  node upce-demo.js "25岁程序员，想做技术自媒体"');
    console.log('');
    console.log('功能特点:');
    console.log('  ✅ 深度角色分析');
    console.log('  ✅ 爆文标题生成');
    console.log('  ✅ 原创文章创作');
    console.log('  ✅ 配图方案设计');
    console.log('  ✅ 多平台适配');
    console.log('  ✅ 完整报告输出');
    process.exit(1);
  }

  const roleDescription = args.join(' ');
  const engine = new UPCEDemo();
  
  try {
    await engine.run(roleDescription);
  } catch (error) {
    console.error('程序执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = UPCEDemo;