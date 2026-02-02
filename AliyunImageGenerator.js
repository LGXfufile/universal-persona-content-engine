const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// 简单限流器
class SimpleRateLimiter {
  constructor() {
    this.lastCall = new Map();
    this.delays = {
      aliyun: 8000,    // 阿里云API 8秒间隔
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

class AliyunImageGenerator {
  constructor() {
    // 阿里云通义万相API配置
    this.apiKey = process.env.DASHSCOPE_API_KEY || 'sk-45097a3d1b244a2dab5ae991d50d7daf';
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    this.maxRetries = 3;
    this.rateLimiter = new SimpleRateLimiter();
  }

  // 生成图片
  async generateImage(prompt, filename, outputDir) {
    console.log(`🎨 正在生成图片: ${filename}`);

    for (let retry = 0; retry < this.maxRetries; retry++) {
      try {
        // 应用限流策略
        await this.rateLimiter.waitIfNeeded('aliyun');

        const response = await axios.post(this.baseURL, {
          model: "qwen-image-max",
          input: {
            messages: [
              {
                role: "user",
                content: [
                  {
                    text: this.optimizePrompt(prompt)
                  }
                ]
              }
            ]
          },
          parameters: {
            negative_prompt: "低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，画面具有AI感。构图混乱。文字模糊，扭曲。",
            prompt_extend: true,
            watermark: false,
            size: "1664*928"
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        // 记录成功
        this.rateLimiter.recordSuccess('aliyun');

        if (response.data.output && response.data.output.task_id) {
          // 异步任务，需要轮询结果
          const result = await this.pollTaskResult(response.data.output.task_id);
          
          if (result.success) {
            // 下载并保存图片
            const imagePath = await this.downloadAndSaveImage(result.imageUrl, filename, outputDir);
            console.log(`✅ 图片生成成功: ${filename}`);
            return { success: true, path: imagePath, prompt };
          } else {
            console.log(`❌ 异步任务失败: ${result.error}`);
            return { success: false, error: result.error, prompt };
          }
        } else if (response.data.output && response.data.output.results && response.data.output.results[0]) {
          // 同步返回结果 - 新API格式
          const imageUrl = response.data.output.results[0].url;
          const imagePath = await this.downloadAndSaveImage(imageUrl, filename, outputDir);
          console.log(`✅ 图片生成成功: ${filename}`);
          return { success: true, path: imagePath, prompt };
        } else if (response.data.output && response.data.output.image_url) {
          // 新API直接返回图片URL
          const imageUrl = response.data.output.image_url;
          const imagePath = await this.downloadAndSaveImage(imageUrl, filename, outputDir);
          console.log(`✅ 图片生成成功: ${filename}`);
          return { success: true, path: imagePath, prompt };
        } else if (response.data.output && response.data.output.choices && response.data.output.choices[0] && response.data.output.choices[0].message && response.data.output.choices[0].message.content && response.data.output.choices[0].message.content[0] && response.data.output.choices[0].message.content[0].image) {
          // 阿里云新格式 - choices数组中的图片
          const imageUrl = response.data.output.choices[0].message.content[0].image;
          const imagePath = await this.downloadAndSaveImage(imageUrl, filename, outputDir);
          console.log(`✅ 图片生成成功: ${filename}`);
          return { success: true, path: imagePath, prompt };
        } else {
          console.log(`⚠️ 响应格式未知:`);
          console.log(JSON.stringify(response.data, null, 2));
          return { success: false, error: '响应格式未知', prompt };
        }

      } catch (error) {
        // 记录错误
        this.rateLimiter.recordError('aliyun');
        
        console.log(`⚠️  图片生成失败 (尝试 ${retry + 1}/${this.maxRetries}): ${error.message}`);
        
        if (retry === this.maxRetries - 1) {
          // 最后一次重试失败，生成占位图片
          const placeholderPath = await this.createPlaceholder(filename, outputDir, prompt);
          console.log(`📝 已创建占位图片: ${filename}`);
          return { success: false, path: placeholderPath, error: error.message, prompt };
        }
        
        // 等待后重试（额外的重试延迟）
        await new Promise(resolve => setTimeout(resolve, 2000 * (retry + 1)));
      }
    }
    
    // 如果所有重试都失败，返回失败结果
    const placeholderPath = await this.createPlaceholder(filename, outputDir, prompt);
    console.log(`📝 所有重试失败，已创建占位图片: ${filename}`);
    return { success: false, path: placeholderPath, error: '所有重试失败', prompt };
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

      try {
        const result = await this.generateImage(
          imagePrompt.prompt,
          imagePrompt.filename,
          outputDir
        );

        if (result && result.success) {
          results.successful.push(result);
        } else {
          results.failed.push({
            filename: imagePrompt.filename,
            prompt: imagePrompt.prompt,
            error: result?.error || '生成失败',
            success: false
          });
        }
      } catch (error) {
        console.log(`❌ 图片生成异常: ${imagePrompt.filename} - ${error.message}`);
        results.failed.push({
          filename: imagePrompt.filename,
          prompt: imagePrompt.prompt,
          error: error.message,
          success: false
        });
      }

      // 批量生成间隔 - 已经在generateImage中通过rateLimiter处理
      // 这里不需要额外延迟
    }

    const successRate = ((results.successful.length / results.total) * 100).toFixed(1);
    console.log(`✅ 图片生成完成: ${results.successful.length}/${results.total} (${successRate}%)`);

    return results;
  }
}

module.exports = AliyunImageGenerator;