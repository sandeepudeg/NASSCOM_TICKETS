import { apiClient } from './client'

export interface Notification {
  id: string
  user_id: string
  type: 'ticket_created' | 'ticket_classified' | 'sla_warning' | 'sla_breach' | 'pattern_detected' | 'urgent_promotion'
  title: string
  message: string
  ticket_id?: string
  is_read: boolean
  created_at: string
}

export const notificationsApi = {
  list: async (unreadOnly: boolean = false): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications', {
      params: { unread_only: unreadOnly }
    })
    return data
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all')
  }
}
