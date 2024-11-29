export default async function handler(req, res) {
    const xaiUrl = 'https://api.x.ai/v1'
    
    try {
      // 获取实际路径并打印请求信息
      const path = req.url.split('/v1')[1] || ''
      const targetUrl = `${xaiUrl}${path}`
      
      console.log('Request URL:', req.url)
      console.log('Target URL:', targetUrl)
      console.log('Method:', req.method)
      console.log('Headers:', req.headers)
  
      // 设置更完整的headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'User-Agent': 'vercel-proxy',
        'X-Forwarded-For': '8.8.8.8',
        'CF-IPCountry': 'US',
      }
  
      const fetchOptions = {
        method: req.method,
        headers: headers,
        redirect: 'follow',
      }
  
      // 处理POST请求体
      if (req.method === 'POST') {
        const body = req.body
        console.log('Request body:', body)
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
      }
  
      // 发送请求并记录响应
      console.log('Sending request with options:', fetchOptions)
      const response = await fetch(targetUrl, fetchOptions)
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
  
      // 设置CORS头
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, *')
      
      // 处理OPTIONS请求
      if (req.method === 'OPTIONS') {
        return res.status(200).end()
      }
  
      // 处理流式响应
      const contentType = response.headers.get('content-type')
      console.log('Content-Type:', contentType)
  
      if (contentType?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        
        const reader = response.body.getReader()
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
            console.log('Streaming chunk:', new TextDecoder().decode(value))
          }
        } catch (streamError) {
          console.error('Streaming error:', streamError)
        } finally {
          reader.releaseLock()
          res.end()
        }
      } else {
        // 处理普通响应
        const data = await response.text()
        console.log('Response data:', data)
        
        // 复制原始响应的状态码
        res.status(response.status)
        
        // 尝试解析JSON
        try {
          const jsonData = JSON.parse(data)
          res.json(jsonData)
        } catch {
          res.send(data)
        }
      }
    } catch (error) {
      console.error('Proxy error:', error)
      // 返回详细的错误信息
      res.status(500).json({ 
        error: 'Proxy Error', 
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
      })
    }
  } 