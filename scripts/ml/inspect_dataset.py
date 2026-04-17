#!/usr/bin/env python3
"""
inspect_dataset.py - Inspect Kaggle dataset structure and field names.

This script downloads Kaggle datasets and inspects their structure to identify:
- Field names used in the dataset
- Category values and their distribution
- Sample records for manual review
- Potential mapping issues

Usage:
    python inspect_dataset.py [--dataset DATASET_ID]
    python inspect_dataset.py --all  # Inspect all three datasets
"""
import argparse
import json
import sys
from pathlib import Path
from collections import Counter
from typing import Optional

try:
    import kagglehub
except ImportError:
    print("[ERROR] kagglehub is not installed. Install with: pip install kagglehub", file=sys.stderr)
    sys.exit(1)

# Dataset IDs
DATASETS = {
    "it-tickets": "adisongoh/it-service-ticket-classification-dataset",
    "multilingual": "tobiasbueck/multilingual-customer-support-tickets",
    "incident-log": "vipulshinde/incident-response-log",
}


def inspect_json_file(file_path: Path, max_samples: int = 5) -> dict:
    """
    Inspect a JSON file and extract structure information.
    
    Args:
        file_path: Path to JSON file
        max_samples: Number of sample records to display
        
    Returns:
        Dictionary with inspection results
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            data = [data]
        
        if len(data) == 0:
            return {"error": "Empty dataset"}
        
        # Extract field names from first record
        sample = data[0]
        field_names = list(sample.keys()) if isinstance(sample, dict) else []
        
        # Count categories if present
        category_field = None
        for field in ["category", "type", "classification", "incident_type", "ticket_type"]:
            if field in sample:
                category_field = field
                break
        
        category_counts = None
        if category_field:
            categories = [item.get(category_field) for item in data if isinstance(item, dict)]
            category_counts = Counter(categories)
        
        return {
            "total_records": len(data),
            "field_names": field_names,
            "category_field": category_field,
            "category_counts": category_counts,
            "samples": data[:max_samples],
        }
    
    except Exception as e:
        return {"error": str(e)}


def inspect_csv_file(file_path: Path, max_samples: int = 5) -> dict:
    """
    Inspect a CSV file and extract structure information.
    
    Args:
        file_path: Path to CSV file
        max_samples: Number of sample records to display
        
    Returns:
        Dictionary with inspection results
    """
    try:
        import csv
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data = list(reader)
        
        if len(data) == 0:
            return {"error": "Empty dataset"}
        
        # Extract field names
        field_names = list(data[0].keys())
        
        # Count categories if present
        category_field = None
        for field in ["category", "type", "classification", "incident_type", "ticket_type"]:
            if field in data[0]:
                category_field = field
                break
        
        category_counts = None
        if category_field:
            categories = [item.get(category_field) for item in data]
            category_counts = Counter(categories)
        
        return {
            "total_records": len(data),
            "field_names": field_names,
            "category_field": category_field,
            "category_counts": category_counts,
            "samples": data[:max_samples],
        }
    
    except Exception as e:
        return {"error": str(e)}


def inspect_dataset(dataset_id: str, dataset_name: str):
    """
    Download and inspect a Kaggle dataset.
    
    Args:
        dataset_id: Kaggle dataset identifier
        dataset_name: Friendly name for the dataset
    """
    print(f"\n{'='*80}")
    print(f"Inspecting: {dataset_name}")
    print(f"Dataset ID: {dataset_id}")
    print('='*80)
    
    try:
        # Download dataset
        print(f"\n[INFO] Downloading dataset...")
        path = kagglehub.dataset_download(dataset_id)
        print(f"[INFO] Downloaded to: {path}")
        
        # Find data files
        path_obj = Path(path)
        json_files = list(path_obj.rglob("*.json"))
        csv_files = list(path_obj.rglob("*.csv"))
        
        print(f"\n[INFO] Found {len(json_files)} JSON files, {len(csv_files)} CSV files")
        
        # Inspect JSON files
        if json_files:
            print(f"\n{'─'*80}")
            print("JSON Files:")
            print('─'*80)
            
            for json_file in json_files[:3]:  # Inspect first 3 JSON files
                print(f"\n📄 File: {json_file.name}")
                print(f"   Path: {json_file}")
                
                result = inspect_json_file(json_file)
                
                if "error" in result:
                    print(f"   ❌ Error: {result['error']}")
                    continue
                
                print(f"   📊 Total records: {result['total_records']}")
                print(f"\n   📋 Field names:")
                for field in result['field_names']:
                    print(f"      - {field}")
                
                if result['category_field']:
                    print(f"\n   🏷️  Category field: '{result['category_field']}'")
                    print(f"   📈 Category distribution:")
                    for cat, count in result['category_counts'].most_common():
                        percentage = (count / result['total_records']) * 100
                        print(f"      {cat:30} : {count:5} ({percentage:5.1f}%)")
                
                print(f"\n   📝 Sample records:")
                for i, sample in enumerate(result['samples'], 1):
                    print(f"\n      Sample {i}:")
                    for key, value in sample.items():
                        value_str = str(value)[:60] if value else "None"
                        print(f"        {key:25} : {value_str}")
        
        # Inspect CSV files
        if csv_files:
            print(f"\n{'─'*80}")
            print("CSV Files:")
            print('─'*80)
            
            for csv_file in csv_files[:3]:  # Inspect first 3 CSV files
                print(f"\n📄 File: {csv_file.name}")
                print(f"   Path: {csv_file}")
                
                result = inspect_csv_file(csv_file)
                
                if "error" in result:
                    print(f"   ❌ Error: {result['error']}")
                    continue
                
                print(f"   📊 Total records: {result['total_records']}")
                print(f"\n   📋 Field names:")
                for field in result['field_names']:
                    print(f"      - {field}")
                
                if result['category_field']:
                    print(f"\n   🏷️  Category field: '{result['category_field']}'")
                    print(f"   📈 Category distribution:")
                    for cat, count in result['category_counts'].most_common():
                        percentage = (count / result['total_records']) * 100
                        print(f"      {cat:30} : {count:5} ({percentage:5.1f}%)")
                
                print(f"\n   📝 Sample records:")
                for i, sample in enumerate(result['samples'], 1):
                    print(f"\n      Sample {i}:")
                    for key, value in sample.items():
                        value_str = str(value)[:60] if value else "None"
                        print(f"        {key:25} : {value_str}")
        
        print(f"\n{'='*80}\n")
        
    except Exception as e:
        print(f"[ERROR] Failed to inspect {dataset_id}: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="Inspect Kaggle dataset structure and field names"
    )
    parser.add_argument(
        "--dataset",
        choices=list(DATASETS.keys()),
        help="Specific dataset to inspect"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Inspect all three datasets"
    )
    
    args = parser.parse_args()
    
    if not args.dataset and not args.all:
        print("[ERROR] Please specify --dataset or --all", file=sys.stderr)
        parser.print_help()
        sys.exit(1)
    
    if args.all:
        # Inspect all datasets
        for name, dataset_id in DATASETS.items():
            inspect_dataset(dataset_id, name)
    else:
        # Inspect specific dataset
        dataset_id = DATASETS[args.dataset]
        inspect_dataset(dataset_id, args.dataset)
    
    print("\n" + "="*80)
    print("NEXT STEPS")
    print("="*80)
    print("""
1. Review the field names and category values above
2. Update CATEGORY_MAPPING in retrain_classifier.py if needed
3. Update map_dataset_fields() if field names don't match
4. Run a test training with a small sample:
   python retrain_classifier.py --dry-run --skip-download --dataset-dir <path>
""")


if __name__ == "__main__":
    main()

