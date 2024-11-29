export default async function handler(req, res) {
  const xaiUrl = 'https://api.x.ai/v1'
  
  try {
    // 获取请求路径
    const path = req.url.replace('/api/proxy', '')
    const targetUrl = `${xaiUrl}${path}`

    // 获取请求体
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        // 如果不是JSON格式就保持原样
      }
    }

    // 设置headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-Forwarded-For': '8.8.8.8',
    }

    // 发送请求到xAI
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    // 获取响应
    const data = await response.text()
    
    // 设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')
    
    // 返回响应
    res.status(response.status).send(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
