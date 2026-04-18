import urllib.request

url = "http://localhost:8005/api/v1/compliance/report"
try:
    with urllib.request.urlopen(url) as response:
        pdf_bytes = response.read()
        with open("downloaded_report.pdf", "wb") as f:
            f.write(pdf_bytes)
        print(f"Downloaded {len(pdf_bytes)} bytes.")
        print(f"Starts with: {pdf_bytes[:10]}")
except Exception as e:
    print(f"Error: {e}")
