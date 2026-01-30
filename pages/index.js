import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const [roleInput, setRoleInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // 检查主题设置
    const theme = localStorage.getItem('theme')
    if (theme) {
      setIsDark(theme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roleInput.trim()) return

    setIsProcessing(true)
    setProgress(0)
    setResult(null)

    try {
      // 模拟处理步骤
      const steps = [
        { name: '角色分析中...', duration: 2000 },
        { name: '生成关键词...', duration: 1500 },
        { name: '创建标题库...', duration: 3000 },
        { name: '生成文章内容...', duration: 5000 },
        { name: '生成配图...', duration: 4000 },
        { name: '质检与优化...', duration: 2000 },
        { name: '保存输出文件...', duration: 1000 }
      ]

      let currentProgress = 0
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].name)
        
        // 模拟进度更新
        const stepProgress = 100 / steps.length
        const startProgress = currentProgress
        const endProgress = currentProgress + stepProgress
        
        const startTime = Date.now()
        while (Date.now() - startTime < steps[i].duration) {
          const elapsed = Date.now() - startTime
          const stepPercent = elapsed / steps[i].duration
          setProgress(startProgress + (stepPercent * stepProgress))
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        currentProgress = endProgress
        setProgress(currentProgress)
      }

      // 模拟API调用结果
      const mockResult = {
        roleId: 'mom_40_town_abc123',
        titlesCount: 100,
        articlesCount: 100,
        outputPath: 'content_os/outputs/mom_40_town_abc123',
        successRate: '95%',
        processingTime: '18分32秒'
      }

      setResult(mockResult)
      setCurrentStep('处理完成！')
      setProgress(100)

    } catch (error) {
      console.error('处理失败:', error)
      setCurrentStep('处理失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadResults = () => {
    // 模拟下载功能
    alert('下载功能开发中...')
  }

  return (
    <>
      <Head>
        <title>UPCE - 万能虚拟产品生成系统</title>
        <meta name="description" content="通用虚拟产品内容生成系统，一键生成100篇爆文" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* 导航栏 */}
        <nav className="glass-effect sticky top-0 z-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">U</span>
                </div>
                <h1 className="text-xl font-bold gradient-text">UPCE</h1>
              </div>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDark ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 标题区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              万能虚拟产品
              <span className="gradient-text block">内容生成系统</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-balance">
              输入任意角色描述，自动生成100篇爆文标题、完整文章内容和精美配图
            </p>
          </motion.div>

          {/* 输入表单 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card mb-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  角色描述
                </label>
                <textarea
                  id="role"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  placeholder="例如：三线城市32岁健身教练，月入6000，想做线上私教"
                  className="input-field h-32 resize-none"
                  disabled={isProcessing}
                />
              </div>
              
              <button
                type="submit"
                disabled={isProcessing || !roleInput.trim()}
                className="button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessing ? '处理中...' : '开始生成内容'}
              </button>
            </form>
          </motion.div>

          {/* 处理进度 */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card mb-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      处理进度
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentStep}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 结果展示 */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      生成完成 🎉
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>成功率 {result.successRate}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {result.titlesCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        标题数量
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {result.articlesCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        文章数量
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        400+
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        配图数量
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {result.processingTime}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        处理时间
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      输出路径
                    </h4>
                    <code className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded">
                      {result.outputPath}
                    </code>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={downloadResults}
                      className="button-primary flex-1"
                    >
                      📥 下载全部文件
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="button-secondary"
                    >
                      重新生成
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 功能特性 */}
          {!isProcessing && !result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-3 gap-6 mt-12"
            >
              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  精准定位
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  深度分析目标人群，识别真实需求和痛点
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  全自动化
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  一键生成标题、文章、配图，无需人工干预
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  智能去重
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  自动检测重复内容，确保每篇文章独特性
                </p>
              </div>
            </motion.div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>© 2026 UPCE - Universal Persona-Driven Content Engine</p>
              <p className="mt-1">Powered by AI • Built with ❤️</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}