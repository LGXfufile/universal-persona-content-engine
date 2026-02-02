const EventEmitter = require('events');
const SmartAPIScheduler = require('./SmartAPIScheduler');

/**
 * 渐进式内容生成器 - 方案二核心组件
 * 功能：分阶段生成、实时进度、断点续传、智能批处理
 */
class ProgressiveGenerator extends EventEmitter {
  constructor() {
    super();
    this.apiScheduler = new SmartAPIScheduler();
    this.progressTracker = new ProgressTracker();
    this.checkpointManager = new CheckpointManager();
    this.batchProcessor = new BatchProcessor();
    
    // 生成配置
    this.config = {
      titleBatchSize: 20,      // 标题批处理大小
      articleBatchSize: 1,     // 文章批处理大小（逐个生成）
      imageBatchSize: 2,       // 图片批处理大小
      maxConcurrent: 3,        // 最大并发数
      timeoutPerStage: 300000, // 每阶段超时时间（5分钟）
      enableCheckpoint: true   // 启用断点续传
    };
  }

  /**
   * 渐进式生成内容
   */
  async generateContent(roleDescription, options = {}) {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    
    try {
      // 初始化进度跟踪
      this.progressTracker.initialize(sessionId, {
        stages: ['analyze', 'titles', 'articles', 'images', 'export'],
        totalSteps: 100
      });

      // 检查是否有断点可以恢复
      let checkpoint = null;
      if (this.config.enableCheckpoint) {
        checkpoint = await this.checkpointManager.load(sessionId, roleDescription);
      }

      const result = {
        sessionId,
        roleDescription,
        startTime,
        stages: {}
      };

      // 阶段1：快速角色分析（30秒内完成）
      if (!checkpoint?.analysis) {
        this.progressTracker.updateStage(sessionId, 'analyze', '分析角色特征...', 10);
        this.emit('stageStart', { sessionId, stage: 'analyze', description: '角色深度分析' });
        
        result.stages.analysis = await this.quickAnalyze(roleDescription, sessionId);
        
        if (this.config.enableCheckpoint) {
          await this.checkpointManager.save(sessionId, { analysis: result.stages.analysis });
        }
        
        this.emit('stageComplete', { sessionId, stage: 'analyze', result: result.stages.analysis });
      } else {
        result.stages.analysis = checkpoint.analysis;
        this.progressTracker.updateStage(sessionId, 'analyze', '从断点恢复角色分析', 10);
      }

      // 阶段2：批量标题生成（分批处理）
      if (!checkpoint?.titles) {
        this.progressTracker.updateStage(sessionId, 'titles', '生成标题库...', 30);
        this.emit('stageStart', { sessionId, stage: 'titles', description: '批量标题生成' });
        
        result.stages.titles = await this.batchGenerateTitles(
          result.stages.analysis, 
          sessionId,
          options.titleCount || 50
        );
        
        if (this.config.enableCheckpoint) {
          await this.checkpointManager.save(sessionId, { 
            analysis: result.stages.analysis,
            titles: result.stages.titles 
          });
        }
        
        this.emit('stageComplete', { sessionId, stage: 'titles', result: result.stages.titles });
      } else {
        result.stages.titles = checkpoint.titles;
        this.progressTracker.updateStage(sessionId, 'titles', '从断点恢复标题库', 30);
      }

      // 阶段3：智能文章生成（逐个生成，实时反馈）
      if (!checkpoint?.articles) {
        this.progressTracker.updateStage(sessionId, 'articles', '创作文章内容...', 70);
        this.emit('stageStart', { sessionId, stage: 'articles', description: '智能文章生成' });
        
        result.stages.articles = await this.smartGenerateArticles(
          result.stages.titles.slice(0, options.articleCount || 3),
          result.stages.analysis,
          sessionId
        );
        
        if (this.config.enableCheckpoint) {
          await this.checkpointManager.save(sessionId, { 
            analysis: result.stages.analysis,
            titles: result.stages.titles,
            articles: result.stages.articles
          });
        }
        
        this.emit('stageComplete', { sessionId, stage: 'articles', result: result.stages.articles });
      } else {
        result.stages.articles = checkpoint.articles;
        this.progressTracker.updateStage(sessionId, 'articles', '从断点恢复文章内容', 70);
      }

      // 阶段4：并行图片生成（可选，支持降级）
      if (options.includeImages !== false) {
        this.progressTracker.updateStage(sessionId, 'images', '生成配图...', 90);
        this.emit('stageStart', { sessionId, stage: 'images', description: '并行图片生成' });
        
        try {
          result.stages.images = await this.parallelImageGeneration(
            result.stages.articles,
            sessionId
          );
        } catch (error) {
          console.log('⚠️ 图片生成失败，使用占位符模式');
          result.stages.images = this.createImagePlaceholders(result.stages.articles);
        }
        
        this.emit('stageComplete', { sessionId, stage: 'images', result: result.stages.images });
      }

      // 阶段5：导出和打包
      this.progressTracker.updateStage(sessionId, 'export', '导出内容包...', 100);
      this.emit('stageStart', { sessionId, stage: 'export', description: '内容导出' });
      
      result.stages.export = await this.exportContent(result, sessionId);
      
      this.emit('stageComplete', { sessionId, stage: 'export', result: result.stages.export });

      // 清理断点
      if (this.config.enableCheckpoint) {
        await this.checkpointManager.clear(sessionId);
      }

      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      
      this.emit('generationComplete', { sessionId, result, duration: result.duration });
      
      return result;

    } catch (error) {
      this.emit('generationError', { sessionId, error: error.message, stack: error.stack });
      return this.handlePartialSuccess(sessionId, error);
    }
  }

