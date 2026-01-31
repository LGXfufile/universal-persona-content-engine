#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const AliyunImageGenerator = require('./AliyunImageGenerator');
const FileExporter = require('./FileExporter');

class UPCEEngine {
  constructor() {
    this.apiKey = 'sk-71cc3aad8fad44c8970dd549933d3573';
    this.baseURL = 'https://api.deepseek.com/v1';
    this.outputDir = path.join(__dirname, 'upce_output');
    this.imageGenerator = new AliyunImageGenerator();
    this.fileExporter = new FileExporter();
    this.config = {
      titleCount: 100,
      maxRetries: 3,
      imageCount: 4 // 每篇文章4张配图
    };
  }

  // 生成角色ID
  generateRoleId(roleDescription) {
    const keywords = roleDescription.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    
    const hash = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 6);
    return keywords.join('_') + '_' + hash;
  }

  // 角色深度分析
  async analyzeRole(roleDescription) {
    console.log('🧠 开始角色深度分析...');
    
    const prompt = `请深度分析以下角色群体：${roleDescription}

请从以下维度进行分析：
1. 深层情绪分析（恐惧、羞耻、希望、孤独、愧疚）
2. 核心需求识别（3个最重要的未被满足需求）
3. 内容切入点（3个具有冲突性和反常识的角度）
4. 高商业意图关键词（20个）
5. 四层产品变现模型设计

请用JSON格式返回结果。`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个专业的用户画像分析师和内容营销专家，擅长深度分析目标人群的心理需求和商业价值。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const analysisText = response.data.choices[0].message.content;
      
      // 尝试解析JSON，如果失败则创建结构化数据
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (e) {
        analysis = this.parseAnalysisText(analysisText, roleDescription);
      }

      console.log('✅ 角色分析完成');
      return {
        roleId: this.generateRoleId(roleDescription),
        roleDescription,
        analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ 角色分析失败:', error.message);
      return this.createFallbackAnalysis(roleDescription);
    }
  }

  // 解析分析文本为结构化数据
  parseAnalysisText(text, roleDescription) {
    return {
      emotions: {
        恐惧: "中等",
        羞耻: "中等", 
        希望: "高",
        孤独: "中等",
        愧疚: "低"
      },
      coreNeeds: [
        "经济独立和财务自由",
        "技能提升和个人成长", 
        "社会认同和价值实现"
      ],
      contentAngles: [
        "真实案例：从普通人到成功者的完整过程",
        "避坑指南：新手最容易犯的致命错误",
        "工具清单：提高效率的免费资源大全"
      ],
      keywords: [
        "副业", "兼职", "在家赚钱", "网络赚钱", "被动收入",
        "小红书", "抖音", "微信", "淘宝", "拼多多",
        "新手", "零基础", "简单", "快速", "稳定",
        "宝妈", "学生", "上班族", "退休", "创业"
      ],
      productModel: {
        免费层: { 产品: "入门指南PDF + 微信群", 价格: 0, 转化率: "30%" },
        基础层: { 产品: "7天训练营 + 1对1指导", 价格: 99, 转化率: "8%" },
        进阶层: { 产品: "3个月陪跑 + 资源包", 价格: 2980, 转化率: "2%" },
        高端层: { 产品: "1对1咨询 + 定制方案", 价格: 9800, 转化率: "0.5%" }
      }
    };
  }

  // 创建备用分析数据
  createFallbackAnalysis(roleDescription) {
    return {
      roleId: this.generateRoleId(roleDescription),
      roleDescription,
      analysis: this.parseAnalysisText("", roleDescription),
      timestamp: new Date().toISOString()
    };
  }

  // 生成标题库
  async generateTitles(roleData) {
    console.log('📝 开始生成标题库...');
    
    const titles = [];
    const templates = [
      "{}赚{}元的真实经历分享",
      "别再被骗了！{}最适合做这个项目",
      "{}副业收入超过主业：真实对比数据",
      "{}最新红利：这个方法太简单了",
      "从{}到月入过万的完整攻略",
      "今天就能开始：{}个零成本项目"
    ];

    const roleKeywords = ['宝妈', '学生', '上班族', '退休人员', '新手'];
    const amounts = ['217', '500', '1000', '3000', '5000'];
    const times = ['3天', '一周', '半月', '一个月'];

    // 使用AI生成更多创意标题
    for (let batch = 0; batch < 5; batch++) {
      const prompt = `基于角色"${roleData.roleDescription}"，生成20个吸引人的自媒体文章标题。

要求：
1. 标题要有冲突感和好奇心
2. 包含具体数字和时间
3. 体现真实性和可操作性
4. 符合该人群的语言习惯
5. 每个标题不超过30字

请直接返回标题列表，每行一个。`;

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
          max_tokens: 1000
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const generatedTitles = response.data.choices[0].message.content
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.?\s*/, '').trim())
          .filter(title => title.length > 5);

        titles.push(...generatedTitles);
        
        console.log(`✅ 已生成 ${titles.length} 个标题`);
        
        // 避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️  批次 ${batch + 1} 生成失败，使用模板生成`);
        
        // 使用模板生成备用标题
        for (let i = 0; i < 20; i++) {
          const template = templates[i % templates.length];
          const role = roleKeywords[i % roleKeywords.length];
          const amount = amounts[i % amounts.length];
          const time = times[i % times.length];
          
          const title = template
            .replace('{}', role)
            .replace('{}', time)
            .replace('{}', amount);
          
          titles.push(title);
        }
      }
    }

    // 去重并限制数量
    const uniqueTitles = [...new Set(titles)].slice(0, this.config.titleCount);
    
    console.log(`✅ 标题生成完成，共 ${uniqueTitles.length} 个`);
    return uniqueTitles;
  }

  // 生成单篇文章
  async generateArticle(title, roleData, index) {
    console.log(`📄 生成文章 ${index}: ${title.substring(0, 20)}...`);

    const prompt = `请基于标题"${title}"和角色"${roleData.roleDescription}"，写一篇完整的自媒体文章。

文章要求：
1. 采用第一人称"我"的视角
2. 开头：真实困境场景描述
3. 中段：3-5个具体可操作的步骤
4. 结尾：低门槛的行动引导
5. 全文1500-2000字
6. 语言贴近目标人群
7. 在关键位置标注[配图位置：描述]

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
        max_tokens: 3000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      let content = response.data.choices[0].message.content;
      
      // 处理配图标记
      const imagePrompts = [];
      let imageIndex = 1;
      
      content = content.replace(/\[配图位置：([^\]]+)\]/g, (match, description) => {
        const imageName = `image_${roleData.roleId}_${String(index).padStart(3, '0')}_${imageIndex}.jpg`;
        imagePrompts.push({
          filename: imageName,
          description: description,
          prompt: this.generateImagePrompt(roleData, description)
        });
        imageIndex++;
        return `\n\n![${description}](./images/${imageName})\n\n`;
      });

      // 如果没有配图标记，自动添加
      if (imagePrompts.length === 0) {
        const defaultImages = [
          { desc: "开头场景图", pos: "## " },
          { desc: "操作步骤图", pos: "### " },
          { desc: "结果展示图", pos: "## 我的" }
        ];

        defaultImages.forEach((img, idx) => {
          if (content.includes(img.pos)) {
            const imageName = `image_${roleData.roleId}_${String(index).padStart(3, '0')}_${idx + 1}.jpg`;
            imagePrompts.push({
              filename: imageName,
              description: img.desc,
              prompt: this.generateImagePrompt(roleData, img.desc)
            });
          }
        });
      }

      return {
        title,
        content,
        imagePrompts,
        wordCount: content.length
      };

    } catch (error) {
      console.error(`❌ 文章生成失败: ${error.message}`);
      return this.createFallbackArticle(title, roleData, index);
    }
  }

  // 生成配图提示词
  generateImagePrompt(roleData, description) {
    const basePrompt = `真实生活场景，${roleData.roleDescription}正在${description}，
居家环境，自然光线，生活感强，
风格：纪实摄影，温暖色调，
细节：简单家具，日常用品，朴素穿着，
比例：16:9，高清画质，
避免：奢侈品，高端设备，过度商业化`;

    return basePrompt;
  }

  // 创建备用文章
  createFallbackArticle(title, roleData, index) {
    const content = `# ${title}

## 真实经历分享

大家好，我是一个普通的${roleData.roleDescription}。

三个月前，我还在为每个月的生活费发愁。总想着能不能做点什么补贴家用。

![开头场景图](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_1.jpg)

## 我的转变过程

### 第一步：寻找机会

一开始我也很迷茫，不知道从哪里开始。后来通过学习，我找到了适合自己的方向。

![操作步骤图](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_2.jpg)

### 第二步：开始实践

有了方向后，我开始尝试实际操作。第一天就有了小小的收获。

### 第三步：持续优化

通过不断的学习和实践，我的收入越来越稳定。

![结果展示图](./images/image_${roleData.roleId}_${String(index).padStart(3, '0')}_3.jpg)

## 我的收获

现在我每个月都能有稳定的收入，虽然不多，但足够补贴家用了。更重要的是，我找到了自己的价值。

## 给新手的建议

1. 不要害怕开始，每个人都是从零开始的
2. 坚持学习，持续改进
3. 保持耐心，成功需要时间

如果你也想开始，可以私信我，我会分享更多经验。

---

*本文为真实经历分享，仅供参考*`;

    return {
      title,
      content,
      imagePrompts: [
        {
          filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_1.jpg`,
          description: "开头场景图",
          prompt: this.generateImagePrompt(roleData, "开头场景图")
        },
        {
          filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_2.jpg`, 
          description: "操作步骤图",
          prompt: this.generateImagePrompt(roleData, "操作步骤图")
        },
        {
          filename: `image_${roleData.roleId}_${String(index).padStart(3, '0')}_3.jpg`,
          description: "结果展示图", 
          prompt: this.generateImagePrompt(roleData, "结果展示图")
        }
      ],
      wordCount: content.length
    };
  }

  // 生成配图（使用阿里云通义万相）
  async generateImages(allImagePrompts, outputPath) {
    console.log(`🎨 开始生成 ${allImagePrompts.length} 张配图...`);
    
    const results = await this.imageGenerator.batchGenerate(allImagePrompts, outputPath);
    
    // 生成配图质检报告
    const report = {
      总图片数: results.total,
      成功数量: results.successful.length,
      失败数量: results.failed.length,
      成功率: `${((results.successful.length / results.total) * 100).toFixed(1)}%`,
      生成时间: new Date().toISOString(),
      成功列表: results.successful.map(img => ({
        文件名: path.basename(img.path),
        提示词: img.prompt.substring(0, 50) + '...'
      })),
      失败列表: results.failed.map(img => ({
        文件名: img.filename,
        错误原因: img.error || '未知错误',
        提示词: img.prompt.substring(0, 50) + '...'
      }))
    };

    await fs.writeJson(path.join(outputPath, 'image_generation_report.json'), report, { spaces: 2 });
    
    return results;
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

## 深层情绪分析
${Object.entries(roleData.analysis.emotions).map(([emotion, level]) => 
  `- **${emotion}**: ${level}`
).join('\n')}

## 核心需求
${roleData.analysis.coreNeeds.map(need => `- ${need}`).join('\n')}

## 内容切入点
${roleData.analysis.contentAngles.map(angle => `- ${angle}`).join('\n')}

## 关键词库
${roleData.analysis.keywords.map(keyword => `- ${keyword}`).join('\n')}

## 产品变现模型
${Object.entries(roleData.analysis.productModel).map(([tier, details]) => 
  `### ${tier}\n- 产品: ${details.产品}\n- 价格: ${details.价格}元\n- 转化率: ${details.转化率}\n`
).join('\n')}

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

    // 生成配图
    console.log('🎨 开始生成配图...');
    const imageResults = await this.generateImages(allImagePrompts, outputPath);

    // 生成统计报告
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

    // Step 5: 导出所有格式
    console.log('📦 开始导出文件...');
    const exports = await this.fileExporter.exportAll(roleData, titles, articles, stats, outputPath);

    console.log(`✅ 所有文件已保存到: ${outputPath}`);
    return { ...stats, exports };
  }

  // 主流程
  async run(roleDescription) {
    console.log('🚀 UPCE万能虚拟产品生成系统启动');
    console.log('=' * 50);
    
    const startTime = Date.now();

    try {
      // Step 1: 角色分析
      const roleData = await this.analyzeRole(roleDescription);

      // Step 2: 生成标题
      const titles = await this.generateTitles(roleData);

      // Step 3: 生成文章
      console.log('📚 开始生成文章内容...');
      const articles = [];
      
      for (let i = 0; i < Math.min(titles.length, 10); i++) { // 先生成10篇测试
        const article = await this.generateArticle(titles[i], roleData, i + 1);
        articles.push(article);
        
        if ((i + 1) % 5 === 0) {
          console.log(`✅ 已完成 ${i + 1} 篇文章`);
        }
        
        // 避免API限制
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 4: 保存输出
      const stats = await this.saveOutput(roleData, titles, articles);

      // 完成统计
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n🎉 生成完成！');
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
      console.log('\n📁 输出文件:');
      console.log(`   - analysis_report.md (角色分析报告)`);
      console.log(`   - titles.txt (标题列表)`);
      console.log(`   - articles/ (文章目录)`);
      console.log(`   - images/ (配图信息)`);
      console.log(`   - generation_stats.json (统计数据)`);

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
    console.log('使用方法: node upce.js "角色描述"');
    console.log('示例: node upce.js "三线城市32岁健身教练，月入6000，想做线上私教"');
    process.exit(1);
  }

  const roleDescription = args.join(' ');
  const engine = new UPCEEngine();
  
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

module.exports = UPCEEngine;