import { LRUCache } from 'lru-cache';
import { ContentGenerationResponse, RoleAnalysis } from '@/types';

// 缓存配置
const cacheOptions = {
  max: 100, // 最大缓存条目数
  ttl: 1000 * 60 * 30, // 30分钟过期
};

// 创建不同类型的缓存实例
export const analysisCache = new LRUCache<string, RoleAnalysis>(cacheOptions);
export const titleCache = new LRUCache<string, string[]>(cacheOptions);
export const contentCache = new LRUCache<string, ContentGenerationResponse>(cacheOptions);

// 缓存键生成器
export const generateCacheKey = (roleDescription: string, type: string = 'default'): string => {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(roleDescription + type).digest('hex');
  return `${type}_${hash.substring(0, 12)}`;
};

// 缓存管理器类
export class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 获取角色分析缓存
  getAnalysis(roleDescription: string): RoleAnalysis | undefined {
    const key = generateCacheKey(roleDescription, 'analysis');
    return analysisCache.get(key);
  }

  // 设置角色分析缓存
  setAnalysis(roleDescription: string, analysis: RoleAnalysis): void {
    const key = generateCacheKey(roleDescription, 'analysis');
    analysisCache.set(key, analysis);
  }

  // 获取标题缓存
  getTitles(roleDescription: string): string[] | undefined {
    const key = generateCacheKey(roleDescription, 'titles');
    return titleCache.get(key);
  }

  // 设置标题缓存
  setTitles(roleDescription: string, titles: string[]): void {
    const key = generateCacheKey(roleDescription, 'titles');
    titleCache.set(key, titles);
  }

  // 获取完整内容缓存
  getContent(roleDescription: string): ContentGenerationResponse | undefined {
    const key = generateCacheKey(roleDescription, 'content');
    return contentCache.get(key);
  }

  // 设置完整内容缓存
  setContent(roleDescription: string, content: ContentGenerationResponse): void {
    const key = generateCacheKey(roleDescription, 'content');
    contentCache.set(key, content);
  }

  // 清除所有缓存
  clearAll(): void {
    analysisCache.clear();
    titleCache.clear();
    contentCache.clear();
  }

  // 获取缓存统计信息
  getStats() {
    return {
      analysis: {
        size: analysisCache.size,
        max: analysisCache.max,
      },
      titles: {
        size: titleCache.size,
        max: titleCache.max,
      },
      content: {
        size: contentCache.size,
        max: contentCache.max,
      },
    };
  }
}

// 导出单例实例
export const cacheManager = CacheManager.getInstance();