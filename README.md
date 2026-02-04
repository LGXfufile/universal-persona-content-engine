# UPCE - 通用虚拟产品内容生成引擎

<div align="center">

![UPCE Logo](https://img.shields.io/badge/UPCE-AI%20Content%20Engine-blue?style=for-the-badge&logo=openai)

[![Next.js](https://img.shields.io/badge/Next.js-15.5.11-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

**基于AI的智能内容创作平台，为您的营销需求提供精准的个性化内容解决方案**

[🚀 在线体验](https://universal-persona-content-engine.vercel.app/) | [📖 使用文档](#使用指南) | [🛠️ 本地部署](#本地开发)

</div>

## ✨ 核心特性

### 🎯 智能用户画像分析
- **深度AI分析**：基于DeepSeek大模型的用户画像深度解析
- **多维度洞察**：人口统计、心理特征、痛点分析、目标识别
- **营销策略**：自动生成营销触发点和解决方案

### 📝 批量内容生成
- **标题库生成**：一次生成100+高质量营销标题
- **原创文章**：AI创作个性化长文内容
- **多平台适配**：小红书、微信、抖音等平台专属格式

### 🎨 AI配图生成
- **智能配图**：基于阿里云通义千问的图像生成
- **场景匹配**：根据内容自动生成匹配的视觉元素
- **高质量输出**：1664×928分辨率，适合社交媒体

### 🌐 现代化Web界面
- **苹果风格设计**：参考Apple官网的简约美学
- **响应式布局**：完美适配桌面端和移动端
- **深色模式**：护眼的深色主题支持
- **实时进度**：生成过程可视化跟踪

## 🏗️ 技术架构

### 前端技术栈
```
Next.js 15.5.11     # React全栈框架
TypeScript 5.9.3    # 类型安全
Tailwind CSS 3.4.0  # 原子化CSS
Framer Motion       # 动画库
```

### 后端引擎
```
Node.js            # 运行环境
DeepSeek API       # 文本生成AI
阿里云DashScope     # 图像生成AI
```

### 部署平台
```
Vercel             # 前端部署
GitHub Actions     # CI/CD自动化
```

## 🚀 快速开始

### 在线使用
访问 [https://universal-persona-content-engine.vercel.app/](https://universal-persona-content-engine.vercel.app/)

1. 输入详细的用户画像描述
2. 点击"开始生成内容"
3. 等待AI分析和内容创作
4. 下载完整的内容包

### 本地开发

#### 环境要求
- Node.js 18.0+
- npm 或 yarn

#### 安装步骤
```bash
# 克隆项目
git clone https://github.com/LGXfufile/universal-persona-content-engine.git
cd universal-persona-content-engine

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

#### 环境配置
创建 `.env.local` 文件：
```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DASHSCOPE_API_KEY=your_aliyun_api_key
```

## 📖 使用指南

### 1. 用户画像描述
为获得最佳效果，请提供详细的用户画像信息：

**推荐格式：**
```
年龄段 + 地域 + 职业 + 收入水平 + 兴趣爱好 + 消费习惯 + 痛点需求

示例：
25-35岁一线城市白领女性，月收入1-3万，关注健康生活方式，
喜欢高品质产品，时间紧张，追求效率，对价格不太敏感，
经常在小红书和微信获取信息。
```

### 2. 生成内容类型

#### 📋 标题库 (100条)
- 吸引眼球的营销标题
- 多种文案风格
- 平台优化适配

#### 📄 原创文章 (3篇)
- 深度内容创作
- 个性化定制
- 多平台格式

#### 🖼️ AI配图 (12张)
- 文章配套图片
- 场景化设计
- 高清质量输出

### 3. 输出文件结构
```
upce_output/role_xxxxxxxx/
├── README.md                 # 使用说明
├── analysis_report.md        # 用户画像分析报告
├── titles.txt               # 标题库
├── articles/                # 文章目录
│   ├── article_001.md
│   ├── article_002.md
│   └── article_003.md
├── images/                  # 图片目录
└── publish_ready/           # 平台适配内容
    ├── xiaohongshu/        # 小红书格式
    ├── weixin/             # 微信格式
    └── douyin/             # 抖音格式
```

## 🛠️ CLI工具使用

### 演示版本（推荐新手）
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

### 快速测试版本
集成真实AI API，生成更丰富的内容：

```bash
# 需要配置DeepSeek API Key
node upce-quick.js "角色描述"
```

### 完整版本
包含配图生成和完整导出功能：

```bash
# 需要配置DeepSeek和阿里云API
node upce.js "角色描述"
```

## 🔧 开发指南

### 项目结构
```
├── pages/                   # Next.js页面
│   ├── api/                # API路由
│   │   └── generate.ts     # 内容生成API
│   └── index.tsx           # 主页面
├── src/
│   ├── types/              # TypeScript类型定义
│   └── utils/              # 工具函数
├── styles/                 # 样式文件
├── public/                 # 静态资源
├── upce-quick.js           # UPCE核心引擎
├── prompts.js              # AI提示词模板
└── vercel.json             # Vercel部署配置
```

### 核心API

#### POST /api/generate
内容生成API，支持Server-Sent Events实时进度推送。

**请求参数：**
```typescript
{
  roleDescription: string;    // 用户画像描述
  titleCount?: number;        // 标题数量 (默认100)
  articleCount?: number;      // 文章数量 (默认3)
  imageCount?: number;        // 图片数量 (默认4)
}
```

**响应格式：**
```typescript
// 进度更新
{
  type: 'progress',
  data: {
    step: string;           // 当前步骤
    progress: number;       // 进度百分比
    message: string;        // 状态消息
  }
}

// 完成结果
{
  type: 'complete',
  data: {
    roleId: string;         // 角色ID
    analysis: RoleAnalysis; // 分析结果
    titles: string[];       // 标题列表
    articles: Article[];    // 文章列表
    images: ImageMetadata[]; // 图片信息
    outputPath: string;     // 输出路径
  }
}
```

### 自定义配置

#### 修改AI提示词
编辑 `prompts.js` 文件中的提示词模板：
```javascript
// 角色分析提示词
roleAnalysis: (roleDescription) => `
  请深度分析以下用户画像：${roleDescription}
  // ... 自定义提示词
`
```

#### 调整生成参数
在 `upce-quick.js` 中修改配置：
```javascript
this.config = {
  titleCount: 100,        // 标题数量
  articleCount: 3,        // 文章数量
  maxRetries: 3,          // 重试次数
  imageCount: 4           // 图片数量
};
```

## 🚀 部署指南

### Vercel部署 (推荐)
1. Fork本项目到您的GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 自动部署完成

### 手动部署
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 静态导出
```bash
# 生成静态文件
npm run export

# 输出到 /out 目录
```

## 🔧 配置说明

### API密钥配置
- **DeepSeek API**: 用于文本生成，在 [DeepSeek官网](https://platform.deepseek.com/) 获取
- **阿里云DashScope**: 用于图像生成，在 [阿里云控制台](https://dashscope.console.aliyun.com/) 获取

### 环境变量
```env
# 必需配置
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# 可选配置
EXPORT_MODE=static                    # 静态导出模式
NODE_ENV=production                   # 生产环境
```

## 📊 功能对比

| 功能 | Web界面 | 演示版CLI | 快速版CLI | 完整版CLI |
|------|---------|-----------|-----------|-----------|
| 角色分析 | ✅ AI生成 | ✅ 模板 | ✅ AI生成 | ✅ AI生成 |
| 标题生成 | ✅ 100个 | ✅ 10个 | ✅ 10个 | ✅ 100个 |
| 文章创作 | ✅ 3篇 | ✅ 3篇 | ✅ 3篇 | ✅ 100篇 |
| 配图方案 | ✅ 提示词 | ✅ 提示词 | ✅ 提示词 | ✅ 真实生成 |
| 多平台适配 | ✅ | ✅ | ✅ | ✅ |
| 实时进度 | ✅ | ❌ | ❌ | ❌ |
| 文件导出 | ✅ JSON | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| API依赖 | ✅ DeepSeek | ❌ 无需 | ✅ DeepSeek | ✅ 全部 |
| 运行速度 | 🚀 较快 | ⚡ 极快 | 🚀 较快 | 🐌 较慢 |

## 📈 性能优化

### 前端优化
- **代码分割**：动态导入减少初始包大小
- **图片优化**：WebP格式和懒加载
- **缓存策略**：静态资源长期缓存
- **压缩优化**：Gzip和Brotli压缩

### 后端优化
- **API缓存**：重复请求结果缓存
- **进程管理**：子进程隔离和超时控制
- **错误重试**：指数退避重试机制
- **内存管理**：及时清理临时文件

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

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 添加适当的注释
- 编写测试用例

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [DeepSeek](https://www.deepseek.com/) - AI文本生成
- [阿里云通义千问](https://tongyi.aliyun.com/) - AI图像生成

---

<div align="center">

**🚀 让AI为您的内容营销赋能！**

[开始使用](https://universal-persona-content-engine.vercel.app/) | [GitHub](https://github.com/LGXfufile/universal-persona-content-engine) | [问题反馈](https://github.com/LGXfufile/universal-persona-content-engine/issues)

Made with ❤️ by [LGXfufile](https://github.com/LGXfufile)

</div>