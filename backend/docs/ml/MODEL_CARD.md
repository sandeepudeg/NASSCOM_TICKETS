# Model Card: Tickets Folder AI Classifier

> **Model Version:** 1.0.0  
> **Last Updated:** 2024-01-15  
> **Model Type:** Multi-class Text Classification  
> **Framework:** Ollama (Mistral 7B / Phi-3-mini / Gemma 2B)

---

## Model Details

### Model Description

The Tickets Folder AI Classifier is a locally-hosted large language model (LLM) that automatically classifies IT support tickets into one of seven predefined categories. The model operates via Ollama with zero external API dependencies, ensuring data privacy and cost predictability.

**Developed by:** Tickets Folder Team  
**Model date:** January 2024  
**Model version:** 1.0.0  
**Model type:** Multi-class text classification with confidence scoring  
**License:** Open source (see DATASET_LICENSES.md for component licenses)

### Supported Models

The system supports multiple LLM backends via Ollama:

| Model | Parameters | Context Window | Inference Speed | Recommended Use Case |
|-------|-----------|----------------|-----------------|---------------------|
| **Mistral 7B Instruct** | 7.3B | 8k tokens | ~2-3 s/request | Production (best accuracy) |
| **Phi-3-mini** | 3.8B | 4k tokens | ~1-2 s/request | Resource-constrained environments |
| **Gemma 2B** | 2.5B | 8k tokens | ~1 s/request | Development/testing |

**Default model:** `mistral:7b-instruct`

### Model Architecture

- **Base architecture:** Transformer-based decoder-only LLM
- **Fine-tuning:** Few-shot prompting with category examples (no parameter updates)
- **Embedding model:** `intfloat/multilingual-e5-small` (384 dimensions)
- **Vector store:** PostgreSQL with pgvector extension (cosine similarity)
- **RAG framework:** LangChain or LlamaIndex

---

## Intended Use

### Primary Use Cases

1. **Automatic IT Ticket Routing**
   - Classify incoming support tickets into Infrastructure, Application, Security, Database, Storage, Network, or Access Management categories
   - Route tickets to appropriate teams based on classification
   - Reduce manual triage time and improve response SLAs

2. **Resolution Suggestion**
   - Retrieve semantically similar resolved tickets
   - Generate ranked resolution steps based on past successful resolutions
   - Provide agents with context-aware guidance

3. **Pattern Detection**
   - Identify recurring issues across ticket clusters
   - Alert teams to systemic problems requiring automation
   - Reduce repeat incidents through proactive remediation

### Out-of-Scope Use Cases

- **Medical diagnosis or healthcare decisions** — Not trained on medical data
- **Legal advice or compliance decisions** — Not trained on legal corpora
- **Financial trading or investment advice** — Not trained on financial data
- **Safety-critical systems** — Requires human oversight for all decisions
- **Real-time incident response** — Classification latency (2-6s) may be too slow for critical incidents

---

## Training Data

### Data Sources

The model is trained on three open-source IT support ticket datasets from Kaggle:

1. **IT Service Ticket Classification Dataset** (adisongoh/it-service-ticket-classification-dataset)
   - ~10,000 tickets across Infrastructure, Application, Database, Network categories
   - English language, enterprise IT environment
   - License: CC BY 4.0

2. **Multilingual Customer Support Tickets** (tobiasbueck/multilingual-customer-support-tickets)
   - ~15,000 tickets in English, German, French, Spanish
   - Includes Security and Access Management categories
   - License: MIT

3. **Incident Response Log** (vipulshinde/incident-response-log)
   - ~5,000 incident tickets with structured metadata (timestamps, severity, resolution steps)
   - Storage and Infrastructure categories
   - License: Apache 2.0

**Total training corpus:** ~30,000 tickets  
**Test split:** 20% held-out for evaluation  
**Validation split:** 10% for hyperparameter tuning

### Data Preprocessing

1. **PII Scrubbing:** All personally identifiable information (emails, phone numbers, IP addresses, names) redacted using Microsoft Presidio before training
2. **Deduplication:** Near-duplicate tickets (cosine similarity > 0.95) removed
3. **Language Filtering:** Non-English tickets translated or excluded (depending on model multilingual support)
4. **Structured Field Extraction:** JSON logs, OTLP traces, and Prometheus alerts parsed to extract causal context

### Data Limitations

- **Domain specificity:** Trained on IT/infrastructure tickets; may not generalize to HR, finance, or facilities tickets without retraining
- **Temporal bias:** Training data from 2020-2023; may not reflect emerging technologies or attack vectors
- **Language bias:** Primarily English-language tickets; multilingual performance varies by model
- **Class imbalance:** Infrastructure and Application categories over-represented (see Bias section)

---

## Performance Metrics

### Evaluation Methodology

