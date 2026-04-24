# 🧠 Ollama LLM: The Infrastructure "Private Librarian"

This document provides a non-technical and technical overview of our local Large Language Model (LLM) engine, Ollama.

---

## 1. Ollama for Laymen: The "Private Librarian" Analogy
Imagine you have a massive library of information, and you need someone to help you summarize books and categorize new arrivals.

- **The Librarian (Ollama)**: This is a highly intelligent assistant that lives entirely inside your building (your server). They don't need the internet, and they never share your secrets with the outside world.
- **The Textbooks (Models)**: These are the "Brains" the librarian has studied.
    - **Mistral**: A fast, reliable general-purpose brain.
    - **Gemma**: A brain designed by Google for high-quality logic.
    - **Llama**: A powerful, creative brain designed by Meta.
- **Reading a Ticket (Inference)**: When a new ticket arrives, the librarian reads it, understands the meaning, and writes a summary or picks a category.

**Ollama is our "Local Intelligence." It gives us the power of a tool like ChatGPT, but with 100% privacy and zero monthly costs.**

---

## 2. How it is used in TicketIQ
Ollama is the engine that drives all our "Smart" features. When the system says "AI is thinking," it is actually talking to Ollama.

### Key Tasks:
1.  **Ticket Classification**: Reading a messy user complaint and deciding if it's "Network" or "Security."
2.  **Resolution Suggestions**: Looking at old tickets and writing a "How-to" guide for the current problem.
3.  **PII Scrubbing**: Identifying and redacting sensitive data (like phone numbers or names) before it gets saved.

---

## 3. Key Highlights & Features
- **Air-Gapped Privacy**: Since the AI runs on your own hardware, no data ever leaves your server. This is critical for handling sensitive internal company issues.
- **Model Swapping**: We can change the "Brain" of the system in seconds without changing any code.
- **GPU Acceleration**: If your server has a graphics card (GPU), Ollama can "think" 10x faster.

---

## 4. How to Use the "Librarian's Tools" (Ollama CLI)
You can talk to the AI directly using the terminal:

1.  **Access the Librarian**: Open your terminal.
2.  **Ask a Question**:
    - Run: `docker exec -it tickets_ollama ollama run llama3.2`
    - Then type: "What are the common signs of a network failure?"
    - The AI will respond to you instantly.
3.  **See the Brains**:
    - Run: `docker exec tickets_ollama ollama list`
    - This shows you all the models currently "memorized" by the system.

### 💡 Example Task: "Testing a New Brain"
If the system is struggling with complex technical tickets, you might want to try a larger model:
1.  Run: `docker exec tickets_ollama ollama pull mistral:7b-instruct`
2.  Once downloaded, update your `.env` file to set `OLLAMA_MODEL=mistral:7b-instruct`.
3.  The system will now use the more advanced Mistral brain for all classification tasks.

---

## 5. Potential Issues & Risks
Intelligence requires a lot of energy:

### ⚠️ "High Latency" (Slow Thinking)
If your server is busy or doesn't have enough RAM, the AI might take 30 seconds to read a single ticket.
- **Observation**: Check the **Ollama Health** panel in Grafana.
- **Solution**: Use a smaller "Brain" like `phi3-mini` or `llama3.2:1b`.

### ⚠️ "Hallucinations" (Confident Mistakes)
Sometimes the AI is *too* confident and picks a wrong category.
- **Mitigation**: We use a "Confidence Score." If the AI is less than 65% sure, it automatically sends the ticket to a human for review.

---

## 6. Accessing the Brain
- **API Endpoint**: `http://localhost:11435` (Internal port 11434)
- **Local Logs**: `docker logs tickets_ollama`

> [!TIP]
> You can download hundreds of different specialized models from [ollama.com/library](https://ollama.com/library) to help with specific tasks like coding, translation, or creative writing.
