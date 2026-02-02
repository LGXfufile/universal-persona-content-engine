const { LRUCache } = require('lru-cache');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * 缓存管理器 - 方案二核心组件
 * 功能：本地缓存、离线模式、智能缓存策略、数据持久化
 */
class CacheManager {
  constructor() {
    // 内存缓存配置
    this.memoryCache = new LRUCache({
      max: 1000,              // 最大缓存项数
      ttl: 1000 * 60 * 60,    // 1小时过期
      updateAgeOnGet: true    // 访问时更新过期时间
    });
    
    // 磁盘缓存配置
    this.diskCacheDir = './cache';
    this.offlineTemplates = new OfflineTemplateEngine();
    this.cacheStats = new CacheStats();
    
    // 缓存策略配置
    this.strategies = {
      analysis: { ttl: 24 * 60 * 60 * 1000, persistent: true },  // 24小时，持久化
      titles: { ttl: 12 * 60 * 60 * 1000, persistent: true },    // 12小时，持久化
      articles: { ttl: 6 * 60 * 60 * 1000, persistent: false },  // 6小时，内存
      images: { ttl: 7 * 24 * 60 * 60 * 1000, persistent: true } // 7天，持久化
    };
    
    this.initializeCache();
  }

  async initializeCache() {
    try {
      await fs.ensureDir(this.diskCacheDir);
      await this.loadPersistentCache();
      console.log('✅ 缓存系统初始化完成');
    } catch (error) {
      console.log('⚠️ 缓存系统初始化失败:', error.message);
    }
  }

  /**
   * 智能获取或生成内容
   */
  async getOrGenerate(key, generator, options = {}) {
    const cacheKey = this.generateCacheKey(key);
    const strategy = this.strategies[options.type] || { ttl: 60 * 60 * 1000, persistent: false };
    
    try {
      // 1. 尝试从内存缓存获取
      const memoryResult = this.memoryCache.get(cacheKey);
      if (memoryResult && !this.isExpired(memoryResult, strategy.ttl)) {
        this.cacheStats.recordHit('memory');
        console.log(`💾 内存缓存命中: ${key.substring(0, 50)}...`);
        return memoryResult.data;
      }

      // 2. 尝试从磁盘缓存获取
      if (strategy.persistent) {
        const diskResult = await this.getDiskCache(cacheKey);
        if (diskResult && !this.isExpired(diskResult, strategy.ttl)) {
          // 回写到内存缓存
          this.memoryCache.set(cacheKey, diskResult);
          this.cacheStats.recordHit('disk');
          console.log(`💿 磁盘缓存命中: ${key.substring(0, 50)}...`);
          return diskResult.data;
        }
      }

      // 3. 尝试生成新内容
      console.log(`🔄 生成新内容: ${key.substring(0, 50)}...`);
      const result = await generator();
      
      // 4. 缓存结果
      await this.setCache(cacheKey, result, strategy);
      this.cacheStats.recordMiss();
      
      return result;

    } catch (error) {
      console.log(`⚠️ 生成失败，尝试离线模式: ${error.message}`);
      
      // 5. 降级到离线模式
      return await this.offlineTemplates.generate(key, options);
    }
  }

