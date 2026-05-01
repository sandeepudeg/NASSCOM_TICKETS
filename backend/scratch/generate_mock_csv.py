import csv
import random
from datetime import datetime, timedelta

def generate_mock_tickets(filename, count=300):
    categories = ["Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access Management"]
    priorities = ["Low", "Medium", "High", "Critical"]
    statuses = ["Open", "In Progress", "Resolved"]
    
    subjects = [
        "Server {} high CPU usage",
        "Database {} connection timeout",
        "VPN tunnel {} status down",
        "User {} locked out of system",
        "Disk space low (95%) on {}",
        "Password reset requested for {}",
        "MFA device reset for {}",
        "Application {} slow response time",
        "Firewall rule block on port {}",
        "Switch {} fans failure alarm"
    ]
    
    descriptions = [
        "The server {} is experiencing prolonged high CPU utilization exceeding 90%.",
        "Multiple users reporting timeouts when connecting to {} database instance.",
        "The primary VPN tunnel for {} region has disconnected.",
        "Account {} has been locked after multiple failed login attempts.",
        "The storage volume {} is nearly full and requires immediate cleanup.",
        "Executive user {} requires an urgent password reset for system access.",
        "User {} cannot authenticate; MFA token needs to be resynced.",
        "Monitoring detected latency spike in {} service.",
        "Traffic from {} is being blocked by updated firewall policies.",
        "Hardware alert: Cooling fan failure on {} switch."
    ]

    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["Subject", "Description", "Service", "Impact", "Status", "Created Date"])
        
        start_date = datetime.now() - timedelta(days=7)
        
        for i in range(1, count + 1):
            category = random.choice(categories)
            priority = random.choice(priorities)
            status = random.choice(statuses)
            
            # Create semi-realistic clusters
            cluster_id = i % 50 
            subject = random.choice(subjects).format(f"ID-{cluster_id}")
            description = random.choice(descriptions).format(f"Component-{cluster_id}")
            
            created_date = (start_date + timedelta(hours=i)).strftime("%Y-%m-%d %H:%M:%S")
            
            writer.writerow([subject, description, category, priority, status, created_date])

    print(f"Generated {count} mock tickets in {filename}")

if __name__ == "__main__":
    generate_mock_tickets("mock_300_tickets.csv")
