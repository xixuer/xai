export default async function handler(req, res) {
  // 禁用默认的重定向处理
  const xaiUrl = 'https://api.x.ai/v1'
  
  try {
    // 获取完整的请求路径
    const fullPath = req.url.split('?')[0]
    const path = fullPath.replace('/api/proxy', '')
    const targetUrl = `${xaiUrl}${path}`
    
    console.log('Proxying request to:', targetUrl)  // 添加日志

    // 设置headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization,
      'Host': 'api.x.ai',
      'Origin': 'https://api.x.ai',
      'Referer': 'https://api.x.ai/',
    }

    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: 'manual',  // 手动处理重定向
      duplex: 'half',  // 处理流式响应
    }

    // 如果是POST请求，添加body
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify(req.body)
    }

    // 发送请求到xAI
    const response = await fetch(targetUrl, fetchOptions)
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')
    
    // 如果是OPTIONS请求，直接返回
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // 处理流式响应
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      const reader = response.body.getReader()
      const encoder = new TextEncoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
      res.end()
    } else {
      // 普通响应
      const data = await response.text()
      res.status(response.status).send(data)
    }
  } catch (error) {
    console.error('Proxy error:', error)  // 添加错误日志
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: error.message,
      stack: error.stack 
    })
  }
} 