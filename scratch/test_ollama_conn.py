import httpx
import asyncio
import json

async def test_ollama():
    url = "http://ollama:11434/api/chat"
    payload = {
        "model": "llama3.2:latest",
        "messages": [{"role": "user", "content": "hi"}],
        "stream": False
    }
    
    print(f"Testing connectivity to {url}...")
    try:
        async with httpx.AsyncClient() as client:
            # First check tags
            tags_resp = await client.get("http://ollama:11434/api/tags")
            print(f"Tags Response ({tags_resp.status_code}): {tags_resp.text}")
            
            # Then try chat
            resp = await client.post(url, json=payload, timeout=30.0)
            print(f"Chat Response ({resp.status_code}): {resp.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ollama())