  /**
   * 快速角色分析
   */
  async quickAnalyze(roleDescription, sessionId) {
    const prompts = require('./prompts');
    
    try {
      const response = await this.apiScheduler.scheduleRequest('text', {
        messages: [
          {
            role: "system",
            content: prompts.roleAnalysisSystem
          },
          {
            role: "user", 
            content: prompts.roleAnalysis(roleDescription)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const analysisText = response.data.choices[0].message.content;
      
      // 尝试解析JSON，失败则使用文本解析
      let analysis;
      try {
        const cleanText = this.cleanJSONText(analysisText);
        analysis = JSON.parse(cleanText);
      } catch (e) {
        analysis = this.parseAnalysisText(analysisText, roleDescription);
      }

      return {
        roleId: this.generateRoleId(roleDescription),
        roleDescription,
        analysis,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.log('⚠️ 角色分析失败，使用模板分析');
      return this.createFallbackAnalysis(roleDescription);
    }
  }

  /**
   * 批量生成标题
   */
  async batchGenerateTitles(analysisResult, sessionId, totalCount = 50) {
    const titles = [];
    const batchSize = this.config.titleBatchSize;
    const batches = Math.ceil(totalCount / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, totalCount - titles.length);
      const progress = 30 + (batch / batches) * 40; // 30-70%
      
      this.progressTracker.updateStage(
        sessionId, 
        'titles', 
        `生成标题批次 ${batch + 1}/${batches}...`, 
        progress
      );

      try {
        const batchTitles = await this.generateTitleBatch(
          analysisResult, 
          currentBatchSize,
          sessionId
        );
        
        titles.push(...batchTitles);
        
        this.emit('batchProgress', {
          sessionId,
          stage: 'titles',
          batch: batch + 1,
          total: batches,
          items: batchTitles.length
        });

        // 批次间延迟
        if (batch < batches - 1) {
          await this.sleep(1000);
        }

      } catch (error) {
        console.log(`⚠️ 标题批次 ${batch + 1} 生成失败，使用模板标题`);
        const fallbackTitles = this.createFallbackTitles(analysisResult, currentBatchSize);
        titles.push(...fallbackTitles);
      }
    }

    return this.deduplicateTitles(titles);
  }

  /**
   * 智能文章生成
   */
  async smartGenerateArticles(selectedTitles, analysisResult, sessionId) {
    const articles = [];
    const totalArticles = selectedTitles.length;
    
    for (let i = 0; i < totalArticles; i++) {
      const title = selectedTitles[i];
      const progress = 70 + ((i + 1) / totalArticles) * 20; // 70-90%
      
      this.progressTracker.updateStage(
        sessionId,
        'articles',
        `创作文章 ${i + 1}/${totalArticles}: ${title.substring(0, 20)}...`,
        progress
      );

      this.emit('articleStart', {
        sessionId,
        articleIndex: i + 1,
        totalArticles,
        title
      });

      try {
        const article = await this.generateSingleArticle(
          title,
          analysisResult,
          sessionId,
          i + 1
        );
        
        articles.push(article);
        
        this.emit('articleComplete', {
          sessionId,
          articleIndex: i + 1,
          article,
          wordCount: article.wordCount
        });

        // 文章间延迟
        if (i < totalArticles - 1) {
          await this.sleep(2000);
        }

      } catch (error) {
        console.log(`⚠️ 文章 ${i + 1} 生成失败，使用模板文章`);
        const fallbackArticle = this.createFallbackArticle(title, analysisResult, i + 1);
        articles.push(fallbackArticle);
      }
    }

    return articles;
  }

  /**
   * 并行图片生成
   */
  async parallelImageGeneration(articles, sessionId) {
    const allImagePrompts = [];
    
    // 收集所有图片提示词
    articles.forEach((article, index) => {
      if (article.imagePrompts) {
        article.imagePrompts.forEach(prompt => {
          allImagePrompts.push({
            ...prompt,
            articleIndex: index + 1,
            articleTitle: article.title
          });
        });
      }
    });

    if (allImagePrompts.length === 0) {
      return { successful: [], failed: [], total: 0 };
    }

    // 分批并行处理
    const batchSize = this.config.imageBatchSize;
    const batches = this.chunkArray(allImagePrompts, batchSize);
    const results = { successful: [], failed: [], total: allImagePrompts.length };

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const progress = 90 + (batchIndex / batches.length) * 10; // 90-100%
      
      this.progressTracker.updateStage(
        sessionId,
        'images',
        `生成图片批次 ${batchIndex + 1}/${batches.length}...`,
        progress
      );

      // 并行处理当前批次
      const batchPromises = batch.map(async (imagePrompt) => {
        try {
          const result = await this.apiScheduler.scheduleRequest('image', {
            input: {
              messages: [{
                role: "user",
                content: [{ text: imagePrompt.prompt }]
              }]
            },
            parameters: {
              negative_prompt: "低分辨率，低画质，肢体畸形，手指畸形",
              prompt_extend: true,
              watermark: false,
              size: "1664*928"
            }
          });

          return { success: true, imagePrompt, result };
        } catch (error) {
          return { success: false, imagePrompt, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.successful.push(result.value);
          } else {
            results.failed.push(result.value);
          }
        } else {
          results.failed.push({
            success: false,
            error: result.reason.message
          });
        }
      });

      this.emit('imageBatchComplete', {
        sessionId,
        batchIndex: batchIndex + 1,
        totalBatches: batches.length,
        batchResults: batchResults.length
      });
    }

    return results;
  }

  /**
   * 导出内容
   */
  async exportContent(generationResult, sessionId) {
    // 这里可以集成现有的FileExporter
    const FileExporter = require('./FileExporter');
    const exporter = new FileExporter();
    
    try {
      const exportResult = await exporter.exportAll(
        generationResult.stages.analysis,
        generationResult.stages.titles,
        generationResult.stages.articles,
        generationResult.stages.images
      );
      
      return exportResult;
    } catch (error) {
      console.log('⚠️ 导出失败，创建基础导出');
      return this.createBasicExport(generationResult);
    }
  }

  /**
   * 处理部分成功的情况
   */
  async handlePartialSuccess(sessionId, error) {
    const completedSteps = this.progressTracker.getCompletedSteps(sessionId);
    
    return {
      sessionId,
      status: 'partial_success',
      error: error.message,
      completedSteps,
      canResume: this.config.enableCheckpoint,
      resumeInstructions: '可以使用相同的角色描述重新运行以从断点继续'
    };
  }

  // 辅助方法
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateRoleId(roleDescription) {
    const crypto = require('crypto');
    const keywords = roleDescription.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    
    const hash = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 6);
    return keywords.join('_') + '_' + hash;
  }

  cleanJSONText(text) {
    let cleanText = text;
    if (cleanText.includes('```json')) {
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    }
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```\s*/g, '');
    }
    
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    return cleanText.trim();
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 占位方法（需要根据实际需求实现）
  parseAnalysisText(text, roleDescription) {
    return {
      emotions: { 焦虑: "中等", 期待: "高" },
      coreNeeds: ["解决实际问题", "获得认同"],
      contentAngles: ["真实经历分享", "实用方法介绍"],
      keywords: roleDescription.split(/[，。、\s]+/).filter(w => w.length > 1)
    };
  }

  createFallbackAnalysis(roleDescription) {
    return {
      roleId: this.generateRoleId(roleDescription),
      roleDescription,
      analysis: this.parseAnalysisText("", roleDescription),
      generatedAt: new Date().toISOString(),
      fallback: true
    };
  }

  async generateTitleBatch(analysisResult, count, sessionId) {
    // 实现标题批次生成逻辑
    const titles = [];
    for (let i = 0; i < count; i++) {
      titles.push(`${analysisResult.roleDescription}相关标题 ${i + 1}`);
    }
    return titles;
  }

  createFallbackTitles(analysisResult, count) {
    const titles = [];
    for (let i = 0; i < count; i++) {
      titles.push(`${analysisResult.roleDescription}的经验分享 ${i + 1}`);
    }
    return titles;
  }

  deduplicateTitles(titles) {
    return [...new Set(titles)];
  }

  async generateSingleArticle(title, analysisResult, sessionId, index) {
    // 实现单篇文章生成逻辑
    return {
      title,
      content: `# ${title}\n\n这是一篇关于${analysisResult.roleDescription}的文章内容...`,
      wordCount: 1200,
      imagePrompts: [
        {
          filename: `image_${index}_1.jpg`,
          description: `${title}相关配图`,
          prompt: `真实生活场景，${analysisResult.roleDescription}，温暖色调，高清摄影`
        }
      ]
    };
  }

  createFallbackArticle(title, analysisResult, index) {
    return {
      title,
      content: `# ${title}\n\n这是一篇模板文章...`,
      wordCount: 800,
      imagePrompts: [],
      fallback: true
    };
  }

  createImagePlaceholders(articles) {
    return {
      successful: [],
      failed: articles.flatMap(article => 
        article.imagePrompts?.map(prompt => ({
          filename: prompt.filename,
          error: '图片生成服务不可用',
          placeholder: true
        })) || []
      ),
      total: articles.reduce((sum, article) => sum + (article.imagePrompts?.length || 0), 0)
    };
  }

  createBasicExport(generationResult) {
    return {
      format: 'basic',
      files: ['analysis.md', 'titles.txt', 'articles/'],
      path: `./upce_output/${generationResult.stages.analysis.roleId}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 进度跟踪器
 */
class ProgressTracker {
  constructor() {
    this.sessions = new Map();
  }

  initialize(sessionId, config) {
    this.sessions.set(sessionId, {
      stages: config.stages,
      totalSteps: config.totalSteps,
      currentStage: null,
      currentProgress: 0,
      stageProgress: new Map(),
      startTime: Date.now(),
      completedSteps: []
    });
  }

  updateStage(sessionId, stage, description, progress) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentStage = stage;
    session.currentProgress = progress;
    session.stageProgress.set(stage, { description, progress, timestamp: Date.now() });

    console.log(`[${progress.toFixed(1)}%] ${stage}: ${description}`);
  }

  getCompletedSteps(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session.stageProgress.keys()) : [];
  }

  getProgress(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      currentStage: session.currentStage,
      currentProgress: session.currentProgress,
      stages: Object.fromEntries(session.stageProgress),
      duration: Date.now() - session.startTime
    };
  }
}

/**
 * 断点管理器
 */
class CheckpointManager {
  constructor() {
    this.fs = require('fs-extra');
    this.path = require('path');
    this.checkpointDir = './checkpoints';
  }

  async save(sessionId, data) {
    try {
      await this.fs.ensureDir(this.checkpointDir);
      const checkpointFile = this.path.join(this.checkpointDir, `${sessionId}.json`);
      
      await this.fs.writeJson(checkpointFile, {
        sessionId,
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }, { spaces: 2 });
      
      console.log(`💾 断点已保存: ${sessionId}`);
    } catch (error) {
      console.log(`⚠️ 断点保存失败: ${error.message}`);
    }
  }

  async load(sessionId, roleDescription) {
    try {
      // 尝试按sessionId加载
      let checkpointFile = this.path.join(this.checkpointDir, `${sessionId}.json`);
      
      if (!await this.fs.pathExists(checkpointFile)) {
        // 尝试按角色描述查找最近的断点
        const files = await this.fs.readdir(this.checkpointDir).catch(() => []);
        const matchingFiles = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const checkpoint = await this.fs.readJson(this.path.join(this.checkpointDir, file));
            if (checkpoint.data?.analysis?.roleDescription === roleDescription) {
              matchingFiles.push({
                file,
                timestamp: checkpoint.timestamp,
                checkpoint
              });
            }
          }
        }
        
        if (matchingFiles.length > 0) {
          // 使用最新的匹配断点
          matchingFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          console.log(`📂 找到匹配的断点: ${matchingFiles[0].file}`);
          return matchingFiles[0].checkpoint.data;
        }
        
        return null;
      }
      
      const checkpoint = await this.fs.readJson(checkpointFile);
      console.log(`📂 断点已加载: ${sessionId}`);
      return checkpoint.data;
    } catch (error) {
      console.log(`⚠️ 断点加载失败: ${error.message}`);
      return null;
    }
  }

  async clear(sessionId) {
    try {
      const checkpointFile = this.path.join(this.checkpointDir, `${sessionId}.json`);
      if (await this.fs.pathExists(checkpointFile)) {
        await this.fs.remove(checkpointFile);
        console.log(`🗑️ 断点已清除: ${sessionId}`);
      }
    } catch (error) {
      console.log(`⚠️ 断点清除失败: ${error.message}`);
    }
  }
}

/**
 * 批处理器
 */
class BatchProcessor {
  constructor() {
    this.maxConcurrent = 3;
    this.queue = [];
    this.running = 0;
  }

  async processBatch(items, processor, options = {}) {
    const results = [];
    const batchSize = options.batchSize || this.maxConcurrent;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => processor(item));
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟
      if (i + batchSize < items.length && options.delay) {
        await this.sleep(options.delay);
      }
    }
    
    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ProgressiveGenerator;