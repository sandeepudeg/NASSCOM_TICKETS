# Domain Adaptation Guide

This guide explains how to adapt the Tickets Folder AI classifier to new domains beyond IT support, such as HR, finance, facilities management, or customer service.

## Overview

The system is designed for transfer learning and cross-domain adaptability. You can retrain the classifier for a new domain by:

1. Defining a new category taxonomy in `classifier_config.yaml`
2. Providing labeled training examples (minimum 50 per category)
3. Running the retraining pipeline
4. Optionally swapping the embedding model for domain-specific embeddings

## Step 1: Define Your Category Taxonomy

Edit `classifier_config.yaml` to define categories relevant to your domain.

### Example: HR Domain

```yaml
version: "1.0"

categories:
  - name: Recruitment
    description: Job postings, candidate screening, interview scheduling, offer letters
    examples:
      - "Need to post job opening for senior developer"
      - "Candidate background check pending"
      - "Interview room booking for tomorrow"
    
  - name: Onboarding
    description: New hire paperwork, equipment provisioning, training enrollment
    examples:
      - "New employee needs laptop and access badge"
      - "Onboarding checklist not completed"
      - "Training portal access request"
    
  - name: Payroll
    description: Salary processing, tax forms, direct deposit issues, pay discrepancies
    examples:
      - "Paycheck amount incorrect this month"
      - "Need to update W-4 tax withholding"
      - "Direct deposit not received"
    
  - name: Benefits
    description: Health insurance, retirement plans, leave requests, benefits enrollment
    examples:
      - "How do I enroll in dental insurance?"
      - "Need to add spouse to health plan"
      - "401k contribution not showing up"
    
  - name: Performance
    description: Performance reviews, goal setting, promotion requests, disciplinary actions
    examples:
      - "Annual review form not accessible"
      - "Request for promotion consideration"
      - "Performance improvement plan documentation"
    
  - name: Compliance
    description: Policy violations, harassment reports, legal inquiries, audit requests
    examples:
      - "Workplace harassment complaint"
      - "Need copy of employee handbook"
      - "Audit request for employment records"
    
  - name: Offboarding
    description: Resignations, terminations, exit interviews, equipment return
    examples:
      - "Employee resignation - last day next Friday"
      - "Exit interview scheduling"
      - "Need to collect laptop and badge from departing employee"

min_training_examples: 50
escalation_threshold: 0.65

model:
  ollama_model: "mistral"
  timeout_seconds: 5
  few_shot_examples: 3
```

### Example: Finance Domain

```yaml
version: "1.0"

categories:
  - name: Accounts Payable
    description: Vendor invoices, payment processing, purchase orders, expense reimbursements
    examples:
      - "Vendor invoice needs approval"
      - "Expense report submitted for travel"
      - "Purchase order not matching invoice"
    
  - name: Accounts Receivable
    description: Customer invoices, payment collection, credit management, aging reports
    examples:
      - "Customer payment overdue by 30 days"
      - "Invoice dispute from client"
      - "Need to send payment reminder"
    
  - name: General Ledger
    description: Journal entries, account reconciliation, month-end close, financial reporting
    examples:
      - "Need to post accrual entry"
      - "Bank reconciliation discrepancy"
      - "Month-end close checklist"
    
  - name: Budgeting
    description: Budget planning, variance analysis, forecasting, capital expenditure requests
    examples:
      - "Department budget exceeded by 15%"
      - "Need approval for capital equipment purchase"
      - "Quarterly forecast update required"
    
  - name: Tax
    description: Tax filings, compliance, audits, tax planning, withholding
    examples:
      - "Sales tax return due next week"
      - "Tax audit notice received"
      - "Need to update tax withholding rates"
    
  - name: Payroll Finance
    description: Payroll processing, wage calculations, payroll tax, garnishments
    examples:
      - "Payroll tax deposit failed"
      - "Overtime calculation incorrect"
      - "Garnishment order received for employee"
    
  - name: Treasury
    description: Cash management, banking, investments, foreign exchange, debt management
    examples:
      - "Cash flow projection needed"
      - "Wire transfer authorization required"
      - "Foreign exchange rate lock request"

min_training_examples: 50
escalation_threshold: 0.65

model:
  ollama_model: "mistral"
  timeout_seconds: 5
  few_shot_examples: 3
```

### Example: Facilities Management Domain

```yaml
version: "1.0"

categories:
  - name: HVAC
    description: Heating, ventilation, air conditioning issues, temperature control
    examples:
      - "Conference room too cold"
      - "AC not working on 3rd floor"
      - "Thermostat not responding"
    
  - name: Electrical
    description: Power outages, lighting issues, electrical repairs, circuit breakers
    examples:
      - "Lights flickering in hallway"
      - "Power outlet not working"
      - "Circuit breaker keeps tripping"
    
  - name: Plumbing
    description: Leaks, clogs, water pressure, restroom issues, water heaters
    examples:
      - "Sink leaking in break room"
      - "Toilet clogged in men's restroom"
      - "No hot water in kitchen"
    
  - name: Cleaning
    description: Janitorial services, waste removal, sanitation, pest control
    examples:
      - "Trash not emptied yesterday"
      - "Spill in lobby needs cleanup"
      - "Pest sighting in storage room"
    
  - name: Security
    description: Access control, surveillance, alarms, visitor management, locks
    examples:
      - "Badge reader not working at entrance"
      - "Security camera offline"
      - "Need to add visitor to access list"
    
  - name: Maintenance
    description: General repairs, preventive maintenance, equipment servicing, inspections
    examples:
      - "Door hinge broken in conference room"
      - "Elevator making strange noise"
      - "Annual fire extinguisher inspection due"
    
  - name: Space Management
    description: Office moves, furniture requests, space allocation, renovations
    examples:
      - "Need to move team to larger office"
      - "Request for additional desk and chair"
      - "Conference room booking conflict"

min_training_examples: 50
escalation_threshold: 0.65

model:
  ollama_model: "mistral"
  timeout_seconds: 5
  few_shot_examples: 3
```

## Step 2: Prepare Training Dataset

Create a training dataset with labeled examples in JSON format. Each example must include:

- `title`: Short summary of the ticket
- `description`: Detailed description
- `category`: One of the categories defined in your config
- `domain`: (optional) Domain identifier for multi-domain deployments

### Dataset Format

```json
[
  {
    "ticket_id": "hr-001",
    "title": "New employee needs laptop",
    "description": "John Smith starts Monday and needs a laptop, monitor, and access badge provisioned.",
    "category": "Onboarding",
    "domain": "hr",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "ticket_id": "hr-002",
    "title": "Paycheck amount incorrect",
    "description": "My paycheck this month is $500 less than expected. I worked 40 hours each week.",
    "category": "Payroll",
    "domain": "hr",
    "created_at": "2024-01-15T11:00:00Z"
  },
  {
    "ticket_id": "hr-003",
    "title": "How do I enroll in dental insurance?",
    "description": "I want to add dental coverage for my family. What's the process and deadline?",
    "category": "Benefits",
    "domain": "hr",
    "created_at": "2024-01-15T11:30:00Z"
  }
]
```

### Minimum Requirements

- **At least 50 labeled examples per category** (more is better)
- **Balanced distribution** across categories (avoid 500 examples for one category and 50 for another)
- **Representative examples** covering common variations and edge cases
- **Clean labels** - ensure category assignments are correct and consistent

### Data Collection Strategies

1. **Historical tickets**: Export and label past tickets from your existing system
2. **Synthetic generation**: Use an LLM to generate realistic examples (review and validate all generated examples)
3. **Active learning**: Start with a small labeled set, deploy, and label escalated tickets
4. **Crowdsourcing**: Have domain experts label a shared dataset

## Step 3: Store Dataset in MinIO

Upload your training dataset to the MinIO object storage bucket:

```bash
# Using MinIO client (mc)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc cp training_data.json local/tickets/datasets/raw/hr_tickets.json

# Or using Python
from minio import Minio

client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

client.fput_object(
    "tickets",
    "datasets/raw/hr_tickets.json",
    "training_data.json"
)
```

## Step 4: Run Retraining Pipeline

Execute the retraining script to fine-tune the classifier on your domain-specific data:

```bash
python retrain_classifier.py \
  --dataset datasets/raw/hr_tickets.json \
  --config classifier_config.yaml \
  --output-model hr_classifier_v1 \
  --min-f1-threshold 0.75
```

The retraining pipeline will:

1. Load your dataset from MinIO
2. Apply PII scrubbing to all text fields
3. Merge any agent override labels from production (weighted 2×)
4. Split data into train/validation/test sets (70/15/15)
5. Fine-tune or prompt-tune the base Ollama model
6. Evaluate on test set (macro F1, per-category F1, semantic similarity)
7. Run LLM-as-judge scoring for routing correctness and resolution relevance
8. Register the model in MLflow if it meets quality thresholds
9. Generate evaluation report with confusion matrix and failure analysis

### Retraining Parameters

```bash
python retrain_classifier.py --help

Options:
  --dataset TEXT              Path to training dataset in MinIO [required]
  --config TEXT               Path to classifier config YAML [default: classifier_config.yaml]
  --output-model TEXT         Model name for MLflow registry [required]
  --min-f1-threshold FLOAT    Minimum macro F1 to register model [default: 0.75]
  --train-split FLOAT         Training set proportion [default: 0.70]
  --val-split FLOAT           Validation set proportion [default: 0.15]
  --test-split FLOAT          Test set proportion [default: 0.15]
  --epochs INT                Training epochs [default: 3]
  --learning-rate FLOAT       Learning rate [default: 2e-5]
  --batch-size INT            Batch size [default: 16]
  --override-weight FLOAT     Weight multiplier for agent overrides [default: 2.0]
```

## Step 5: Evaluate Model Performance

Review the evaluation report generated by the retraining pipeline:

```bash
cat evaluation_report_<run_id>.json
```

Key metrics to check:

- **Macro F1 score**: Should be ≥ 0.75 (average across all categories)
- **Per-category F1**: Check for imbalanced performance (no category should be < 0.60)
- **Confusion matrix**: Identify common misclassifications
- **Semantic similarity**: Measures embedding quality (should be ≥ 0.80)
- **LLM-as-judge scores**: Routing correctness and resolution relevance (1-5 scale)

### Example Evaluation Report

```json
{
  "run_id": "abc123",
  "model_name": "hr_classifier_v1",
  "timestamp": "2024-01-15T14:30:00Z",
  "metrics": {
    "macro_f1": 0.82,
    "weighted_f1": 0.84,
    "accuracy": 0.85,
    "per_category_f1": {
      "Recruitment": 0.88,
      "Onboarding": 0.85,
      "Payroll": 0.79,
      "Benefits": 0.81,
      "Performance": 0.76,
      "Compliance": 0.83,
      "Offboarding": 0.80
    },
    "semantic_similarity": 0.87,
    "llm_judge_routing_correctness": 4.2,
    "llm_judge_resolution_relevance": 3.9
  },
  "confusion_matrix": { ... },
  "failure_analysis": [
    {
      "ticket_id": "hr-042",
      "true_category": "Payroll",
      "predicted_category": "Benefits",
      "confidence": 0.68,
      "reason": "Ticket mentioned '401k' which overlaps with benefits"
    }
  ]
}
```

## Step 6: Deploy New Model

If the model meets quality thresholds, it will be automatically registered in MLflow. To deploy it:

1. **Update environment variable** to point to the new model:

```bash
# In .env file
OLLAMA_MODEL=hr_classifier_v1
```

2. **Restart the backend service**:

```bash
docker compose restart backend
```

3. **Monitor production metrics** in Grafana:
   - Classification confidence distribution
   - Escalation rate (should be < 20%)
   - Per-category prediction volume
   - Latency (p99 should be < 6s)

## Step 7: (Optional) Swap Embedding Model

For domain-specific embeddings, you can swap the sentence-transformer model:

### Available Embedding Models

| Model | Dimension | Use Case | Performance |
|-------|-----------|----------|-------------|
| `all-MiniLM-L6-v2` | 384 | General purpose (default) | Fast, good quality |
| `all-mpnet-base-v2` | 768 | Higher quality, slower | Best quality |
| `paraphrase-multilingual-MiniLM-L12-v2` | 384 | Multilingual support | Good for non-English |
| `msmarco-distilbert-base-v4` | 768 | Semantic search optimized | Best for retrieval |
| `sentence-t5-base` | 768 | Latest architecture | Experimental |

### How to Swap

1. **Set environment variable**:

