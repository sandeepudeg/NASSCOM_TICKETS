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
  created_at: string
  updated_at: string
  evaluation_matrix: EvaluationMatrix | null
  is_automation_candidate?: boolean
  is_repeated_issue?: boolean
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
}

export interface CreateTicketRequest {
  title: string
  description: string
  priority?: string
  source_channel?: string
  enable_judge?: boolean
  structured_payload?: Record<string, any>
}

export interface TicketListResponse {
  tickets?: Ticket[]
  escalations?: Ticket[]
  automation_candidates?: Ticket[]
  next_cursor: string | null
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
