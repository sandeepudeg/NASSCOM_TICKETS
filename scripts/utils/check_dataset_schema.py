#!/usr/bin/env python3
"""
Quick script to check Kaggle dataset schema compatibility with database fields.
"""

# Expected database fields for tickets
DB_FIELDS = {
    "id": "String (UUID)",
    "title": "String(500) - REQUIRED",
    "description": "Text - REQUIRED",
    "owner_id": "String - REQUIRED",
    "category": "Enum (7 categories) - OPTIONAL",
    "status": "Enum (open, in_progress, resolved, closed)",
    "routing_status": "Enum (pending_classification, classified, escalated, reviewed)",
    "confidence_score": "Float (0.0-1.0) - OPTIONAL",
    "priority": "String(50) - OPTIONAL",
    "structured_payload": "Text (JSON) - OPTIONAL",
    "causal_context_json": "Text (JSON) - OPTIONAL",
    "causal_signal": "Text - OPTIONAL",
    "parse_warning": "Text - OPTIONAL",
    "created_at": "DateTime",
    "updated_at": "DateTime",
    "resolved_at": "DateTime - OPTIONAL",
}

VALID_CATEGORIES = [
    "Infrastructure",
    "Application",
    "Security",
    "Database",
    "Storage",
    "Network",
    "Access Management",
]

print("=" * 80)
print("DATABASE SCHEMA - Tickets Table")
print("=" * 80)
for field, dtype in DB_FIELDS.items():
    print(f"  {field:25} : {dtype}")

print("\n" + "=" * 80)
print("EXPECTED KAGGLE DATASET FIELDS")
print("=" * 80)
print("""
Based on retrain_classifier.py and evaluate_classifier.py, the expected format is:

{
  "title": "string (required)",
  "description": "string (required)",
  "category": "string (one of 7 valid categories, required)",
  "resolution": "string (optional, used for evaluation)"
}

Additional fields that may be present:
  - ticket_id: string (optional, for tracking)
  - source: string (optional, dataset identifier)
  - priority: string (optional)
  - status: string (optional)
""")

print("\n" + "=" * 80)
print("FIELD MAPPING ANALYSIS")
print("=" * 80)

mapping = {
    "Dataset Field": "Database Field",
    "-" * 20: "-" * 20,
    "title": "title ✓ (direct match)",
    "description": "description ✓ (direct match)",
    "category": "category ✓ (must be one of 7 valid values)",
    "resolution": "NOT STORED (used only for training/evaluation)",
    "ticket_id": "id (optional, generated if missing)",
    "priority": "priority ✓ (optional)",
    "status": "status (optional, defaults to 'open')",
}

for k, v in mapping.items():
    print(f"  {k:20} -> {v}")

print("\n" + "=" * 80)
print("POTENTIAL ISSUES TO CHECK")
print("=" * 80)

issues = [
    "1. Category values must match exactly (case-sensitive):",
    "   Valid: Infrastructure, Application, Security, Database, Storage, Network, Access Management",
    "",
    "2. Missing required fields in dataset:",
    "   - title (required)",
    "   - description (required)",
    "   - category (required for training)",
    "",
    "3. Field name mismatches:",
    "   - 'summary' vs 'title'",
    "   - 'issue' vs 'description'",
    "   - 'type' vs 'category'",
    "",
    "4. owner_id is NOT in dataset (will be set to 'system' during ingestion)",
    "",
    "5. Resolution field is used for evaluation but not stored in DB",
]

for issue in issues:
    print(f"  {issue}")

print("\n" + "=" * 80)
print("RECOMMENDATION")
print("=" * 80)
print("""
To verify actual dataset schema:
1. Download one dataset: python download_datasets.py --skip-upload
2. Check the downloaded JSON files in ~/.cache/kagglehub/
3. Inspect the first few records to see actual field names
4. Create a mapping function if field names don't match

Example mapping function needed if dataset uses different field names:
  
  def map_dataset_to_db_schema(dataset_record):
      return {
          "title": dataset_record.get("summary") or dataset_record.get("title"),
          "description": dataset_record.get("issue") or dataset_record.get("description"),
          "category": dataset_record.get("type") or dataset_record.get("category"),
          "priority": dataset_record.get("priority", "medium"),
          "owner_id": "system",  # Always set for training data
      }
""")

print("\n" + "=" * 80)
