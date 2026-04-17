import { apiClient } from './client'
import { ModelMetrics } from './types'

export const modelApi = {
  // Get model performance metrics
  getMetrics: async (): Promise<ModelMetrics> => {
    const response = await apiClient.get<ModelMetrics>('/model/metrics')
    return response.data
  },
}
