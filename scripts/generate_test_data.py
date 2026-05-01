import pandas as pd
import random

CATEGORIES = [
    "Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access Management"
]

TEMPLATES = {
    "Infrastructure": [
        "Server cluster {id} high CPU usage warning",
        "VPC Peering connection {id} dropped packets detected",
        "Load Balancer {id} health check failures in Region-B",
    ],
    "Application": [
        "Payment gateway 500 status on /checkout/{id}",
        "User session timeout issue on mobile app version {id}",
        "API Latency increased for /v1/products/list - {id}",
    ],
    "Security": [
        "Unusual login activity detected for account {id}",
        "Credential stuffing attempt blocked on IP range {id}.0.0/16",
        "Unauthorized S3 bucket policy modification on {id}",
    ],
    "Database": [
        "Postgres slow query optimization needed for {id}",
        "Database backup failure for instance {id} on S3",
        "Connection pool exhaustion on microservice {id}",
    ],
    "Storage": [
        "S3 bucket {id} access denied for service role",
        "Disk space low (95%) on shared drive {id}",
        "EFS mount failure on instance {id}",
    ],
    "Network": [
        "Wireless AP {id} offline in South Wing",
        "VPN tunnel {id} status changed to Down",
        "DNS resolution failure for internal host {id}",
    ],
    "Access Management": [
        "Password reset requested for executive account {id}",
        "New employee AD account creation for user {id}",
        "Role-based access change request for team {id}",
    ]
}

data = []
for _ in range(300):
    category = random.choice(CATEGORIES)
    template = random.choice(TEMPLATES[category])
    id_str = f"EXT-{random.randint(1000, 9999)}"
    
    subject = template.format(id=id_str)
    description = f"Batch imported ticket for {subject}. This issue was detected by external monitoring system. Please investigate the {category} logs for ID {id_str}. User IP: {random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
    
    data.append({
        "Subject": subject,
        "Description": description,
        "Service": category,
        "Impact": random.choice(["Low", "Medium", "High", "Critical"]),
        "Status": random.choice(["open", "in_progress", "resolved"])
    })

df = pd.DataFrame(data)
df.to_csv("tickets_ingestion_300.csv", index=False)
print("Generated tickets_ingestion_300.csv with 300 tickets.")
