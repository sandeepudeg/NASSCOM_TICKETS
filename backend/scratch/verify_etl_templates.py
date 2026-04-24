import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.services.import_service import ImportService

def test_domain_templates():
    templates = ImportService.get_domain_templates()
    
    assert "Healthcare (HIPAA/DPDP)" in templates
    assert "Legal & Compliance" in templates
    assert "Financial Services" in templates
    
    healthcare = templates["Healthcare (HIPAA/DPDP)"]
    assert healthcare["Patient ID"] == "national_id"
    
    legal = templates["Legal & Compliance"]
    assert legal["Case Title"] == "title"
    
    print("ETL Domain Templates Verification: SUCCESS")

if __name__ == "__main__":
    test_domain_templates()
