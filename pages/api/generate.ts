import { NextApiRequest, NextApiResponse } from 'next';
import { ContentGenerationRequest, ContentGenerationResponse, GenerationProgress, APIResponse, RoleAnalysis } from '@/types';
import path from 'path';
import { spawn } from 'child_process';

// 存储生成进度的内存缓存
const progressCache = new Map<string, GenerationProgress>();
const resultCache = new Map<string, ContentGenerationResponse>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { roleDescription, titleCount = 100, articleCount = 3, imageCount = 4 }: ContentGenerationRequest = req.body;

  if (!roleDescription?.trim()) {
    return res.status(400).json({ success: false, error: '角色描述不能为空' });
  }

  try {
    // 生成任务ID
    const taskId = generateTaskId(roleDescription);
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // 发送进度更新函数
    const sendProgress = (progress: GenerationProgress) => {
      progressCache.set(taskId, progress);
      res.write(`data: ${JSON.stringify({ type: 'progress', data: progress })}\n\n`);
    };

    // 发送完成结果函数
    const sendResult = (result: ContentGenerationResponse) => {
      resultCache.set(taskId, result);
      res.write(`data: ${JSON.stringify({ type: 'complete', data: result })}\n\n`);
      res.end();
    };

    // 发送错误函数
    const sendError = (error: string) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
      res.end();
    };

    // 开始内容生成流程
    await generateContentStream(roleDescription, { titleCount, articleCount, imageCount }, sendProgress, sendResult, sendError);

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '内容生成失败' 
    });
  }
}

async function generateContentStream(
  roleDescription: string,
  config: { titleCount: number; articleCount: number; imageCount: number },
  onProgress: (progress: GenerationProgress) => void,
  onComplete: (result: ContentGenerationResponse) => void,
  onError: (error: string) => void
) {
  try {
    // 集成真实的UPCE引擎
    const projectRoot = process.cwd();
    const upceScript = path.join(projectRoot, 'upce-quick.js');
    
    // 生成任务ID
    const taskId = generateTaskId(roleDescription);
    
    return new Promise((resolve, reject) => {
      // 启动UPCE进程
      const upceProcess = spawn('node', [upceScript, roleDescription], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DEEPSEEK_API_KEY: 'sk-71cc3aad8fad44c8970dd549933d3573'
        }
      });

      let outputBuffer = '';
      let errorBuffer = '';
      let currentStep = '';
      let progress = 0;

      // 监听标准输出
      upceProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        
        // 解析进度信息
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.includes('开始分析角色')) {
            currentStep = '角色深度分析';
            progress = 10;
            onProgress({ step: currentStep, progress, message: '正在深度分析用户画像特征...' });
          } else if (line.includes('开始生成标题')) {
            currentStep = '生成内容标题';
            progress = 30;
            onProgress({ step: currentStep, progress, message: '正在生成高质量标题库...' });
          } else if (line.includes('开始生成文章')) {
            currentStep = '创建文章内容';
            progress = 60;
            onProgress({ step: currentStep, progress, message: '正在创作个性化文章内容...' });
          } else if (line.includes('开始生成图片')) {
            currentStep = '生成配图';
            progress = 80;
            onProgress({ step: currentStep, progress, message: '正在生成精美配图...' });
          } else if (line.includes('导出完成')) {
            currentStep = '保存输出文件';
            progress = 100;
            onProgress({ step: currentStep, progress, message: '正在保存完整输出文件...' });
          }
        }
      });

      // 监听标准错误
      upceProcess.stderr?.on('data', (data) => {
        errorBuffer += data.toString();
      });

      // 进程结束处理
      upceProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            // 解析UPCE输出结果
            const result = await parseUPCEOutput(outputBuffer, projectRoot);
            onComplete(result);
            resolve(result);
          } catch (parseError) {
            const error = `解析UPCE输出失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`;
            onError(error);
            reject(new Error(error));
          }
        } else {
          const error = `UPCE进程异常退出 (代码: ${code}): ${errorBuffer}`;
          onError(error);
          reject(new Error(error));
        }
      });

      // 进程错误处理
      upceProcess.on('error', (error) => {
        const errorMsg = `启动UPCE进程失败: ${error.message}`;
        onError(errorMsg);
        reject(new Error(errorMsg));
      });

      // 设置超时
      setTimeout(() => {
        if (!upceProcess.killed) {
          upceProcess.kill();
          const timeoutError = 'UPCE生成超时，请稍后重试';
          onError(timeoutError);
          reject(new Error(timeoutError));
        }
      }, 300000); // 5分钟超时
    });

  } catch (error) {
    console.error('Generation stream error:', error);
    onError(error instanceof Error ? error.message : '生成过程中发生错误');
  }
}

