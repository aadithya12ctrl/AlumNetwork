import os
from backend.services.llm_client import call_llm

try:
    print("Calling LLM...")
    response = call_llm("You are a helpful assistant.", "Say hello!")
    print(f"Response: {response}")
except Exception as e:
    print(f"Error: {e}")
