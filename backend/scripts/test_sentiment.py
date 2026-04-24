import asyncio
import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

from src.ml.classifier import classifier

async def test_sentiment():
    print("--- Testing Sentiment & Impact Extraction ---")
    
    test_cases = [
        {
            "title": "Network is down",
            "description": "I cannot connect to the internet from my desk."
        },
        {
            "title": "URGENT: HELP ME NOW!!!",
            "description": "I AM SO ANGRY!! The entire database is wiped and 500 customers are calling me! I will lose my job if this is not fixed in 5 minutes!! FIX IT NOW!!!!"
        }
    ]
    
    for i, case in enumerate(test_cases):
        print(f"\nTest Case {i+1}: {case['title']}")
        result = await classifier.classify(case['title'], case['description'])
        print(f"Category: {result.category}")
        print(f"Confidence: {result.confidence_score}")
        print(f"Sentiment Score: {result.sentiment_score} (Higher = More Frustrated)")
        print(f"Impact Score: {result.impact_score} (Higher = More Business Impact)")

if __name__ == "__main__":
    asyncio.run(test_sentiment())
