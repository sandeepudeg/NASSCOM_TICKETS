# 🧠 MLflow Registry: The AI "Training Academy & Hall of Fame"

This document provides a non-technical and technical overview of our AI Model Registry using MLflow in the TicketIQ infrastructure.

---

## 1. MLflow for Laymen: The "Training Academy" Analogy
Imagine we are training a team of athletes (AI Models). Before we let them play in a real game (process your tickets), we need to track their progress and decide who is the best.

- **The Experiments (Training Sessions)**: This is where we group our training together. For example, "Aisle Classification Training v1."
- **The Runs (Practice Rounds)**: Every time we train the AI, we record a "Run." We write down their stats: How many questions did they get right? How fast were they?
- **The Artifacts (The Equipment)**: This is the actual "Brain" file that the AI uses to think. We keep it safe in our **Digital Warehouse (MinIO)**.
- **The Model Registry (The Hall of Fame)**: Once we find an athlete that is amazing, we "Register" them. We then give them a status:
    - **Staging**: They are practicing with the team but not in the game yet.
    - **Production**: They are the "Starter." They are the ones currently handling your tickets!

**MLflow ensures that we always know exactly which version of the AI is "playing" and why we chose them over the others.**

---

## 2. How it is used in TicketIQ
In our application, our AI is constantly learning. MLflow acts as the **Manager** for our AI models.

### The Lifecycle of a Model:
1.  **Training**: A developer trains a new model to recognize "Network Errors."
2.  **Tracking**: The stats (accuracy, speed) are sent to MLflow.
3.  **Review**: An administrator looks at the stats in the MLflow UI.
4.  **Promotion**: The administrator clicks a button to move the new model into "Production."
5.  **Deployment**: Our API automatically sees the change and starts using the new "Brain" instantly.

---

## 3. Key Highlights & Features
- **Reproducibility**: We can see exactly what code and data were used to train a model from 6 months ago.
- **Version Control**: If a new model starts making mistakes, we can "Roll Back" to the previous version with one click.
- **Comparison**: You can select two models and see a "Side-by-Side" comparison of their accuracy.

---

## 4. How to Use the "Academy Office" (MLflow UI)
You can oversee our AI athletes here:

1.  **Access the UI**: Visit `http://localhost:5000`.
2.  **Check for Experiments**: Click on "Experiments" in the left sidebar.

> [!NOTE]
> **If you see "No experiments yet":**
> This means you haven't run any training sessions. To populate the UI with sample data so you can practice, run this command in your terminal:
> ```powershell
> python scripts/seed_mlflow.py
> ```
> This will create 5 "Practice Rounds" and a "Ticket Classifier" experiment for you to explore.

3.  **Browse Experiments**: Click on "Experiments" to see the past training rounds.
3.  **Compare Models**:
    - Select two or more "Runs."
    - Click **Compare**.
    - Look at the "Accuracy" column to see who won.
4.  **The Registry**: Click on "Models" at the top to see our current "Hall of Famers."

### 🚀 Practical Step-by-Step Example: "The Smarter Classifier"
*Scenario: You just trained a new version of the AI that is 10% more accurate at finding "Security" tickets. Here is how you put it into the real game:*

1.  **Find the Session**: Open `http://localhost:5000` and click on the "Ticket Classifier" experiment on the left.
2.  **Check the Scoreboard**: Look at the list of "Runs." You'll see your latest one at the top. Check the `accuracy` column. If it says `0.95` (95%), it's a winner!
3.  **Register the Athlete**:
    - Click on the name of that specific "Run."
    - Scroll down to the "Artifacts" section.
    - Click on the folder named `model`.
    - Click the blue **Register Model** button.
    - Select `ticket-classifier` from the list and click **Register**.
4.  **The Hall of Fame Review**:
    - Click **Models** at the top of the screen.
    - Click on `ticket-classifier`.
    - You will see your new version (e.g., "Version 6") sitting there with no status.
5.  **Go Pro (Production)**:
    - Click on "Version 6."
    - Click the **Stage** dropdown (top right) and select **Transition to -> Production**.
    - Confirm the change.
6.  **The Result**: The "Version 5" athlete is now "Retired," and "Version 6" is now handling every ticket that comes into the building!

---

## 5. Potential Issues & Risks
Training AI can be tricky:

### ⚠️ "The Brain is Missing"
MLflow stores the *stats* in its own database, but the actual *model file* is in MinIO.
- **Symptom**: You see the model in MLflow, but the API says "File Not Found."
- **Solution**: Ensure the `tickets_minio` container is running and healthy.

### ⚠️ "Overfitting" (The "Studying for the Test" Risk)
Sometimes a model looks like a genius in the Academy (100% accuracy) but fails in the real world.
- **Prevention**: We use "Validation Data" that the AI has never seen before to make sure it's actually smart, not just memorizing.

---

## 6. Accessing the Academy
- **Web UI (Human View)**: `http://localhost:5000`
- **Storage Path**: `s3://mlflow/` (Inside MinIO)
- **Tracking URI**: `http://mlflow:5000` (Used by the API)

> [!TIP]
> Use the **"Search"** bar in the Experiments tab to find models trained on specific dates or with specific levels of accuracy (e.g., `metrics.accuracy > 0.9`).
