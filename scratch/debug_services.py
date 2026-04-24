import asyncio
import os
import httpx
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11435")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

async def check_postgres():
    print(f"\n--- Checking PostgreSQL: {DATABASE_URL} ---")
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"[OK] Connection successful!")
            print(f"Version: {version}")
        await engine.dispose()
    except Exception as e:
        print(f"[ERROR] PostgreSQL Error: {e}")

async def check_ollama():
    print(f"\n--- Checking Ollama: {OLLAMA_BASE_URL} ---")
    try:
        async with httpx.AsyncClient() as client:
            # Check tags
            tags_url = f"{OLLAMA_BASE_URL}/api/tags"
            resp = await client.get(tags_url)
            if resp.status_code == 200:
                print(f"[OK] Ollama service is reachable.")
                models = [m['name'] for m in resp.json().get('models', [])]
                print(f"Available models: {models}")
            else:
                print(f"[ERROR] Ollama tags returned status {resp.status_code}")

            # Try a generation with 120s timeout
            gen_url = f"{OLLAMA_BASE_URL}/api/generate"
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": "Say 'ready'",
                "stream": False
            }
            print(f"Testing generation with model '{OLLAMA_MODEL}' (timeout 120s)...")
            gen_resp = await client.post(gen_url, json=payload, timeout=120.0)
            if gen_resp.status_code == 200:
                print(f"[OK] Generation successful!")
                print(f"Response: {gen_resp.json().get('response')}")
            else:
                print(f"[ERROR] Generation failed with status {gen_resp.status_code}: {gen_resp.text}")

    except Exception as e:
        print(f"[ERROR] Ollama Error: {type(e).__name__}: {e}")

async def main():
    await check_postgres()
    await check_ollama()

if __name__ == "__main__":
    asyncio.run(main())
