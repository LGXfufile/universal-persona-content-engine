# UPCE - 万能虚拟产品生成系统

## 🎯 项目简介

Universal Persona-Driven Content Engine (UPCE) 是一个基于AI的通用虚拟产品内容生成系统，能够根据任意用户角色描述，自动生成爆文标题、完整文章内容和精美配图方案，帮助内容创作者快速构建完整的营销内容体系。

## ✨ 核心功能

- 🧠 **智能角色分析** - 深度解析目标人群的情绪、需求和痛点
- 📝 **批量内容生成** - 自动生成高质量的原创文章内容
- 🎨 **配图方案设计** - 提供详细的AI配图生成提示词
- 🔍 **智能去重检测** - 确保每篇内容的独特性
- 📊 **多平台适配** - 针对不同平台优化内容格式
- 💰 **变现模型设计** - 自动设计四层产品变现体系

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装依赖
```bash
# 克隆项目（如果从GitHub获取）
git clone https://github.com/LGXfufile/universal-persona-content-engine.git
cd universal-persona-content-engine

# 安装依赖
npm install
```

### 🧪 图片生成测试（推荐）
在使用完整版本前，建议先测试图片生成API是否配置正确：

```bash
# 一键测试图片生成API
./test-images.sh

# 或直接运行测试
node test-image-api.js --quick
```

**测试结果指导：**
- ✅ **API测试成功** → 使用完整版本：`node upce.js "角色描述"`
- ❌ **API测试失败** → 使用演示版本：`node upce-demo.js "角色描述"`

详细测试指南请查看：[IMAGE_TEST_GUIDE.md](IMAGE_TEST_GUIDE.md)

### 基础使用

#### 1. 演示版本（推荐新手）
演示版本不依赖外部API，可以立即体验完整功能：

```bash
# 基本使用
node upce-demo.js "角色描述"

# 示例：健身教练
node upce-demo.js "三线城市32岁健身教练，月入6000，想做线上私教"

# 示例：宝妈副业
node upce-demo.js "35岁宝妈，想通过小红书做副业赚钱"

# 示例：程序员自媒体
node upce-demo.js "25岁程序员，想做技术自媒体建立个人品牌"
```

#### 2. 快速测试版本
集成真实AI API，生成更丰富的内容：

```bash
# 需要配置DeepSeek API Key
node upce-quick.js "角色描述"
```

#### 3. 完整版本
包含配图生成和完整导出功能：

```bash
# 需要配置DeepSeek和阿里云API
node upce.js "角色描述"
```

### 输出结果

运行成功后，系统会在 `upce_output/` 目录下生成完整的内容包：

```
upce_output/role_xxxxxxxx/
├── README.md                   # 使用说明
├── analysis_report.md          # 角色深度分析报告
├── complete_report.md          # 完整项目报告
├── titles.txt                  # 爆文标题列表
├── generation_stats.json      # 统计数据
├── image_prompts.json         # 配图提示词
├── articles/                   # 原创文章目录
│   ├── article_001.md
│   ├── article_002.md
│   └── article_003.md
├── images/                     # 配图信息
│   └── *.info.json
└── publish_ready/              # 发布就绪版本
    ├── xiaohongshu/           # 小红书优化版
    ├── weixin/                # 微信公众号版
    └── douyin/                # 抖音脚本版
```

## 📋 使用示例

### 示例1：健身教练转型线上
```bash
node upce-demo.js "三线城市32岁健身教练，月入6000，想做线上私教"
```

**生成内容预览：**
- 标题：《月入6000的健身教练，如何靠线上私教3个月收入翻倍》
- 文章：1300+字的完整转型攻略
- 配图：4张专业场景配图方案
- 变现：99元-9800元四层产品模型

### 示例2：宝妈副业创业
```bash
node upce-demo.js "35岁宝妈，有两个孩子，想通过小红书做副业"
```

**生成内容预览：**
- 标题：《35岁二胎妈妈，小红书副业月入过万的真实经历》
- 文章：贴近宝妈群体的实用指南
- 配图：居家场景的真实生活配图
- 变现：适合宝妈的低门槛产品设计

### 示例3：程序员个人品牌
```bash
node upce-demo.js "25岁前端程序员，想做技术自媒体建立个人品牌"
```

**生成内容预览：**
- 标题：《25岁程序员，技术自媒体年入50万的完整路径》
- 文章：技术人员转型内容创作指南
- 配图：编程工作场景和成长历程
- 变现：技术课程和咨询服务模型

## ⚙️ 高级配置

### API配置（可选）

如果要使用真实AI生成功能，需要配置API密钥：

#### 1. DeepSeek API配置
```bash
# 方法1：环境变量
export DEEPSEEK_API_KEY="sk-613c035207a848529bfae4308cce4515"

# 方法2：直接修改脚本中的apiKey变量
```

#### 2. 阿里云通义万相配置
```bash
# 配置阿里云API密钥
export DASHSCOPE_API_KEY="sk-45097a3d1b244a2dab5ae991d50d7daf"
```

