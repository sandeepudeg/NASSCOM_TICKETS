import { apiClient } from './client'

export interface DashboardSummary {
  trend_24h: Array<{ name: string; value: number }>;
  avg_sentiment_percent: number;
  throughput_per_hour: number;
  system_status: string;
}

export const analyticsApi = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/analytics/dashboard-summary')
    return response.data
  }
}
