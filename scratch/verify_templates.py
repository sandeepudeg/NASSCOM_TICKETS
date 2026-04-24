import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.services.import_service import ImportService

def test_templates():
    templates = ImportService.get_domain_templates()
    print(f"Total templates: {len(templates)}")
    for name, mapping in templates.items():
        print(f"Template: {name}")
        for k, v in mapping.items():
            print(f"  {k} -> {v}")
    
    assert "IT Service Management (ITSM)" in templates
    assert "Healthcare (HIPAA/DPDP)" in templates
    print("\nVerification Successful!")

if __name__ == "__main__":
    test_templates()
