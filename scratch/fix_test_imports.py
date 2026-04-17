import os
import pathlib

# Remove the faulty test_rag_pool file
p = pathlib.Path("scratch/test_rag_pool.py")
if p.exists():
    p.unlink()

test_files = [
    "backend/tests/unit/test_evaluate_classifier.py",
    "backend/tests/unit/test_ingest_ticket.py",
    "backend/tests/unit/test_retrain_classifier.py"
]

for f in test_files:
    try:
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
        
        # fix the path append
        content = content.replace('.parent.parent.parent / "scripts"', '.parent.parent.parent.parent / "scripts"')
        
        with open(f, "w", encoding="utf-8") as file:
            file.write(content)
            
        print(f"Fixed {f}")
    except Exception as e:
        print(f"Failed to fix {f}: {e}")
