from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import httpx
from typing import List, Dict, Optional
from loguru import logger

router = APIRouter()

class Message(BaseModel):
    role: str
    content: List[Dict] | str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: bool = False
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=1, ge=0, le=1)
    max_tokens: Optional[int] = None

@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest, authorization: str = Header(...)):
    try:
        # 记录请求信息
        logger.info(f"Incoming request: {request.dict()}")
        
        headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "User-Agent": "vercel-proxy",
            "Accept": "application/json",
        }
        
        logger.info(f"Request headers: {headers}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                json=request.dict(exclude_none=True),
                headers=headers,
                timeout=60.0
            )
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {response.headers}")
            
            if response.status_code != 200:
                logger.error(f"Error response: {response.text}")
                return response.json()
            
            if request.stream:
                return StreamingResponse(
                    response.aiter_bytes(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                        "Content-Type": "text/event-stream"
                    }
                )
            else:
                return response.json()
                
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error: {str(e)}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=e.response.text
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Proxy Error",
                "message": str(e)
            }
        ) 