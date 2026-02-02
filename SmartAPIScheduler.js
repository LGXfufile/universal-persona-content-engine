const EventEmitter = require('events');

/**
 * 智能API调度器 - 方案二核心组件
 * 功能：负载均衡、自适应延迟、熔断保护、智能重试
 */
class SmartAPIScheduler extends EventEmitter {
  constructor() {
    super();
    this.apiStatus = new Map(); // 实时API状态
    this.loadBalancer = new WeightedRoundRobin();
    this.adaptiveDelay = new AdaptiveDelayCalculator();
    this.circuitBreaker = new CircuitBreaker();
    this.retryStrategy = new ExponentialBackoff();
    
    // API配置
    this.apis = {
      deepseek: {
        name: 'DeepSeek',
        baseURL: 'https://api.deepseek.com',
        key: process.env.DEEPSEEK_API_KEY || 'sk-613c035207a848529bfae4308cce4515',
        weight: 100,
        maxConcurrent: 5,
        timeout: 30000
      },
      aliyun: {
        name: '阿里云通义万相',
        baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        key: process.env.DASHSCOPE_API_KEY || 'sk-45097a3d1b244a2dab5ae991d50d7daf',
        weight: 80,
        maxConcurrent: 3,
        timeout: 60000
      }
    };
    
    this.initializeAPIs();
  }

  initializeAPIs() {
    Object.keys(this.apis).forEach(apiKey => {
      this.apiStatus.set(apiKey, {
        available: true,
        responseTime: 0,
        errorCount: 0,
        successCount: 0,
        lastError: null,
        concurrentRequests: 0
      });
    });
  }

