# 📦 MinIO Object Storage: The Infrastructure "Digital Warehouse"

This document provides a non-technical and technical overview of how MinIO stores our data in the TicketIQ infrastructure.

---

## 1. MinIO for Laymen: The "Infinite Warehouse" Analogy
Imagine you own a massive, invisible warehouse. Unlike a traditional filing cabinet (your computer's hard drive), this warehouse can grow to the size of a city if needed.

- **Buckets (The Aisles)**: The warehouse is divided into large sections called "Buckets." You might have one aisle for "Legal Documents," one for "Security Footage," and one for "Backup Tapes."
- **Objects (The Boxes)**: Everything you put in the warehouse is an "Object." It doesn't matter if it's a tiny text file or a massive 10GB video; it's just a box with a unique label on it.
- **The Manager (MinIO)**: MinIO is the warehouse manager. You don't walk into the warehouse yourself; you give the manager a label, and they bring you the box instantly, no matter how full the warehouse is.

**MinIO is where we keep everything that is too big or too important to keep in a standard database.**

---

## 2. How it is used in TicketIQ
In our system, MinIO acts as our **Permanent Memory**. We use it for three main things:

1.  **Database Backups**: Every night, a copy of our entire ticket database is "boxed up" and put on a shelf in MinIO.
2.  **AI Model Storage (MLflow)**: Our AI models (the "Brains") are large files stored in a dedicated MinIO bucket.
3.  **Audit Logs**: When we archive old tickets to keep the main system fast, they are moved into MinIO for long-term storage.

---

## 3. Key Highlights & Features
- **S3 Compatible**: MinIO speaks the same "language" as Amazon Web Services (AWS). This means if we ever grow too big for our local servers, we can move everything to the cloud without changing a single line of code.
- **High Availability**: Even if one part of the system fails, MinIO is designed to keep your "boxes" safe and accessible.
- **Security**: Every aisle (Bucket) can be locked with specific keys, so only the right service can see the right data.

---

## 4. How to Use the "Warehouse Console" (MinIO UI)
You can walk through the warehouse aisles yourself using the web interface:

1.  **Access the Console**: Visit `http://localhost:9001`.
2.  **Login**: Use `minioadmin` / `minioadmin`.
3.  **Browse Buckets**: Click on "Buckets" in the left menu to see our different aisles (e.g., `backups`, `mlflow`, `audit-archives`).
4.  **Upload/Download**: You can manually drag and drop files here just like using Google Drive or Dropbox.

### 💡 Example Scenario: "I need to recover a backup from 2 days ago"
1.  Log into the **MinIO Console**.
2.  Open the **`backups`** bucket.
3.  Look for the file labeled with the date you need (e.g., `backup-2026-04-22.sql.gz`).
4.  Click the "Download" button to get the file.

---

## 5. Potential Issues & Risks
Even an infinite warehouse has some rules:

### ⚠️ "Out of Space"
While the warehouse is "infinite" in theory, it is limited by the actual hard drive space on your server.
- **Symptom**: You see "Disk Full" errors in the system logs.
- **Solution**: Delete old backups or add a larger hard drive to the server.

### ⚠️ "Key Mismatch"
If the API "Key" (password) is changed in MinIO but not updated in our backend code, the manager will refuse to hand over the boxes.
- **Symptom**: "Access Denied" errors in the `tickets_api` logs.

---

## 6. Accessing the Warehouse
- **Web Console (Human View)**: `http://localhost:9001`
- **API Endpoint (Machine View)**: `http://localhost:9000`
- **Default Credentials**: `minioadmin` / `minioadmin` (Change these in production!)

> [!TIP]
> MinIO is extremely fast at serving images and large files. If your application starts feeling slow when loading documents, check the **Object Latency** in the Grafana dashboards.