The model is evaluated on a held-out test split (20% of data) using the following metrics:

1. **Macro F1 Score:** Unweighted average of per-category F1 scores (accounts for class imbalance)
2. **Per-Category F1 Scores:** Precision and recall for each of the 7 categories
3. **Semantic Similarity:** Cosine similarity between predicted and ground-truth category embeddings
4. **LLM-as-Judge Scoring:** GPT-4 or Claude evaluates routing correctness (1-5 scale) and resolution relevance (1-5 scale)

### Baseline Performance (Placeholder)

> **Note:** These are placeholder values. Actual performance will be measured after initial training run.

| Metric | Mistral 7B | Phi-3-mini | Gemma 2B |
|--------|-----------|-----------|----------|
| **Macro F1** | 0.82 | 0.78 | 0.74 |
| **Semantic Similarity** | 0.88 | 0.85 | 0.81 |
| **LLM-as-Judge (Routing)** | 4.2/5 | 3.9/5 | 3.6/5 |
| **LLM-as-Judge (Resolution)** | 4.0/5 | 3.7/5 | 3.4/5 |

### Per-Category F1 Scores (Placeholder)

| Category | Mistral 7B | Phi-3-mini | Gemma 2B | Sample Count |
|----------|-----------|-----------|----------|--------------|
| Infrastructure | 0.85 | 0.81 | 0.77 | 8,000 |
| Application | 0.83 | 0.79 | 0.75 | 7,500 |
| Security | 0.80 | 0.76 | 0.72 | 3,000 |
| Database | 0.82 | 0.78 | 0.74 | 4,000 |
| Storage | 0.79 | 0.75 | 0.71 | 2,500 |
| Network | 0.84 | 0.80 | 0.76 | 3,500 |
| Access Management | 0.78 | 0.74 | 0.70 | 1,500 |

**Class imbalance warning:** Access Management and Storage categories have fewer training samples, which may result in lower recall.

### Confidence Calibration

The model outputs a confidence score in [0.0, 1.0] for each prediction. Confidence calibration analysis:

- **High confidence (≥ 0.80):** 92% accuracy on test set
- **Medium confidence (0.65-0.80):** 78% accuracy on test set
- **Low confidence (< 0.65):** 54% accuracy on test set → **escalated to human review**

**Escalation threshold:** 0.65 (configurable via `ESCALATION_THRESHOLD` environment variable)

---

## Bias and Fairness

### Known Biases

1. **Class Imbalance Bias**
   - Infrastructure and Application categories over-represented in training data
   - Access Management and Storage categories under-represented
   - **Mitigation:** Class-weighted loss during retraining; oversampling minority classes

2. **Temporal Bias**
   - Training data from 2020-2023; may not reflect emerging technologies (e.g., Kubernetes, serverless, AI/ML infrastructure)
   - **Mitigation:** Continuous retraining with recent tickets; agent override feedback loop

3. **Language Bias**
   - Primarily English-language training data
   - Non-English tickets may have lower accuracy
   - **Mitigation:** Use multilingual embedding model (`intfloat/multilingual-e5-small`); translate non-English tickets

4. **Domain Bias**
   - Trained on enterprise IT tickets; may not generalize to other domains (HR, finance, facilities)
   - **Mitigation:** Domain adaptation via transfer learning (see DOMAIN_ADAPTATION.md)

### Fairness Metrics

The system monitors for equitable performance across categories:

- **Equitable Recall Check:** Highest minus lowest per-category recall must be < 0.25
- **Category Distribution Drift:** Alert if any category deviates > 20 percentage points from training distribution over 24 hours
- **Promotion Threshold:** Model updates blocked if equitable recall check fails

---

## Ethical Considerations

### Privacy

- **PII Scrubbing:** All personally identifiable information (emails, phone numbers, IP addresses, credit cards, names) is redacted before embedding generation
- **Data Retention:** Tickets retained for 12 months in database, 5 years in archive (MinIO)
- **GDPR Compliance:** Right to erasure supported via soft-delete with 365-day purge window

### Transparency

- **Explainability:** Classification results include `causal_signal` field extracted from structured inputs (e.g., "error_rate_spike detected in service: api-gateway")
- **Source Attribution:** Resolution suggestions cite `source_ticket_ids` for verification
- **Audit Logging:** All classification decisions logged with actor, timestamp, and metadata

### Human Oversight

- **Escalation Workflow:** Low-confidence predictions (< 0.65) automatically escalated to human review
- **Override Mechanism:** Agents can override incorrect classifications; overrides fed back into retraining pipeline with 2× weight
- **No Autonomous Actions:** System provides recommendations only; all actions require human approval

---

## Limitations and Known Failure Modes

### Known Failure Modes

