# UPCE - 万能虚拟产品生成系统

## 🎯 项目简介

Universal Persona-Driven Content Engine (UPCE) 是一个基于AI的通用虚拟产品内容生成系统，能够根据任意用户角色描述，自动生成100篇爆文标题、完整文章内容和精美配图。

## ✨ 核心功能

- 🧠 **智能角色分析** - 深度解析目标人群的情绪、需求和痛点
- 📝 **批量内容生成** - 一键生成100篇SEO友好的原创文章
- 🎨 **自动配图生成** - 使用AI生成符合内容的精美配图
- 🔍 **智能去重检测** - 确保每篇内容的独特性
- 📊 **质量自动检测** - 全流程质检，确保输出质量
- 💰 **变现模型设计** - 自动设计四层产品变现体系

## 🚀 技术栈

- **前端**: Next.js 14, React 18, Tailwind CSS
- **后端**: Node.js, Express
- **AI服务**: DeepSeek API (文本生成), 阿里云通义万相 (图像生成)
- **部署**: Vercel + GitHub Actions (CICD)
- **样式**: 苹果风格设计，支持深色模式

## 📦 安装与运行

### 环境要求
- Node.js 18+
- npm 或 yarn

### 本地开发
```bash
# 克隆项目
git clone https://github.com/LGXfufile/universal-persona-content-engine.git
cd universal-persona-content-engine

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用

### 生产构建
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 🔧 配置说明

### 环境变量
创建 `.env.local` 文件：
```env
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 配置文件
- `content_os/config/image_rules.json` - 图片生成规则配置
- `system_prompt.md` - AI系统提示词配置

## 📁 项目结构

```
├── pages/                  # Next.js 页面
│   ├── api/               # API 路由
│   ├── index.js           # 主页面
│   └── _app.js            # 应用配置
├── src/
│   └── utils/             # 工具类
│       ├── ContentEngine.js    # 内容生成引擎
│       └── ImageGenerator.js   # 图片生成器
├── content_os/            # 内容操作系统
│   ├── config/           # 配置文件
│   ├── metadata/         # 元数据存储
│   └── outputs/          # 输出文件
├── styles/               # 样式文件
└── .github/workflows/    # GitHub Actions
```

## 🎨 设计理念

采用苹果官网风格的现代化设计：
- **极简主义** - 清晰的视觉层次，减少视觉噪音
- **毛玻璃效果** - 现代化的半透明界面元素
- **流畅动画** - 基于 Framer Motion 的自然过渡效果
- **深色模式优先** - 默认深色主题，护眼舒适
- **响应式设计** - 完美适配各种设备尺寸

## 🔄 CICD 流程

项目配置了完整的自动化部署流程：

1. **代码推送** → GitHub Repository
2. **自动构建** → GitHub Actions
3. **部署上线** → Vercel Platform
4. **域名访问** → 自动分配域名

每次推送到 main 分支都会自动触发部署。

## 📊 使用示例

### 输入示例
```
角色是：三线城市32岁健身教练，月入6000，想做线上私教
```

### 输出内容
- ✅ 100个爆文标题
- ✅ 100篇完整文章（含配图）
- ✅ 角色深度分析报告
- ✅ 关键词库和变现模型
- ✅ 质量检测报告

## 🛠️ 开发指南

### 添加新功能
1. 在 `src/utils/` 中创建新的工具类
2. 在 `pages/api/` 中添加对应的API路由
3. 更新前端界面以支持新功能

### 自定义配置
- 修改 `content_os/config/image_rules.json` 调整图片生成规则
- 编辑 `system_prompt.md` 优化AI提示词
- 调整 `tailwind.config.js` 自定义样式主题

## 🔒 安全说明

- API密钥通过环境变量安全存储
- 所有用户输入都经过验证和清理
- 图片生成包含内容安全检查
- 遵循最佳安全实践

## 📈 性能优化

- 使用 Next.js 静态生成优化首屏加载
- 图片懒加载和压缩优化
- API响应缓存机制
- 批量处理减少API调用次数

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- GitHub: [@LGXfufile](https://github.com/LGXfufile)
- 项目链接: [https://github.com/LGXfufile/universal-persona-content-engine](https://github.com/LGXfufile/universal-persona-content-engine)

---

⭐ 如果这个项目对你有帮助，请给个星标支持！