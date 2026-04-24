import { apiClient } from './client'
import {
  Ticket,
  CreateTicketRequest,
  ClassificationResponse,
  TicketListResponse,
  SemanticGraphResponse,
  CopilotSummaryResponse,
  CopilotDraftResponse,
  TranslationResponse,
  GlobalInsight,
  AuditSnapshot,
} from './types'

export const ticketsApi = {
  // Submit a new ticket
  create: async (data: CreateTicketRequest): Promise<ClassificationResponse> => {
    const response = await apiClient.post<ClassificationResponse>('/tickets', data)
    return response.data
  },

  // Get ticket classification result
  getClassification: async (ticketId: string): Promise<ClassificationResponse> => {
    const response = await apiClient.get<ClassificationResponse>(
      `/tickets/${ticketId}/classification`
    )
    return response.data
  },

  // Get a single ticket
  get: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.get<Ticket>(`/tickets/${ticketId}`)
    return response.data
  },

  getTicketGraph: async (id: string): Promise<SemanticGraphResponse> => {
    const { data } = await apiClient.get(`/tickets/${id}/graph`)
    return data
  },

  summarizeTicket: async (id: string): Promise<CopilotSummaryResponse> => {
    const { data } = await apiClient.post(`/tickets/${id}/summarize`)
    return data
  },

  draftTicketReply: async (id: string, audience: 'customer' | 'engineer'): Promise<CopilotDraftResponse> => {
    const { data } = await apiClient.post(`/tickets/${id}/draft`, null, {
      params: { audience }
    })
    return data
  },

  translateTicket: async (id: string, targetLang: string = 'English'): Promise<TranslationResponse> => {
    const { data } = await apiClient.post(`/tickets/${id}/translate`, null, {
      params: { target_lang: targetLang }
    })
    return data
  },

  getGlobalInsights: async (id: string): Promise<GlobalInsight[]> => {
    const { data } = await apiClient.get(`/tickets/${id}/global-insights`)
    return data
  },

  getTicketSnapshots: async (id: string): Promise<AuditSnapshot[]> => {
    const { data } = await apiClient.get(`/tickets/${id}/snapshots`)
    return data
  },

  // List all tickets with filtering
  list: async (params?: {
    cursor?: string
    limit?: number
    status?: string
    category?: string
    routing_status?: string
    sla_breach?: boolean
  }): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>('/tickets', { params })
    return response.data
  },

  // Agentic Fix Simulation
  simulateFix: async (ticketId: string): Promise<{ report: string }> => {
    const response = await apiClient.post<{ report: string }>(`/tickets/${ticketId}/simulate`)
    return response.data
  },

  // Automation Execution
  remediateFix: async (ticketId: string): Promise<{ success: boolean; output: string }> => {
    const response = await apiClient.post<{ success: boolean; output: string }>(`/tickets/${ticketId}/remediate`)
    return response.data
  },
  
  getImportTemplates: async (): Promise<Record<string, Record<string, string>>> => {
    const { data } = await apiClient.get('/tickets/import/templates')
    return data
  },

  dispatchDrafts: async (ticketId: string, drafts: { customer_draft: string; engineer_note: string }): Promise<ClassificationResponse> => {
    const response = await apiClient.post<ClassificationResponse>(`/tickets/${ticketId}/dispatch`, drafts)
    return response.data
  },
}