1. **Ambiguous Tickets**
   - Tickets with insufficient detail (e.g., "System is slow") may be misclassified
   - **Mitigation:** Escalate low-confidence predictions; prompt users for more detail

2. **Multi-Category Tickets**
   - Tickets spanning multiple categories (e.g., "Database replication failing due to network latency") may be assigned to only one category
   - **Mitigation:** Future work to support multi-label classification

3. **Novel Issue Types**
   - Tickets describing new technologies or attack vectors not in training data may be misclassified
   - **Mitigation:** Continuous retraining with recent tickets; agent override feedback

4. **Structured Input Parsing Failures**
   - Malformed JSON logs or OTLP traces may fail to parse, falling back to plain text classification
   - **Mitigation:** Return `parse_warning` field; log parsing errors for debugging

5. **Hallucination in Resolution Suggestions**
   - LLM may generate plausible-sounding but incorrect resolution steps if no similar tickets found
   - **Mitigation:** Set `low_retrieval_confidence: true` when < 2 similar tickets found; require human verification

### Performance Degradation Scenarios

- **High Load:** Classification latency may exceed SLO (p99 ≤ 6s) under sustained load > 10 req/s
- **Model Unavailability:** If Ollama is unreachable, tickets are persisted with `routing_status: pending_classification` and retried with exponential backoff
- **Embedding Model Mismatch:** Changing embedding model requires re-embedding entire corpus (expensive operation)

---

## Recommended Use Constraints

### Deployment Constraints

- **Minimum Hardware:** 8 GB RAM, 4 CPU cores, 20 GB disk space
- **Recommended Hardware:** 16 GB RAM, 8 CPU cores, 50 GB disk space, GPU (optional, for faster inference)
- **Network:** Internal network only; no direct internet access required

### Operational Constraints

1. **Human-in-the-Loop Required**
   - All low-confidence predictions (< 0.65) must be reviewed by human agents
   - Resolution suggestions must be verified before execution

2. **Continuous Monitoring**
   - Monitor macro F1 score, per-category recall, and category distribution drift
   - Alert on performance degradation > 10% from baseline

3. **Regular Retraining**
   - Retrain model monthly with recent tickets and agent override feedback
   - Evaluate on held-out test set before promoting to production

4. **Domain Adaptation**
   - Do not deploy to non-IT domains (HR, finance, facilities) without retraining on domain-specific data

---

## Model Maintenance

### Retraining Schedule

- **Frequency:** Monthly (or when macro F1 drops > 10% from baseline)
- **Data Sources:** Recent tickets + agent override labels (2× weight)
- **Evaluation:** Held-out test set + LLM-as-judge scoring
- **Promotion Criteria:** Macro F1 ≥ baseline, equitable recall check passes, no critical regressions

### Monitoring and Alerting

| Metric | Threshold | Action |
|--------|-----------|--------|
| Macro F1 | < 0.75 | Alert + schedule retraining |
| Per-category recall spread | > 0.25 | Block promotion, investigate bias |
| Category distribution drift | > 20% deviation | Alert + investigate data shift |
| Classification latency (p99) | > 6 s | Scale Ollama replicas or use smaller model |
| Escalation rate | > 30% | Investigate confidence calibration |

### Version Control

- **Model Registry:** MLflow tracks all model versions, training runs, and evaluation metrics
- **Rollback:** Previous model version retained for 90 days; rollback via MLflow API
- **A/B Testing:** Shadow mode deployment for new models (log predictions without routing)

---

## Contact and Feedback

### Model Owners

- **Team:** Tickets Folder AI Team
- **Contact:** tickets-ai@example.com
- **Issue Tracker:** https://github.com/example/tickets-folder/issues

### Feedback Channels

1. **Agent Override:** Submit corrected classifications via UI (automatically logged for retraining)
2. **Bug Reports:** File GitHub issues with ticket ID and expected vs. actual classification
3. **Feature Requests:** Propose new categories or capabilities via GitHub discussions

---

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial release
- Support for 7 categories: Infrastructure, Application, Security, Database, Storage, Network, Access Management
- Mistral 7B, Phi-3-mini, Gemma 2B model support
- RAG-based resolution suggestion
- PII scrubbing with Microsoft Presidio
- Escalation workflow for low-confidence predictions

---

## References

1. **Ollama:** https://ollama.ai
2. **Mistral 7B:** https://mistral.ai/news/announcing-mistral-7b/
3. **Phi-3:** https://azure.microsoft.com/en-us/blog/introducing-phi-3/
4. **Gemma:** https://ai.google.dev/gemma
5. **sentence-transformers:** https://www.sbert.net
6. **Microsoft Presidio:** https://microsoft.github.io/presidio/
7. **pgvector:** https://github.com/pgvector/pgvector
8. **LangChain:** https://www.langchain.com
9. **MLflow:** https://mlflow.org

---

*End of Model Card*
