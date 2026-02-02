#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ImageGenerationTester {
  constructor() {
    // 支持多种API配置方式
    this.configs = {
      deepseek: {
        name: 'DeepSeek (通过代理调用通义万相)',
        apiKey: process.env.DEEPSEEK_API_KEY || 'sk-613c035207a848529bfae4308cce4515',
        baseURL: 'https://api.deepseek.com/chat/completions',
        headers: {
          'Authorization': 'Bearer {API_KEY}',
          'Content-Type': 'application/json'
        },
        payload: {
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: "请生成一张图片：{PROMPT}"
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        }
      },
      dashscope: {
        name: '阿里云通义万相 (直接调用)',
        apiKey: process.env.DASHSCOPE_API_KEY || 'sk-45097a3d1b244a2dab5ae991d50d7daf',
        baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        headers: {
          'Authorization': 'Bearer {API_KEY}',
          'Content-Type': 'application/json'
        },
        payload: {
          model: "qwen-image-max",
          input: {
            messages: [
              {
                role: "user",
                content: [
                  {
                    text: "{PROMPT}"
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
        }
      },
      openai: {
        name: 'OpenAI DALL-E (需要OpenAI API Key)',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: 'https://api.openai.com/v1/images/generations',
        headers: {
          'Authorization': 'Bearer {API_KEY}',
          'Content-Type': 'application/json'
        },
        payload: {
          model: "dall-e-3",
          prompt: "{PROMPT}",
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        }
      }
    };

    this.testPrompts = [
      {
        name: '简单测试',
        prompt: '一个年轻人在家里使用电脑学习，温暖的自然光线，真实生活场景，高清摄影'
      },
      {
        name: '健身场景',
        prompt: '32岁健身教练在健身房指导客户，专业健身环境，自然光线，真实工作状态，纪实摄影风格'
      },
      {
        name: '居家办公',
        prompt: '年轻人在家中通过视频通话工作，居家环境，自然光线，生活感强，温暖色调，高清画质'
      }
    ];
  }

  // 测试单个API配置
  async testAPI(configName, config, prompt) {
    console.log(`\n🧪 测试 ${config.name}...`);
    
    if (!config.apiKey) {
      console.log(`❌ 未配置API Key，跳过测试`);
      return { success: false, error: 'API Key未配置' };
    }

    try {
      // 准备请求头
      const headers = {};
      Object.entries(config.headers).forEach(([key, value]) => {
        headers[key] = value.replace('{API_KEY}', config.apiKey);
      });

      // 准备请求体
      let payload = JSON.parse(JSON.stringify(config.payload));
      const payloadStr = JSON.stringify(payload);
      payload = JSON.parse(payloadStr.replace(/{PROMPT}/g, prompt.prompt));

      console.log(`📝 提示词: ${prompt.prompt}`);
      console.log(`🌐 请求地址: ${config.baseURL}`);

      const response = await axios.post(config.baseURL, payload, {
        headers,
        timeout: 30000
      });

      console.log(`✅ API调用成功`);
      console.log(`📊 响应状态: ${response.status}`);
      
      if (response.data) {
        // DeepSeek 文本响应格式
        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          console.log(`💬 文本响应: ${response.data.choices[0].message.content}`);
          return { 
            success: true, 
            textResponse: response.data.choices[0].message.content,
            response: response.data 
          };
        }
        // OpenAI/DeepSeek 图片格式
        else if (response.data.data && response.data.data[0] && response.data.data[0].url) {
          console.log(`🎨 图片URL: ${response.data.data[0].url}`);
          return { 
            success: true, 
            imageUrl: response.data.data[0].url,
            response: response.data 
          };
        }
        // 阿里云异步任务格式
        else if (response.data.output && response.data.output.task_id) {
          console.log(`⏳ 异步任务ID: ${response.data.output.task_id}`);
          return { 
            success: true, 
            taskId: response.data.output.task_id,
            response: response.data 
          };
        }
        // 阿里云直接返回图片URL
        else if (response.data.output && response.data.output.image_url) {
          console.log(`🎨 图片URL: ${response.data.output.image_url}`);
          return { 
            success: true, 
            imageUrl: response.data.output.image_url,
            response: response.data 
          };
        }
        // 阿里云新格式 - choices数组中的图片
        else if (response.data.output && response.data.output.choices && response.data.output.choices[0] && response.data.output.choices[0].message && response.data.output.choices[0].message.content && response.data.output.choices[0].message.content[0] && response.data.output.choices[0].message.content[0].image) {
          const imageUrl = response.data.output.choices[0].message.content[0].image;
          console.log(`🎨 图片URL: ${imageUrl}`);
          return { 
            success: true, 
            imageUrl: imageUrl,
            response: response.data 
          };
        } else {
          console.log(`⚠️  响应格式未知:`);
          console.log(JSON.stringify(response.data, null, 2));
          return { 
            success: true, 
            response: response.data 
          };
        }
      }

      return { success: true, response: response.data };

    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
      
      if (error.response) {
        console.log(`📊 HTTP状态: ${error.response.status}`);
        console.log(`📝 错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // 分析常见错误
        if (error.response.status === 401) {
          console.log(`💡 建议: API Key可能无效或已过期，请检查配置`);
        } else if (error.response.status === 429) {
          console.log(`💡 建议: API调用频率超限，请稍后重试`);
        } else if (error.response.status === 400) {
          console.log(`💡 建议: 请求参数可能有误，检查提示词格式`);
        }
      }

      return { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        details: error.response?.data 
      };
    }
  }

  // 测试图片下载
  async testImageDownload(imageUrl) {
    console.log(`\n📥 测试图片下载...`);
    
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const imageBuffer = Buffer.from(response.data);
      const testDir = path.join(__dirname, 'test_images');
      await fs.ensureDir(testDir);
      
      const filename = `test_image_${Date.now()}.jpg`;
      const filepath = path.join(testDir, filename);
      
      await fs.writeFile(filepath, imageBuffer);
      
      console.log(`✅ 图片下载成功: ${filepath}`);
      console.log(`📊 文件大小: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      
      return { success: true, filepath, size: imageBuffer.length };
      
    } catch (error) {
      console.log(`❌ 图片下载失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 生成测试报告
  generateReport(results) {
    console.log(`\n📋 测试报告`);
    console.log(`${'='.repeat(50)}`);
    
    let successCount = 0;
    let totalCount = 0;
    
    Object.entries(results).forEach(([configName, configResults]) => {
      console.log(`\n🔧 ${this.configs[configName].name}`);
      console.log(`${'-'.repeat(30)}`);
      
      configResults.forEach((result, index) => {
        totalCount++;
        const prompt = this.testPrompts[index];
        console.log(`📝 ${prompt.name}: ${result.success ? '✅ 成功' : '❌ 失败'}`);
        
        if (result.success) {
          successCount++;
          if (result.imageUrl) {
            console.log(`   🎨 图片已生成`);
          } else if (result.taskId) {
            console.log(`   ⏳ 异步任务已提交`);
          } else if (result.textResponse) {
            console.log(`   💬 文本响应成功`);
          }
        } else {
          console.log(`   ❌ ${result.error}`);
        }
      });
    });
    
    console.log(`\n📊 总体统计:`);
    console.log(`   - 总测试数: ${totalCount}`);
    console.log(`   - 成功数: ${successCount}`);
    console.log(`   - 成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    // 给出建议
    console.log(`\n💡 使用建议:`);
    
    if (successCount === 0) {
      console.log(`   ❌ 所有API都无法使用，建议:`);
      console.log(`      1. 检查网络连接`);
      console.log(`      2. 验证API Key是否正确`);
      console.log(`      3. 确认API服务是否正常`);
      console.log(`      4. 使用演示版本: node upce-demo.js`);
    } else {
      const workingAPIs = Object.entries(results)
        .filter(([_, configResults]) => configResults.some(r => r.success))
        .map(([configName, _]) => this.configs[configName].name);
      
      console.log(`   ✅ 可用的API服务: ${workingAPIs.join(', ')}`);
      console.log(`   🚀 推荐使用: node upce.js "角色描述"`);
    }
  }

  // 主测试流程
  async runTests() {
    console.log(`🧪 UPCE图片生成API测试工具`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📅 测试时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log(`🎯 测试目标: 验证图片生成API是否可用`);
    
    const results = {};
    
    // 测试每个API配置
    for (const [configName, config] of Object.entries(this.configs)) {
      results[configName] = [];
      
      console.log(`\n🔧 开始测试 ${config.name}`);
      
      // 测试每个提示词
      for (const prompt of this.testPrompts) {
        const result = await this.testAPI(configName, config, prompt);
        results[configName].push(result);
        
        // 如果成功生成图片，尝试下载测试
        if (result.success && result.imageUrl) {
          await this.testImageDownload(result.imageUrl);
        }
        
        // 避免API限制，添加延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 生成测试报告
    this.generateReport(results);
    
    // 保存详细测试结果
    const reportPath = path.join(__dirname, 'image_api_test_report.json');
    await fs.writeJson(reportPath, {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTests: Object.values(results).flat().length,
        successfulTests: Object.values(results).flat().filter(r => r.success).length
      }
    }, { spaces: 2 });
    
    console.log(`\n📄 详细报告已保存: ${reportPath}`);
    
    return results;
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`🧪 UPCE图片生成API测试工具`);
    console.log(``);
    console.log(`使用方法:`);
    console.log(`  node test-image-api.js              # 运行完整测试`);
    console.log(`  node test-image-api.js --quick      # 快速测试`);
    console.log(`  node test-image-api.js --config     # 显示配置说明`);
    console.log(``);
    console.log(`环境变量配置:`);
    console.log(`  DEEPSEEK_API_KEY=your_key          # DeepSeek API密钥`);
    console.log(`  DASHSCOPE_API_KEY=your_key         # 阿里云通义万相密钥`);
    console.log(`  OPENAI_API_KEY=your_key            # OpenAI API密钥`);
    console.log(``);
    console.log(`示例:`);
    console.log(`  export DEEPSEEK_API_KEY="sk-xxx"`);
    console.log(`  node test-image-api.js`);
    return;
  }
  
  if (args.includes('--config')) {
    console.log(`⚙️  API配置说明`);
    console.log(`${'='.repeat(50)}`);
    console.log(``);
    console.log(`1. DeepSeek API (推荐)`);
    console.log(`   - 获取地址: https://platform.deepseek.com/`);
    console.log(`   - 配置方式: export DEEPSEEK_API_KEY="sk-xxx"`);
    console.log(`   - 说明: 通过DeepSeek代理调用通义万相`);
    console.log(``);
    console.log(`2. 阿里云通义万相`);
    console.log(`   - 获取地址: https://dashscope.console.aliyun.com/`);
    console.log(`   - 配置方式: export DASHSCOPE_API_KEY="sk-xxx"`);
    console.log(`   - 说明: 直接调用阿里云服务`);
    console.log(``);
    console.log(`3. OpenAI DALL-E`);
    console.log(`   - 获取地址: https://platform.openai.com/`);
    console.log(`   - 配置方式: export OPENAI_API_KEY="sk-xxx"`);
    console.log(`   - 说明: 需要海外网络环境`);
    console.log(``);
    console.log(`💡 建议优先使用DeepSeek API，稳定性和速度都比较好。`);
    return;
  }
  
  const tester = new ImageGenerationTester();
  
  if (args.includes('--quick')) {
    console.log(`⚡ 快速测试模式 - 只测试第一个提示词`);
    tester.testPrompts = [tester.testPrompts[0]];
  }
  
  try {
    await tester.runTests();
  } catch (error) {
    console.error(`❌ 测试过程出错:`, error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = ImageGenerationTester;