function generateTaskId(roleDescription: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(roleDescription + Date.now()).digest('hex').substring(0, 8);
}

function getProgressByStep(step: string): number {
  const stepProgress: Record<string, number> = {
    '角色深度分析': 10,
    '生成内容标题': 25,
    '创建文章内容': 45,
    '生成配图': 70,
    '质检与优化': 85,
    '保存输出文件': 95,
  };
  
  return stepProgress[step] || 0;
}

// 获取任务进度的API端点
export async function getProgress(taskId: string) {
  return progressCache.get(taskId);
}

// 获取任务结果的API端点
export async function getResult(taskId: string) {
  return resultCache.get(taskId);
}

// 解析UPCE输出结果
async function parseUPCEOutput(outputBuffer: string, projectRoot: string): Promise<ContentGenerationResponse> {
  const fs = require('fs').promises;
  
  try {
    // 从输出中提取角色ID和输出路径 - 修复正则表达式
    const roleIdMatch = outputBuffer.match(/角色ID[：:\s]*([a-zA-Z0-9_]+)/);
    const pathMatch = outputBuffer.match(/输出目录[：:\s]*([^\n\r]+)/);
    
    // 如果无法从输出中提取，尝试从最新的输出目录获取
    let roleId = '';
    let outputPath = '';
    
    if (roleIdMatch && pathMatch) {
      roleId = roleIdMatch[1];
      outputPath = pathMatch[1].trim();
    } else {
      // 尝试从upce_output目录找到最新的role目录
      const upceOutputDir = path.join(projectRoot, 'upce_output');
      try {
        const dirs = await fs.readdir(upceOutputDir);
        const roleDirs = dirs.filter((dir: string) => dir.startsWith('role_'));
        if (roleDirs.length > 0) {
          // 按修改时间排序，获取最新的
          const stats = await Promise.all(
            roleDirs.map(async (dir: string) => {
              const stat = await fs.stat(path.join(upceOutputDir, dir));
              return { dir, mtime: stat.mtime };
            })
          );
          stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
          roleId = stats[0].dir;
          outputPath = path.join('upce_output', roleId);
        }
      } catch (e) {
        console.warn('无法读取upce_output目录:', e);
      }
    }
    
    if (!roleId) {
      throw new Error('无法确定角色ID和输出路径');
    }
    
    const fullOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(projectRoot, outputPath);
    
    // 读取分析报告
    let analysis: RoleAnalysis = {
      demographics: {
        age: '',
        gender: '',
        location: '',
        income: '',
        education: ''
      },
      psychographics: {
        values: [],
        interests: [],
        lifestyle: [],
        personality: []
      },
      painPoints: [],
      goals: [],
      contentPreferences: {
        platforms: [],
        formats: [],
        tone: '',
        topics: []
      },
      marketingInsights: {
        triggers: [],
        objections: [],
        solutions: []
      }
    };
    
    try {
      const analysisPath = path.join(fullOutputPath, 'analysis_report.md');
      const analysisContent = await fs.readFile(analysisPath, 'utf-8');
      analysis = { ...analysis, ...parseAnalysisReport(analysisContent) };
    } catch (e) {
      console.warn('无法读取分析报告:', e);
    }
    
    // 读取标题列表
    let titles: string[] = [];
    try {
      const titlesPath = path.join(fullOutputPath, 'titles.txt');
      const titlesContent = await fs.readFile(titlesPath, 'utf-8');
      titles = titlesContent.split('\n').filter((line: string) => line.trim()).slice(0, 100);
    } catch (e) {
      console.warn('无法读取标题文件:', e);
    }
    
    // 读取文章列表
    let articles: any[] = [];
    try {
      const articlesDir = path.join(fullOutputPath, 'articles');
      const articleFiles = await fs.readdir(articlesDir);
      
      for (const file of articleFiles.filter((f: string) => f.endsWith('.md'))) {
        const articlePath = path.join(articlesDir, file);
        const content = await fs.readFile(articlePath, 'utf-8');
        const title = content.split('\n')[0].replace(/^#\s*/, '');
        
        articles.push({
          id: file.replace('.md', ''),
          title: title || file,
          content: content,
          platform: 'xiaohongshu',
          tags: ['AI生成', '营销内容'],
          imagePrompts: []
        });
      }
    } catch (e) {
      console.warn('无法读取文章文件:', e);
    }
    
    // 读取图片信息
    let images: any[] = [];
    try {
      const imagesDir = path.join(fullOutputPath, 'images');
      const imageFiles = await fs.readdir(imagesDir);
      
      for (const file of imageFiles.filter((f: string) => f.endsWith('.info.json'))) {
        const imagePath = path.join(imagesDir, file);
        const imageInfo = JSON.parse(await fs.readFile(imagePath, 'utf-8'));
        
        images.push({
          id: file.replace('.info.json', ''),
          prompt: imageInfo.prompt || '配图',
          status: 'completed'
        });
      }
    } catch (e) {
      console.warn('无法读取图片信息:', e);
    }
    
    return {
      roleId,
      analysis,
      titles,
      articles,
      images,
      outputPath: outputPath.replace(projectRoot, '').replace(/^\//, '')
    };
    
  } catch (error) {
    throw new Error(`解析UPCE输出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 解析分析报告内容
function parseAnalysisReport(content: string): any {
  try {
    // 简单的Markdown解析，提取关键信息
    const sections = content.split('##').slice(1);
    const analysis: any = {
      demographics: {},
      psychographics: {},
      painPoints: [],
      goals: [],
      contentPreferences: {},
      marketingInsights: {}
    };
    
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const title = lines[0].trim();
      const sectionContent = lines.slice(1).join('\n');
      
      if (title.includes('人口统计')) {
        analysis.demographics = extractKeyValuePairs(sectionContent);
      } else if (title.includes('心理特征')) {
        analysis.psychographics = extractKeyValuePairs(sectionContent);
      } else if (title.includes('痛点')) {
        analysis.painPoints = extractListItems(sectionContent);
      } else if (title.includes('目标')) {
        analysis.goals = extractListItems(sectionContent);
      } else if (title.includes('内容偏好')) {
        analysis.contentPreferences = extractKeyValuePairs(sectionContent);
      } else if (title.includes('营销洞察')) {
        analysis.marketingInsights = extractKeyValuePairs(sectionContent);
      }
    }
    
    return analysis;
  } catch (error) {
    console.warn('解析分析报告失败:', error);
    return {};
  }
}

// 提取键值对
function extractKeyValuePairs(content: string): any {
  const result: any = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/[-*]\s*([^：:]+)[：:]\s*(.+)/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      result[key] = value;
    }
  }
  
  return result;
}

// 提取列表项
function extractListItems(content: string): string[] {
  const lines = content.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    const match = line.match(/[-*]\s*(.+)/);
    if (match) {
      items.push(match[1].trim());
    }
  }
  
  return items;
}