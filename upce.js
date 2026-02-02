#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const AliyunImageGenerator = require('./AliyunImageGenerator');
const FileExporter = require('./FileExporter');
const Logger = require('./Logger');
const prompts = require('./prompts');

class UPCEEngine {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || 'sk-613c035207a848529bfae4308cce4515';
    this.baseURL = 'https://api.deepseek.com';
    this.outputDir = path.join(__dirname, 'upce_output');
    this.imageGenerator = new AliyunImageGenerator();
    this.fileExporter = new FileExporter();
    this.logger = null; // 将在run方法中初始化
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
    this.logger.stepStart('角色深度分析', '分析目标用户群体的深层需求和痛点');
    
    const prompt = prompts.roleAnalysis(roleDescription);

    try {
      this.logger.apiCall('DeepSeek Chat', this.baseURL + '/chat/completions', { model: 'deepseek-chat' });
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: prompts.roleAnalysisSystem
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
        // 清理可能的markdown格式
        let cleanText = analysisText;
        
        // 移除markdown代码块标记
        if (cleanText.includes('```json')) {
          cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        }
        if (cleanText.includes('```')) {
          cleanText = cleanText.replace(/```\s*/g, '');
        }
        
        // 尝试提取JSON部分
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanText = jsonMatch[0];
        }
        
        analysis = JSON.parse(cleanText.trim());
      } catch (e) {
        this.logger.warning('JSON解析失败，使用文本解析', { error: e.message });
        analysis = this.parseAnalysisText(analysisText, roleDescription);
      }

      const result = {
        roleId: this.generateRoleId(roleDescription),
        roleDescription,
        analysis,
        timestamp: new Date().toISOString()
      };

      this.logger.stepComplete('角色深度分析', { roleId: result.roleId });
      this.logger.apiResponse('DeepSeek Chat', true, { responseLength: analysisText.length });
      
      return result;

    } catch (error) {
      this.logger.stepFailed('角色深度分析', error);
      this.logger.apiResponse('DeepSeek Chat', false, { error: error.message });
      
      this.logger.warning('使用备用分析数据');
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
      const prompt = prompts.titleGeneration(roleData.roleDescription, roleData.analysis);

      try {
        const response = await axios.post(`${this.baseURL}/chat/completions`, {
          model: "deepseek-chat",
          messages: [
            {
              role: "system", 
              content: prompts.titleGenerationSystem
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
    
    // 显示前5个标题作为预览
    console.log('\n📋 标题预览（前5个）:');
    uniqueTitles.slice(0, 5).forEach((title, index) => {
      console.log(`   ${index + 1}. ${title}`);
    });
    console.log(`   ... 还有 ${uniqueTitles.length - 5} 个标题\n`);
    
    return uniqueTitles;
  }

  // 生成单篇文章
  async generateArticle(title, roleData, index) {
    console.log(`📄 生成文章 ${index}: ${title.substring(0, 20)}...`);

    const prompt = prompts.articleGeneration(title, roleData.roleDescription, roleData.analysis);

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: prompts.articleGenerationSystem
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
      
      // 处理配图标记 - 支持多种格式
      const imagePrompts = [];
      let imageIndex = 1;
      
      // 匹配多种配图标记格式
      const imagePatterns = [
        /\[配图位置：([^\]]+)\]/g,
        /\[配图：([^\]]+)\]/g,
        /\[配图\d+：([^\]]+)\]/g,
        /配图\d+：([^\n]+)/g
      ];
      
      imagePatterns.forEach(pattern => {
        content = content.replace(pattern, (match, description) => {
          const imageName = `image_${roleData.roleId}_${String(index).padStart(3, '0')}_${imageIndex}.jpg`;
          imagePrompts.push({
            filename: imageName,
            description: description,
            prompt: this.generateImagePrompt(roleData, description)
          });
          imageIndex++;
          return `\n\n![${description}](./images/${imageName})\n\n`;
        });
      });

      // 如果没有找到配图标记，强制添加默认配图
      if (imagePrompts.length === 0) {
        console.log(`⚠️ 文章 ${index} 未检测到配图标记，添加默认配图`);
        
        // 在文章开头、中间、结尾添加配图
        const defaultImages = [
          { desc: `${roleData.roleDescription}的真实生活场景`, insertAfter: "# " },
          { desc: `${roleData.roleDescription}的具体操作步骤展示`, insertAfter: "## " },
          { desc: `${roleData.roleDescription}获得成功后的状态`, insertAfter: "### " }
        ];

        defaultImages.forEach((img, idx) => {
          const imageName = `image_${roleData.roleId}_${String(index).padStart(3, '0')}_${idx + 1}.jpg`;
          imagePrompts.push({
            filename: imageName,
            description: img.desc,
            prompt: this.generateImagePrompt(roleData, img.desc)
          });
          
          // 在适当位置插入图片标记
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(img.insertAfter) && i < lines.length - 1) {
              lines.splice(i + 1, 0, `\n![${img.desc}](./images/${imageName})\n`);
              break;
            }
          }
          content = lines.join('\n');
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
    
    this.logger.info('📁 开始创建输出目录', { outputPath });
    await fs.ensureDir(outputPath);
    await fs.ensureDir(path.join(outputPath, 'articles'));
    await fs.ensureDir(path.join(outputPath, 'images'));
    
    // 验证目录创建成功
    const articlesDir = path.join(outputPath, 'articles');
    const articlesDirExists = await fs.pathExists(articlesDir);
    this.logger.info('📂 目录创建状态', { 
      outputPath: await fs.pathExists(outputPath),
      articlesDir: articlesDirExists,
      imagesDir: await fs.pathExists(path.join(outputPath, 'images'))
    });

    console.log('💾 保存输出文件...');
    this.logger.info('💾 开始保存所有输出文件');

    // 保存角色分析报告
    this.logger.info('📝 开始保存角色分析报告');
    const analysisReport = `# ${roleData.roleDescription} - 角色分析报告

## 基本信息
- **角色ID**: ${roleData.roleId}
- **分析时间**: ${roleData.timestamp}
- **角色描述**: ${roleData.roleDescription}

## 深层情绪分析
${Object.entries(roleData.analysis.emotions || {}).map(([emotion, level]) => 
  `- **${emotion}**: ${level}`
).join('\n')}

## 核心需求
${(roleData.analysis.coreNeeds || []).map(need => `- ${need}`).join('\n')}

## 内容切入点
${(roleData.analysis.contentAngles || []).map(angle => `- ${angle}`).join('\n')}

## 关键词库
${(roleData.analysis.keywords || []).map(keyword => `- ${keyword}`).join('\n')}

## 产品变现模型
${roleData.analysis.productModel ? Object.entries(roleData.analysis.productModel).map(([tier, details]) => 
  `### ${tier}\n- 产品: ${details.产品 || details.product || 'N/A'}\n- 价格: ${details.价格 || details.price || 'N/A'}元\n- 转化率: ${details.转化率 || details.conversion || 'N/A'}\n`
).join('\n') : '暂无产品模型数据'}

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
      const filePath = path.join(outputPath, 'articles', filename);
      
      this.logger.info(`💾 开始保存文章 ${i + 1}`, { filename, filePath });
      
      try {
        await fs.writeFile(filePath, article.content);
        
        // 验证文件是否真的保存成功
        const fileExists = await fs.pathExists(filePath);
        const fileStats = fileExists ? await fs.stat(filePath) : null;
        
        if (fileExists && fileStats.size > 0) {
          console.log(`📄 文章已保存: ${filePath} (${fileStats.size} bytes)`);
          this.logger.success(`文章 ${i + 1} 保存成功`, { 
            filePath, 
            fileSize: fileStats.size,
            wordCount: article.wordCount 
          });
        } else {
          throw new Error(`文件保存失败或文件为空: ${filePath}`);
        }
      } catch (saveError) {
        this.logger.error(`文章 ${i + 1} 保存失败`, { 
          filename, 
          filePath, 
          error: saveError.message 
        });
        console.log(`❌ 文章保存失败: ${filePath} - ${saveError.message}`);
      }
      
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
    const roleId = this.generateRoleId(roleDescription);
    const outputPath = path.join(this.outputDir, roleId);
    
    // 初始化日志系统
    this.logger = new Logger(outputPath, roleId);
    
    this.logger.info('🚀 UPCE万能虚拟产品生成系统启动');
    this.logger.info('角色描述', { roleDescription });
    
    const startTime = Date.now();

    try {
      // Step 1: 角色分析
      const roleData = await this.analyzeRole(roleDescription);

      // Step 2: 生成标题
      const titles = await this.generateTitles(roleData);

      // Step 3: 生成文章
      this.logger.stepStart('文章生成', `生成${Math.min(titles.length, 3)}篇文章`);
      const articles = [];
      
      for (let i = 0; i < Math.min(titles.length, 3); i++) { // 先生成3篇测试，避免超时
        this.logger.progress(`生成文章: ${titles[i].substring(0, 30)}...`, i + 1, 3);
        
        try {
          this.logger.info(`🚀 开始生成文章 ${i + 1}`, { 
            title: titles[i], 
            index: i + 1, 
            totalArticles: Math.min(titles.length, 3) 
          });
          
          const article = await this.generateArticle(titles[i], roleData, i + 1);
          articles.push(article);
          
          this.logger.success(`文章 ${i + 1} 生成完成`, { 
            title: titles[i], 
            wordCount: article.wordCount,
            imageCount: article.imagePrompts.length,
            filePath: `${this.outputDir}/${roleId}/articles/article_${String(i + 1).padStart(3, '0')}.md`
          });
          
        } catch (error) {
          this.logger.error(`文章 ${i + 1} 生成失败`, { 
            title: titles[i], 
            error: error.message 
          });
          
          // 使用备用文章
          const fallbackArticle = this.createFallbackArticle(titles[i], roleData, i + 1);
          articles.push(fallbackArticle);
          this.logger.warning(`使用备用文章 ${i + 1}`);
        }
        
        // 避免API限制
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.logger.stepComplete('文章生成', { articlesCount: articles.length });

      // Step 4: 保存输出
      const stats = await this.saveOutput(roleData, titles, articles);

      // 完成统计
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      // 生成最终报告
      this.logger.generateFinalReport({
        ...stats,
        duration: `${duration}秒`,
        performance: {
          totalTime: duration,
          avgTimePerArticle: Math.round(duration / articles.length),
          apiCalls: articles.length + 2, // 角色分析 + 标题生成 + 文章数量
        }
      });

      // 显示输出路径
      this.logger.showOutputPaths();

      console.log('\n🎉 生成完成！详细信息请查看日志文件');
      console.log(`📄 HTML报告: open "${path.join(outputPath, 'generation_report.html')}"`);
      console.log(`📁 输出目录: open "${outputPath}"`);

      return stats;

    } catch (error) {
      this.logger.error('生成过程出错', { error: error.message, stack: error.stack });
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