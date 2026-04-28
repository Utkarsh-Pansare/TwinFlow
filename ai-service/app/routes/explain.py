import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import google.generativeai as genai

router = APIRouter()

class ExplainRequest(BaseModel):
    route: List[str]
    score: float
    legs_summary: Dict[str, Any] = None

@router.post("/stream")
async def explain_route_stream(req: ExplainRequest):
    """Stream Gemini explanation token by token."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback if no API key
        async def fallback_stream():
            yield f"data: Route {' → '.join(req.route)} selected with resilience {req.score}%.\n\n"
        return StreamingResponse(fallback_stream(), media_type="text/event-stream")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    legs_info = ""
    if req.legs_summary:
        legs_info = f"\nRoute details: {req.legs_summary.get('leg_count', 0)} legs, ~{req.legs_summary.get('total_hours', 0)}h, ~{req.legs_summary.get('total_km', 0)} km."

    prompt = f"""You are a logistics AI. Explain why this route was chosen in a single concise paragraph:
Route: {' → '.join(req.route)}
Resilience Score: {req.score}%{legs_info}

Keep it professional and highlight the key strengths."""

    async def generate_stream():
        try:
            # We use synchronous generate_content with stream=True because 
            # google-generativeai async stream support can be tricky depending on the version.
            # But the SDK supports generating an iterator.
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                # SSE format requires "data: <content>\n\n"
                # If there are newlines in the text, SSE requires each line to start with "data: " 
                # or we can simply replace newlines to keep it in one data block, or format correctly.
                text = chunk.text.replace("\n", " ")
                yield f"data: {text}\n\n"
            
            # Send a completion event (optional, but good for the client to know)
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: Error generating explanation: {e}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate_stream(), media_type="text/event-stream")
