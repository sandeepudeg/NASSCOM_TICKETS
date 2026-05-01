import asyncio
import os
import sys
import json

# Add backend/src to path
backend_path = os.path.abspath(os.path.join(os.getcwd(), "backend", "src"))
sys.path.append(backend_path)
# Add backend to path for config
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "backend")))

from ml.classifier import classifier

async def test_classification():
    tickets = [
        {"title": "not able to connect external monitor", "description": "Issues with the laptop port"},
        {"title": "facing issue with the mouse", "description": "issues with the USB cable"}
    ]
    
    for t in tickets:
        print(f"Testing classification for: {t['title']}")
        try:
            result = await classifier.classify(t['title'], t['description'])
            print(f"  Result Category: {result.category}")
            print(f"  Confidence: {result.confidence_score}")
            print(f"  Outcome: {result.inference_outcome}")
        except Exception as e:
            print(f"  CRASHED: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_classification())