  /**
   * 设置缓存
   */
  async setCache(cacheKey, data, strategy) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl: strategy.ttl,
      version: '1.0'
    };

    // 设置内存缓存
    this.memoryCache.set(cacheKey, cacheItem);

    // 设置磁盘缓存（如果需要持久化）
    if (strategy.persistent) {
      await this.setDiskCache(cacheKey, cacheItem);
    }
  }

  /**
   * 磁盘缓存操作
   */
  async getDiskCache(cacheKey) {
    try {
      const cacheFile = path.join(this.diskCacheDir, `${cacheKey}.json`);
      if (await fs.pathExists(cacheFile)) {
        return await fs.readJson(cacheFile);
      }
    } catch (error) {
      console.log(`⚠️ 磁盘缓存读取失败: ${error.message}`);
    }
    return null;
  }

  async setDiskCache(cacheKey, cacheItem) {
    try {
      const cacheFile = path.join(this.diskCacheDir, `${cacheKey}.json`);
      await fs.writeJson(cacheFile, cacheItem, { spaces: 2 });
    } catch (error) {
      console.log(`⚠️ 磁盘缓存写入失败: ${error.message}`);
    }
  }

  /**
   * 加载持久化缓存到内存
   */
  async loadPersistentCache() {
    try {
      const cacheFiles = await fs.readdir(this.diskCacheDir);
      let loadedCount = 0;

      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const cacheKey = file.replace('.json', '');
          const cacheItem = await fs.readJson(path.join(this.diskCacheDir, file));
          
          // 检查是否过期
          if (!this.isExpired(cacheItem, cacheItem.ttl)) {
            this.memoryCache.set(cacheKey, cacheItem);
            loadedCount++;
          } else {
            // 删除过期的磁盘缓存
            await fs.remove(path.join(this.diskCacheDir, file));
          }
        }
      }

      console.log(`📂 加载了 ${loadedCount} 个缓存项到内存`);
    } catch (error) {
      console.log(`⚠️ 持久化缓存加载失败: ${error.message}`);
    }
  }

  /**
   * 缓存预热
   */
  async warmupCache(commonQueries) {
    console.log('🔥 开始缓存预热...');
    
    for (const query of commonQueries) {
      try {
        if (!this.memoryCache.has(this.generateCacheKey(query.key))) {
          await this.getOrGenerate(query.key, query.generator, query.options);
          await this.sleep(100); // 避免过快请求
        }
      } catch (error) {
        console.log(`⚠️ 预热失败: ${query.key} - ${error.message}`);
      }
    }
    
    console.log('✅ 缓存预热完成');
  }

  /**
   * 智能缓存清理
   */
  async cleanupCache() {
    console.log('🧹 开始缓存清理...');
    
    // 清理内存缓存（LRU会自动处理）
    const memorySize = this.memoryCache.length;
    
    // 清理磁盘缓存
    let diskCleanedCount = 0;
    try {
      const cacheFiles = await fs.readdir(this.diskCacheDir);
      
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const cacheItem = await fs.readJson(path.join(this.diskCacheDir, file));
          
          if (this.isExpired(cacheItem, cacheItem.ttl)) {
            await fs.remove(path.join(this.diskCacheDir, file));
            diskCleanedCount++;
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ 磁盘缓存清理失败: ${error.message}`);
    }
    
    console.log(`🧹 缓存清理完成: 内存${memorySize}项, 磁盘清理${diskCleanedCount}项`);
  }

  /**
   * 缓存统计报告
   */
  getCacheReport() {
    const stats = this.cacheStats.getStats();
    const memoryStats = {
      size: this.memoryCache.length,
      maxSize: this.memoryCache.max,
      usage: `${((this.memoryCache.length / this.memoryCache.max) * 100).toFixed(1)}%`
    };

    return {
      memory: memoryStats,
      statistics: stats,
      hitRate: stats.totalRequests > 0 ? 
        `${((stats.hits / stats.totalRequests) * 100).toFixed(1)}%` : '0%'
    };
  }

  /**
   * 导出缓存数据
   */
  async exportCache(exportPath) {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        memory: {},
        disk: []
      };

      // 导出内存缓存
      this.memoryCache.forEach((value, key) => {
        exportData.memory[key] = value;
      });

      // 导出磁盘缓存列表
      const cacheFiles = await fs.readdir(this.diskCacheDir);
      exportData.disk = cacheFiles.filter(f => f.endsWith('.json'));

      await fs.writeJson(exportPath, exportData, { spaces: 2 });
      console.log(`📤 缓存数据已导出到: ${exportPath}`);
      
      return exportData;
    } catch (error) {
      console.log(`⚠️ 缓存导出失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 导入缓存数据
   */
  async importCache(importPath) {
    try {
      const importData = await fs.readJson(importPath);
      let importedCount = 0;

      // 导入内存缓存
      Object.entries(importData.memory || {}).forEach(([key, value]) => {
        if (!this.isExpired(value, value.ttl)) {
          this.memoryCache.set(key, value);
          importedCount++;
        }
      });

      console.log(`📥 缓存数据已导入: ${importedCount} 项`);
      return importedCount;
    } catch (error) {
      console.log(`⚠️ 缓存导入失败: ${error.message}`);
      throw error;
    }
  }

  // 辅助方法
  generateCacheKey(input) {
    if (typeof input === 'string') {
      return crypto.createHash('md5').update(input).digest('hex');
    }
    return crypto.createHash('md5').update(JSON.stringify(input)).digest('hex');
  }

  isExpired(cacheItem, ttl) {
    return Date.now() - cacheItem.timestamp > ttl;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 离线模板引擎
 */
class OfflineTemplateEngine {
  constructor() {
    this.templates = {
      analysis: this.createAnalysisTemplate,
      titles: this.createTitlesTemplate,
      articles: this.createArticlesTemplate,
      images: this.createImagesTemplate
    };
  }

  async generate(key, options = {}) {
    const type = options.type || 'analysis';
    const template = this.templates[type];
    
    if (!template) {
      throw new Error(`不支持的离线模板类型: ${type}`);
    }

    console.log(`🔄 使用离线模板生成: ${type}`);
    return template.call(this, key, options);
  }

  createAnalysisTemplate(key, options) {
    const roleDescription = options.roleDescription || key;
    
    return {
      roleId: this.generateRoleId(roleDescription),
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
        keywords: this.extractKeywords(roleDescription),
        productModel: {
          "入门级": { 产品: "基础指导", 价格: "99", 转化率: "15%" },
          "进阶级": { 产品: "深度咨询", 价格: "599", 转化率: "8%" },
          "专业级": { 产品: "一对一服务", 价格: "1999", 转化率: "3%" },
          "VIP级": { 产品: "全程陪伴", 价格: "9999", 转化率: "1%" }
        }
      },
      generatedAt: new Date().toISOString(),
      offline: true
    };
  }

  createTitlesTemplate(key, options) {
    const roleDescription = options.roleDescription || key;
    const count = options.count || 10;
    
    const titleTemplates = [
      `${roleDescription}的真实经历分享`,
      `从零开始：${roleDescription}的成长之路`,
      `${roleDescription}必看的实用指南`,
      `${roleDescription}如何实现月入过万`,
      `${roleDescription}的成功秘诀大公开`,
      `${roleDescription}踩过的坑，你别再踩`,
      `${roleDescription}三个月的蜕变记录`,
      `${roleDescription}最全攻略，建议收藏`,
      `${roleDescription}的副业创收经验`,
      `${roleDescription}如何突破瓶颈期`
    ];

    const titles = [];
    for (let i = 0; i < count; i++) {
      const template = titleTemplates[i % titleTemplates.length];
      titles.push(`${template} ${i > 9 ? Math.floor(i/10) + 1 : ''}`);
    }

    return titles;
  }

  createArticlesTemplate(key, options) {
    const titles = options.titles || [`${key}的经验分享`];
    const roleDescription = options.roleDescription || key;
    
    return titles.map((title, index) => ({
      title,
      content: this.generateArticleContent(title, roleDescription),
      wordCount: 1200 + Math.floor(Math.random() * 400),
      imagePrompts: [
        {
          filename: `image_${index + 1}_1.jpg`,
          description: `${title}相关场景图`,
          prompt: `真实生活场景，${roleDescription}，温暖色调，自然光线，高清摄影`
        },
        {
          filename: `image_${index + 1}_2.jpg`, 
          description: `${title}实操展示图`,
          prompt: `${roleDescription}正在实际操作，专注认真的表情，生活化场景`
        }
      ],
      offline: true
    }));
  }

  createImagesTemplate(key, options) {
    const articles = options.articles || [];
    
    return {
      successful: [],
      failed: articles.flatMap(article => 
        article.imagePrompts?.map(prompt => ({
          filename: prompt.filename,
          error: '离线模式：图片生成不可用',
          placeholder: true,
          offline: true
        })) || []
      ),
      total: articles.reduce((sum, article) => sum + (article.imagePrompts?.length || 0), 0),
      offline: true
    };
  }

  generateArticleContent(title, roleDescription) {
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

  generateRoleId(roleDescription) {
    const keywords = roleDescription.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    
    const hash = crypto.createHash('md5').update(roleDescription).digest('hex').substring(0, 6);
    return keywords.join('_') + '_' + hash;
  }

  extractKeywords(text) {
    return text.split(/[，。、\s]+/)
      .filter(word => word.length > 1)
      .slice(0, 10);
  }
}

/**
 * 缓存统计
 */
class CacheStats {
  constructor() {
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      diskHits: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
  }

  recordHit(source = 'unknown') {
    this.stats.hits++;
    this.stats.totalRequests++;
    
    if (source === 'memory') {
      this.stats.memoryHits++;
    } else if (source === 'disk') {
      this.stats.diskHits++;
    }
  }

  recordMiss() {
    this.stats.misses++;
    this.stats.totalRequests++;
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.totalRequests > 0 ? 
        (this.stats.hits / this.stats.totalRequests) : 0,
      uptime: Date.now() - this.stats.startTime
    };
  }

  reset() {
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      diskHits: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
  }
}

module.exports = {
  CacheManager,
  OfflineTemplateEngine,
  CacheStats
};