import { apiClient } from './client'
import {
  Ticket,
  CreateTicketRequest,
  ClassificationResponse,
  TicketListResponse,
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

  // List all tickets with filtering
  list: async (params?: {
    cursor?: string
    limit?: number
    status?: string
    category?: string
    routing_status?: string
  }): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>('/tickets', { params })
    return response.data
  },
}