```bash
# In .env file
EMBEDDING_MODEL=all-mpnet-base-v2
```

2. **Restart backend** (model will be downloaded on first use):

```bash
docker compose restart backend
```

3. **Re-embed existing tickets** (required if changing dimension):

```bash
python scripts/reembed_tickets.py --model all-mpnet-base-v2
```

**Note**: Changing embedding dimension (e.g., 384 → 768) requires:
- Database migration to update `vector(N)` column type
- Re-embedding all existing tickets
- Rebuilding vector index

## Step 8: Continuous Improvement

### Active Learning Loop

1. **Monitor escalation queue** - tickets with low confidence are escalated for human review
2. **Agent overrides** - when agents correct classifications, these are logged as high-quality labels
3. **Periodic retraining** - run retraining weekly/monthly with accumulated overrides
4. **Bias detection** - monitor per-category recall to ensure equitable performance

### Bias Detection

The evaluation pipeline includes bias detection:

```bash
python evaluate_classifier.py --check-bias

Bias Report:
- Class imbalance: Recruitment (850 samples), Compliance (120 samples) ⚠️
- Recall spread: 0.88 - 0.62 = 0.26 (threshold: 0.25) ⚠️
- Recommendation: Oversample Compliance category or use class-weighted loss
```

If bias is detected, the retraining pipeline will:
1. Attempt class-weighted loss function
2. Apply SMOTE oversampling for minority classes
3. Block model promotion if recall spread > 0.25

## Troubleshooting

### Low F1 Score (< 0.75)

**Causes**:
- Insufficient training data (< 50 examples per category)
- Imbalanced dataset (one category dominates)
- Overlapping category definitions (ambiguous boundaries)
- Poor quality labels (inconsistent or incorrect)

**Solutions**:
- Collect more labeled examples (target 200+ per category)
- Balance dataset using oversampling or undersampling
- Refine category definitions in `classifier_config.yaml`
- Review and correct mislabeled examples

### High Escalation Rate (> 30%)

**Causes**:
- Model not confident on new domain
- Escalation threshold too high
- Training data not representative of production

**Solutions**:
- Lower `escalation_threshold` in config (try 0.55 instead of 0.65)
- Add more diverse training examples
- Use active learning to label escalated tickets and retrain

### Slow Classification (> 6s p99)

**Causes**:
- Large Ollama model (e.g., Mistral 7B on CPU)
- Embedding model too large
- Network latency to Ollama

**Solutions**:
- Switch to smaller model (e.g., `phi3` or `gemma:2b`)
- Use GPU for Ollama inference
- Use faster embedding model (`all-MiniLM-L6-v2`)
- Increase `classification_timeout_seconds` if acceptable

### Category Confusion

**Causes**:
- Overlapping category definitions
- Insufficient distinguishing features in training data

**Solutions**:
- Review confusion matrix to identify problematic pairs
- Add more examples that clearly distinguish confused categories
- Refine category descriptions to emphasize differences
- Consider merging highly confused categories

## Multi-Domain Deployment

To support multiple domains in a single deployment:

1. **Add domain field** to ticket schema
2. **Create separate configs** per domain (`classifier_config_hr.yaml`, `classifier_config_finance.yaml`)
3. **Route to domain-specific model** based on ticket source or user selection
4. **Maintain separate MLflow models** per domain

Example routing logic:

```python
def get_classifier_for_domain(domain: str) -> TicketClassifier:
    config_map = {
        "hr": "classifier_config_hr.yaml",
        "finance": "classifier_config_finance.yaml",
        "it": "classifier_config.yaml"
    }
    config_path = config_map.get(domain, "classifier_config.yaml")
    return TicketClassifier(config_path=config_path)
```

## License Compliance

When using open-source datasets or models for domain adaptation:

1. **Check licenses** - ensure compatibility with your use case (commercial vs. non-commercial)
2. **Document sources** - maintain `DATASET_LICENSES.md` with all attributions
3. **Respect restrictions** - some datasets prohibit redistribution or require attribution

See `DATASET_LICENSES.md` for current dataset licenses.

## Support

For questions or issues with domain adaptation:

1. Check evaluation report for specific failure modes
2. Review Grafana dashboards for production metrics
3. Consult MLflow experiment tracking for training history
4. Open an issue with evaluation report and config file attached
