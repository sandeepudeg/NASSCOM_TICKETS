
import csv
import random
import os

# Configuration
num_users = 10
tickets_per_user = 50
output_dir = "ingestion_data_users"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Updated Data pools as per user request
services = ["access", "database", "application", "storage", "infrastructure", "security", "network"]
impacts = ["Critical", "High", "Medium", "Low"]
statuses = ["open", "in_progress", "resolved"]

templates = [
    ("Password reset requested for executive account {id}", "access"),
    ("Connection pool exhaustion on microservice {id}", "database"),
    ("Disk space low (95%) on shared drive {id}", "storage"),
    ("VPN tunnel {id} status changed to Down", "network"),
    ("VPC Peering connection {id} dropped packets detected", "infrastructure"),
    ("Role-based access change request for team {id}", "access"),
    ("DNS resolution failure for internal host {id}", "network"),
    ("Wireless AP {id} offline in South Wing", "network"),
    ("Unusual login activity detected for account {id}", "security"),
    ("Database backup failure for instance {id} on S3", "database"),
    ("EFS mount failure on instance {id}", "storage"),
    ("User session timeout issue on mobile app version {id}", "application"),
    ("Unauthorized S3 bucket policy modification on {id}", "security"),
    ("Postgres slow query optimization needed for {id}", "database"),
    ("Payment gateway 500 status on /checkout/{id}", "application"),
    ("Server cluster {id} high CPU usage warning", "infrastructure"),
    ("Credential stuffing attempt blocked on IP range {id}.0.0/16", "security"),
    ("API Latency increased for /v1/products/list - {id}", "application"),
    ("S3 bucket {id} access denied for service role", "storage"),
    ("Load Balancer {id} health check failures in Region-B", "infrastructure")
]

def generate_ip():
    return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}"

def generate_ext_id(prefix=""):
    return f"EXT-{prefix}{random.randint(100, 999)}"

for i in range(1, num_users + 1):
    output_file = os.path.join(output_dir, f"tickets_user_{i}.csv")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Subject", "Description", "Service", "Impact", "Status"])
        
        for j in range(tickets_per_user):
            ext_id = generate_ext_id(prefix=str(i))
            template, service = random.choice(templates)
            subject = template.format(id=ext_id)
            
            description = (
                f"Batch imported ticket for {subject}. "
                f"This issue was detected by external monitoring system. "
                f"Please investigate the {service} logs for ID {ext_id}. "
                f"User IP: {generate_ip()}"
            )
            
            impact = random.choice(impacts)
            status = random.choice(statuses)
            
            writer.writerow([subject, description, service, impact, status])
    
    print(f"Generated {output_file}")

print(f"\nSuccessfully generated {num_users} files with {tickets_per_user} tickets each in '{output_dir}'")
