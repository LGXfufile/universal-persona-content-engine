# 🧪 图片生成API测试指南

## 🎯 测试目的

在使用UPCE系统的完整版本前，建议先测试图片生成API是否配置正确，避免在生成大量内容时遇到配图失败的问题。

## 🚀 快速测试

### 方法1：一键测试脚本
```bash
# 运行交互式测试
./test-images.sh
```

### 方法2：直接命令行
```bash
# 快速测试（推荐）
node test-image-api.js --quick

# 完整测试
node test-image-api.js

# 查看配置说明
node test-image-api.js --config

# 查看帮助
node test-image-api.js --help
```

## ⚙️ API配置

### 1. DeepSeek API（推荐）
```bash
# 设置环境变量
export DEEPSEEK_API_KEY="sk-71cc3aad8fad44c8970dd549933d3573"

# 或者直接修改脚本中的apiKey
```

**获取方式：**
- 访问：https://platform.deepseek.com/
- 注册账号并获取API Key
- 通过DeepSeek代理调用通义万相，稳定性好

### 2. 阿里云通义万相
```bash
# 设置环境变量
export DASHSCOPE_API_KEY="your_dashscope_key"
```

**获取方式：**
- 访问：https://dashscope.console.aliyun.com/
- 开通通义万相服务
- 获取API Key

### 3. OpenAI DALL-E
```bash
# 设置环境变量  
export OPENAI_API_KEY="your_openai_key"
```

**获取方式：**
- 访问：https://platform.openai.com/
- 需要海外网络环境
- 费用相对较高

## 📊 测试内容

测试脚本会验证以下场景：

### 测试提示词
1. **简单测试**：基础人物场景
2. **健身场景**：专业工作环境  
3. **居家办公**：生活化场景

### 测试项目
- ✅ API连接性测试
- ✅ 图片生成测试
- ✅ 图片下载测试
- ✅ 响应格式验证
- ✅ 错误处理测试

## 📋 测试结果解读

### 成功示例
```
🧪 测试 DeepSeek (通过代理调用通义万相)...
📝 提示词: 一个年轻人在家里使用电脑学习，温暖的自然光线
🌐 请求地址: https://api.deepseek.com/v1/images/generations
✅ API调用成功
📊 响应状态: 200
🎨 图片URL: https://example.com/image.jpg

📥 测试图片下载...
✅ 图片下载成功: test_images/test_image_1706789123456.jpg
📊 文件大小: 245.67 KB
```

### 失败示例
```
🧪 测试 DeepSeek (通过代理调用通义万相)...
❌ 测试失败: Request failed with status code 401
📊 HTTP状态: 401
📝 错误详情: {"error": "Invalid API key"}
💡 建议: API Key可能无效或已过期，请检查配置
```

## 🔧 常见问题解决

### 1. 401 Unauthorized
**问题**：API Key无效或过期
**解决**：
```bash
# 检查API Key是否正确
echo $DEEPSEEK_API_KEY

# 重新设置API Key
export DEEPSEEK_API_KEY="your_correct_key"
```

### 2. 429 Too Many Requests
**问题**：API调用频率超限
**解决**：
- 等待一段时间后重试
- 检查API套餐限制
- 使用其他API服务

### 3. 400 Bad Request
**问题**：请求参数错误
**解决**：
- 检查提示词格式
- 确认API接口版本
- 查看详细错误信息

### 4. 网络连接失败
**问题**：无法连接到API服务
**解决**：
```bash
# 测试网络连接
ping api.deepseek.com

# 检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

## 📈 测试报告

测试完成后会生成详细报告：

### 控制台输出
```
📋 测试报告
==================================================

🔧 DeepSeek (通过代理调用通义万相)
------------------------------
📝 简单测试: ✅ 成功
📝 健身场景: ✅ 成功  
📝 居家办公: ❌ 失败

📊 总体统计:
   - 总测试数: 9
   - 成功数: 6
   - 成功率: 66.7%

💡 使用建议:
   ✅ 可用的API服务: DeepSeek
   🚀 推荐使用: node upce.js "角色描述"
```

### JSON报告文件
```json
{
  "timestamp": "2026-01-31T07:00:00.000Z",
  "results": {
    "deepseek": [
      {
        "success": true,
        "imageUrl": "https://example.com/image.jpg"
      }
    ]
  },
  "summary": {
    "totalTests": 9,
    "successfulTests": 6
  }
}
```

## 🎯 根据测试结果选择版本

### 所有API都失败
```bash
# 使用演示版本，无需API
node upce-demo.js "角色描述"
```

### 部分API成功
```bash
# 使用快速版本，只需文本API
node upce-quick.js "角色描述"
```

### 图片API成功
```bash
# 使用完整版本，包含真实配图
node upce.js "角色描述"
```

## 💡 优化建议

### 1. 提高成功率
- 使用多个API服务作为备选
- 设置合理的重试机制
- 优化提示词格式

### 2. 降低成本
- 优先使用免费额度较高的服务
- 合理控制图片生成数量
- 使用缓存避免重复生成

### 3. 提升质量
- 测试不同的提示词风格
- 调整图片参数设置
- 验证生成图片的质量

## 🔄 定期测试

建议定期运行测试脚本：

```bash
# 每周测试一次
crontab -e
# 添加：0 9 * * 1 cd /path/to/upce && ./test-images.sh

# 手动定期测试
node test-image-api.js --quick
```

---

**💡 提示：测试通过后，就可以放心使用UPCE的完整功能了！**