const ContentEngine = require('../src/utils/ContentEngine');
const ImageGenerator = require('../src/utils/ImageGenerator');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roleDescription } = req.body;

    if (!roleDescription || !roleDescription.trim()) {
      return res.status(400).json({ message: '角色描述不能为空' });
    }

    // 创建内容引擎实例
    const contentEngine = new ContentEngine();
    const imageGenerator = new ImageGenerator();

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
      // Step 1: 角色分析
      sendProgress('analyze', 10, '正在分析角色特征...');
      const roleResult = await contentEngine.analyzeRole(roleDescription);

      // Step 2: 生成标题
      sendProgress('titles', 25, '正在生成标题库...');
      const titles = await contentEngine.generateTitles(roleResult.data, 100);

      // Step 3: 生成文章
      sendProgress('articles', 40, '正在生成文章内容...');
      const articles = [];
      for (let i = 0; i < titles.length; i++) {
        const article = await contentEngine.generateArticle(titles[i], roleResult.data, i + 1);
        articles.push(article);
        
        if ((i + 1) % 10 === 0) {
          const progress = 40 + ((i + 1) / titles.length) * 30;
          sendProgress('articles', progress, `已生成 ${i + 1} 篇文章...`);
        }
      }

      // Step 4: 生成配图
      sendProgress('images', 70, '正在生成配图...');
      const outputDir = `content_os/outputs/${roleResult.roleId}`;
      const allImagePrompts = articles.flatMap(article => article.imagePrompts);
      
      const imageResults = await imageGenerator.batchGenerateImages(allImagePrompts, outputDir);
      
      // Step 5: 插入配图到文章
      sendProgress('insert', 85, '正在插入配图到文章...');
      const finalArticles = await imageGenerator.insertImagesIntoArticles(articles, outputDir);

      // Step 6: 保存输出
      sendProgress('save', 95, '正在保存输出文件...');
      await contentEngine.saveOutput(roleResult.roleId, {
        analysis: roleResult.data,
        titles,
        articles: finalArticles
      });

      // 生成质检报告
      const qualityReport = await imageGenerator.generateQualityReport(imageResults, outputDir);

      // 发送完成结果
      const result = {
        roleId: roleResult.roleId,
        titlesCount: titles.length,
        articlesCount: finalArticles.length,
        imagesCount: imageResults.successful.length,
        outputPath: outputDir,
        successRate: imageResults.successRate,
        qualityReport
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