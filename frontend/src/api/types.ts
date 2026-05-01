// RFC 7807 Problem Details
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
}

// Folder types
export interface Folder {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  version: number
}

export interface CreateFolderRequest {
  name: string
}

export interface RenameFolderRequest {
  name: string
  version: number
}

export interface FolderListResponse {
  folders: Folder[]
  next_cursor: string | null
}

export interface FolderStat {
  id: string
  name: string
  total_tickets: number
  open_tickets: number
  resolved_tickets: number
  sla_breaches: number
  efficiency: number
}

export interface FolderStatsResponse {
  stats: FolderStat[]
  total_folders: number
}

// Ticket types
export interface Ticket {
  id: string
  ticket_number?: string
  title: string
  description: string
  raw_payload: string
  input_format: 'text' | 'json_log' | 'otlp_trace' | 'prometheus_alert'
  category: string
  status: string
  priority: string
  routing_status: 'pending_classification' | 'routed' | 'escalated' | 'resolved'
  confidence_score: number
  source_channel?: string
  causal_context: Record<string, unknown> | null
  parse_warning: string | null
  owner_id: string
  created_at: string
  updated_at: string
  evaluation_matrix: EvaluationMatrix | null
  is_automation_candidate?: boolean
  is_repeated_issue?: boolean
  automation_status?: string
  automation_output?: string | null
  automation_simulation_report?: string | null
  automation_runbook_id?: string | null
  automation_verification_json?: string | null
  sentiment_score?: number
  impact_score?: number
  intelligence_priority?: string
  complexity_score?: number
  estimated_resolution_at?: string
  sla_status?: string
  resolution_details?: string
  hold_type?: string
  status_changed_at?: string
}

export interface SimilarTicket {
  id: string
  title: string
  category: string
  description?: string
  resolution_summary: string
  similarity_score: number
}

export interface ResolutionSuggestion {
  steps: string[]
  source_ticket_ids: string[]
  root_cause?: string
  low_retrieval_confidence?: boolean
}

export interface EvaluationMatrix {
  accuracy: number
  f1_score: number
  solution_design: number
  usability: number
  feasibility: number
  security: number
  innovation: number
  semantic_similarity: number
  judge_explanation: string
}

export interface ClassificationResponse {
  id: string
  ticket_number?: string
  title: string
  description: string
  owner_id: string
  category: string
  confidence_score: number
  priority: string
  routing_status: string
  causal_signal: string | null
  parse_warning: string | null
  similar_tickets: SimilarTicket[]
  resolution_suggestion: ResolutionSuggestion | null
  evaluation_matrix: EvaluationMatrix | null
  assigned_department: string | null
  source_channel?: string
  lifecycle_stage: string | null
  is_automation_candidate?: boolean
  is_repeated_issue?: boolean
  automation_status?: string
  automation_output?: string | null
  automation_simulation_report?: string | null
  automation_runbook_id?: string | null
  automation_verification_json?: string | null
  sentiment_score?: number
  impact_score?: number
  intelligence_priority?: string
  complexity_score?: number
  estimated_resolution_at?: string
  sla_status?: string
  status: string
  roi_value_saved?: number
  resolution_time_ms?: number
  resolution_details?: string
  hold_type?: string
  status_changed_at?: string
  input_format?: 'text' | 'json_log' | 'otlp_trace' | 'prometheus_alert'
}

export interface CreateTicketRequest {
  title: string
  description: string
  priority?: string
  source_channel?: string
  enable_judge?: boolean
  structured_payload?: Record<string, any>
  owner_id?: string
}

export interface TicketListResponse {
  tickets?: Ticket[]
  escalations?: Ticket[]
  automation_candidates?: Ticket[]
  page: number
  page_size: number
  total_pages: number
  total: number
}

// Escalation types
export interface AutomationCandidate extends Ticket {}
export interface EscalationTicket extends Ticket {
  similar_tickets: SimilarTicket[]
}

export interface OverrideRequest {
  corrected_category: string
  agent_id: string
}

// Pattern alert types
export interface PatternAlert {
  id: string
  cluster_size: number
  representative_title: string
  category: string
  window_start: string
  window_end: string
  status: 'active' | 'acknowledged' | 'snoozed' | 'dismissed'
  snoozed_until: string | null
  created_at: string
  updated_at: string
}

export interface PatternAlertUpdateRequest {
  status: 'acknowledged' | 'snoozed' | 'dismissed'
  snoozed_until?: string
}

// Model metrics types
export interface ModelMetrics {
  macro_f1: number
  per_category_f1: Record<string, number>
  semantic_similarity: number
  llm_judge_routing_correctness: number
  llm_judge_resolution_relevance: number
  hallucination_rate: number
  last_updated: string
}

// Semantic Graph types
export interface GraphNode {
  id: string
  label: string
  category: string
  status: string
  is_target: boolean
}

export interface GraphEdge {
  from: string
  to: string
  strength: number
}

export interface SemanticGraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  cluster_name: string
  total_correlated: number
}

// Copilot types
export interface CopilotSummaryResponse {
  summary: string
}

export interface CopilotDraftResponse {
  draft: string
}

// Global types
export interface TranslationResponse {
  title: string
  description: string
  language: string
}

export interface GlobalInsight {
  title: string
  category: string
  resolution_summary: string
  matching_score: number
  tenant_hint: string
}

// Governance types
export interface AuditSnapshot {
  id: string
  audit_log_id: string
  created_at: string
  state: {
    ticket_intelligence: {
      sentiment_score: number
      impact_score: number
      complexity_score: number
      intelligence_priority: string
      confidence_score: number
      category_at_time: string
    }
    automation_state: {
      is_candidate: boolean
      status: string
    }
    system_health: {
      timestamp: string
      node: string
      compliance_mode: string
    }
  }
}
