#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

class OutputViewer {
  constructor() {
    this.outputDir = path.join(__dirname, 'upce_output');
  }

  // 列出所有生成的项目
  async listProjects() {
    try {
      if (!await fs.pathExists(this.outputDir)) {
        console.log('❌ 输出目录不存在，请先运行UPCE生成内容');
        return [];
      }

      const projects = await fs.readdir(this.outputDir);
      const projectInfos = [];

      for (const projectDir of projects) {
        const projectPath = path.join(this.outputDir, projectDir);
        const statsPath = path.join(projectPath, 'generation_stats.json');
        
        if (await fs.pathExists(statsPath)) {
          const stats = await fs.readJson(statsPath);
          projectInfos.push({
            roleId: projectDir,
            ...stats,
            path: projectPath
          });
        }
      }

      return projectInfos.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    } catch (error) {
      console.error('❌ 读取项目列表失败:', error.message);
      return [];
    }
  }

  // 显示项目列表
  async showProjects() {
    console.log('📁 UPCE生成项目列表');
    console.log('='.repeat(60));

    const projects = await this.listProjects();

    if (projects.length === 0) {
      console.log('📭 暂无生成项目');
      console.log('\n💡 使用以下命令开始生成:');
      console.log('   node upce-demo.js "角色描述"');
      return;
    }

    projects.forEach((project, index) => {
      const date = new Date(project.generatedAt).toLocaleString('zh-CN');
      console.log(`\n${index + 1}. 📊 ${project.roleDescription}`);
      console.log(`   角色ID: ${project.roleId}`);
      console.log(`   生成时间: ${date}`);
      console.log(`   内容统计: ${project.statistics.titlesCount}标题 | ${project.statistics.articlesCount}文章 | ${project.statistics.imagesCount}配图`);
      console.log(`   总字数: ${project.statistics.totalWords.toLocaleString()}字`);
      console.log(`   输出路径: ${project.path}`);
    });

    console.log('\n🎯 快速访问命令:');
    console.log(`   查看最新项目: open "${projects[0].path}"`);
    console.log(`   查看所有项目: open "${this.outputDir}"`);
    console.log(`   查看项目详情: node view-output.js <项目编号>`);
  }

