from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_service import find_hooks

app = FastAPI(title="Clip Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptRequest(BaseModel):
    transcript: str
    count: int = 5


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/api/analyse")
def analyse(req: TranscriptRequest):
    if len(req.transcript.strip()) < 200:
        raise HTTPException(400, "Transcript too short to analyse")
    try:
        return {"clips": find_hooks(req.transcript, req.count)}
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")