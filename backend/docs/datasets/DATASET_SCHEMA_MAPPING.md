# Dataset Schema Mapping Analysis

## Overview

This document analyzes the field mapping between Kaggle datasets and the database schema to identify potential compatibility issues.

---

## Database Schema (Tickets Table)

```python
class Ticket(Base):
    __tablename__ = "tickets"
    
    # Required fields
    id = Column(String, primary_key=True)              # UUID, auto-generated
    title = Column(String(500), nullable=False)        # REQUIRED
    description = Column(Text, nullable=False)         # REQUIRED
    owner_id = Column(String, nullable=False)          # REQUIRED (set to 'system' for training data)
    
    # Classification fields
    category = Column(Enum(...), nullable=True)        # One of 7 categories
    status = Column(Enum(...), default="open")         # open, in_progress, resolved, closed
    routing_status = Column(Enum(...))                 # pending_classification, classified, escalated, reviewed
    confidence_score = Column(Float, nullable=True)    # 0.0 to 1.0
    
    # Optional metadata
    priority = Column(String(50), nullable=True)
    structured_payload = Column(Text, nullable=True)
    causal_context_json = Column(Text, nullable=True)
    causal_signal = Column(Text, nullable=True)
    parse_warning = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
```

### Valid Categories (Case-Sensitive)

1. Infrastructure
2. Application
3. Security
4. Database
5. Storage
6. Network
7. Access Management

---

## Expected Dataset Format

Based on `retrain_classifier.py` and `evaluate_classifier.py`:

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "category": "string (required, one of 7 valid categories)",
  "resolution": "string (optional, used for evaluation only)"
}
```

---

## Kaggle Datasets Analysis

### Dataset 1: IT Service Ticket Classification Dataset
**ID:** `adisongoh/it-service-ticket-classification-dataset`

**Expected Fields (based on typical IT ticket datasets):**
- `ticket_id` or `id` → Maps to `id` (or auto-generated)
- `title` or `summary` or `subject` → Maps to `title` ✓
- `description` or `details` or `issue` → Maps to `description` ✓
- `category` or `type` or `classification` → Maps to `category` ⚠️
- `priority` → Maps to `priority` ✓
- `status` → Maps to `status` ✓
- `resolution` or `solution` → Used for training only (not stored)

**Potential Issues:**
- ⚠️ Category values may not match the 7 predefined categories
- ⚠️ Field names might be different (e.g., "summary" instead of "title")

---

### Dataset 2: Multilingual Customer Support Tickets
**ID:** `tobiasbueck/multilingual-customer-support-tickets`

**Expected Fields:**
- `ticket_id` → Maps to `id`
- `subject` or `title` → Maps to `title` ⚠️
- `message` or `description` → Maps to `description` ⚠️
- `category` or `department` → Maps to `category` ⚠️
- `language` → NOT MAPPED (could be stored in structured_payload)

**Potential Issues:**
- ⚠️ Multilingual content may need language detection
- ⚠️ Categories likely don't match IT-specific categories
- ⚠️ Field names may differ significantly

---

### Dataset 3: Incident Response Log
**ID:** `vipulshinde/incident-response-log`

**Expected Fields:**
- `incident_id` → Maps to `id`
- `short_description` or `title` → Maps to `title` ⚠️
- `description` or `details` → Maps to `description` ✓
- `category` or `incident_type` → Maps to `category` ⚠️
- `priority` → Maps to `priority` ✓
- `state` or `status` → Maps to `status` ⚠️
- `resolution_notes` → Used for training only

**Potential Issues:**
- ⚠️ ServiceNow-style field names may differ
- ⚠️ Categories may be ServiceNow-specific
- ⚠️ Status values may not match enum values

---

## Critical Compatibility Issues

### Issue 1: Category Value Mismatch ⚠️ HIGH PRIORITY

**Problem:** Kaggle datasets likely use different category names than the 7 predefined categories.

**Example Mismatches:**
```
Dataset Category          → Required Category
"Hardware"                → "Infrastructure"
"Software"                → "Application"
"Network Issue"           → "Network"
"Database Problem"        → "Database"
"Security Incident"       → "Security"
"Storage Issue"           → "Storage"
"Access Request"          → "Access Management"
"Other"                   → ??? (needs manual mapping)
```

**Solution Required:**
Create a category mapping function in `retrain_classifier.py`:

```python
CATEGORY_MAPPING = {
    # Common variations
    "hardware": "Infrastructure",
    "infrastructure": "Infrastructure",
    "server": "Infrastructure",
    
    "software": "Application",
    "application": "Application",
    "app": "Application",
    
    "security": "Security",
    "security incident": "Security",
    
    "database": "Database",
    "db": "Database",
    
    "storage": "Storage",
    "disk": "Storage",
    
    "network": "Network",
    "networking": "Network",
    
    "access": "Access Management",
    "access management": "Access Management",
    "permissions": "Access Management",
}

