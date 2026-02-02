const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor(outputDir, roleId) {
    this.outputDir = outputDir;
    this.roleId = roleId;
    this.logFile = path.join(outputDir, 'generation.log');
    this.startTime = Date.now();
    
    // 确保日志目录存在
    fs.ensureDirSync(outputDir);
    
    // 初始化日志文件
    this.log('INFO', '='.repeat(60));
    this.log('INFO', `UPCE内容生成日志 - ${new Date().toLocaleString('zh-CN')}`);
    this.log('INFO', `角色ID: ${roleId}`);
    this.log('INFO', `输出目录: ${outputDir}`);
    this.log('INFO', '='.repeat(60));
  }

  log(level, message, data = null) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    let logEntry = `[${timestamp}] [${elapsed}s] [${level}] ${message}`;
    
    if (data) {
      logEntry += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    // 写入文件
    fs.appendFileSync(this.logFile, logEntry + '\n');
    
    // 同时输出到控制台（根据级别使用不同颜色）
    const colors = {
      'INFO': '\x1b[36m',    // 青色
      'SUCCESS': '\x1b[32m', // 绿色
      'WARNING': '\x1b[33m', // 黄色
      'ERROR': '\x1b[31m',   // 红色
      'PROGRESS': '\x1b[35m' // 紫色
    };
    
    const color = colors[level] || '\x1b[0m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${logEntry}${reset}`);
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  success(message, data = null) {
    this.log('SUCCESS', message, data);
  }

  warning(message, data = null) {
    this.log('WARNING', message, data);
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  progress(message, current = null, total = null) {
    let progressMsg = message;
    if (current !== null && total !== null) {
      const percent = ((current / total) * 100).toFixed(1);
      progressMsg += ` (${current}/${total} - ${percent}%)`;
    }
    this.log('PROGRESS', progressMsg);
  }

  // 记录步骤开始
  stepStart(stepName, description = '') {
    this.log('INFO', `🚀 开始步骤: ${stepName}`, { description });
  }

  // 记录步骤完成
  stepComplete(stepName, result = null) {
    this.log('SUCCESS', `✅ 完成步骤: ${stepName}`, result);
  }

  // 记录步骤失败
  stepFailed(stepName, error) {
    this.log('ERROR', `❌ 步骤失败: ${stepName}`, { error: error.message, stack: error.stack });
  }

  // 记录API调用
  apiCall(apiName, url, params = null) {
    this.log('INFO', `📡 API调用: ${apiName}`, { url, params });
  }

  // 记录API响应
  apiResponse(apiName, success, responseData = null) {
    if (success) {
      this.log('SUCCESS', `✅ API成功: ${apiName}`, responseData);
    } else {
      this.log('ERROR', `❌ API失败: ${apiName}`, responseData);
    }
  }

  // 记录文件操作
  fileOperation(operation, filePath, result = null) {
    this.log('INFO', `📁 文件操作: ${operation} - ${path.basename(filePath)}`, { filePath, result });
  }

  // 生成最终报告
  generateFinalReport(stats) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    this.log('INFO', '='.repeat(60));
    this.log('SUCCESS', '🎉 内容生成完成！');
    this.log('INFO', `总耗时: ${duration}秒`);
    this.log('INFO', '生成统计:', stats);
    this.log('INFO', '='.repeat(60));
    
    // 生成HTML格式的日志报告
    this.generateHTMLReport(stats, duration);
  }

  // 生成HTML格式的日志报告
  generateHTMLReport(stats, duration) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UPCE生成报告 - ${this.roleId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f7; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 2.5em; font-weight: 700; color: #1d1d1f; margin-bottom: 10px; }
        .subtitle { font-size: 1.2em; color: #86868b; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .section { margin: 30px 0; }
        .section-title { font-size: 1.5em; font-weight: 600; color: #1d1d1f; margin-bottom: 15px; border-bottom: 2px solid #f5f5f7; padding-bottom: 10px; }
        .file-list { background: #f9f9f9; border-radius: 8px; padding: 20px; }
        .file-item { display: flex; justify-content: between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e5e7; }
        .file-item:last-child { border-bottom: none; }
        .file-name { font-weight: 500; color: #1d1d1f; }
        .file-path { font-size: 0.9em; color: #86868b; font-family: monospace; }
        .btn { display: inline-block; padding: 12px 24px; background: #0071e3; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 5px; }
        .btn:hover { background: #0077ed; }
        .timestamp { text-align: center; color: #86868b; font-size: 0.9em; margin-top: 30px; }
        .log-preview { background: #1d1d1f; color: #f5f5f7; padding: 20px; border-radius: 8px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.9em; max-height: 300px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🎉 UPCE生成报告</h1>
            <p class="subtitle">角色ID: ${this.roleId}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.statistics?.titlesCount || 0}</div>
                <div class="stat-label">爆文标题</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.statistics?.articlesCount || 0}</div>
                <div class="stat-label">原创文章</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.statistics?.imagesCount || 0}</div>
                <div class="stat-label">配图方案</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${duration}s</div>
                <div class="stat-label">生成耗时</div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">📁 生成文件</h2>
            <div class="file-list">
                <div class="file-item">
                    <div>
                        <div class="file-name">📊 完整报告</div>
                        <div class="file-path">complete_report.md</div>
                    </div>
                </div>
                <div class="file-item">
                    <div>
                        <div class="file-name">📝 标题列表</div>
                        <div class="file-path">titles.txt</div>
                    </div>
                </div>
                <div class="file-item">
                    <div>
                        <div class="file-name">📚 文章目录</div>
                        <div class="file-path">articles/</div>
                    </div>
                </div>
                <div class="file-item">
                    <div>
                        <div class="file-name">🎨 配图方案</div>
                        <div class="file-path">images/</div>
                    </div>
                </div>
                <div class="file-item">
                    <div>
                        <div class="file-name">🚀 发布版本</div>
                        <div class="file-path">publish_ready/</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">🎯 快速访问</h2>
            <a href="file://${this.outputDir}" class="btn">📁 打开输出目录</a>
            <a href="file://${path.join(this.outputDir, 'complete_report.md')}" class="btn">📊 查看完整报告</a>
            <a href="file://${path.join(this.outputDir, 'README.md')}" class="btn">📖 使用说明</a>
        </div>

        <div class="section">
            <h2 class="section-title">📋 生成日志预览</h2>
            <div class="log-preview" id="logPreview">
                正在加载日志...
            </div>
        </div>

        <div class="timestamp">
            生成时间: ${new Date().toLocaleString('zh-CN')} | 
            输出目录: ${this.outputDir}
        </div>
    </div>

    <script>
        // 加载日志内容
        fetch('generation.log')
            .then(response => response.text())
            .then(data => {
                const logPreview = document.getElementById('logPreview');
                const lines = data.split('\\n').slice(-20); // 显示最后20行
                logPreview.textContent = lines.join('\\n');
            })
            .catch(error => {
                document.getElementById('logPreview').textContent = '日志加载失败: ' + error.message;
            });
    </script>
</body>
</html>`;

    const htmlPath = path.join(this.outputDir, 'generation_report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    this.log('SUCCESS', `📄 HTML报告已生成: ${htmlPath}`);
  }

  // 显示输出路径信息
  showOutputPaths() {
    this.log('INFO', '📁 输出文件路径信息:');
    this.log('INFO', `   主目录: ${this.outputDir}`);
    this.log('INFO', `   完整报告: ${path.join(this.outputDir, 'complete_report.md')}`);
    this.log('INFO', `   HTML报告: ${path.join(this.outputDir, 'generation_report.html')}`);
    this.log('INFO', `   文章目录: ${path.join(this.outputDir, 'articles')}`);
    this.log('INFO', `   配图目录: ${path.join(this.outputDir, 'images')}`);
    this.log('INFO', `   发布版本: ${path.join(this.outputDir, 'publish_ready')}`);
    this.log('INFO', `   生成日志: ${this.logFile}`);
    
    console.log('\n🎯 快速访问命令:');
    console.log(`   打开目录: open "${this.outputDir}"`);
    console.log(`   查看报告: open "${path.join(this.outputDir, 'generation_report.html')}"`);
    console.log(`   查看日志: tail -f "${this.logFile}"`);
  }
}

module.exports = Logger;