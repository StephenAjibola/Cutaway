import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT_TEMPLATE = """You are an expert short-form video editor. Analyse this transcript and identify the {count} strongest moments to cut into standalone short clips for TikTok, Reels, or Shorts.

A strong moment is one that:
- Opens with a hook that stops someone scrolling
- Makes a complete point on its own, without needing surrounding context
- Runs roughly 20-60 seconds when spoken
- Contains something surprising, useful, emotional, or contrarian

Transcript:
{transcript}

Respond with ONLY a valid JSON array. No markdown, no code fences, no explanation. Each object must have exactly these keys:
- "start": the opening words of the clip, quoted verbatim from the transcript
- "end": the closing words of the clip, quoted verbatim from the transcript
- "title": a short punchy title for the clip (under 60 characters)
- "caption": a social caption for the post (1-2 sentences)
- "reason": why this moment works as a short clip (1 sentence)
- "score": a number 1-10 rating its short-form potential
"""


def find_hooks(transcript: str, count: int = 5):
    prompt = PROMPT_TEMPLATE.format(transcript=transcript, count=count)
    response = client.models.generate_content(
    model="gemini-flash-lite-latest",
    contents=prompt
)
    raw = response.text.strip()

    # Models sometimes wrap JSON in code fences despite instructions
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)