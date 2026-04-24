import { apiClient } from './client'
import {
  Folder,
  CreateFolderRequest,
  RenameFolderRequest,
  FolderListResponse,
  TicketListResponse,
  FolderStatsResponse,
} from './types'

export const foldersApi = {
  // Create a new folder
  create: async (data: CreateFolderRequest): Promise<Folder> => {
    const response = await apiClient.post<Folder>('/folders', data)
    return response.data
  },

  // List folders with pagination and filtering
  list: async (params?: {
    cursor?: string
    limit?: number
    name_prefix?: string
    include_deleted?: boolean
  }): Promise<FolderListResponse> => {
    const response = await apiClient.get<FolderListResponse>('/folders', { params })
    return response.data
  },

  // Get a single folder by ID
  get: async (id: string): Promise<Folder> => {
    const response = await apiClient.get<Folder>(`/folders/${id}`)
    return response.data
  },

  // Rename a folder (with optimistic locking)
  rename: async (id: string, data: RenameFolderRequest): Promise<Folder> => {
    const response = await apiClient.patch<Folder>(`/folders/${id}`, data)
    return response.data
  },

  // Soft-delete a folder
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/folders/${id}`)
  },

  // List tickets in a folder
  listTickets: async (
    folderId: string,
    params?: { 
      cursor?: string; 
      limit?: number;
      status?: string;
      category?: string;
      routing_status?: string;
      sla_breach?: boolean;
      intelligence_priority?: string;
    }
  ): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>(
      `/folders/${folderId}/tickets`,
      { params }
    )
    return response.data
  },

  // Assign a ticket to a folder
  assignTicket: async (folderId: string, ticketId: string): Promise<void> => {
    await apiClient.post(`/folders/${folderId}/tickets/${ticketId}`)
  },

  // Remove a ticket from a folder
  removeTicket: async (folderId: string, ticketId: string): Promise<void> => {
    await apiClient.delete(`/folders/${folderId}/tickets/${ticketId}`)
  },

  // Bulk assign tickets to a folder
  bulkAssign: async (
    folderId: string,
    ticketIds: string[]
  ): Promise<{ successful: string[]; failed: Array<{ ticket_id: string; error: string }> }> => {
    const response = await apiClient.post(`/folders/${folderId}/tickets/bulk`, {
      ticket_ids: ticketIds,
    })
    return response.data
  },

  // Get aggregated stats for all folders
  getStats: async (): Promise<FolderStatsResponse> => {
    const response = await apiClient.get<FolderStatsResponse>('/folders/stats')
    return response.data
  },
}
