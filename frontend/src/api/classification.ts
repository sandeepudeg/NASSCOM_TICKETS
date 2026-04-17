import { apiClient } from './client'
import {
  EscalationTicket,
  OverrideRequest,
  PatternAlert,
  PatternAlertUpdateRequest,
  AutomationCandidate,
} from './types'

export const classificationApi = {
  // Get escalation queue
  getEscalations: async (params?: {
    cursor?: string
    limit?: number
  }): Promise<{ escalations: EscalationTicket[]; next_cursor: string | null; total: number }> => {
    const response = await apiClient.get('/classification/escalations', { params })
    return response.data
  },

  // Override escalation routing decision
  overrideEscalation: async (
    escalationId: string,
    data: OverrideRequest
  ): Promise<EscalationTicket> => {
    const response = await apiClient.post<EscalationTicket>(
      `/classification/tickets/${escalationId}/override`,
      data
    )
    return response.data
  },

  // Get pattern alerts
  getPatternAlerts: async (params?: {
    cursor?: string
    limit?: number
    status?: 'active' | 'acknowledged' | 'snoozed' | 'dismissed'
  }): Promise<{ alerts: PatternAlert[]; next_cursor: string | null; total: number }> => {
    const response = await apiClient.get('/classification/pattern-alerts', { params })
    return response.data
  },

  // Update pattern alert status
  updatePatternAlert: async (
    alertId: string,
    data: PatternAlertUpdateRequest
  ): Promise<{ status: string }> => {
    let endpoint = `/classification/pattern-alerts/${alertId}/acknowledge`
    if (data.status === 'dismissed') endpoint = `/classification/pattern-alerts/${alertId}/dismiss`
    if (data.status === 'snoozed') endpoint = `/classification/pattern-alerts/${alertId}/snooze`
    
    const response = await apiClient.post<{ status: string }>(endpoint)
    return response.data
  },

  // Get automation candidates
  getAutomationCandidates: async (params?: {
    cursor?: string
    limit?: number
  }): Promise<{ automation_candidates: AutomationCandidate[]; next_cursor: string | null; total: number }> => {
    const response = await apiClient.get('/classification/automation-candidates', { params })
    return response.data
  },
}
