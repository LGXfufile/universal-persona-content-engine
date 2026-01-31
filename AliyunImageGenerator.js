const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class AliyunImageGenerator {
  constructor() {
    // 阿里云通义万相API配置
    this.apiKey = process.env.DASHSCOPE_API_KEY || 'sk-71cc3aad8fad44c8970dd549933d3573';
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
    this.maxRetries = 3;
  }

  // 生成图片
  async generateImage(prompt, filename, outputDir) {
    console.log(`🎨 正在生成图片: ${filename}`);

    for (let retry = 0; retry < this.maxRetries; retry++) {
      try {
        const response = await axios.post(this.baseURL, {
          model: "wanx-v1",
          input: {
            prompt: this.optimizePrompt(prompt),
            negative_prompt: "低质量,模糊,变形,文字,水印,logo,商标,奢侈品,豪车,名牌",
            style: "<photography>",
            size: "1024*1024",
            n: 1,
            seed: Math.floor(Math.random() * 1000000)
          },
          parameters: {
            style: "<photography>",
            size: "1024*1024",
            n: 1
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable'
          },
          timeout: 30000
        });

        if (response.data.output && response.data.output.task_id) {
          // 异步任务，需要轮询结果
          const result = await this.pollTaskResult(response.data.output.task_id);
          
          if (result.success) {
            // 下载并保存图片
            const imagePath = await this.downloadAndSaveImage(result.imageUrl, filename, outputDir);
            console.log(`✅ 图片生成成功: ${filename}`);
            return { success: true, path: imagePath, prompt };
          }
        } else if (response.data.output && response.data.output.results) {
          // 同步返回结果
          const imageUrl = response.data.output.results[0].url;
          const imagePath = await this.downloadAndSaveImage(imageUrl, filename, outputDir);
          console.log(`✅ 图片生成成功: ${filename}`);
          return { success: true, path: imagePath, prompt };
        }

      } catch (error) {
        console.log(`⚠️  图片生成失败 (尝试 ${retry + 1}/${this.maxRetries}): ${error.message}`);
        
        if (retry === this.maxRetries - 1) {
          // 最后一次重试失败，生成占位图片
          const placeholderPath = await this.createPlaceholder(filename, outputDir, prompt);
          console.log(`📝 已创建占位图片: ${filename}`);
          return { success: false, path: placeholderPath, error: error.message, prompt };
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 2000 * (retry + 1)));
      }
    }
  }

  // 优化提示词
  optimizePrompt(prompt) {
    const qualityKeywords = [
      '高清摄影',
      '自然光线',
      '真实感',
      '生活化场景',
      '温暖色调',
      '纪实风格'
    ];

    return `${prompt}，${qualityKeywords.join('，')}，专业摄影，细节丰富`;
  }

  // 轮询异步任务结果
  async pollTaskResult(taskId, maxAttempts = 30) {
    const pollURL = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(pollURL, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        const status = response.data.output.task_status;
        
        if (status === 'SUCCEEDED') {
          return {
            success: true,
            imageUrl: response.data.output.results[0].url
          };
        } else if (status === 'FAILED') {
          return {
            success: false,
            error: response.data.output.message || '任务失败'
          };
        }
        
        // 任务还在进行中，等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`轮询任务状态失败: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return { success: false, error: '任务超时' };
  }

  // 下载并保存图片
  async downloadAndSaveImage(imageUrl, filename, outputDir) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const imagePath = path.join(outputDir, 'images', filename);
      await fs.ensureDir(path.dirname(imagePath));
      await fs.writeFile(imagePath, response.data);

      return imagePath;
    } catch (error) {
      throw new Error(`下载图片失败: ${error.message}`);
    }
  }

  // 创建占位图片信息
  async createPlaceholder(filename, outputDir, prompt) {
    const placeholderInfo = {
      filename,
      prompt,
      status: 'placeholder',
      reason: '图片生成失败，已创建占位符',
      timestamp: new Date().toISOString(),
      note: '可以稍后重新生成此图片'
    };

    const placeholderPath = path.join(outputDir, 'images', filename + '.placeholder.json');
    await fs.ensureDir(path.dirname(placeholderPath));
    await fs.writeJson(placeholderPath, placeholderInfo, { spaces: 2 });

    return placeholderPath;
  }

  // 批量生成图片
  async batchGenerate(imagePrompts, outputDir) {
    console.log(`🎨 开始批量生成 ${imagePrompts.length} 张图片...`);
    
    const results = {
      successful: [],
      failed: [],
      total: imagePrompts.length
    };

    for (let i = 0; i < imagePrompts.length; i++) {
      const imagePrompt = imagePrompts[i];
      console.log(`进度: ${i + 1}/${imagePrompts.length}`);

      const result = await this.generateImage(
        imagePrompt.prompt,
        imagePrompt.filename,
        outputDir
      );

      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push(result);
      }

      // 避免API限制
      if (i < imagePrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successRate = ((results.successful.length / results.total) * 100).toFixed(1);
    console.log(`✅ 图片生成完成: ${results.successful.length}/${results.total} (${successRate}%)`);

    return results;
  }
}

module.exports = AliyunImageGenerator;