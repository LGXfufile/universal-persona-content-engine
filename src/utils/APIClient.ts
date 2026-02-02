import axios, { AxiosResponse, AxiosError } from 'axios';
import { cacheManager } from './CacheManager';
import { RoleAnalysis, ContentGenerationRequest, ContentGenerationResponse } from '@/types';

// API配置
const API_CONFIG = {
  deepseek: {
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    maxRetries: 3,
    timeout: 30000,
  },
  aliyun: {
    baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: 'qwen-image-max',
    maxRetries: 3,
    timeout: 60000,
  },
};

// 重试机制
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // 指数退避
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

// API客户端类
export class APIClient {
  private deepseekKey: string;
  private aliyunKey: string;

  constructor() {
    this.deepseekKey = process.env.DEEPSEEK_API_KEY || '';
    this.aliyunKey = process.env.DASHSCOPE_API_KEY || '';
  }

  // DeepSeek API调用
  async callDeepSeek(messages: any[], temperature: number = 0.7): Promise<string> {
    if (!this.deepseekKey) {
      throw new Error('DeepSeek API密钥未配置');
    }

    return retryRequest(async () => {
      const response = await axios.post(
        `${API_CONFIG.deepseek.baseURL}/chat/completions`,
        {
          model: API_CONFIG.deepseek.model,
          messages,
          temperature,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekKey}`,
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.deepseek.timeout,
        }
      );

      return response.data.choices[0].message.content;
    }, API_CONFIG.deepseek.maxRetries);
  }

  // 阿里云图片生成API调用
  async generateImage(prompt: string): Promise<string> {
    if (!this.aliyunKey) {
      throw new Error('阿里云API密钥未配置');
    }

    return retryRequest(async () => {
      const response = await axios.post(
        API_CONFIG.aliyun.baseURL,
        {
          model: API_CONFIG.aliyun.model,
          input: {
            prompt,
            size: '1664*928',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.aliyunKey}`,
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.aliyun.timeout,
        }
      );

      return response.data.output.results[0].url;
    }, API_CONFIG.aliyun.maxRetries);
  }

  // 角色分析（带缓存）
  async analyzeRole(roleDescription: string): Promise<RoleAnalysis> {
    // 检查缓存
    const cached = cacheManager.getAnalysis(roleDescription);
    if (cached) {
      return cached;
    }

    const systemPrompt = `你是一位专业的用户画像分析师。请根据用户描述，深度分析目标用户群体的特征。
返回JSON格式的分析结果，包含以下字段：
- demographics: 人口统计学特征
- psychographics: 心理特征
- painPoints: 痛点
- goals: 目标
- contentPreferences: 内容偏好
- marketingInsights: 营销洞察`;

    const userPrompt = `请分析以下用户群体：${roleDescription}`;

    const response = await this.callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    try {
      // 清理响应文本并解析JSON
      let cleanResponse = response;
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      }
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const analysis = JSON.parse(cleanResponse.trim());
      
      // 缓存结果
      cacheManager.setAnalysis(roleDescription, analysis);
      
      return analysis;
    } catch (error) {
      throw new Error(`角色分析结果解析失败: ${error}`);
    }
  }

  // 批量生成标题（带缓存）
  async generateTitles(roleDescription: string, analysis: RoleAnalysis, count: number = 100): Promise<string[]> {
    // 检查缓存
    const cached = cacheManager.getTitles(roleDescription);
    if (cached && cached.length >= count) {
      return cached.slice(0, count);
    }

    const systemPrompt = `你是一位专业的内容营销专家。基于用户画像分析，生成吸引目标用户的标题。
要求：
1. 标题要有吸引力和点击欲望
2. 符合目标用户的兴趣和痛点
3. 适合社交媒体传播
4. 每行一个标题，不要编号`;

    const userPrompt = `基于以下用户画像：${roleDescription}
    
分析结果：${JSON.stringify(analysis, null, 2)}

请生成${count}个高质量的营销标题：`;

    const response = await this.callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.8);

    const titles = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+\./))
      .slice(0, count);

    // 缓存结果
    cacheManager.setTitles(roleDescription, titles);

    return titles;
  }

  // 生成文章内容
  async generateArticle(title: string, roleDescription: string, analysis: RoleAnalysis): Promise<string> {
    const systemPrompt = `你是一位专业的内容创作者。基于标题和用户画像，创作高质量的营销文章。
要求：
1. 内容要有价值，解决用户痛点
2. 语言风格符合目标用户偏好
3. 结构清晰，易于阅读
4. 适合社交媒体发布`;

    const userPrompt = `标题：${title}
目标用户：${roleDescription}
用户分析：${JSON.stringify(analysis, null, 2)}

请创作一篇高质量的营销文章：`;

    return await this.callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.7);
  }
}

// 导出单例实例
export const apiClient = new APIClient();