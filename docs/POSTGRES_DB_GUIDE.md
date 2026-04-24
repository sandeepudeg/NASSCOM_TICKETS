# 🐘 PostgreSQL Database: The Infrastructure "Permanent Vault"

This document provides a non-technical and technical overview of our primary database, PostgreSQL.

---

## 1. PostgreSQL for Laymen: The "Indestructible Filing Cabinet" Analogy
Imagine you have a massive, fireproof, and indestructible filing cabinet that holds every single piece of information for your entire company.

- **The Cabinet (PostgreSQL)**: This is the secure vault where everything is stored. If it's not in the cabinet, the application doesn't know it exists.
- **The Drawers (Tables)**: The cabinet is organized into drawers for specific types of information.
    - **The Tickets Drawer (`tickets`)**: Holds every user complaint.
    - **The Folders Drawer (`folders`)**: Holds the names and settings of your organizational folders.
    - **The Security Log (`audit_log`)**: A permanent record of who did what and when.
- **The Filing System (SQL)**: To get something out of the cabinet, you don't just grab it; you write a specific request (a Query) like: "Please bring me all folders from the Tickets drawer that were created yesterday."

**PostgreSQL is the "Source of Truth." It ensures that your data is never lost, never corrupted, and always organized.**

---

## 2. How it is used in TicketIQ
PostgreSQL is the **Memory** of TicketIQ. Every time you click a button or submit a form, the application is either writing to or reading from this vault.

### Special Feature: pgvector (The "Idea Scanner")
Our cabinet has a special tool called `pgvector`. It allows us to store "Ideas" (Vectors) inside the drawers alongside the text. This is what allows us to search for tickets by **meaning** rather than just by words.

---

## 3. Key Highlights & Features
- **ACID Compliance (Indestructibility)**: This is a technical term that basically means: "If the power goes out in the middle of saving a ticket, the database will either finish perfectly or roll back as if nothing happened." Your data will never be "half-saved."
- **Relational Integrity**: The cabinet is "Smart." It won't let you put a ticket into a folder that doesn't exist. It keeps all your data connected and consistent.
- **Scalability**: It can handle millions of rows and gigabytes of data without slowing down.

---

## 4. How to Use the "Vault Keys" (psql CLI)
You can look inside the vault yourself using the command line:

1.  **Open the Vault**:
    - Run: `docker exec -it tickets_postgres psql -U postgres -d tickets`
2.  **Look at the Drawers**:
    - Type: `\dt` (This lists all your tables).
3.  **Read some Data**:
    - Type: `SELECT title, category FROM tickets LIMIT 5;`
    - This will show you the titles and categories of the first 5 tickets in the vault.
4.  **Exit**: Type `\q`.

### 💡 Example Task: "Finding High Priority Tickets"
If you want to see exactly what's in the vault for high-priority items:
- Query: `SELECT ticket_number, title FROM tickets WHERE priority = 'High';`

---

## 5. Potential Issues & Risks
Even a vault needs maintenance:

### ⚠️ "Connection Refused"
This means the API is trying to talk to the vault, but the vault is locked or the door is closed.
- **Observation**: Check the `tickets_postgres` container in Docker.
- **Solution**: Ensure the database is "Up" and "Healthy."

### ⚠️ "Disk Full"
If the server's hard drive is full, the vault cannot accept any new files.
- **Solution**: Check the `postgres-backup` logs to see if old backups are being cleared properly.

---

## 6. Accessing the Vault
- **Database Name**: `tickets`
- **Username/Password**: `postgres` / `postgres`
- **Port**: `5432`

> [!TIP]
> Never delete data directly from the vault unless you are an expert. Instead, use the **Soft Delete** feature in the application, which moves files to a "Recycle Bin" drawer instead of shredding them!
