// 快速修复实施方案 - API限流器
// 使用方法：在AliyunImageGenerator.js中集成

class SimpleRateLimiter {
  constructor() {
    this.lastCall = new Map();
    this.delays = {
      deepseek: 2000,  // DeepSeek API 2秒间隔
      aliyun: 8000,    // 阿里云API 8秒间隔（更保守）
      openai: 3000     // OpenAI API 3秒间隔
    };
    this.consecutiveErrors = new Map();
  }

  async waitIfNeeded(apiType) {
    const lastTime = this.lastCall.get(apiType) || 0;
    const elapsed = Date.now() - lastTime;
    const errorCount = this.consecutiveErrors.get(apiType) || 0;
    
    // 根据连续错误次数动态调整延迟
    const baseDelay = this.delays[apiType];
    const adaptiveDelay = baseDelay * Math.pow(1.5, errorCount);
    const finalDelay = Math.min(adaptiveDelay, 30000); // 最大30秒
    
    if (elapsed < finalDelay) {
      const waitTime = finalDelay - elapsed;
      console.log(`⏳ API限流等待 ${waitTime/1000}秒 (${apiType})`);
      await this.sleep(waitTime);
    }
    
    this.lastCall.set(apiType, Date.now());
  }

  recordSuccess(apiType) {
    this.consecutiveErrors.set(apiType, 0);
  }

  recordError(apiType) {
    const current = this.consecutiveErrors.get(apiType) || 0;
    this.consecutiveErrors.set(apiType, current + 1);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 配置管理器
class ConfigManager {
  static getConfig() {
    return {
      apis: {
        deepseek: {
          key: process.env.DEEPSEEK_API_KEY || 'sk-613c035207a848529bfae4308cce4515',
          baseURL: 'https://api.deepseek.com',
          timeout: 30000,
          maxRetries: 3
        },
        aliyun: {
          key: process.env.DASHSCOPE_API_KEY || 'sk-45097a3d1b244a2dab5ae991d50d7daf',
          baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
          timeout: 60000,
          maxRetries: 2
        }
      },
      generation: {
        titleCount: 30,        // 从100减少到30
        articleCount: 3,       // 保持3篇
        imageCount: 2,         // 从4减少到2张每篇
        batchSize: 5,          // 分批处理，每批5个
        imageDelay: 8000       // 图片生成间隔8秒
      },
      rateLimiting: {
        enabled: true,
        adaptiveDelay: true,
        maxConsecutiveErrors: 3
      }
    };
  }
}

// 检查点管理器
class CheckpointManager {
  constructor(roleId) {
    this.roleId = roleId;
    this.checkpointFile = `./upce_output/${roleId}/checkpoint.json`;
  }

  save(data) {
    try {
      const fs = require('fs-extra');
      fs.ensureDirSync(path.dirname(this.checkpointFile));
      fs.writeJsonSync(this.checkpointFile, {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }, { spaces: 2 });
      console.log('💾 检查点已保存');
    } catch (error) {
      console.log('⚠️ 检查点保存失败:', error.message);
    }
  }

  load() {
    try {
      const fs = require('fs-extra');
      if (fs.existsSync(this.checkpointFile)) {
        const data = fs.readJsonSync(this.checkpointFile);
        console.log('📂 检查点已加载');
        return data;
      }
    } catch (error) {
      console.log('⚠️ 检查点加载失败:', error.message);
    }
    return {};
  }

  clear() {
    try {
      const fs = require('fs-extra');
      if (fs.existsSync(this.checkpointFile)) {
        fs.removeSync(this.checkpointFile);
        console.log('🗑️ 检查点已清除');
      }
    } catch (error) {
      console.log('⚠️ 检查点清除失败:', error.message);
    }
  }
}

module.exports = {
  SimpleRateLimiter,
  ConfigManager,
  CheckpointManager
};