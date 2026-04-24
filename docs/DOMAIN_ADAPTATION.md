# Domain Adaptation & Customization Guide

This guide explains how to adapt the TicketIQ Intelligence engine to new business domains (e.g., HR, Finance, Legal, or Industry-specific IT).

## 1. Concept: The "Intelligence Mesh"
TicketIQ is designed to be domain-agnostic. By updating a few configuration layers, you can transition from "IT Infrastructure" to any other support domain.

## 2. Step 1: Updating the Taxonomy
The primary way to adapt the domain is by modifying the `Category` enum.

**Location**: `backend/src/schemas/ticket.py`

Modify the categories to match your business:
```python
class Category(str, Enum):
    # IT Default
    INFRASTRUCTURE = "infrastructure"
    
    # HR Example
    PAYROLL = "payroll"
    RECRUITMENT = "recruitment"
    BENEFITS = "benefits"
```

## 3. Step 2: Prompt Engineering
The AI Classifier uses system prompts to understand how to categorize tickets. 

**Location**: `backend/src/ml/classifier.py`

Update the `SYSTEM_PROMPT` to include descriptions for your new categories. This helps the LLM understand the context of your specific business.

## 4. Step 3: Runbook Adaptation
Runbooks provide the "intelligence" for resolution suggestions.

**Location**: `backend/src/ml/rag_service.py` (or through the Admin UI)

1. **Ingest Domain Knowledge**: Upload PDFs or Markdown files related to your new domain into the RAG vector store.
2. **Standard Operating Procedures (SOPs)**: Ensure the AI has access to the specific steps your team takes for each new category.

## 5. Step 4: Routing & Folders
Update the departmental routing logic to ensure tickets land in the correct team folders.

**Location**: `backend/src/services/routing_service.py`

## 6. Testing the Adaptation
Use the **Agentic Simulation** feature to test your new domain:
1. Create 10-20 sample tickets for the new domain.
2. Run the `seed_enterprise_data.py` script with your custom ticket templates.
3. Verify that the **Intelligence Dashboard** correctly reflects the new departmental distribution.

## 7. Metrics Calibration
* **Sentiment Thresholds**: Different industries have different "baselines" for frustration. Adjust thresholds in `ticket_service.py` if needed.
* **SLA Definitions**: Legal or Finance may require faster/slower SLAs than IT. Update the `predictive_service.py` to reflect these business rules.

---
**Status**: Ready for Enterprise Deployment.
