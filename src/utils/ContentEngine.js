const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

class ContentEngine {
  constructor() {
    this.configPath = path.join(__dirname, '../content_os/config');
    this.metadataPath = path.join(__dirname, '../content_os/metadata');
    this.outputsPath = path.join(__dirname, '../content_os/outputs');
    this.logsPath = path.join(__dirname, '../content_os/logs');
    
    this.config = this.loadConfig();
    this.metadata = this.loadMetadata();
  }

  loadConfig() {
    const imageRules = fs.readJsonSync(path.join(this.configPath, 'image_rules.json'));
    return { imageRules };
  }

  loadMetadata() {
    const rolesProcessed = fs.readJsonSync(path.join(this.metadataPath, 'roles_processed.json'));
    const titleHashes = fs.readFileSync(path.join(this.metadataPath, 'title_hashes.txt'), 'utf8')
      .split('\n').filter(line => line.trim());
    const contentHashes = fs.readFileSync(path.join(this.metadataPath, 'content_hashes.txt'), 'utf8')
      .split('\n').filter(line => line.trim());
    
    return { rolesProcessed, titleHashes, contentHashes };
  }

  generateRoleId(roleDescription) {
    // 提取关键词生成唯一ID
    const keywords = roleDescription.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    
    const hash = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 6);
    return keywords.join('_') + '_' + hash;
  }

  calculateSimHash(text) {
    // 简化的SimHash实现
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return hash;
  }

  calculateSimilarity(text1, text2) {
    // 简化的相似度计算
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  async analyzeRole(roleDescription) {
    const roleId = this.generateRoleId(roleDescription);
    
    // 检查是否已处理过
    const existingRole = this.metadata.rolesProcessed.find(r => r.role_id === roleId);
    if (existingRole) {
      console.log(`角色 ${roleId} 已存在，跳过分析`);
      return { roleId, isExisting: true, data: existingRole };
    }

    // 角色分析逻辑
    const analysis = {
      role_id: roleId,
      role_desc: roleDescription,
      processed_at: new Date().toISOString(),
      emotions: this.extractEmotions(roleDescription),
      needs: this.identifyNeeds(roleDescription),
      contentAngles: this.generateContentAngles(roleDescription),
      keywords: this.generateKeywords(roleDescription),
      productModel: this.designProductModel(roleDescription)
    };

    // 保存到元数据
    this.metadata.rolesProcessed.push(analysis);
    await this.saveMetadata();

    return { roleId, isExisting: false, data: analysis };
  }

  extractEmotions(roleDescription) {
    // 基于角色描述提取5类深层情绪
    const emotionPatterns = {
      恐惧: ['担心', '害怕', '焦虑', '不安', '压力'],
      羞耻: ['尴尬', '丢脸', '自卑', '不好意思', '难堪'],
      希望: ['希望', '期待', '梦想', '目标', '愿望'],
      孤独: ['孤单', '独自', '没人', '一个人', '寂寞'],
      愧疚: ['内疚', '对不起', '愧疚', '自责', '后悔']
    };

    const emotions = {};
    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      emotions[emotion] = patterns.some(pattern => 
        roleDescription.includes(pattern)
      ) ? '高' : '中';
    }

    return emotions;
  }

  identifyNeeds(roleDescription) {
    // 识别3个核心需求
    const commonNeeds = [
      { need: '经济独立', keywords: ['赚钱', '收入', '经济', '财务'] },
      { need: '时间自由', keywords: ['时间', '自由', '灵活', '兼职'] },
      { need: '社会认同', keywords: ['认可', '成就', '价值', '地位'] },
      { need: '技能提升', keywords: ['学习', '技能', '能力', '成长'] },
      { need: '家庭平衡', keywords: ['家庭', '孩子', '平衡', '照顾'] }
    ];

    return commonNeeds
      .filter(item => item.keywords.some(keyword => roleDescription.includes(keyword)))
      .slice(0, 3)
      .map(item => item.need);
  }

  generateContentAngles(roleDescription) {
    // 生成3个内容切入点
    return [
      '真实案例分享：从0到月入3000的完整过程',
      '避坑指南：新手最容易犯的5个错误',
      '工具推荐：提高效率的免费资源清单'
    ];
  }

  generateKeywords(roleDescription) {
    // 生成20个高商业意图关键词
    const baseKeywords = [
      '副业', '兼职', '在家赚钱', '网络赚钱', '被动收入',
      '小红书', '抖音', '微信', '淘宝', '拼多多',
      '新手', '零基础', '简单', '快速', '稳定',
      '宝妈', '学生', '上班族', '退休', '创业'
    ];

    // 根据角色描述筛选和组合关键词
    return baseKeywords.slice(0, 20);
  }

  designProductModel(roleDescription) {
    // 设计四层产品模型
    return {
      免费层: {
        产品: '入门指南PDF + 微信群',
        价格: 0,
        转化率: '30%',
        月活跃: 1000
      },
      基础层: {
        产品: '7天训练营 + 1对1指导',
        价格: 99,
        转化率: '8%',
        月销量: 80
      },
      进阶层: {
        产品: '3个月陪跑 + 资源包 + 社群',
        价格: 2980,
        转化率: '2%',
        月销量: 20
      },
      高端层: {
        产品: '1对1咨询 + 定制方案',
        价格: 9800,
        转化率: '0.5%',
        月销量: 5
      }
    };
  }

  async generateTitles(roleData, count = 100) {
    const titles = [];
    const templates = [
      (role, amount, time) => `${role}${time}赚${amount}元的真实经历`,
      (role, truth) => `别再被骗了！${role}最适合做${truth}`,
      (role, comparison) => `${role}副业收入超过主业：${comparison}`,
      (platform, secret) => `${platform}最新红利：${secret}`,
      (failure, success) => `从${failure}到${success}的完整过程`,
      (action) => `今天就能开始：${action}`
    ];

    const roleKeywords = ['宝妈', '学生', '上班族', '退休人员'];
    const amounts = ['217', '500', '1000', '3000', '5000'];
    const times = ['3天', '一周', '半月', '一个月'];
    const platforms = ['小红书', '抖音', '微信', '闲鱼'];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      let title;
      
      switch (i % templates.length) {
        case 0:
          title = template(
            roleKeywords[i % roleKeywords.length],
            amounts[i % amounts.length],
            times[i % times.length]
          );
          break;
        case 1:
          title = template(
            roleKeywords[i % roleKeywords.length],
            '这个项目'
          );
          break;
        case 2:
          title = template(
            roleKeywords[i % roleKeywords.length],
            '真实对比'
          );
          break;
        case 3:
          title = template(
            platforms[i % platforms.length],
            '流量密码'
          );
          break;
        case 4:
          title = template('被嘲笑', '月入过万');
          break;
        case 5:
          title = template('3个零成本副业项目');
          break;
      }

      // 检查重复
      const titleHash = this.calculateSimHash(title);
      const isDuplicate = this.metadata.titleHashes.some(hash => {
        return this.calculateSimilarity(title, hash) > this.config.imageRules.quality_thresholds.similarity_max;
      });

      if (!isDuplicate) {
        titles.push(title);
        this.metadata.titleHashes.push(titleHash);
      } else {
        i--; // 重新生成
      }
    }

    await this.saveMetadata();
    return titles;
  }

  async generateArticle(title, roleData, index) {
    const article = {
      title,
      content: this.generateArticleContent(title, roleData),
      images: [],
      imagePrompts: []
    };

    // 在关键位置插入配图
    const imagePositions = [
      { position: 'after_intro', description: '开头场景图' },
      { position: 'step_1', description: '操作步骤1' },
      { position: 'step_3', description: '操作步骤3' },
      { position: 'result', description: '结果展示' }
    ];

    for (let i = 0; i < imagePositions.length; i++) {
      const imagePrompt = this.generateImagePrompt(roleData, imagePositions[i].description);
      const imageName = `image_${roleData.role_id}_${index}_${i + 1}.png`;
      
      article.images.push(imageName);
      article.imagePrompts.push({
        filename: imageName,
        prompt: imagePrompt,
        position: imagePositions[i].position
      });
    }

    return article;
  }

  generateArticleContent(title, roleData) {
    return `# ${title}

## 真实经历分享

大家好，我是一个普通的${roleData.role_desc}。

三个月前，我还在为每个月的生活费发愁。孩子要上学，家里开销大，老公的工资勉强够用，我总想着能不能做点什么补贴家用。

![开头场景图](image_placeholder_1.png)

## 我的转变过程

### 第一步：寻找机会

一开始我也很迷茫，不知道从哪里开始。后来在朋友的推荐下，我开始关注一些副业项目。

![操作步骤1](image_placeholder_2.png)

### 第二步：学习技能

我花了一周时间学习基础知识，每天晚上孩子睡了以后，我就在手机上学习。

### 第三步：开始实践

有了基础后，我开始尝试实际操作。第一天就有了小小的收获。

![操作步骤3](image_placeholder_3.png)

### 第四步：持续优化

通过不断的学习和实践，我的收入越来越稳定。

## 我的收获

现在我每个月都能有稳定的收入，虽然不多，但足够补贴家用了。更重要的是，我找到了自己的价值。

![结果展示](image_placeholder_4.png)

## 给新手的建议

1. 不要害怕开始，每个人都是从零开始的
2. 坚持学习，持续改进
3. 保持耐心，成功需要时间

如果你也想开始，可以扫码加我微信，我会分享更多经验。

---

*本文为真实经历分享，仅供参考*`;
  }

  generateImagePrompt(roleData, description) {
    const basePrompt = `真实生活场景，${roleData.role_desc}正在${description}，
环境：居家环境，自然光线，
风格：纪实摄影，温暖色调，生活感强，
细节：简单家具，日常用品，朴素穿着，
比例：16:9，高清画质，
避免：奢侈品，高端设备，过度商业化`;

    return basePrompt;
  }

  async saveMetadata() {
    await fs.writeJson(
      path.join(this.metadataPath, 'roles_processed.json'),
      this.metadata.rolesProcessed,
      { spaces: 2 }
    );
    
    await fs.writeFile(
      path.join(this.metadataPath, 'title_hashes.txt'),
      this.metadata.titleHashes.join('\n')
    );
    
    await fs.writeFile(
      path.join(this.metadataPath, 'content_hashes.txt'),
      this.metadata.contentHashes.join('\n')
    );
  }

  async saveOutput(roleId, data) {
    const outputDir = path.join(this.outputsPath, roleId);
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(outputDir, 'articles'));

    // 保存分析结果
    await fs.writeFile(
      path.join(outputDir, `analysis_${roleId}.md`),
      this.formatAnalysis(data.analysis)
    );

    // 保存标题
    await fs.writeFile(
      path.join(outputDir, `titles_${roleId}.txt`),
      data.titles.join('\n')
    );

    // 保存文章
    for (let i = 0; i < data.articles.length; i++) {
      const article = data.articles[i];
      const filename = `article_${roleId}_${String(i + 1).padStart(3, '0')}.md`;
      await fs.writeFile(
        path.join(outputDir, 'articles', filename),
        article.content
      );
    }

    // 保存配图提示词
    const imagePrompts = data.articles.flatMap(article => article.imagePrompts);
    await fs.writeJson(
      path.join(outputDir, `image_prompts_${roleId}.json`),
      imagePrompts,
      { spaces: 2 }
    );
  }

  formatAnalysis(analysis) {
    return `# 角色分析报告

## 基本信息
- **角色ID**: ${analysis.role_id}
- **角色描述**: ${analysis.role_desc}
- **处理时间**: ${analysis.processed_at}

## 情绪分析
${Object.entries(analysis.emotions).map(([emotion, level]) => 
  `- **${emotion}**: ${level}`
).join('\n')}

## 核心需求
${analysis.needs.map(need => `- ${need}`).join('\n')}

## 内容切入点
${analysis.contentAngles.map(angle => `- ${angle}`).join('\n')}

## 关键词库
${analysis.keywords.map(keyword => `- ${keyword}`).join('\n')}

## 产品模型
${Object.entries(analysis.productModel).map(([tier, details]) => 
  `### ${tier}\n- 产品: ${details.产品}\n- 价格: ${details.价格}元\n- 转化率: ${details.转化率}\n`
).join('\n')}
`;
  }

  async processRole(roleDescription) {
    console.log('开始处理角色:', roleDescription);
    
    // Step 1: 角色分析
    const roleResult = await this.analyzeRole(roleDescription);
    
    if (roleResult.isExisting) {
      console.log('角色已存在，进行增量生成');
    }

    // Step 2: 生成标题
    console.log('生成标题中...');
    const titles = await this.generateTitles(roleResult.data, 100);

    // Step 3: 生成文章
    console.log('生成文章中...');
    const articles = [];
    for (let i = 0; i < titles.length; i++) {
      const article = await this.generateArticle(titles[i], roleResult.data, i + 1);
      articles.push(article);
      
      if ((i + 1) % 10 === 0) {
        console.log(`已生成 ${i + 1} 篇文章`);
      }
    }

    // Step 4: 保存输出
    console.log('保存输出文件...');
    await this.saveOutput(roleResult.roleId, {
      analysis: roleResult.data,
      titles,
      articles
    });

    console.log(`处理完成！输出目录: content_os/outputs/${roleResult.roleId}`);
    
    return {
      roleId: roleResult.roleId,
      titlesCount: titles.length,
      articlesCount: articles.length,
      outputPath: `content_os/outputs/${roleResult.roleId}`
    };
  }
}

module.exports = ContentEngine;