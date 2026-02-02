import { NextApiRequest, NextApiResponse } from 'next';
import { APIResponse } from '@/types';

// 简化的进度获取API，暂时返回模拟数据
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  const { taskId } = req.query;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ success: false, error: '任务ID无效' });
  }

  try {
    // 模拟进度数据
    const mockProgress = {
      step: '内容生成中',
      progress: 50,
      message: '正在处理您的请求...',
    };
    
    res.status(200).json({ success: true, data: mockProgress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取进度失败' 
    });
  }
}