def normalize_category(raw_category: str) -> Optional[str]:
    """Map dataset category to valid database category."""
    if not raw_category:
        return None
    
    # Try exact match first
    if raw_category in VALID_CATEGORIES:
        return raw_category
    
    # Try case-insensitive mapping
    normalized = CATEGORY_MAPPING.get(raw_category.lower())
    if normalized:
        return normalized
    
    # Log unmapped categories for manual review
    print(f"[WARN] Unmapped category: {raw_category}")
    return None
```

---

### Issue 2: Field Name Mismatches ⚠️ MEDIUM PRIORITY

**Problem:** Dataset field names may not match database field names.

**Solution Required:**
Create a field mapping function:

```python
def map_dataset_fields(record: dict) -> dict:
    """Map dataset fields to database schema."""
    return {
        "title": (
            record.get("title") or 
            record.get("summary") or 
            record.get("subject") or 
            record.get("short_description") or
            "Untitled"
        ),
        "description": (
            record.get("description") or 
            record.get("details") or 
            record.get("message") or 
            record.get("issue") or
            ""
        ),
        "category": normalize_category(
            record.get("category") or 
            record.get("type") or 
            record.get("classification") or
            record.get("incident_type")
        ),
        "priority": record.get("priority", "medium"),
        "resolution": (
            record.get("resolution") or 
            record.get("solution") or 
            record.get("resolution_notes") or
            ""
        ),
        "owner_id": "system",  # Always 'system' for training data
    }
```

---

### Issue 3: Missing owner_id ⚠️ LOW PRIORITY

**Problem:** Datasets don't include `owner_id`, which is required in the database.

**Solution:** Always set `owner_id = "system"` for training data.

**Implementation:** Already handled in the mapping function above.

---

### Issue 4: Resolution Field Not Stored ℹ️ INFO

**Problem:** The `resolution` field is used for training/evaluation but not stored in the database.

**Impact:** This is by design. Resolution data is only needed during:
- Model training (to learn from past resolutions)
- Model evaluation (to compute semantic similarity scores)

**No action required.**

---

## Recommended Implementation Changes

### 1. Update `retrain_classifier.py`

Add the category mapping and field mapping functions:

```python
# Add after VALID_CATEGORIES definition
CATEGORY_MAPPING = {
    # ... (mapping dict from above)
}

def normalize_category(raw_category: str) -> Optional[str]:
    # ... (function from above)

def map_dataset_fields(record: dict) -> dict:
    # ... (function from above)

