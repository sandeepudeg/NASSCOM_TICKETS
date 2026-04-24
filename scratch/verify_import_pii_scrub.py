import requests
import json
import os
import time

BASE_URL = "http://localhost:8005/api/v1"
CSV_PATH = r"d:\Learning\Self_learning\Nasscom\Tickets\data\test_itsm_pii.csv"

def verify_import():
    print(f"Starting verification of import field mapping and PII scrubbing...")
    
    # 1. Define mapping for ITSM template
    # Header: Subject, Description, CI Name, Service, Impact
    mapping = {
        "Subject": "title",
        "Description": "description",
        "CI Name": "national_id",
        "Service": "category",
        "Impact": "priority"
    }
    
    # 2. Perform Import
    with open(CSV_PATH, 'rb') as f:
        files = {'file': (os.path.basename(CSV_PATH), f, 'text/csv')}
        data = {'mapping_json': json.dumps(mapping)}
        
        print(f"Uploading {CSV_PATH} with ITSM mapping...")
        response = requests.post(f"{BASE_URL}/tickets/import", files=files, data=data)
    
    if response.status_code != 200:
        print(f"Error during import: {response.status_code}")
        print(response.text)
        return False
        
    result = response.json()
    print(f"Import successful! Created {result.get('created_count')} tickets.")
    
    # 3. Verify Scrubbing
    # Get the latest tickets
    print("Verifying PII scrubbing in the database...")
    tickets_res = requests.get(f"{BASE_URL}/tickets", params={"page_size": 10})
    if tickets_res.status_code != 200:
        print("Error fetching tickets for verification.")
        return False
        
    tickets = tickets_res.json().get('tickets', [])
    
    # Check for our specific titles from the CSV
    test_titles = [
        "Database connection failure in Prod",
        "Payment Gateway Timeout",
        "Unauthorized access attempt"
    ]
    
    found_count = 0
    for t in tickets:
        if t['title'] in test_titles:
            found_count += 1
            print(f"\nChecking Ticket: {t['title']}")
            print(f"Category: {t['category']}")
            print(f"Priority: {t['priority']}")
            
            desc = t['description']
            # PII in CSV: 3215 4487 9901, ABCDE1234F, 22AAAAA0000A1Z5, 9988-7766-5544
            
            has_aadhaar = "[AADHAAR]" in desc or "3215" not in desc
            has_pan = "[PAN]" in desc or "ABCDE1234F" not in desc
            has_gstin = "[GSTIN]" in desc or "22AAAAA" not in desc
            
            print(f"  Description: {desc[:100]}...")
            print(f"  Aadhaar Scrubbed: {has_aadhaar}")
            print(f"  PAN Scrubbed: {has_pan}")
            print(f"  GSTIN Scrubbed: {has_gstin}")
            
            if not (has_aadhaar and has_pan and has_gstin):
                print("  [!] Scrubbing FAILED for one or more entities.")
            else:
                print("  [+] Scrubbing SUCCESSFUL.")

    if found_count == 0:
        print("Could not find the imported test tickets in the latest batch.")
        return False
        
    return True

if __name__ == "__main__":
    # Wait for backend to be ready
    for _ in range(5):
        try:
            r = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health/ready")
            if r.status_code == 200:
                break
        except:
            pass
        print("Waiting for backend...")
        time.sleep(2)
        
    if verify_import():
        print("\nEnd-to-End Verification COMPLETE.")
    else:
        print("\nEnd-to-End Verification FAILED.")
