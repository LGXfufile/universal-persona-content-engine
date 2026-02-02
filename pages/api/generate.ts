import { NextApiRequest, NextApiResponse } from 'next';
import { ContentGenerationRequest, ContentGenerationResponse, GenerationProgress, APIResponse } from '@/types';

// 存储生成进度的内存缓存
const progressCache = new Map<string, GenerationProgress>();
const resultCache = new Map<string, ContentGenerationResponse>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { roleDescription, titleCount = 100, articleCount = 3, imageCount = 4 }: ContentGenerationRequest = req.body;

  if (!roleDescription?.trim()) {
    return res.status(400).json({ success: false, error: '角色描述不能为空' });
  }

  try {
    // 生成任务ID
    const taskId = generateTaskId(roleDescription);
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // 发送进度更新函数
    const sendProgress = (progress: GenerationProgress) => {
      progressCache.set(taskId, progress);
      res.write(`data: ${JSON.stringify({ type: 'progress', data: progress })}\n\n`);
    };

    // 发送完成结果函数
    const sendResult = (result: ContentGenerationResponse) => {
      resultCache.set(taskId, result);
      res.write(`data: ${JSON.stringify({ type: 'complete', data: result })}\n\n`);
      res.end();
    };

    // 发送错误函数
    const sendError = (error: string) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
      res.end();
    };

    // 开始内容生成流程
    await generateContentStream(roleDescription, { titleCount, articleCount, imageCount }, sendProgress, sendResult, sendError);

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '内容生成失败' 
    });
  }
}

async function generateContentStream(
  roleDescription: string,
  config: { titleCount: number; articleCount: number; imageCount: number },
  onProgress: (progress: GenerationProgress) => void,
  onComplete: (result: ContentGenerationResponse) => void,
  onError: (error: string) => void
) {
  try {
    // 暂时使用模拟数据，后续集成真实的UPCE引擎
    const mockEngine = {
      run: async (roleDescription: string) => {
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          roleId: `role_${Date.now()}`,
          analysis: {
            demographics: { 
              age: '25-35', 
              gender: '女性', 
              location: '一线城市',
              income: '中高收入',
              education: '本科以上'
            },
            psychographics: { 
              values: ['健康', '品质'], 
              interests: ['美食', '旅行'],
              lifestyle: ['快节奏', '注重效率'],
              personality: ['理性', '追求完美']
            },
            painPoints: ['时间不够', '选择困难'],
            goals: ['提升生活品质', '保持健康'],
            contentPreferences: { 
              platforms: ['小红书', '微信'], 
              formats: ['图文', '视频'],
              tone: '亲切专业',
              topics: ['生活方式', '健康养生']
            },
            marketingInsights: { 
              triggers: ['限时优惠'], 
              objections: ['价格敏感'],
              solutions: ['性价比展示', '用户评价']
            }
          },
          titles: Array.from({ length: 10 }, (_, i) => `精选标题 ${i + 1}`),
          articles: Array.from({ length: 3 }, (_, i) => ({
            id: `article_${i}`,
            title: `精选文章 ${i + 1}`,
            content: '这是一篇由AI生成的高质量营销文章内容...',
            platform: ['xiaohongshu', 'weixin', 'douyin'][i] as any,
            tags: ['营销', '内容'],
            imagePrompts: [`配图提示词 ${i + 1}`]
          })),
          images: Array.from({ length: 4 }, (_, i) => ({
            id: `img_${i}`,
            prompt: `配图提示词 ${i + 1}`,
            status: 'completed' as any
          })),
          outputPath: `/upce_output/mock_${Date.now()}/`
        };
      }
    };
    
    // 模拟进度更新
    const steps = [
      { step: '角色深度分析', progress: 20, message: '正在分析用户画像...' },
      { step: '生成内容标题', progress: 40, message: '正在生成标题库...' },
      { step: '创建文章内容', progress: 60, message: '正在创作文章内容...' },
      { step: '生成配图', progress: 80, message: '正在生成配图...' },
      { step: '保存输出文件', progress: 100, message: '正在保存文件...' }
    ];

    for (const step of steps) {
      onProgress(step);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 执行内容生成
    const result = await mockEngine.run(roleDescription);
    
    // 转换结果格式
    const response: ContentGenerationResponse = {
      roleId: result.roleId,
      analysis: result.analysis,
      titles: result.titles || [],
      articles: result.articles || [],
      images: result.images || [],
      outputPath: result.outputPath,
    };

    onComplete(response);

  } catch (error) {
    console.error('Generation stream error:', error);
    onError(error instanceof Error ? error.message : '生成过程中发生错误');
  }
}

function generateTaskId(roleDescription: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(roleDescription + Date.now()).digest('hex').substring(0, 8);
}

function getProgressByStep(step: string): number {
  const stepProgress: Record<string, number> = {
    '角色深度分析': 10,
    '生成内容标题': 25,
    '创建文章内容': 45,
    '生成配图': 70,
    '质检与优化': 85,
    '保存输出文件': 95,
  };
  
  return stepProgress[step] || 0;
}

// 获取任务进度的API端点
export async function getProgress(taskId: string) {
  return progressCache.get(taskId);
}

// 获取任务结果的API端点
export async function getResult(taskId: string) {
  return resultCache.get(taskId);
}