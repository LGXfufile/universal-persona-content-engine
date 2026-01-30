// 简化的API实现，移除复杂依赖
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roleDescription } = req.body;

    if (!roleDescription || !roleDescription.trim()) {
      return res.status(400).json({ message: '角色描述不能为空' });
    }

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 发送进度更新
    const sendProgress = (step, progress, message) => {
      res.write(`data: ${JSON.stringify({ step, progress, message })}\n\n`);
    };

    try {
      // 模拟处理步骤
      const steps = [
        { name: '角色分析中...', duration: 2000, progress: 15 },
        { name: '生成关键词...', duration: 1500, progress: 30 },
        { name: '创建标题库...', duration: 3000, progress: 50 },
        { name: '生成文章内容...', duration: 4000, progress: 75 },
        { name: '生成配图...', duration: 3000, progress: 90 },
        { name: '质检与优化...', duration: 1500, progress: 95 },
        { name: '保存输出文件...', duration: 1000, progress: 100 }
      ];

      for (const step of steps) {
        sendProgress(step.name, step.progress, step.name);
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // 模拟结果
      const result = {
        roleId: 'demo_' + Date.now(),
        titlesCount: 100,
        articlesCount: 100,
        imagesCount: 400,
        outputPath: 'content_os/outputs/demo_output',
        successRate: '95%',
        processingTime: '15分钟'
      };

      sendProgress('complete', 100, '处理完成！');
      res.write(`data: ${JSON.stringify({ type: 'result', data: result })}\n\n`);

    } catch (error) {
      console.error('处理过程中出错:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}