  /**
   * 智能调度API请求
   */
  async scheduleRequest(type, payload, options = {}) {
    const startTime = Date.now();
    
    try {
      // 选择最佳API
      const bestAPI = this.selectBestAPI(type);
      if (!bestAPI) {
        throw new Error('没有可用的API服务');
      }

      // 应用自适应延迟
      const delay = this.adaptiveDelay.calculate(bestAPI);
      if (delay > 0) {
        console.log(`⏳ 智能延迟 ${delay/1000}秒 (${bestAPI})`);
        await this.sleep(delay);
      }

      // 执行请求
      const result = await this.executeWithFallback(bestAPI, type, payload, options);
      
      // 记录成功
      this.recordSuccess(bestAPI, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // 记录失败
      this.recordFailure(type, error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * 选择最佳API
   */
  selectBestAPI(type) {
    const availableAPIs = this.getAvailableAPIs(type);
    if (availableAPIs.length === 0) {
      return null;
    }

    // 根据类型选择合适的API
    if (type === 'image') {
      return availableAPIs.find(api => api === 'aliyun') || availableAPIs[0];
    } else if (type === 'text') {
      return availableAPIs.find(api => api === 'deepseek') || availableAPIs[0];
    }

    // 使用负载均衡选择
    return this.loadBalancer.select(availableAPIs);
  }

  /**
   * 获取可用的API列表
   */
  getAvailableAPIs(type) {
    const available = [];
    
    for (const [apiKey, status] of this.apiStatus.entries()) {
      if (status.available && 
          status.concurrentRequests < this.apis[apiKey].maxConcurrent &&
          this.circuitBreaker.isAvailable(apiKey)) {
        available.push(apiKey);
      }
    }
    
    return available;
  }

  /**
   * 执行请求并支持降级
   */
  async executeWithFallback(apiKey, type, payload, options) {
    const api = this.apis[apiKey];
    const status = this.apiStatus.get(apiKey);
    
    // 增加并发计数
    status.concurrentRequests++;
    
    try {
      const result = await this.retryStrategy.execute(async () => {
        return await this.makeAPICall(api, type, payload, options);
      });
      
      return result;
    } catch (error) {
      // 尝试降级到其他API
      const fallbackAPIs = this.getAvailableAPIs(type).filter(key => key !== apiKey);
      
      if (fallbackAPIs.length > 0) {
        console.log(`⚠️ ${api.name}失败，尝试降级到${this.apis[fallbackAPIs[0]].name}`);
        return await this.executeWithFallback(fallbackAPIs[0], type, payload, options);
      }
      
      throw error;
    } finally {
      // 减少并发计数
      status.concurrentRequests--;
    }
  }

  /**
   * 实际的API调用
   */
  async makeAPICall(api, type, payload, options) {
    const axios = require('axios');
    
    if (type === 'text') {
      return await axios.post(`${api.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: payload.messages,
        temperature: payload.temperature || 0.7,
        max_tokens: payload.max_tokens || 2000
      }, {
        headers: {
          'Authorization': `Bearer ${api.key}`,
          'Content-Type': 'application/json'
        },
        timeout: api.timeout
      });
    } else if (type === 'image') {
      return await axios.post(api.baseURL, {
        model: "qwen-image-max",
        input: payload.input,
        parameters: payload.parameters
      }, {
        headers: {
          'Authorization': `Bearer ${api.key}`,
          'Content-Type': 'application/json'
        },
        timeout: api.timeout
      });
    }
    
    throw new Error(`不支持的请求类型: ${type}`);
  }

  /**
   * 记录成功
   */
  recordSuccess(apiKey, responseTime) {
    const status = this.apiStatus.get(apiKey);
    status.successCount++;
    status.responseTime = (status.responseTime + responseTime) / 2; // 移动平均
    status.errorCount = Math.max(0, status.errorCount - 1); // 逐渐恢复
    
    this.circuitBreaker.recordSuccess(apiKey);
    this.adaptiveDelay.recordSuccess(apiKey);
    
    this.emit('apiSuccess', { apiKey, responseTime });
  }

  /**
   * 记录失败
   */
  recordFailure(apiKey, error, responseTime) {
    const status = this.apiStatus.get(apiKey);
    status.errorCount++;
    status.lastError = error.message;
    
    // 如果错误率过高，暂时标记为不可用
    if (status.errorCount > 5) {
      status.available = false;
      setTimeout(() => {
        status.available = true;
        status.errorCount = 0;
      }, 60000); // 1分钟后重新尝试
    }
    
    this.circuitBreaker.recordFailure(apiKey);
    this.adaptiveDelay.recordFailure(apiKey);
    
    this.emit('apiFailure', { apiKey, error: error.message, responseTime });
  }

  /**
   * 获取API状态报告
   */
  getStatusReport() {
    const report = {};
    
    for (const [apiKey, status] of this.apiStatus.entries()) {
      const api = this.apis[apiKey];
      report[apiKey] = {
        name: api.name,
        available: status.available,
        successRate: status.successCount / (status.successCount + status.errorCount) || 0,
        avgResponseTime: Math.round(status.responseTime),
        concurrentRequests: status.concurrentRequests,
        lastError: status.lastError
      };
    }
    
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 加权轮询负载均衡器
 */
class WeightedRoundRobin {
  constructor() {
    this.currentWeights = new Map();
  }

  select(apiKeys) {
    if (apiKeys.length === 0) return null;
    if (apiKeys.length === 1) return apiKeys[0];

    // 简化版本：随机选择（可以后续优化为真正的加权轮询）
    return apiKeys[Math.floor(Math.random() * apiKeys.length)];
  }
}

/**
 * 自适应延迟计算器
 */
class AdaptiveDelayCalculator {
  constructor() {
    this.delays = new Map();
    this.basedelays = {
      deepseek: 2000,
      aliyun: 8000
    };
  }

  calculate(apiKey) {
    const baseDelay = this.basedelays[apiKey] || 3000;
    const currentDelay = this.delays.get(apiKey) || baseDelay;
    
    this.delays.set(apiKey, currentDelay);
    return currentDelay;
  }

  recordSuccess(apiKey) {
    const currentDelay = this.delays.get(apiKey) || this.basedelays[apiKey];
    // 成功时逐渐减少延迟
    const newDelay = Math.max(this.basedelays[apiKey], currentDelay * 0.9);
    this.delays.set(apiKey, newDelay);
  }

  recordFailure(apiKey) {
    const currentDelay = this.delays.get(apiKey) || this.basedelays[apiKey];
    // 失败时增加延迟
    const newDelay = Math.min(30000, currentDelay * 1.5);
    this.delays.set(apiKey, newDelay);
  }
}

/**
 * 熔断器
 */
class CircuitBreaker {
  constructor() {
    this.states = new Map(); // 'closed', 'open', 'half-open'
    this.failureCounts = new Map();
    this.lastFailureTime = new Map();
    this.threshold = 5; // 失败阈值
    this.timeout = 60000; // 熔断超时时间
  }

  isAvailable(apiKey) {
    const state = this.states.get(apiKey) || 'closed';
    
    if (state === 'closed') {
      return true;
    } else if (state === 'open') {
      // 检查是否可以进入半开状态
      const lastFailure = this.lastFailureTime.get(apiKey) || 0;
      if (Date.now() - lastFailure > this.timeout) {
        this.states.set(apiKey, 'half-open');
        return true;
      }
      return false;
    } else if (state === 'half-open') {
      return true;
    }
    
    return false;
  }

  recordSuccess(apiKey) {
    this.states.set(apiKey, 'closed');
    this.failureCounts.set(apiKey, 0);
  }

  recordFailure(apiKey) {
    const failures = (this.failureCounts.get(apiKey) || 0) + 1;
    this.failureCounts.set(apiKey, failures);
    this.lastFailureTime.set(apiKey, Date.now());
    
    if (failures >= this.threshold) {
      this.states.set(apiKey, 'open');
    }
  }
}

/**
 * 指数退避重试策略
 */
class ExponentialBackoff {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000;
    this.maxDelay = 10000;
  }

  async execute(fn) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries - 1) {
          break;
        }
        
        // 计算退避延迟
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );
        
        console.log(`⏳ 重试延迟 ${delay/1000}秒 (尝试 ${attempt + 1}/${this.maxRetries})`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SmartAPIScheduler;