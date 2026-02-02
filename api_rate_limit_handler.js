#!/usr/bin/env node

/**
 * API限流处理器
 * 专门处理429错误和API限流问题
 */

class ApiRateLimitHandler {
  constructor(options = {}) {
    this.config = {
      maxRetries: options.maxRetries || 5,
      baseDelay: options.baseDelay || 3000, // 3秒基础延迟
      maxDelay: options.maxDelay || 60000,   // 最大60秒延迟
      backoffMultiplier: options.backoffMultiplier || 3, // 3倍指数增长
      jitterFactor: options.jitterFactor || 0.1, // 10%随机抖动
      ...options
    };
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      retriedRequests: 0
    };
  }

  /**
   * 计算延迟时间（带抖动的指数退避）
   */
  calculateDelay(attempt, isRateLimit = false) {
    let delay;
    
    if (isRateLimit) {
      // 429错误使用更激进的延迟策略
      delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
    } else {
      // 其他错误使用标准指数退避
      delay = this.config.baseDelay * Math.pow(2, attempt - 1);
    }
    
    // 限制最大延迟
    delay = Math.min(delay, this.config.maxDelay);
    
    // 添加随机抖动避免雷群效应
    const jitter = delay * this.config.jitterFactor * (Math.random() - 0.5);
    delay += jitter;
    
    return Math.max(delay, 1000); // 最小1秒延迟
  }

  /**
   * 延迟函数
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查是否为限流错误
   */
  isRateLimitError(error) {
    return error.response?.status === 429 || 
           error.code === 'RATE_LIMITED' ||
           error.message?.includes('rate limit') ||
           error.message?.includes('429');
  }

  /**
   * 带重试的API请求包装器
   */
  async executeWithRetry(requestFunction, context = {}) {
    this.stats.totalRequests++;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await requestFunction();
        this.stats.successfulRequests++;
        
        if (attempt > 1) {
          console.log(`✅ 重试成功 (第${attempt}次尝试)`);
        }
        
        return result;
        
      } catch (error) {
        const isRateLimit = this.isRateLimitError(error);
        const isLastAttempt = attempt === this.config.maxRetries;
        
        if (isRateLimit) {
          this.stats.rateLimitedRequests++;
        }
        
        if (isLastAttempt) {
          console.error(`❌ 请求最终失败 (${this.config.maxRetries}次尝试后): ${error.message}`);
          throw error;
        }
        
        this.stats.retriedRequests++;
        
        // 计算延迟时间
        const delayTime = this.calculateDelay(attempt, isRateLimit);
        
        // 输出友好的错误信息
        if (isRateLimit) {
          console.log(`⚠️  API限流 (尝试 ${attempt}/${this.config.maxRetries}): 请求过于频繁`);
        } else {
          console.log(`⚠️  请求失败 (尝试 ${attempt}/${this.config.maxRetries}): ${error.message}`);
        }
        
        console.log(`⏳ 等待 ${Math.round(delayTime/1000)}秒 后重试...`);
        
        // 如果有上下文信息，显示进度
        if (context.current && context.total) {
          console.log(`📊 当前进度: ${context.current}/${context.total} (${Math.round(context.current/context.total*100)}%)`);
        }
        
        await this.delay(delayTime);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const successRate = this.stats.totalRequests > 0 
      ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1)
      : 0;
      
    return {
      ...this.stats,
      successRate: `${successRate}%`,
      rateLimitRate: this.stats.totalRequests > 0 
        ? `${(this.stats.rateLimitedRequests / this.stats.totalRequests * 100).toFixed(1)}%`
        : '0%'
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      retriedRequests: 0
    };
  }

  /**
   * 打印统计报告
   */
  printStats() {
    const stats = this.getStats();
    console.log('\n📊 API请求统计:');
    console.log(`   总请求数: ${stats.totalRequests}`);
    console.log(`   成功请求: ${stats.successfulRequests}`);
    console.log(`   限流次数: ${stats.rateLimitedRequests}`);
    console.log(`   重试次数: ${stats.retriedRequests}`);
    console.log(`   成功率: ${stats.successRate}`);
    console.log(`   限流率: ${stats.rateLimitRate}`);
  }
}

module.exports = ApiRateLimitHandler;