# skills.md — Tickets Folder Feature

skills:
  - name: folder-management
    description: Create, list, rename, and delete ticket folders. Supports soft-delete, pagination, and name filtering.
    input: operation (create|list|rename|delete), folder_name, folder_id, pagination params, sort options.
    output: Folder object with id, name, owner_id, created_at, updated_at, version, deleted_at.
    error_handling: Return validation errors for empty/invalid names, duplicate names, not-found errors, limit-exceeded errors.

  - name: ticket-assignment
    description: Assign and remove tickets from folders. Supports single and bulk assignment with transaction rollback.
    input: folder_id, ticket_ids (single or list up to 100), operation (assign|remove|bulk-assign).
    output: Assignment result with assigned_at timestamps, or HTTP 207 Multi-Status for partial failures.
    error_handling: Return already-assigned, not-found errors. Rollback entire batch on any failure.

  - name: ticket-classification
    description: Classify incoming tickets into one of seven categories using local LLM (Ollama) with confidence scoring.
    input: ticket (title, description, optional structured payload - JSON log, OTLP trace, Prometheus alert).
    output: category, confidence_score (0.0-1.0), routing_status, causal_context, parse_warning.
    error_handling: Queue for async retry if LLM unavailable (pending_classification status).

  - name: rag-similarity-search
    description: Retrieve semantically similar resolved tickets using RAG pipeline with vector store.
    input: ticket text, top_k (default 5), similarity_threshold (default 0.70).
    output: Array of similar_tickets with id, title, category, resolution_summary, similarity_score.
    error_handling: Return low_retrieval_confidence flag if fewer than 2 matches found.

  - name: resolution-suggestion
    description: Generate actionable resolution steps from similar past tickets using RAG.
    input: similar_tickets context, current ticket text.
    output: ranked ordered list of up to 5 steps, source_ticket_ids array.
    error_handling: Return empty suggestion if retrieval confidence is low.

  - name: escalation-handling
    description: Handle ticket escalation when confidence_score falls below threshold. Notify via webhook.
    input: ticket, confidence_score, escalation_threshold (default 0.65).
    output: routing_status (escalated), webhook notification status.
    error_handling: Retry webhook with exponential backoff on failure, log audit event.

  - name: pattern-detection
    description: Detect repeated issues across tickets within sliding time window and suggest automation.
    input: time_window_days (default 7), similarity_threshold (default 0.80), cluster_size_min (default 3).
    output: PatternAlert with cluster_size, representative_title, suggested_runbook_keyword, ticket_links.
    error_handling: Log alert creation to audit log.

  - name: structured-input-parsing
    description: Parse and extract causal context from structured inputs (JSON logs, OTLP traces, Prometheus alerts).
    input: payload string, format (json_log|otlp_trace|prometheus_alert|text).
    output: causal_context object with error_codes, service_names, severity, timestamps, causal_signal.
    error_handling: Return parse_warning, fallback to plain text on unrecognised format.

  - name: pii-scrubbing
    description: Detect and redact PII from ticket content using Presidio before embedding/storage.
    input: text or structured payload.
    output: scrubbed_text with [EMAIL], [PHONE], [NAME] placeholders, redaction_summary.
    error_handling: Log redaction summary to audit log without storing original PII.

  - name: model-evaluation
    description: Evaluate classifier quality using F1 scores, semantic similarity, and LLM-as-judge metrics.
    input: test dataset, model_version.
    output: macro_f1, per_category_f1[], semantic_similarity, judge_scores (routing, resolution).
    error_handling: Flag categories with F1 < 0.65 for retraining.

  - name: ticket-crud
    description: Create, read, update, delete tickets with proper side-effects on folder associations.
    input: ticket data, operation type.
    output: ticket object with all fields.
    error_handling: Remove folder associations within same transaction on deletion.
