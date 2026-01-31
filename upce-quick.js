#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

class UPCEQuickTest {
  constructor() {
    this.apiKey = 'sk-71cc3aad8fad44c8970dd549933d3573';
    this.baseURL = 'https://api.deepseek.com/v1';
    this.outputDir = path.join(__dirname, 'upce_output');
    this.config = {
      titleCount: 10, // 减少到10个标题快速测试
      articleCount: 3, // 只生成3篇文章
      maxRetries: 2
    };
  }

  // 生成角色ID
  generateRoleId(roleDescription) {
    const hash = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 8);
    return `role_${hash}`;
  }

  // 角色深度分析
  async analyzeRole(roleDescription) {
    console.log('🧠 开始角色深度分析...');
    
    const prompt = `请深度分析以下角色群体：${roleDescription}

请从以下维度进行分析：
1. 深层情绪分析（恐惧、羞耻、希望、孤独、愧疚）- 用"高/中/低"评级
2. 核心需求识别（3个最重要的未被满足需求）
3. 内容切入点（3个具有冲突性和反常识的角度）
4. 高商业意图关键词（10个）
5. 四层产品变现模型设计（免费、99元、2980元、9800元）

请用简洁的格式返回结果。`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个专业的用户画像分析师和内容营销专家。请用简洁明了的格式回答。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const analysisText = response.data.choices[0].message.content;
      
      console.log('✅ 角色分析完成');
      return {
        roleId: this.generateRoleId(roleDescription),
        roleDescription,
        analysisText,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ 角色分析失败:', error.message);
      return this.createFallbackAnalysis(roleDescription);
    }
  }

  // 创建备用分析数据
  createFallbackAnalysis(roleDescription) {
    const analysisText = `
## 深层情绪分析
- 恐惧：中等（担心收入不稳定）
- 羞耻：低（对自己职业有信心）
- 希望：高（期待线上发展）
- 孤独：中等（需要更多客户连接）
- 愧疚：低（为家庭努力工作）

## 核心需求
1. 扩大客户群体，突破地域限制
2. 提高收入水平，实现财务自由
3. 建立个人品牌，获得行业认可

## 内容切入点
1. 真实案例：从线下到线上的完整转型过程
2. 避坑指南：线上私教最容易犯的5个错误
3. 工具清单：零成本搭建线上健身工作室

## 关键词
健身教练、线上私教、健身指导、减肥训练、居家健身、健身计划、体重管理、肌肉训练、有氧运动、健身咨询

## 产品变现模型
- 免费层：健身知识分享 + 微信群交流
- 基础层（99元）：7天健身计划 + 饮食指导
- 进阶层（2980元）：3个月1对1线上私教
- 高端层（9800元）：全年健身管理 + 营养方案
`;

    return {
      roleId: this.generateRoleId(roleDescription),
      roleDescription,
      analysisText,
      timestamp: new Date().toISOString()
    };
  }

  // 生成标题库
  async generateTitles(roleData) {
    console.log(`📝 开始生成${this.config.titleCount}个标题...`);
    
    const prompt = `基于角色"${roleData.roleDescription}"，生成${this.config.titleCount}个吸引人的自媒体文章标题。

要求：
1. 标题要有冲突感和好奇心
2. 包含具体数字和时间
3. 体现真实性和可操作性
4. 符合该人群的语言习惯
5. 每个标题不超过30字

请直接返回标题列表，每行一个，不要编号。`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system", 
            content: "你是一个专业的自媒体标题创作专家，擅长创作高点击率的爆文标题。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const titles = response.data.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(title => title.length > 5)
        .slice(0, this.config.titleCount);

      console.log(`✅ 标题生成完成，共 ${titles.length} 个`);
      return titles;

    } catch (error) {
      console.error('❌ 标题生成失败:', error.message);
      
      // 使用模板生成备用标题
      const templates = [
        "32岁健身教练3个月线上收入翻倍的真实经历",
        "别再只做线下了！健身教练这样转型月入过万",
        "从月入6000到2万：健身教练的线上私教攻略",
        "小城市健身教练如何通过线上突破收入瓶颈",
        "0成本搭建线上健身工作室，我是这样做的",
        "健身教练转型线上私教必须避开的5个坑",
        "三线城市健身教练的逆袭：线上月入2万实录",
        "从被质疑到被认可：我的线上私教创业故事",
        "健身教练如何用手机做线上私教月入过万",
        "不会营销的健身教练，看我如何3个月获客200+"
      ];
      
      return templates.slice(0, this.config.titleCount);
    }
  }

  // 生成单篇文章
  async generateArticle(title, roleData, index) {
    console.log(`📄 生成文章 ${index}: ${title.substring(0, 20)}...`);

    const prompt = `请基于标题"${title}"和角色"${roleData.roleDescription}"，写一篇1200字左右的自媒体文章。

文章要求：
1. 采用第一人称"我"的视角
2. 开头：真实困境场景描述（200字）
3. 中段：3-4个具体可操作的步骤（800字）
4. 结尾：低门槛的行动引导（200字）
5. 语言贴近目标人群，真实可信
6. 在适当位置标注[配图：描述]

请直接返回文章内容。`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个专业的自媒体内容创作者，擅长写出引人共鸣的真实故事和实用指南。"
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      });

      let content = response.data.choices[0].message.content;
      
      // 处理配图标记
      const imagePrompts = [];
      let imageIndex = 1;
      
      content = content.replace(/\[配图：([^\]]+)\]/g, (match, description) => {
        const imageName = `image_${roleData.roleId}_${String(index).padStart(3, '0')}_${imageIndex}.jpg`;
        imagePrompts.push({
          filename: imageName,
          description: description,
          prompt: `真实生活场景，${roleData.roleDescription}正在${description}，居家环境，自然光线，生活感强，纪实摄影风格，温暖色调，高清画质`
        });
        imageIndex++;
        return `\n\n![${description}](./images/${imageName})\n\n`;
      });

      // 如果没有配图标记，自动添加2-3张
      if (imagePrompts.length === 0) {
        const autoImages = [
          { desc: "健身教练工作场景", pos: 0.2 },
          { desc: "线上指导客户训练", pos: 0.6 },
          { desc: "收入增长数据展示", pos: 0.9 }
        ];

        const contentLines = content.split('\n');
        autoImages.forEach((img, idx) => {
          const insertPos = Math.floor(contentLines.length * img.pos);
          const imageName = `image_${roleData.roleId}_${String(index).padStart(3, '0')}_${idx + 1}.jpg`;
          
          imagePrompts.push({
            filename: imageName,
            description: img.desc,
            prompt: `真实生活场景，${roleData.roleDescription}正在${img.desc}，居家环境，自然光线，生活感强，纪实摄影风格，温暖色调，高清画质`
          });
          
          contentLines.splice(insertPos, 0, `\n![${img.desc}](./images/${imageName})\n`);
        });
        
        content = contentLines.join('\n');
      }

      return {
        title,
        content,
        imagePrompts,
        wordCount: content.replace(/!\[.*?\]\(.*?\)/g, '').length
      };

    } catch (error) {
      console.error(`❌ 文章生成失败: ${error.message}`);
      return this.createFallbackArticle(title, roleData, index);
    }
  }

  // 创建备用文章
  createFallbackArticle(title, roleData, index) {
    const content = `# ${title}

## 我的真实经历

大家好，我是一个${roleData.roleDescription}。

三个月前，我还在为收入发愁。每天在健身房忙碌，但收入却很有限。我开始思考，是不是该尝试一些新的方式。

![健身教练工作场景](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_1.jpg)

## 我的转变过程

### 第一步：市场调研

我花了一周时间研究线上健身市场，发现这是一个巨大的机会。

### 第二步：技能准备

我学习了线上教学的技巧，包括如何用手机拍摄教学视频。

![线上指导客户训练](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_2.jpg)

### 第三步：客户获取

通过社交媒体分享专业内容，我逐渐积累了第一批客户。

### 第四步：服务优化

根据客户反馈，我不断完善自己的服务体系。

## 我的收获

现在我的月收入比之前翻了一倍，更重要的是，我帮助了更多人实现健身目标。

![收入增长数据展示](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_3.jpg)

## 给同行的建议

1. 不要害怕尝试新模式
2. 专业能力是根本
3. 持续学习和改进
4. 真诚服务每一位客户

如果你也想开始线上私教，欢迎和我交流经验。

---

*本文为真实经历分享，仅供参考*`;

    return {
      title,
      content,
      imagePrompts: [
        {
          filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_1.jpg`,
          description: "健身教练工作场景",
          prompt: `真实生活场景，${roleData.roleDescription}正在健身教练工作场景，居家环境，自然光线，生活感强，纪实摄影风格，温暖色调，高清画质`
        },
        {
          filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_2.jpg`, 
          description: "线上指导客户训练",
          prompt: `真实生活场景，${roleData.roleDescription}正在线上指导客户训练，居家环境，自然光线，生活感强，纪实摄影风格，温暖色调，高清画质`
        },
        {
          filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_3.jpg`,
          description: "收入增长数据展示", 
          prompt: `真实生活场景，${roleData.roleDescription}正在收入增长数据展示，居家环境，自然光线，生活感强，纪实摄影风格，温暖色调，高清画质`
        }
      ],
      wordCount: content.replace(/!\[.*?\]\(.*?\)/g, '').length
    };
  }

  // 保存输出文件
  async saveOutput(roleData, titles, articles) {
    const outputPath = path.join(this.outputDir, roleData.roleId);
    await fs.ensureDir(outputPath);
    await fs.ensureDir(path.join(outputPath, 'articles'));
    await fs.ensureDir(path.join(outputPath, 'images'));

    console.log('💾 保存输出文件...');

    // 保存角色分析报告
    const analysisReport = `# ${roleData.roleDescription} - 角色分析报告

## 基本信息
- **角色ID**: ${roleData.roleId}
- **分析时间**: ${roleData.timestamp}
- **角色描述**: ${roleData.roleDescription}

## 分析结果
${roleData.analysisText}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;

    await fs.writeFile(path.join(outputPath, 'analysis_report.md'), analysisReport);

    // 保存标题列表
    await fs.writeFile(path.join(outputPath, 'titles.txt'), titles.join('\n'));

    // 保存文章
    const allImagePrompts = [];
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const filename = `article_${String(i + 1).padStart(3, '0')}.md`;
      await fs.writeFile(path.join(outputPath, 'articles', filename), article.content);
      
      // 收集所有配图提示词
      allImagePrompts.push(...article.imagePrompts);
    }

    // 保存配图提示词
    await fs.writeJson(path.join(outputPath, 'image_prompts.json'), allImagePrompts, { spaces: 2 });

    // 生成配图占位符信息
    for (const imagePrompt of allImagePrompts) {
      const placeholderInfo = {
        filename: imagePrompt.filename,
        description: imagePrompt.description,
        prompt: imagePrompt.prompt,
        status: "待生成",
        note: "配图提示词已准备，可用于AI图片生成"
      };

      const infoPath = path.join(outputPath, 'images', imagePrompt.filename + '.info.json');
      await fs.writeJson(infoPath, placeholderInfo, { spaces: 2 });
    }

    // 生成完整报告
    const completeReport = `# UPCE内容生成报告

## 📊 生成概览
- **角色描述**: ${roleData.roleDescription}
- **角色ID**: ${roleData.roleId}
- **生成时间**: ${new Date().toLocaleString('zh-CN')}
- **标题数量**: ${titles.length}
- **文章数量**: ${articles.length}
- **配图数量**: ${allImagePrompts.length}
- **总字数**: ${articles.reduce((sum, article) => sum + article.wordCount, 0).toLocaleString()}

## 📝 标题列表
${titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

## 📚 文章概览
${articles.map((article, index) => `
### 文章 ${index + 1}: ${article.title}
- **字数**: ${article.wordCount}
- **配图**: ${article.imagePrompts.length}张
`).join('\n')}

## 🎨 配图信息
${allImagePrompts.map((img, index) => `${index + 1}. ${img.description} (${img.filename})`).join('\n')}

## 📁 文件结构
\`\`\`
${roleData.roleId}/
├── analysis_report.md          # 角色分析报告
├── titles.txt                  # 标题列表
├── complete_report.md          # 完整报告
├── image_prompts.json         # 配图提示词
├── articles/                   # 文章目录
│   ├── article_001.md
│   ├── article_002.md
│   └── article_003.md
└── images/                     # 配图信息
    └── *.info.json
\`\`\`

## 🚀 使用建议
1. **发布平台**: 小红书、抖音、微信公众号、知乎
2. **发布频率**: 每天1-2篇，避免刷屏
3. **最佳时间**: 晚上7-9点，周末效果更佳
4. **互动引导**: 文末添加互动问题提高参与度

---
*本报告由UPCE万能虚拟产品生成系统自动生成*
`;

    await fs.writeFile(path.join(outputPath, 'complete_report.md'), completeReport);

    // 生成统计数据
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
      outputPath: outputPath
    };

    await fs.writeJson(path.join(outputPath, 'generation_stats.json'), stats, { spaces: 2 });

    console.log(`✅ 所有文件已保存到: ${outputPath}`);
    return stats;
  }

  // 主流程
  async run(roleDescription) {
    console.log('🚀 UPCE快速测试版启动');
    console.log('=' * 50);
    
    const startTime = Date.now();

    try {
      // Step 1: 角色分析
      const roleData = await this.analyzeRole(roleDescription);
      
      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: 生成标题
      const titles = await this.generateTitles(roleData);
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: 生成文章（只生成3篇）
      console.log(`📚 开始生成${this.config.articleCount}篇文章...`);
      const articles = [];
      
      for (let i = 0; i < this.config.articleCount; i++) {
        const article = await this.generateArticle(titles[i], roleData, i + 1);
        articles.push(article);
        
        console.log(`✅ 已完成第 ${i + 1} 篇文章`);
        
        // 每篇文章之间添加延迟
        if (i < this.config.articleCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Step 4: 保存输出
      const stats = await this.saveOutput(roleData, titles, articles);

      // 完成统计
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n🎉 快速测试完成！');
      console.log('=' * 50);
      console.log(`📊 统计信息:`);
      console.log(`   - 角色ID: ${stats.roleId}`);
      console.log(`   - 标题数量: ${stats.statistics.titlesCount}`);
      console.log(`   - 文章数量: ${stats.statistics.articlesCount}`);
      console.log(`   - 配图数量: ${stats.statistics.imagesCount}`);
      console.log(`   - 总字数: ${stats.statistics.totalWords.toLocaleString()}`);
      console.log(`   - 平均字数: ${stats.statistics.avgWordsPerArticle}`);
      console.log(`   - 处理时间: ${duration}秒`);
      console.log(`   - 输出目录: ${stats.outputPath}`);
      
      console.log('\n📁 生成的文件:');
      console.log(`   - analysis_report.md (角色分析报告)`);
      console.log(`   - complete_report.md (完整报告)`);
      console.log(`   - titles.txt (${titles.length}个标题)`);
      console.log(`   - articles/ (${articles.length}篇文章)`);
      console.log(`   - images/ (${stats.statistics.imagesCount}个配图信息)`);
      console.log(`   - generation_stats.json (统计数据)`);

      console.log('\n🎯 下一步建议:');
      console.log(`   1. 查看生成的内容: open "${stats.outputPath}"`);
      console.log(`   2. 配置阿里云API生成真实配图`);
      console.log(`   3. 根据需要调整内容和标题`);
      console.log(`   4. 发布到各大自媒体平台`);

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
    console.log('使用方法: node upce-quick.js "角色描述"');
    console.log('示例: node upce-quick.js "三线城市32岁健身教练，月入6000，想做线上私教"');
    process.exit(1);
  }

  const roleDescription = args.join(' ');
  const engine = new UPCEQuickTest();
  
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

module.exports = UPCEQuickTest;