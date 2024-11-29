from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
from typing import List, Dict, Optional

router = APIRouter()

class Message(BaseModel):
    role: str
    content: List[Dict] | str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: bool = False
    temperature: float = 0.7
    max_tokens: Optional[int] = None

@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest, authorization: str = Header(...)):
    headers = {
        "Authorization": authorization,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                json=request.dict(exclude_none=True),
                headers=headers
            )
            
            if request.stream:
                return StreamingResponse(
                    response.aiter_bytes(),
                    media_type="text/event-stream"
                )
            else:
                return response.json()
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 