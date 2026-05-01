import requests
import time

url = "http://localhost:8005/api/v1/tickets"
payload = {
    "title": "Speed Test Ticket",
    "description": "Checking the creation speed after optimization."
}

print(f"Sending POST request to {url}...")
start_time = time.time()
try:
    response = requests.post(url, json=payload, timeout=30)
    end_time = time.time()
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {end_time - start_time:.2f} seconds")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
