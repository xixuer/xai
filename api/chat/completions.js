export default async function handler(req, res) {
    const xaiUrl = 'https://api.x.ai/v1/chat/completions'  // 直接指向完整的目标URL
    
    try {
      console.log('Request URL:', req.url)
      console.log('Target URL:', xaiUrl)
      console.log('Method:', req.method)
      console.log('Headers:', req.headers)
  
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'User-Agent': 'Mozilla/5.0',
        'X-Forwarded-For': '8.8.8.8',
        'CF-IPCountry': 'US',
      }
  
      const fetchOptions = {
        method: req.method,
        headers: headers,
        redirect: 'follow',
      }
  
      if (req.method === 'POST') {
        const body = req.body
        console.log('Request body:', body)
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
      }
  
      console.log('Sending request with options:', fetchOptions)
      const response = await fetch(xaiUrl, fetchOptions)
      
      // 设置CORS头
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', '*')
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end()
      }
  
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        
        const reader = response.body.getReader()
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
        } finally {
          reader.releaseLock()
          res.end()
        }
      } else {
        const data = await response.text()
        res.status(response.status).send(data)
      }
    } catch (error) {
      console.error('Proxy error:', error)
      res.status(500).json({ 
        error: 'Proxy Error', 
        message: error.message,
        stack: error.stack,
      })
    }
} 