### 自定义配置

可以修改脚本中的配置参数：

```javascript
this.config = {
  titleCount: 10,        // 标题数量
  articleCount: 3,       // 文章数量  
  maxRetries: 2,         // 重试次数
  imageCount: 4          // 每篇文章配图数量
};
```

## 📊 功能对比

| 功能 | 演示版 | 快速版 | 完整版 |
|------|--------|--------|--------|
| 角色分析 | ✅ 模板 | ✅ AI生成 | ✅ AI生成 |
| 标题生成 | ✅ 10个 | ✅ 10个 | ✅ 100个 |
| 文章创作 | ✅ 3篇 | ✅ 3篇 | ✅ 100篇 |
| 配图方案 | ✅ 提示词 | ✅ 提示词 | ✅ 真实生成 |
| 多平台适配 | ✅ | ✅ | ✅ |
| 文件导出 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| API依赖 | ❌ 无需 | ✅ DeepSeek | ✅ 全部 |
| 运行速度 | ⚡ 极快 | 🚀 较快 | 🐌 较慢 |

## 🎨 配图生成指南

系统会生成详细的配图提示词，可以使用以下AI工具生成图片：

### 推荐工具
1. **阿里云通义万相** - 中文理解好，适合生活场景
2. **Midjourney** - 画质精美，风格多样  
3. **Stable Diffusion** - 开源免费，可本地部署
4. **文心一格** - 百度出品，中文优化

### 使用步骤
```bash
# 1. 查看生成的配图提示词
cat upce_output/role_xxxxxxxx/image_prompts.json

# 2. 复制提示词到AI绘图工具
# 3. 设置参数：1920x1080，纪实风格
# 4. 生成后保存到images/目录
# 5. 更新文章中的图片链接
```

## 🚀 发布策略

### 平台选择
- **小红书**: 使用 `publish_ready/xiaohongshu/` 版本
- **微信公众号**: 使用 `publish_ready/weixin/` 版本
- **抖音**: 参考 `publish_ready/douyin/` 脚本制作视频
- **知乎**: 使用原始文章，增加专业数据

### 发布时间
- **工作日**: 晚上7-9点效果最佳
- **周末**: 上午10-12点，下午2-4点
- **频率**: 每天1-2篇，避免刷屏

### 变现时机
- **1-3个月**: 积累粉丝，建立信任
- **3-6个月**: 推出低价产品测试市场
- **6-12个月**: 推出高价值服务

## 🔧 故障排除

### 常见问题

#### 1. 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. API调用超时
```bash
# 使用演示版本，无需API
node upce-demo.js "角色描述"
```

#### 3. 生成内容为空
```bash
# 检查角色描述是否清晰具体
# 好的示例："32岁健身教练，月入6000，想做线上私教"
# 避免过于简单："想赚钱"
```

#### 4. 文件权限错误
```bash
# 添加执行权限
chmod +x upce-demo.js upce-quick.js upce.js
```

### 性能优化

#### 1. 加速生成
```bash
# 使用演示版本，速度最快
node upce-demo.js "角色描述"

# 减少生成数量（修改脚本配置）
titleCount: 5,     # 减少标题数量
articleCount: 1,   # 减少文章数量
```

#### 2. 批量处理
```bash
# 创建批量脚本
#!/bin/bash
roles=(
  "健身教练想做线上私教"
  "宝妈想做小红书副业"  
  "程序员想做技术自媒体"
)

for role in "${roles[@]}"; do
  node upce-demo.js "$role"
done
```

## 📈 预期效果

按照系统生成的内容和策略执行，预期可达成：

### 短期目标（1-3个月）
- 📱 获得1000+精准粉丝
- 📝 发布30+优质内容
- 💡 建立专业形象和信任

### 中期目标（3-6个月）  
- 👥 粉丝增长到5000+
- 💰 月收入达到5000-10000元
- 🎯 推出付费产品并获得验证

### 长期目标（6-12个月）
- 🚀 成为细分领域KOL
- 💎 月收入达到2-5万元
- 🏆 建立完整的商业闭环

## 🤝 技术支持

### 获取帮助
- 📖 查看生成的 `README.md` 文件
- 📊 阅读 `complete_report.md` 完整报告
- 💬 GitHub Issues: [提交问题](https://github.com/LGXfufile/universal-persona-content-engine/issues)

### 功能定制
如需要以下服务：
- 🎨 配图生成服务
- ✍️ 内容定制优化
- 📈 发布策略指导  
- 💰 变现方案设计

请联系技术支持团队。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🌟 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系方式

- **GitHub**: [@LGXfufile](https://github.com/LGXfufile)
- **项目地址**: [universal-persona-content-engine](https://github.com/LGXfufile/universal-persona-content-engine)

---

⭐ **如果这个项目对你有帮助，请给个星标支持！**

🚀 **立即开始你的内容创业之旅：**
```bash
node upce-demo.js "你的角色描述"
```