# Update load_and_preprocess function
def load_and_preprocess(file_paths: list[str]) -> list[dict]:
    """Load datasets, map fields, apply PII scrubbing, filter invalid categories."""
    from ml.pii_scrubber import PIIScrubber
    
    all_data = []
    
    # Load all files
    for path_str in file_paths:
        path = Path(path_str)
        if not path.exists():
            print(f"[WARN] File not found: {path}", file=sys.stderr)
            continue
            
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    # Map fields for each record
                    mapped_data = [map_dataset_fields(record) for record in data]
                    all_data.extend(mapped_data)
                else:
                    all_data.append(map_dataset_fields(data))
        except Exception as e:
            print(f"[ERROR] Failed to load {path}: {e}", file=sys.stderr)
            continue
    
    # Apply PII scrubbing
    scrubbed_data = []
    for item in all_data:
        scrubbed_item = item.copy()
        
        if "title" in scrubbed_item:
            scrubbed_item["title"], _ = PIIScrubber.scrub(scrubbed_item["title"])
        
        if "description" in scrubbed_item:
            scrubbed_item["description"], _ = PIIScrubber.scrub(scrubbed_item["description"])
        
        if "resolution" in scrubbed_item:
            scrubbed_item["resolution"], _ = PIIScrubber.scrub(scrubbed_item["resolution"])
        
        scrubbed_data.append(scrubbed_item)
    
    # Filter out records with invalid/unmapped categories
    valid_data = []
    for item in scrubbed_data:
        category = item.get("category")
        if category and category in VALID_CATEGORIES:
            valid_data.append(item)
        else:
            print(f"[DEBUG] Filtered out item with invalid category: {category}", file=sys.stderr)
    
    return valid_data
```

---

### 2. Create Dataset Inspection Script

Before running the full retraining pipeline, inspect the actual dataset structure:

```python
#!/usr/bin/env python3
"""inspect_dataset.py - Inspect Kaggle dataset structure"""
import json
import kagglehub
from pathlib import Path
from collections import Counter

def inspect_dataset(dataset_id: str):
    print(f"\n{'='*80}")
    print(f"Inspecting: {dataset_id}")
    print('='*80)
    
    # Download dataset
    path = kagglehub.dataset_download(dataset_id)
    print(f"Downloaded to: {path}")
    
    # Find JSON files
    json_files = list(Path(path).rglob("*.json"))
    csv_files = list(Path(path).rglob("*.csv"))
    
    print(f"\nFound {len(json_files)} JSON files, {len(csv_files)} CSV files")
    
    # Inspect first JSON file
    if json_files:
        with open(json_files[0], 'r') as f:
            data = json.load(f)
            
        if isinstance(data, list) and len(data) > 0:
            sample = data[0]
            print(f"\nSample record fields:")
            for key, value in sample.items():
                value_preview = str(value)[:50] if value else "None"
                print(f"  {key:25} : {value_preview}")
            
            # Count categories
            if "category" in sample:
                categories = Counter(item.get("category") for item in data)
                print(f"\nCategory distribution:")
                for cat, count in categories.most_common():
                    print(f"  {cat:30} : {count}")

# Inspect all three datasets
for dataset_id in [
    "adisongoh/it-service-ticket-classification-dataset",
    "tobiasbueck/multilingual-customer-support-tickets",
    "vipulshinde/incident-response-log",
]:
    try:
        inspect_dataset(dataset_id)
    except Exception as e:
        print(f"[ERROR] Failed to inspect {dataset_id}: {e}")
```

---

## Action Items

### Before Training:

1. ✅ **Run dataset inspection script** to see actual field names and category values
2. ⚠️ **Implement category mapping** in `retrain_classifier.py`
3. ⚠️ **Implement field mapping** in `retrain_classifier.py`
4. ⚠️ **Test with small sample** before full training run

### During Training:

1. Monitor logs for unmapped categories
2. Track how many records are filtered out due to invalid categories
3. Verify PII scrubbing is working correctly

### After Training:

1. Review evaluation metrics to ensure model quality
2. Check if category distribution is balanced
3. Verify that mapped categories make sense

---

## Summary

**Critical Issues Found:**
1. ⚠️ **Category value mismatch** - Datasets likely use different category names
2. ⚠️ **Field name mismatch** - Datasets may use different field names (e.g., "summary" vs "title")
3. ⚠️ **Missing owner_id** - Must be set to "system" for training data

**Recommended Next Steps:**
1. Download and inspect one dataset to see actual structure
2. Implement category and field mapping functions
3. Test with a small sample before full training
4. Update `retrain_classifier.py` with the mapping logic

**Files to Update:**
- `retrain_classifier.py` - Add mapping functions
- `evaluate_classifier.py` - Ensure it handles mapped fields correctly
- Create `inspect_dataset.py` - New script to inspect dataset structure
