import os
import json
import time
import re
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.aicredits.in/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3-8b-instruct")

MAX_RETRIES = 8
BASE_DELAY = 2.0


def call_llm(
    system_prompt: str,
    user_prompt: str,
    expect_json: bool = False,
    max_tokens: int = 2048,
    temperature: float = 0.3,
) -> str:
    """
    Call the LLM with exponential backoff and JSON-mode fallback.
    Returns raw string response.
    """
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    if expect_json:
        payload["response_format"] = {"type": "json_object"}

    for attempt in range(MAX_RETRIES):
        try:
            response = httpx.post(
                f"{LLM_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0,
            )

            if response.status_code == 429:
                wait = BASE_DELAY * (2 ** attempt)
                print(f"[LLM] Rate limited. Waiting {wait}s (attempt {attempt + 1})")
                time.sleep(wait)
                continue

            if response.status_code == 400 and expect_json:
                # Provider doesn't support json_object mode — retry without it
                payload.pop("response_format", None)
                continue

            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

        except httpx.HTTPStatusError as e:
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(BASE_DELAY * (2 ** attempt))
        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(BASE_DELAY)

    raise RuntimeError("LLM call failed after all retries")


def parse_json_response(raw: str) -> dict | list:
    """
    Multi-strategy JSON parser — tries 4 strategies before raising.
    Strategy 1: Direct parse
    Strategy 2: Extract from markdown ```json blocks
    Strategy 3: Brace matching (find first { ... })
    Strategy 4: Bracket matching (find first [ ... ])
    """
    # Strategy 1: Direct
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Markdown block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Strategy 3: Brace match
    brace_match = re.search(r"\{[\s\S]*\}", raw)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            pass

    # Strategy 4: Bracket match
    bracket_match = re.search(r"\[[\s\S]*\]", raw)
    if bracket_match:
        try:
            return json.loads(bracket_match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from LLM response:\n{raw[:500]}")
