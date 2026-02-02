import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import { ContentGenerationRequest, ContentGenerationResponse, GenerationProgress } from '@/types'

export default function Home() {
  const [roleInput, setRoleInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ContentGenerationResponse | null>(null)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme) {
      setIsDark(theme === 'dark')
    }
    
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleInput.trim()) return

    setIsProcessing(true)
    setProgress(null)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleDescription: roleInput,
          titleCount: 100,
          articleCount: 3,
          imageCount: 4,
        } as ContentGenerationRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'progress') {
                setProgress(data.data)
              } else if (data.type === 'complete') {
                setResult(data.data)
                setIsProcessing(false)
              } else if (data.type === 'error') {
                setError(data.error)
                setIsProcessing(false)
              }
            } catch (e) {
              console.warn('解析SSE数据失败:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
      setError(error instanceof Error ? error.message : '生成过程中发生未知错误')
      setIsProcessing(false)
    }
  }

  const downloadResult = () => {
    if (!result) return
    
    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `upce-result-${result.roleId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <Head>
        <title>UPCE - 通用虚拟产品内容生成引擎</title>
        <meta name="description" content="基于AI的智能内容生成平台，为您的营销需求提供精准的个性化内容" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1" />
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
              whileHover={{ scale: 1.02 }}
            >
              UPCE
            </motion.h1>
            <div className="flex-1 flex justify-end">
              <motion.button
                onClick={toggleTheme}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isDark ? '🌙' : '☀️'}
              </motion.button>
            </div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            通用虚拟产品内容生成引擎 - 基于AI的智能内容创作平台
            <br />
            <span className="text-sm opacity-75">为您的营销需求提供精准的个性化内容解决方案</span>
          </motion.p>
        </motion.header>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-soft-lg border border-white/20 dark:border-gray-700/50 p-8 mb-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roleInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                目标用户画像描述
              </label>
              <motion.textarea
                id="roleInput"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="请详细描述您的目标用户群体，例如：25-35岁一线城市白领女性，关注健康生活方式，有一定消费能力..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isProcessing}
                whileFocus={{ scale: 1.01 }}
              />
            </div>

            <motion.button
              type="submit"
              disabled={!roleInput.trim() || isProcessing}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-soft transition-all duration-200 disabled:cursor-not-allowed"
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI正在创作中...</span>
                </div>
              ) : (
                '开始生成内容'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Progress Display */}
        <AnimatePresence>
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-soft-lg border border-white/20 dark:border-gray-700/50 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {progress.step}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progress.progress}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {progress.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center space-x-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                    生成失败
                  </h3>
                  <p className="text-red-600 dark:text-red-400 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Display */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-soft-lg border border-white/20 dark:border-gray-700/50 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  生成完成 ✨
                </h2>
                <motion.button
                  onClick={downloadResult}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  下载结果
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.titles?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">标题生成</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {result.articles?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">文章创作</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.images?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">配图生成</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <strong>输出路径:</strong> {result.outputPath}
                <br />
                <strong>角色ID:</strong> {result.roleId}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}