  // 显示特定项目详情
  async showProjectDetails(projectIndex) {
    const projects = await this.listProjects();
    
    if (projectIndex < 1 || projectIndex > projects.length) {
      console.log(`❌ 无效的项目编号，请选择 1-${projects.length}`);
      return;
    }

    const project = projects[projectIndex - 1];
    const projectPath = project.path;

    console.log(`📊 项目详情: ${project.roleDescription}`);
    console.log('='.repeat(60));

    // 显示基本信息
    console.log(`🎯 基本信息:`);
    console.log(`   角色ID: ${project.roleId}`);
    console.log(`   生成时间: ${new Date(project.generatedAt).toLocaleString('zh-CN')}`);
    console.log(`   输出路径: ${projectPath}`);

    // 显示统计信息
    console.log(`\n📊 内容统计:`);
    console.log(`   标题数量: ${project.statistics.titlesCount}`);
    console.log(`   文章数量: ${project.statistics.articlesCount}`);
    console.log(`   配图数量: ${project.statistics.imagesCount}`);
    console.log(`   总字数: ${project.statistics.totalWords.toLocaleString()}`);
    console.log(`   平均字数: ${project.statistics.avgWordsPerArticle}`);

    // 显示文件列表
    console.log(`\n📁 生成文件:`);
    const files = [
      { name: '📊 完整报告', file: 'complete_report.md', desc: '包含所有分析和内容的详细报告' },
      { name: '📋 角色分析', file: 'analysis_report.md', desc: '深度角色分析和变现模型' },
      { name: '📝 标题列表', file: 'titles.txt', desc: `${project.statistics.titlesCount}个爆文标题` },
      { name: '📚 文章目录', file: 'articles/', desc: `${project.statistics.articlesCount}篇原创文章` },
      { name: '🎨 配图方案', file: 'images/', desc: `${project.statistics.imagesCount}个配图提示词` },
      { name: '🚀 发布版本', file: 'publish_ready/', desc: '多平台优化版本' },
      { name: '📖 使用说明', file: 'README.md', desc: '详细使用指南' },
      { name: '📋 生成日志', file: 'generation.log', desc: '完整生成过程日志' }
    ];

    for (const fileInfo of files) {
      const filePath = path.join(projectPath, fileInfo.file);
      const exists = await fs.pathExists(filePath);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${fileInfo.name}: ${fileInfo.desc}`);
    }

    // 显示快速访问命令
    console.log(`\n🎯 快速访问命令:`);
    console.log(`   打开项目目录: open "${projectPath}"`);
    console.log(`   查看完整报告: open "${path.join(projectPath, 'complete_report.md')}"`);
    console.log(`   查看HTML报告: open "${path.join(projectPath, 'generation_report.html')}"`);
    console.log(`   查看生成日志: tail -f "${path.join(projectPath, 'generation.log')}"`);

    // 显示文章预览
    const articlesDir = path.join(projectPath, 'articles');
    if (await fs.pathExists(articlesDir)) {
      console.log(`\n📚 文章预览:`);
      const articleFiles = await fs.readdir(articlesDir);
      
      for (let i = 0; i < Math.min(articleFiles.length, 3); i++) {
        const articlePath = path.join(articlesDir, articleFiles[i]);
        const content = await fs.readFile(articlePath, 'utf8');
        const title = content.split('\n')[0].replace('# ', '');
        const wordCount = content.replace(/!\[.*?\]\(.*?\)/g, '').length;
        
        console.log(`   ${i + 1}. ${title} (${wordCount}字)`);
      }
      
      if (articleFiles.length > 3) {
        console.log(`   ... 还有 ${articleFiles.length - 3} 篇文章`);
      }
    }

    // 显示配图信息
    const imagesDir = path.join(projectPath, 'images');
    if (await fs.pathExists(imagesDir)) {
      const imageFiles = await fs.readdir(imagesDir);
      const infoFiles = imageFiles.filter(f => f.endsWith('.info.json'));
      
      if (infoFiles.length > 0) {
        console.log(`\n🎨 配图信息:`);
        console.log(`   配图数量: ${infoFiles.length}`);
        console.log(`   提示词文件: image_prompts.json`);
        console.log(`   配图状态: 待生成（需要AI工具）`);
      }
    }
  }

  // 打开项目目录
  async openProject(projectIndex) {
    const projects = await this.listProjects();
    
    if (projectIndex < 1 || projectIndex > projects.length) {
      console.log(`❌ 无效的项目编号，请选择 1-${projects.length}`);
      return;
    }

    const project = projects[projectIndex - 1];
    const { exec } = require('child_process');
    
    console.log(`📁 正在打开项目: ${project.roleDescription}`);
    exec(`open "${project.path}"`);
  }

  // 清理旧项目
  async cleanOldProjects(keepCount = 5) {
    const projects = await this.listProjects();
    
    if (projects.length <= keepCount) {
      console.log(`📁 当前有 ${projects.length} 个项目，无需清理`);
      return;
    }

    const toDelete = projects.slice(keepCount);
    console.log(`🗑️  准备清理 ${toDelete.length} 个旧项目，保留最新的 ${keepCount} 个`);

    for (const project of toDelete) {
      try {
        await fs.remove(project.path);
        console.log(`✅ 已删除: ${project.roleId}`);
      } catch (error) {
        console.log(`❌ 删除失败: ${project.roleId} - ${error.message}`);
      }
    }

    console.log(`✅ 清理完成，当前保留 ${keepCount} 个最新项目`);
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const viewer = new OutputViewer();

  if (args.length === 0) {
    await viewer.showProjects();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'list':
    case 'ls':
      await viewer.showProjects();
      break;
      
    case 'show':
    case 'view':
      const projectIndex = parseInt(args[1]);
      if (isNaN(projectIndex)) {
        console.log('使用方法: node view-output.js show <项目编号>');
        console.log('示例: node view-output.js show 1');
      } else {
        await viewer.showProjectDetails(projectIndex);
      }
      break;
      
    case 'open':
      const openIndex = parseInt(args[1]);
      if (isNaN(openIndex)) {
        console.log('使用方法: node view-output.js open <项目编号>');
        console.log('示例: node view-output.js open 1');
      } else {
        await viewer.openProject(openIndex);
      }
      break;
      
    case 'clean':
      const keepCount = parseInt(args[1]) || 5;
      await viewer.cleanOldProjects(keepCount);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('📁 UPCE输出查看工具');
      console.log('');
      console.log('使用方法:');
      console.log('  node view-output.js              # 显示所有项目');
      console.log('  node view-output.js list         # 显示所有项目');
      console.log('  node view-output.js show <编号>  # 显示项目详情');
      console.log('  node view-output.js open <编号>  # 打开项目目录');
      console.log('  node view-output.js clean [数量] # 清理旧项目，保留指定数量');
      console.log('');
      console.log('示例:');
      console.log('  node view-output.js show 1       # 查看第1个项目详情');
      console.log('  node view-output.js open 1       # 打开第1个项目目录');
      console.log('  node view-output.js clean 3      # 只保留最新3个项目');
      break;
      
    default:
      console.log(`❌ 未知命令: ${command}`);
      console.log('使用 node view-output.js help 查看帮助');
  }
}

if (require.main === module) {
  main();
}

module.exports = OutputViewer;