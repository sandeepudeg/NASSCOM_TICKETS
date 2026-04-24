import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ClassificationResultPanel from '../ClassificationResultPanel'
import { ticketsApi } from '../../api/tickets'
import { ClassificationResponse } from '../../api/types'

// Mock the tickets API
vi.mock('../../api/tickets', () => ({
  ticketsApi: {
    getClassification: vi.fn(),
  },
}))

describe('ClassificationResultPanel Component', () => {
  let queryClient: QueryClient

  const mockClassificationResponse: ClassificationResponse = {
    id: 'ticket-123',
    title: 'System Alert',
    description: 'Manual test ticket',
    owner_id: 'agent-1',
    category: 'Infrastructure',
    status: 'open',
    confidence_score: 0.87,
    priority: 'P2',
    routing_status: 'routed',
    causal_signal: 'error_rate_spike detected in service: api-gateway',
    parse_warning: null,
    similar_tickets: [
      {
        id: 'ticket-456',
        title: 'API gateway 502 errors',
        category: 'Infrastructure',
        resolution_summary: 'Restarted upstream pods and cleared connection pool',
        similarity_score: 0.91,
      },
      {
        id: 'ticket-789',
        title: 'Gateway timeout issues',
        category: 'Infrastructure',
        resolution_summary: 'Increased timeout configuration and scaled replicas',
        similarity_score: 0.85,
      },
    ],
    resolution_suggestion: {
      steps: [
        'Check pod health status in the api-gateway namespace',
        'Review ingress logs for connection errors',
        'Verify upstream service availability',
      ],
      source_ticket_ids: ['ticket-456', 'ticket-789'],
      low_retrieval_confidence: false,
    },
    evaluation_matrix: {
      accuracy: 0.95,
      f1_score: 0.92,
      solution_design: 0.88,
      usability: 0.90,
      feasibility: 0.91,
      security: 0.95,
      innovation: 0.85,
      semantic_similarity: 0.88,
      judge_explanation: 'Strong resolution path identified.',
    },
    assigned_department: 'Infrastructure Department',
    lifecycle_stage: 'Stage 3: Transferred',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  const renderWithRouter = (ticketId: string = 'ticket-123') => {
    window.history.pushState({}, '', `/tickets/${ticketId}`)
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/tickets/:id" element={<ClassificationResultPanel />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('Low Retrieval Confidence Banner', () => {
    it('should render low retrieval confidence banner when flag is true', async () => {
      const responseWithLowConfidence: ClassificationResponse = {
        ...mockClassificationResponse,
        similar_tickets: [
          {
            id: 'ticket-456',
            title: 'API gateway 502 errors',
            category: 'Infrastructure',
            resolution_summary: 'Restarted upstream pods',
            similarity_score: 0.75,
          },
        ],
        resolution_suggestion: {
          steps: ['Check pod health status'],
          source_ticket_ids: ['ticket-456'],
          low_retrieval_confidence: true,
        },
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithLowConfidence)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Low Retrieval Confidence')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/The system found fewer than 2 similar tickets/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Resolution suggestions may be less reliable/i)
      ).toBeInTheDocument()
    })

    it('should not render low retrieval confidence banner when flag is false', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Classification Result')).toBeInTheDocument()
      })

      expect(screen.queryByText('Low Retrieval Confidence')).not.toBeInTheDocument()
      expect(
        screen.queryByText(/The system found fewer than 2 similar tickets/i)
      ).not.toBeInTheDocument()
    })

    it('should not render low retrieval confidence banner when resolution_suggestion is null', async () => {
      const responseWithoutSuggestion: ClassificationResponse = {
        ...mockClassificationResponse,
        resolution_suggestion: null,
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithoutSuggestion)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Classification Result')).toBeInTheDocument()
      })

      expect(screen.queryByText('Low Retrieval Confidence')).not.toBeInTheDocument()
    })

    it('should render banner as closable alert', async () => {
      const responseWithLowConfidence: ClassificationResponse = {
        ...mockClassificationResponse,
        resolution_suggestion: {
          steps: ['Check pod health status'],
          source_ticket_ids: ['ticket-456'],
          low_retrieval_confidence: true,
        },
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithLowConfidence)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Low Retrieval Confidence')).toBeInTheDocument()
      })

      // Check that the alert has a close button (Ant Design Alert with closable prop)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('Parse Warning Display', () => {
    it('should render parse warning when present', async () => {
      const responseWithWarning: ClassificationResponse = {
        ...mockClassificationResponse,
        parse_warning: 'Unable to parse structured payload; falling back to plain text',
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithWarning)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Parse Warning')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Unable to parse structured payload; falling back to plain text/i)
      ).toBeInTheDocument()
    })

    it('should not render parse warning when null', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Classification Result')).toBeInTheDocument()
      })

      expect(screen.queryByText('Parse Warning')).not.toBeInTheDocument()
    })
  })

  describe('Classification Result Display', () => {
    it('should display ticket ID and category', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('ticket-123')).toBeInTheDocument()
      })

      // Use getAllByText since "Infrastructure" appears multiple times (category + similar tickets)
      const infrastructureTags = screen.getAllByText('Infrastructure')
      expect(infrastructureTags.length).toBeGreaterThan(0)
    })

    it('should display confidence score as percentage', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('87.0%')).toBeInTheDocument()
      })
    })

    it('should display routing status', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText(/ROUTED/i)).toBeInTheDocument()
      })
    })

    it('should display causal signal when present', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(
          screen.getByText(/error_rate_spike detected in service: api-gateway/i)
        ).toBeInTheDocument()
      })
    })

    it('should display escalated status with warning color', async () => {
      const escalatedResponse: ClassificationResponse = {
        ...mockClassificationResponse,
        confidence_score: 0.45,
        routing_status: 'escalated',
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(escalatedResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText(/ESCALATED/i)).toBeInTheDocument()
      })
    })
  })

  describe('Similar Tickets Display', () => {
    it('should display similar tickets list', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Similar Tickets')).toBeInTheDocument()
      })

      expect(screen.getByText('API gateway 502 errors')).toBeInTheDocument()
      expect(screen.getByText('Gateway timeout issues')).toBeInTheDocument()
      expect(screen.getByText('91.0% similar')).toBeInTheDocument()
      expect(screen.getByText('85.0% similar')).toBeInTheDocument()
    })

    it('should not display similar tickets section when array is empty', async () => {
      const responseWithoutSimilar: ClassificationResponse = {
        ...mockClassificationResponse,
        similar_tickets: [],
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithoutSimilar)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Classification Result')).toBeInTheDocument()
      })

      expect(screen.queryByText('Similar Tickets')).not.toBeInTheDocument()
    })
  })

  describe('Resolution Suggestion Display', () => {
    it('should display resolution suggestion steps', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Resolution Suggestion')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Check pod health status in the api-gateway namespace/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Review ingress logs for connection errors/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Verify upstream service availability/i)
      ).toBeInTheDocument()
    })

    it('should display source ticket count', async () => {
      vi.mocked(ticketsApi.getClassification).mockResolvedValue(mockClassificationResponse)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText(/Based on 2 similar resolved ticket/i)).toBeInTheDocument()
      })
    })

    it('should not display resolution suggestion when null', async () => {
      const responseWithoutSuggestion: ClassificationResponse = {
        ...mockClassificationResponse,
        resolution_suggestion: null,
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithoutSuggestion)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Classification Result')).toBeInTheDocument()
      })

      expect(screen.queryByText('Resolution Suggestion')).not.toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should display loading spinner while fetching data', () => {
      vi.mocked(ticketsApi.getClassification).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = renderWithRouter('ticket-123')

      // Ant Design Spin component has aria-busy="true"
      const spinner = container.querySelector('[aria-busy="true"]')
      expect(spinner).toBeInTheDocument()
    })

    it('should display error message when fetch fails', async () => {
      vi.mocked(ticketsApi.getClassification).mockRejectedValue(
        new Error('Failed to fetch')
      )

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      })

      expect(screen.getByText(/Failed to load classification result/i)).toBeInTheDocument()
    })
  })

  describe('Multiple Alerts Rendering', () => {
    it('should render both low confidence and parse warning alerts when both are present', async () => {
      const responseWithBothAlerts: ClassificationResponse = {
        ...mockClassificationResponse,
        parse_warning: 'Unable to parse OTLP trace format',
        resolution_suggestion: {
          steps: ['Check pod health status'],
          source_ticket_ids: ['ticket-456'],
          low_retrieval_confidence: true,
        },
      }

      vi.mocked(ticketsApi.getClassification).mockResolvedValue(responseWithBothAlerts)

      renderWithRouter('ticket-123')

      await waitFor(() => {
        expect(screen.getByText('Low Retrieval Confidence')).toBeInTheDocument()
      })

      expect(screen.getByText('Parse Warning')).toBeInTheDocument()
      expect(screen.getByText(/Unable to parse OTLP trace format/i)).toBeInTheDocument()
    })
  })
})
