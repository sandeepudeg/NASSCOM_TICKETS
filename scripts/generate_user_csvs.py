
import csv
import random
import os

# Configuration
output_dir = "ingestion_data_users"
tickets_per_user = 50

# Data pools
services = ["Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access"]
impacts = ["Critical", "High", "Medium", "Low"]
statuses = ["open", "in_progress", "resolved"]

templates = [
    ("Password reset requested for executive account {id}", "Access"),
    ("Connection pool exhaustion on microservice {id}", "Database"),
    ("Disk space low (95%) on shared drive {id}", "Storage"),
    ("VPN tunnel {id} status changed to Down", "Network"),
    ("VPC Peering connection {id} dropped packets detected", "Infrastructure"),
    ("Role-based access change request for team {id}", "Access"),
    ("DNS resolution failure for internal host {id}", "Network"),
    ("Wireless AP {id} offline in South Wing", "Network"),
    ("Unusual login activity detected for account {id}", "Security"),
    ("Database backup failure for instance {id} on S3", "Database"),
    ("EFS mount failure on instance {id}", "Storage"),
    ("User session timeout issue on mobile app version {id}", "Application"),
    ("Unauthorized S3 bucket policy modification on {id}", "Security"),
    ("Postgres slow query optimization needed for {id}", "Database"),
    ("Payment gateway 500 status on /checkout/{id}", "Application"),
    ("Server cluster {id} high CPU usage warning", "Infrastructure"),
    ("Credential stuffing attempt blocked on IP range {id}.0.0/16", "Security"),
    ("API Latency increased for /v1/products/list - {id}", "Application"),
    ("S3 bucket {id} access denied for service role", "Storage"),
    ("Load Balancer {id} health check failures in Region-B", "Infrastructure")
]

def generate_ip():
    return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}"

def generate_ext_id():
    return f"EXT-{random.randint(1000, 9999)}"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for u in range(1, 11):
    user_id = f"user{u}"
    file_path = os.path.join(output_dir, f"tickets_{user_id}.csv")
    
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Subject", "Description", "Service", "Impact", "Status"])
        
        for _ in range(tickets_per_user):
            ext_id = generate_ext_id()
            template, service = random.choice(templates)
            subject = template.format(id=ext_id)
            
            description = (
                f"Batch imported ticket for {subject}. "
                f"User ID: {user_id}. "
                f"Please investigate the {service} logs for ID {ext_id}. "
                f"User IP: {generate_ip()}"
            )
            
            impact = random.choice(impacts)
            status = random.choice(statuses)
            
            writer.writerow([subject, description, service, impact, status])

print(f"Successfully generated 10 CSV files in {output_dir}")
