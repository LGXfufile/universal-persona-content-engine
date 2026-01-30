const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

class ImageGenerator {
  constructor() {
    this.apiKey = 'sk-71cc3aad8fad44c8970dd549933d3573'; // DeepSeek API Key
    this.baseURL = 'https://api.deepseek.com/v1';
    this.configPath = path.join(__dirname, '../content_os/config');
    this.config = this.loadConfig();
  }

  loadConfig() {
    return fs.readJsonSync(path.join(this.configPath, 'image_rules.json'));
  }

  async generateImage(prompt, filename, retryCount = 0) {
    try {
      console.log(`生成图片: ${filename} (尝试 ${retryCount + 1})`);
      
      // 优化提示词
      const optimizedPrompt = this.optimizePrompt(prompt);
      
      // 调用阿里云通义万相API (通过DeepSeek代理)
      const response = await axios.post(`${this.baseURL}/images/generations`, {
        model: "wanx-v1",
        prompt: optimizedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.data && response.data.data[0]) {
        const imageUrl = response.data.data[0].url;
        
        // 下载并保存图片
        const imageBuffer = await this.downloadImage(imageUrl);
        const processedImage = await this.processImage(imageBuffer);
        
        // 质检
        const qualityCheck = await this.checkImageQuality(processedImage, prompt);
        
        if (qualityCheck.passed) {
          return {
            success: true,
            filename,
            prompt: optimizedPrompt,
            quality: qualityCheck.score
          };
        } else {
          throw new Error(`图片质检未通过: ${qualityCheck.reason}`);
        }
      } else {
        throw new Error('API返回数据格式错误');
      }
    } catch (error) {
      console.error(`生成图片失败: ${error.message}`);
      
      if (retryCount < this.config.retry_limits.image_generation) {
        console.log(`重试生成图片 ${filename}...`);
        // 修改提示词重试
        const modifiedPrompt = this.modifyPromptForRetry(prompt, retryCount + 1);
        return await this.generateImage(modifiedPrompt, filename, retryCount + 1);
      } else {
        return {
          success: false,
          filename,
          error: error.message,
          retryCount
        };
      }
    }
  }

  optimizePrompt(prompt) {
    // 添加质量和风格关键词
    const qualityKeywords = [
      '高清画质',
      '自然光线',
      '真实感',
      '生活化',
      '温暖色调',
      '纪实摄影风格'
    ];

    // 添加禁止元素
    const bannedElements = this.config.banned_elements.join('，');
    const avoidClause = `，避免出现：${bannedElements}`;

    return `${prompt}，${qualityKeywords.join('，')}${avoidClause}`;
  }

  modifyPromptForRetry(originalPrompt, retryCount) {
    const modifications = [
      '增加生活感，更加朴素自然',
      '强调居家环境，日常场景',
      '突出真实性，减少商业化元素'
    ];

    const modification = modifications[retryCount - 1] || modifications[0];
    return `${originalPrompt}，${modification}`;
  }

  async downloadImage(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`下载图片失败: ${error.message}`);
    }
  }

  async processImage(imageBuffer) {
    try {
      // 使用Sharp处理图片
      const processedBuffer = await sharp(imageBuffer)
        .resize(1920, 1080, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      throw new Error(`处理图片失败: ${error.message}`);
    }
  }

  async checkImageQuality(imageBuffer, originalPrompt) {
    try {
      // 获取图片元数据
      const metadata = await sharp(imageBuffer).metadata();
      
      // 基础质检
      const checks = {
        resolution: metadata.width >= this.config.min_resolution && metadata.height >= this.config.min_resolution,
        format: ['jpeg', 'jpg', 'png'].includes(metadata.format),
        size: imageBuffer.length > 50000 && imageBuffer.length < 5000000 // 50KB - 5MB
      };

      // 计算质量分数
      let score = 0;
      if (checks.resolution) score += 40;
      if (checks.format) score += 30;
      if (checks.size) score += 30;

      const passed = score >= 70;
      const reason = passed ? '质检通过' : this.getFailureReason(checks);

      return {
        passed,
        score,
        reason,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: imageBuffer.length
        }
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        reason: `质检过程出错: ${error.message}`
      };
    }
  }

  getFailureReason(checks) {
    const failures = [];
    if (!checks.resolution) failures.push('分辨率不达标');
    if (!checks.format) failures.push('格式不支持');
    if (!checks.size) failures.push('文件大小异常');
    return failures.join(', ');
  }

  async batchGenerateImages(imagePrompts, outputDir) {
    const results = [];
    const failedImages = [];

    await fs.ensureDir(path.join(outputDir, 'images'));

    for (let i = 0; i < imagePrompts.length; i++) {
      const { filename, prompt } = imagePrompts[i];
      const imagePath = path.join(outputDir, 'images', filename);

      console.log(`生成图片 ${i + 1}/${imagePrompts.length}: ${filename}`);

      const result = await this.generateImage(prompt, filename);
      
      if (result.success) {
        // 保存图片
        await fs.writeFile(imagePath, result.imageBuffer);
        results.push({
          ...result,
          path: imagePath
        });
        console.log(`✅ 图片生成成功: ${filename}`);
      } else {
        failedImages.push({
          filename,
          prompt,
          error: result.error
        });
        console.log(`❌ 图片生成失败: ${filename} - ${result.error}`);
      }

      // 添加延迟避免API限制
      if (i < imagePrompts.length - 1) {
        await this.sleep(1000);
      }
    }

    // 处理失败的图片
    if (failedImages.length > 0) {
      console.log(`\n处理 ${failedImages.length} 个失败的图片...`);
      await this.handleFailedImages(failedImages, outputDir);
    }

    return {
      successful: results,
      failed: failedImages,
      totalCount: imagePrompts.length,
      successRate: (results.length / imagePrompts.length * 100).toFixed(2) + '%'
    };
  }

  async handleFailedImages(failedImages, outputDir) {
    // 生成占位图片
    for (const failed of failedImages) {
      try {
        const placeholderPath = path.join(outputDir, 'images', failed.filename);
        await this.generatePlaceholder(placeholderPath, failed.prompt);
        console.log(`生成占位图: ${failed.filename}`);
      } catch (error) {
        console.error(`生成占位图失败: ${failed.filename} - ${error.message}`);
      }
    }
  }

  async generatePlaceholder(imagePath, prompt) {
    // 生成简单的占位图
    const placeholderBuffer = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .png()
    .toBuffer();

    await fs.writeFile(imagePath, placeholderBuffer);
  }

  async insertImagesIntoArticles(articles, outputDir) {
    const updatedArticles = [];

    for (const article of articles) {
      let content = article.content;
      
      // 替换图片占位符
      for (let i = 0; i < article.images.length; i++) {
        const imageName = article.images[i];
        const placeholder = `image_placeholder_${i + 1}.png`;
        const imagePath = `./images/${imageName}`;
        
        content = content.replace(
          `![${article.imagePrompts[i]?.position || '图片'}](${placeholder})`,
          `![${article.imagePrompts[i]?.position || '图片'}](${imagePath})`
        );
      }

      updatedArticles.push({
        ...article,
        content
      });
    }

    return updatedArticles;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 质检报告生成
  async generateQualityReport(results, outputDir) {
    const report = {
      生成时间: new Date().toISOString(),
      总图片数: results.totalCount,
      成功数量: results.successful.length,
      失败数量: results.failed.length,
      成功率: results.successRate,
      成功图片: results.successful.map(img => ({
        文件名: img.filename,
        质量分数: img.quality,
        提示词: img.prompt.substring(0, 100) + '...'
      })),
      失败图片: results.failed.map(img => ({
        文件名: img.filename,
        失败原因: img.error,
        提示词: img.prompt.substring(0, 100) + '...'
      }))
    };

    await fs.writeJson(
      path.join(outputDir, 'image_quality_report.json'),
      report,
      { spaces: 2 }
    );

    return report;
  }
}

module.exports = ImageGenerator;