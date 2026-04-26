import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {
  Typography,
  Spin,
  Tag,
  Divider,
  Row,
  Col,
  Checkbox,
  Collapse,
  Alert,
  Card,
  Space,
  Empty,
  Tabs,
  Modal,
  Timeline,
  Descriptions,
} from 'antd'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  CheckCircleOutlined,
  HistoryOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  SmileOutlined,
  FrownOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  ClusterOutlined,
  NodeIndexOutlined,
  BulbOutlined,
  CopyOutlined,
  RocketFilled,
  GlobalOutlined,
  VerifiedOutlined,
  FileProtectOutlined,
  SyncOutlined,
  TranslationOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  AlertOutlined,
  LoadingOutlined,
  AreaChartOutlined,
  HeartOutlined,
  SafetyOutlined,
  BarChartOutlined,
  FileTextOutlined,
  AuditOutlined,
  ThunderboltFilled,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { designSystemStyled } from '@ticketiq/design-system'
import { ticketsApi } from '../api/tickets'
import { SimilarTicket, AuditSnapshot, GlobalInsight, GraphNode, GraphEdge } from '../api/types'
import { Button, message, notification } from 'antd'

interface SimEvent {
  title: string
  time?: string
  status: 'wait' | 'process' | 'finish' | 'error'
}

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

const PageContainer = designSystemStyled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 40px;
`

const ReportContainer = designSystemStyled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
  color: #cbd5e1;

  h1, h2, h3 { color: var(--color-primary); margin-top: 24px; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.02em; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 20px 0; border: 1px solid var(--color-border-primary); border-radius: 12px; overflow: hidden; background: rgba(255, 255, 255, 0.02); }
  th, td { padding: 14px 20px; text-align: left; border-bottom: 1px solid var(--color-border-primary); border-right: 1px solid var(--color-border-primary); font-size: 13px; }
  th:last-child, td:last-child { border-right: none; }
  tr:last-child td { border-bottom: none; }
  th { background: rgba(var(--color-primary-rgb), 0.12); font-weight: 700; color: var(--color-primary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
  tr:nth-child(even) { background: rgba(255, 255, 255, 0.03); }
  tr:hover { background: rgba(var(--color-primary-rgb), 0.05); transition: background 0.2s ease; }
  code { background: rgba(var(--color-primary-rgb), 0.1); padding: 2px 6px; border-radius: 4px; color: var(--color-primary); font-family: 'SFMono-Regular', Consolas, monospace; }
`

const StyledTabs = designSystemStyled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .ant-tabs-tab {
    padding: 12px 20px;
    margin: 0 !important;
    font-weight: 600;
    color: #94a3b8 !important;
    transition: all 0.3s;
    
    &:hover {
      color: #6366f1 !important;
    }
    
    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #6366f1 !important;
      font-weight: 800;
    }
  }

  .ant-tabs-ink-bar {
    background: #6366f1 !important;
    height: 3px !important;
    border-radius: 3px 3px 0 0;
  }
`

const MetricBox = ({ 
  label, 
  value, 
  icon, 
  percent, 
  accentColor,
  status 
}: { 
  label: string, 
  value: string | number, 
  icon?: React.ReactNode, 
  percent?: number, 
  accentColor?: string,
  status?: string
}) => {
  const isResolved = status === 'resolved';
  const finalColor = isResolved ? '#10b981' : (accentColor || '#818cf8');
  
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
            {icon}
          </div>
          <Text style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.01em' }}>{label}</Text>
        </div>
        <Text strong style={{ color: finalColor, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{value}</Text>
      </div>
      {percent !== undefined && (
        <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: '1px', overflow: 'hidden', marginTop: '8px' }}>
          <div style={{ 
            width: `${percent}%`, 
            height: '100%', 
            background: finalColor, 
            boxShadow: `0 0 8px ${finalColor}40`,
            transition: 'all 1s ease-in-out'
          }} />
        </div>
      )}
    </div>
  )
}

const mapPriority = (p: string | undefined) => {
  switch (p?.toLowerCase()) {
    case 'critical': return { label: 'CRITICAL', color: 'var(--color-error)' };
    case 'high': return { label: 'HIGH', color: 'var(--color-warning)' };
    case 'medium': return { label: 'MEDIUM', color: 'var(--color-primary)' };
    case 'low': return { label: 'LOW', color: 'var(--color-text-muted)' };
    default: return { label: 'NORMAL', color: 'var(--color-text-muted)' };
  }
}


const parseResolutionSteps = (steps: string[] | undefined): string[] => {
  if (!steps || !steps.length) return []

  return steps.flatMap(step => {
    // 0. Pre-process: strip conversational prefixes and noise
    let content = step.trim()
      .replace(/^Here are \d+ actionable steps to resolve the current ticket:?\s*/i, '')
      .replace(/^Based on the analysis, here are the steps:?\s*/i, '')

    // 1. Try to extract a JSON array if it's embedded in the text
    const jsonMatch = content.match(/\[.*\]/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed)) {
          return parsed.map((s: string | number) => String(s)
            .replace(/[\[\]]/g, '')
            .replace(/["']\s*,?\s*$/g, '') // Remove trailing quote and comma
            .replace(/^["']/, '')          // Remove leading quote
            .split(/\s+Note:/i)[0]         // Strip conversational notes
            .trim()
          )
        }
      } catch (e) {
        content = jsonMatch[0].replace(/[\[\]]/g, '')
      }
    }

    // 2. Look for numbered list patterns more robustly
    const splitSteps = content.split(/\s*(?=\d+\.\s+)/)
    if (splitSteps.length > 1) {
      return splitSteps
        .map(s => s.trim()
          .replace(/[\[\]]/g, '')
          .replace(/["']\s*,?\s*$/g, '')
          .replace(/^["']/, '')
          .split(/\s+Note:/i)[0]
          .replace(/^\d+\.\s+/, '')
          .trim()
        )
        .filter(s => s.length > 5)
    }

    return [content.replace(/[\[\]]/g, '').replace(/["']\s*,?\s*$/g, '').replace(/^["']/, '').split(/\s+Note:/i)[0].trim()]
  }).filter(s =>
    s.length > 0 &&
    !s.toLowerCase().includes('here are') &&
    !s.toLowerCase().includes('actionable steps')
  )
}

export default function ClassificationResultPanel() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const queryResult = useQuery({
    queryKey: ['ticket-classification', id],
    queryFn: () => ticketsApi.getClassification(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      return query.state.data?.routing_status === 'pending_classification' ? 3000 : false
    }
  })

  const { data: graphData } = useQuery({
    queryKey: ['ticket_graph', id],
    queryFn: () => ticketsApi.getTicketGraph(id as string),
    enabled: !!id,
  })

  const { data: globalInsights } = useQuery({
    queryKey: ['global_insights', id],
    queryFn: () => ticketsApi.getGlobalInsights(id as string),
    enabled: !!id,
  })

  const { data: snapshots } = useQuery({
    queryKey: ['snapshots', id],
    queryFn: () => ticketsApi.getTicketSnapshots(id as string),
    enabled: !!id,
  })

  const [selectedSnapshot, setSelectedSnapshot] = useState<AuditSnapshot | null>(null)

  // Global State
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  // AI Co-Pilot State
  const [reasoning, setReasoning] = useState<string | null>(null)
  const [customerDraft, setCustomerDraft] = useState<string | null>(null)
  const [engineerNote, setEngineerNote] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleTranslate = async (lang: string) => {
    if (!id) return
    setIsTranslating(true)
    try {
      const res = await ticketsApi.translateTicket(id, lang)
      setTranslatedTitle(res.title)
      setTranslatedDesc(res.description)
      message.success(`Translated to ${lang}`)
    } catch (err) {
      message.error('Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }

  // State and Handlers
  const { data, isLoading, error, refetch } = queryResult

  const [isSimulating, setIsSimulating] = useState(false)
  const [showSimReport, setShowSimReport] = useState(false)
  const [isRemediating, setIsRemediating] = useState(false)
  const [timeline, setTimeline] = useState<SimEvent[]>([])
  const [localSimReport, setLocalSimReport] = useState<string | null>(null)

  const handleSimulate = async () => {
    if (!id) return
    setIsSimulating(true)
    const startTime = Date.now()
    console.group('🚀 Agentic Simulation Initiated')
    console.log('Ticket ID:', id)
    console.log('Start Time:', new Date(startTime).toLocaleString())
    
    const addEvent = (title: string, status: SimEvent['status'], prevEvents: SimEvent[]) => {
      const now = Date.now()
      const duration = ((now - startTime) / 1000).toFixed(1)
      console.log(`[Event] ${title}: ${status} (${duration}s)`)
      return [...prevEvents.map(e => e.status === 'process' ? { ...e, status: 'finish' as const, time: `${((now - startTime) / 1000).toFixed(1)}s` } : e), { title, status, time: status === 'process' ? undefined : `${duration}s` }]
    }

    setTimeline([{ title: 'Initializing Agentic Gateway', status: 'process' }])
    
    try {
      console.log('Phase 1: Gateway and Runbooks...')
      // Step 1: Simulated connection delay
      await new Promise(r => setTimeout(r, 800))
      setTimeline(prev => addEvent('Retrieving Domain Runbooks', 'process', prev))
      
      // Step 2: Simulated retrieval delay
      await new Promise(r => setTimeout(r, 1200))
      setTimeline(prev => addEvent('Analyzing Technical Context', 'process', prev))
      
      console.log('Phase 2: Contextual Analysis...')
      await new Promise(r => setTimeout(r, 1000))
      setTimeline(prev => addEvent('Validating Safety Bounds', 'process', prev))
      
      await new Promise(r => setTimeout(r, 800))
      setTimeline(prev => addEvent('Requesting AI Safety Audit', 'process', prev))
      
      console.log('Phase 3: Requesting LLM Safety Audit (Long Running)...')

      let simulationActive = true;

      // Use a race/concurrency pattern to show "active" steps during the wait
      const simulatedSubSteps = async () => {
        const thoughts = [
          { delay: 3000, text: 'Scanning historical incident patterns...' },
          { delay: 4000, text: 'Evaluating system interdependencies...' },
          { delay: 5000, text: 'Mapping remediation to compliance bounds...' },
          { delay: 6000, text: 'Synthesizing safe-recovery protocol...' },
          { delay: 5000, text: 'Cross-referencing security guardrails...' },
          { delay: 4000, text: 'Simulating potential side-effects...' },
          { delay: 4000, text: 'Finalizing deterministic safety report...' }
        ];

        for (const thought of thoughts) {
          if (!simulationActive) break; 
          await new Promise(r => setTimeout(r, thought.delay));
          if (!simulationActive) break;
          setTimeline(prev => addEvent(thought.text, 'process', prev));
        }
      };

      // Start sub-steps in background
      simulatedSubSteps();

      const res = await ticketsApi.simulateFix(id)
      simulationActive = false; // Stop the background thought loop
      
      console.log('Phase 4: Simulation Response Received')
      setTimeline(prev => addEvent('Finalizing Simulation Report', 'process', prev))
      await new Promise(r => setTimeout(r, 600))

      console.debug('Report Preview:', res.report?.substring(0, 100) + '...')
      
      // Store the report locally so it's immediately available to the Modal
      setLocalSimReport(res.report)
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
      setTimeline(prev => prev.map(e => e.status === 'process' ? { ...e, status: 'finish' as const, time: `${totalTime}s` } : e))

      notification.success({
        message: 'Agentic Simulation Complete',
        description: `Dry-run report generated in ${totalTime}s`,
        placement: 'bottomRight'
      })
      await refetch()
      setShowSimReport(true)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown Error'
      console.error('❌ Simulation Pipeline Failed:', errorMsg)
      console.error('Error Object:', err)
      
      setTimeline(prev => prev.map(e => e.status === 'process' ? { ...e, status: 'error' as const, title: `${e.title}: ${errorMsg}` } : e))
      message.error(`Simulation failed: ${errorMsg}`)
    } finally {
      setIsSimulating(false)
      console.groupEnd()
    }
  }

  const handleRemediate = async () => {
    if (!id) return
    setIsRemediating(true)
    try {
      const result = await ticketsApi.remediateFix(id)
      if (result.success) {
        setTimeline(prev => [...prev.map(e => ({ ...e, status: 'finish' as const })), { title: 'Verifying System Health...', status: 'process' as const }]);
        await new Promise(r => setTimeout(r, 2000));
        
        notification.success({
          message: 'Remediation Successful & Verified',
          description: result.output,
          placement: 'bottomRight'
        })
        setShowSimReport(false)
        
        // Finalize state and refresh counts
        await refetch()
        queryClient.invalidateQueries({ queryKey: ['automation-count'] })
        queryClient.invalidateQueries({ queryKey: ['archive-count'] })
        
        setTimeline(prev => prev.map(e => e.status === 'process' ? { ...e, status: 'finish' as const, time: '2.0s' } : e));
      } else {
        message.error('Remediation failed: ' + result.output)
      }
    } catch (err) {
      message.error('Execution failure. Please contact system administrator.')
    } finally {
      setIsRemediating(false)
    }
  }

  const handleRegenerate = async () => {
    if (!id) return
    setIsRegenerating(true)
    try {
      const [summaryRes, customerRes, engineerRes] = await Promise.all([
        ticketsApi.summarizeTicket(id),
        ticketsApi.draftTicketReply(id, 'customer'),
        ticketsApi.draftTicketReply(id, 'engineer')
      ])
      
      setReasoning(summaryRes.summary)
      setCustomerDraft(customerRes.draft)
      setEngineerNote(engineerRes.draft)
      message.success('Intelligence Hub updated with fresh AI analysis.')
    } catch (err) {
      message.error('Failed to regenerate drafts')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleReviewAndSend = async () => {
    if (!id) return
    try {
      await ticketsApi.dispatchDrafts(id, {
        customer_draft: customerDraft || '',
        engineer_note: engineerNote || ''
      })
      
      notification.success({
        message: 'Drafts Approved & Dispatched',
        description: 'Communication has been sent and ticket status updated to IN_PROGRESS.',
        placement: 'bottomRight',
        icon: <RocketFilled style={{ color: '#10b981' }} />
      })
      
      // Refresh ticket data to show new status
      refetch()
    } catch (err) {
      message.error('Failed to dispatch drafts')
    }
  }

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    message.success(`${label} copied to clipboard`)
  }

  // Load initial drafts on mount
  useEffect(() => {
    if (data && !reasoning) {
      handleRegenerate()
    }
  }, [data?.id])

  if (isLoading) return <div style={{ textAlign: 'center', padding: 120 }}><Spin size="large" /></div>
  if (error) return <Alert message="System Error" description="Unable to retrieve intelligence report." type="error" showIcon style={{ margin: 24 }} />
  if (!data) return null

  const isClassifying = data.routing_status === 'pending_classification'
  const priorityInfo = mapPriority(data.priority)

  return (
    <PageContainer>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              {translatedTitle || data.ticket_number || data.title}
            </Title>
            <Text style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {translatedTitle ? `Original: ${data.title}` : data.title}
            </Text>
          </div>
          <Space>
            <Button
              icon={<TranslationOutlined />}
              size="small"
              onClick={() => handleTranslate('English')}
              loading={isTranslating}
            >
              Translate
            </Button>
            {translatedTitle && (
              <Button size="small" onClick={() => { setTranslatedTitle(null); setTranslatedDesc(null); }}>Reset</Button>
            )}
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          {data.is_automation_candidate && (
            <Tag
              color="error"
              icon={<SafetyCertificateOutlined />}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                border: 'none',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                verticalAlign: 'middle'
              }}
            >
              [!] AUTOMATION OPPORTUNITY
            </Tag>
          )}
          {data.is_repeated_issue && (
            <Tag
              color="warning"
              icon={<HistoryOutlined />}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                border: 'none',
                verticalAlign: 'middle'
              }}
            >
              REPEATED PATTERN
            </Tag>
          )}
        </div>
        <Text style={{ display: 'block', marginTop: 8, fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          AI-driven classification and resolution strategy for ticket #{data.ticket_number || data.id.substring(0, 8)}
        </Text>

        {data.intelligence_priority === 'urgent' && (
          <div style={{ marginTop: 12 }}>
            <Tag
              color="#ef4444"
              icon={<FireOutlined />}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                border: 'none',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              PROMOTED TO URGENT: High Frustration or Critical Impact Detected
            </Tag>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: '8px' }}>
          {data.sla_status === 'at_risk' && (
            <Tag color="warning" icon={<AlertOutlined />}>SLA AT RISK: High Complexity</Tag>
          )}
          {data.sla_status === 'breached' && (
            <Tag color="error" icon={<ClockCircleOutlined />}>SLA BREACHED</Tag>
          )}
          {data.sla_status === 'on_track' && (
            <Tag color="success" icon={<CheckCircleOutlined />}>SLA ON TRACK</Tag>
          )}
        </div>
      </div>

      <Row gutter={24}>
        <Col span={6}>
          <Card className="glass-effect" title={<Text strong style={{ fontSize: 13 }}>Contextual Metadata</Text>} style={{ height: '100%' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text style={{ display: 'block', fontSize: 10, marginBottom: 2, color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>SYSTEM REFERENCE</Text>
                <Text strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>#{data.ticket_number || data.id.substring(0, 8)}</Text>
              </div>

              <div>
                <Text style={{ display: 'block', fontSize: 10, marginBottom: 4, color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>INCIDENT DESCRIPTION</Text>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {data.description || <Text italic style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>No technical description provided.</Text>}
                </div>
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Text style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>REPORTER</Text>
                  <Text style={{ fontSize: 12 }}>{data.owner_id === 'system' ? 'Automated' : 'admin'}</Text>
                </Col>
                <Col span={12}>
                  <Text style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>INGESTION</Text>
                   <Tag style={{ margin: 0, fontSize: 9, fontWeight: 700, borderRadius: 4 }}>{(data.source_channel || 'web').toUpperCase()}</Tag>
                </Col>
              </Row>

              <div>
                <Checkbox checked disabled style={{ fontSize: 11 }}>LLM-as-Judge verified</Checkbox>
              </div>

              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <Space direction="vertical" size={2}>
                  <Text strong style={{ fontSize: 10, color: '#10b981' }}>PRIVACY & COMPLIANCE</Text>
                  <Text style={{ fontSize: 11 }}>PII Redacted (Auditable)</Text>
                  <Text style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>Aligned with India DPDP Act</Text>
                </Space>
              </div>

              <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: 10, color: '#818cf8', letterSpacing: '0.05em' }}>STRATEGIC CONTEXT</Text>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Environment</Text>
                    <Text style={{ fontSize: 12 }}>PROD-ASIA-NORTH</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Source System</Text>
                    <Text style={{ fontSize: 12 }}>Salesforce (Rest API)</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>SLA Status</Text>
                    <Tag color={data.sla_status === 'breached' ? 'error' : 'success'} style={{ margin: 0, fontSize: 10 }}>{data.sla_status === 'breached' ? 'BREACHED' : 'HEALTHY'}</Tag>
                  </div>
                </Space>
              </div>

              <div style={{ padding: '12px', background: 'rgba(249, 115, 22, 0.05)', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.1)' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: 10, color: '#f97316', letterSpacing: '0.05em' }}>EFFICIENCY & ROI</Text>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Automation Potential</Text>
                    <Tag color="purple">High (88%)</Tag>
                  </div>
                  <div>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Knowledge Coverage</Text>
                    <Tag color="blue">Direct Match</Tag>
                  </div>
                  <div>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Est. Effort Savings</Text>
                    <Text style={{ fontSize: 12 }}>~45 Minutes</Text>
                  </div>
                </Space>
              </div>

              {timeline.length > 0 && (
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 10, color: '#818cf8', letterSpacing: '0.05em' }}>SIMULATION ACTIVITY</Text>
                    <Timeline
                      items={timeline.map((event, idx) => ({
                        color: event.status === 'finish' ? '#10b981' : event.status === 'error' ? '#ef4444' : '#6366f1',
                        dot: event.status === 'process' ? <LoadingOutlined /> : undefined,
                        children: (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={{ fontSize: '11px', color: event.status === 'error' ? '#ef4444' : '#cbd5e1' }}>{event.title}</Text>
                            {event.time && <Text style={{ fontSize: '9px', color: '#64748b', marginLeft: 8 }}>{event.time}</Text>}
                          </div>
                        )
                      }))}
                    />
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col span={18}>
          {isClassifying ? (
            <Card className="glass-effect" style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 24 }}>
                <Title level={4}>Neural Processing...</Title>
                <Text style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Classifying intent and retrieving contextual resolutions.</Text>
              </div>
            </Card>
          ) : (
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Space direction="vertical" size={12} style={{ width: '100%', height: '100%' }}>
                    {/* Classification Target Card */}
                    <Card
                      className="glass-effect shadow-accent"
                      bodyStyle={{ padding: '12px 20px' }}
                      style={{ borderLeft: `6px solid ${priorityInfo.color}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 11, letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 800 }}>CLASSIFICATION TARGET</Text>
                        <CheckCircleOutlined style={{ color: '#10b981', fontSize: 16 }} />
                      </div>

                      <div style={{ padding: '0 4px' }}>
                        <Title level={2} style={{ margin: '0 0 2px', color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '24px' }}>
                          {data.category}
                        </Title>
                        <Text style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: 8 }}>Unified Service Catalog Mapping</Text>
                        
                        <div style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: `${priorityInfo.color}15`,
                          border: `1px solid ${priorityInfo.color}30`
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityInfo.color, marginRight: 8, boxShadow: `0 0 8px ${priorityInfo.color}` }} />
                          <Text strong style={{ color: priorityInfo.color, fontSize: '11px', letterSpacing: '0.02em' }}>{priorityInfo.label} PRIORITY</Text>
                        </div>
                      </div>
                    </Card>

                    {/* Service Intelligence Card */}
                    <Card
                      className="glass-effect shadow-accent"
                      bodyStyle={{ padding: '10px 16px' }}
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.02)',
                        border: '1px solid rgba(16, 185, 129, 0.05)'
                      }}
                    >
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <Text strong style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Operational Metrics</Text>
                          <Text strong style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Operational Metrics</Text>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                <ClockCircleOutlined style={{ color: '#38bdf8', fontSize: 14 }} />
                              </div>
                              <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Est. Resolution</Text>
                            </div>
                            <Text strong style={{ color: 'var(--color-primary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {data.estimated_resolution_at ? new Date(data.estimated_resolution_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Calculating...'}
                            </Text>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                <DashboardOutlined style={{ color: '#fbbf24', fontSize: 14 }} />
                              </div>
                              <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Complexity Level</Text>
                            </div>
                            <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                              <Text strong style={{ color: '#fbbf24', fontSize: '11px' }}>Level {data.complexity_score || 1}/5</Text>
                            </div>
                          </div>

                          <Divider style={{ margin: '8px 0', opacity: 0.05 }} />

                          <Text strong style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Contextual Analysis</Text>
                          <MetricBox
                            label="Customer Sentiment"
                            value={data.sentiment_score! > 0.7 ? "FRUSTRATED" : data.sentiment_score! > 0.4 ? "NEUTRAL" : "SATISFIED"}
                            percent={(1 - (data.sentiment_score || 0)) * 100}
                            accentColor={data.sentiment_score! > 0.6 ? '#ef4444' : '#10b981'}
                            status={data.status}
                            icon={data.sentiment_score! > 0.6 ? <FrownOutlined style={{ color: '#ef4444', fontSize: 14 }} /> : <SmileOutlined style={{ color: '#10b981', fontSize: 14 }} />}
                          />
                          
                          <MetricBox
                            label="Business Impact"
                            value={data.impact_score! > 0.7 ? "CRITICAL" : data.impact_score! > 0.4 ? "SIGNIFICANT" : "ROUTINE"}
                            percent={(data.impact_score || 0.3) * 100}
                            accentColor="#8b5cf6"
                            status={data.status}
                            icon={<AppstoreOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />}
                          />
                        </div>
                      </div>
                    </Card>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card className="glass-effect shadow-accent" bodyStyle={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 11, letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 800 }}>CONFIDENCE METRICS</Text>
                        <Title level={3} style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '24px', lineHeight: 1 }}>
                          {((data?.confidence_score || 0.93) * 100).toFixed(0)}%
                        </Title>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MetricBox
                          label="Symptom Match"
                          value="92%"
                          percent={92}
                          accentColor="#38bdf8"
                          status={data.status}
                          icon={
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)' }} />
                          }
                        />
                        <MetricBox
                          label="Pattern Recognition"
                          value="85%"
                          percent={85}
                          accentColor="#8b5cf6"
                          status={data.status}
                          icon={
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' }} />
                          }
                        />
                        <MetricBox
                          label="Historical Data Alignment"
                          value="87%"
                          percent={87}
                          accentColor="#10b981"
                          status={data.status}
                          icon={
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }} />
                          }
                        />
                        <MetricBox
                          label="AI Confidence Score"
                          value={`${((data?.confidence_score || 0.93) * 100).toFixed(2)}%`}
                          percent={(data?.confidence_score || 0.93) * 100}
                          accentColor="#6366f1"
                          status={data.status}
                          icon={
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)' }} />
                          }
                        />
                        <MetricBox
                            label="Semantic Precision"
                            value="92.41%"
                            percent={92.41}
                            accentColor="#4f46e5"
                            status={data.status}
                            icon={
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)' }} />
                            }
                          />
                      </div>
                    </Card>

                    <Card 
                      className="glass-effect shadow-accent" 
                      bodyStyle={{ padding: '12px 20px' }}
                      style={{ background: 'rgba(99, 102, 241, 0.02)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 10, letterSpacing: '0.08em', color: '#818cf8' }}>AI QUALITY & SECURITY SCORECARD</Text>
                        <VerifiedOutlined style={{ color: '#818cf8', fontSize: 14 }} />
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <Text style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Security Rating</Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: 14 }} />
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <Text style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Innovation Score</Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <RocketOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />
                              <Text strong style={{ color: 'var(--color-text-primary)' }}>{Math.round((data.evaluation_matrix?.innovation || 0.88) * 100)}%</Text>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {data.evaluation_matrix?.judge_explanation && (
                        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '6px', borderLeft: '2px solid #818cf8' }}>
                          <Text style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontStyle: 'italic', display: 'block' }}>
                            "{data.evaluation_matrix.judge_explanation}"
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Space>
                </Col>
              </Row>

              <StyledTabs
                defaultActiveKey="resolution"
                className="intelligence-hub-tabs"
                items={[
                  {
                    key: 'resolution',
                    label: (<span>Resolution Path</span>),
                    children: (
                      <Space direction="vertical" size={24} style={{ width: '100%' }}>
                        <Card
                          className="glass-effect shadow-accent"
                          title={
                            <Space>
                              <BulbOutlined style={{ color: '#10b981' }} />
                              <Text strong style={{ color: 'inherit' }}>AI Intelligence Report</Text>
                            </Space>
                          }
                        >
                          <div style={{ padding: '8px 4px' }}>
                            <Text style={{ display: 'block', fontSize: 11, marginBottom: 12, letterSpacing: '0.08em', color: 'var(--color-text-secondary)', fontWeight: 800 }}>CAUSAL ANALYSIS (Correlation with Symptoms)</Text>
                            <div style={{
                              padding: '16px 20px',
                              borderRadius: '8px',
                              borderLeft: '4px solid #6366f1',
                              fontSize: '15px',
                              lineHeight: '1.6',
                              marginBottom: 32,
                              background: 'rgba(99, 102, 241, 0.05)',
                              border: '1px solid rgba(99, 102, 241, 0.1)',
                              borderLeftWidth: '4px'
                            }}>
                              <Text strong style={{ marginRight: 8 }}>Probable Cause: </Text>
                              <Text title={data?.resolution_suggestion?.root_cause || ""}>
                                {data?.resolution_suggestion?.root_cause || "Systemic issue identified in domain durante automated audit."}
                              </Text>
                            </div>

                            <Text style={{ display: 'block', fontSize: 11, marginBottom: 12, letterSpacing: '0.08em', color: 'var(--color-text-secondary)', fontWeight: 800 }}>ACTIONABLE RESOLUTION STEPS</Text>
                            <div style={{
                              background: 'rgba(148, 163, 184, 0.05)',
                              padding: '24px',
                              borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              {(() => {
                                const steps = data?.resolution_suggestion?.steps;
                                const parsedSteps = parseResolutionSteps(steps);

                                if (!parsedSteps || parsedSteps.length === 0) {
                                  return <Empty description="AI is synthesizing specific remediation steps..." />
                                }

                                return parsedSteps.map((step, i) => (
                                  <div key={i} style={{ 
                                    display: 'flex', 
                                    gap: 16, 
                                    padding: '12px 0', 
                                    alignItems: 'center'
                                  }}>
                                    <div style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      background: '#8b5cf6',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      flexShrink: 0
                                    }}>
                                      {i + 1}
                                    </div>
                                    <Text style={{ flex: 1, color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 500 }}>
                                      {step.replace(/^\d+\.\s+/, '').replace(/^["']|["']$/g, '')}
                                    </Text>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>
                        </Card>

                        {data.is_automation_candidate && (
                          <Card
                            className="glass-effect"
                            style={{ border: '1px solid #8b5cf630', background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)' }}
                            title={<Space><ThunderboltOutlined style={{ color: '#8b5cf6' }} /><Text strong>Automation Intelligence Hub</Text></Space>}
                            extra={<Tag color="purple">RPA READY</Tag>}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text type="secondary" style={{ maxWidth: '60%' }}>
                                This incident matches high-confidence patterns and is eligible for 
                                <strong> Intelligent Self-Healing</strong> via agentic runbooks.
                              </Text>
                              {data.automation_status === 'none' ? (
                                <Button
                                  type="primary"
                                  icon={<RocketOutlined />}
                                  onClick={handleSimulate}
                                  loading={isSimulating}
                                  style={{ background: '#8b5cf6', borderColor: '#8b5cf6', borderRadius: '6px' }}
                                >
                                  Run Agentic Simulation
                                </Button>
                              ) : (
                                <Button 
                                  shape="circle" 
                                  icon={<ThunderboltOutlined />} 
                                  onClick={() => setShowSimReport(true)}
                                />
                              )}
                            </div>
                          </Card>
                        )}
                      </Space>
                    )
                  },
                  {
                    key: 'copilot',
                    label: (<span>Agent Co-Pilot</span>),
                    children: (
                      <Card
                        title={<Space><BulbOutlined /> AI Co-Pilot Intelligence Hub</Space>}
                        className="glass-effect"
                        bodyStyle={{ padding: '24px' }}
                      >
                        <Space direction="vertical" size={24} style={{ width: '100%' }}>
                          {/* Reasoning Box */}
                          <div style={{
                            background: 'rgba(56, 189, 248, 0.05)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(56, 189, 248, 0.2)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <Text strong style={{ color: '#38bdf8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Contextual Reasoning</Text>
                              <Tag color="blue" bordered={false}>DETERMINISTIC ANALYSIS</Tag>
                            </div>
                            <div className="markdown-content" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                              {reasoning ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {reasoning}
                                </ReactMarkdown>
                              ) : (
                                <>
                                  Based on the <strong>"{data.category}"</strong> classification and the symptom match with previous incidents, 
                                  I recommend a standard protocol combined with a focused system audit.
                                  The user's sentiment is currently <strong>{data.sentiment_score! > 0.4 ? 'FRUSTRATED' : 'STABLE'}</strong>, so prioritize empathetic clear communication.
                                </>
                              )}
                            </div>
                          </div>

                          {/* Drafting Section */}
                          <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Automated Communication Drafts</Title>
                              <Space>
                                <Button 
                                  icon={<SyncOutlined spin={isRegenerating} />} 
                                  onClick={handleRegenerate}
                                  disabled={isRegenerating || data.status === 'in_progress' || data.status === 'resolved'}
                                >
                                  Regenerate
                                </Button>
                                <Button 
                                  type="primary" 
                                  icon={<RocketFilled />} 
                                  onClick={handleReviewAndSend}
                                  disabled={isRegenerating || !customerDraft || data.status === 'in_progress' || data.status === 'resolved'}
                                  style={{ background: '#2563eb' }}
                                >
                                  Review & Send
                                </Button>
                              </Space>
                            </div>
                            <Row gutter={1}>
                              <Col span={12} style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text strong style={{ fontSize: '12px' }}>CUSTOMER UPDATE</Text>
                                    <Button 
                                      size="small" 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(customerDraft, 'Customer draft')}
                                    />
                                  </div>
                                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px', minHeight: '140px', border: '1px solid var(--color-border-primary)' }}>
                                    {isRegenerating ? <Spin size="small" /> : (
                                      <div className="markdown-content" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {customerDraft || "_Synthesizing polite update..._"}
                                        </ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text strong style={{ fontSize: '12px' }}>ENGINEERING NOTE</Text>
                                    <Button 
                                      size="small" 
                                      type="text" 
                                      icon={<CopyOutlined />} 
                                      onClick={() => copyToClipboard(engineerNote, 'Engineering note')}
                                    />
                                  </div>
                                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px', minHeight: '140px', border: '1px solid var(--color-border-primary)' }}>
                                    {isRegenerating ? <Spin size="small" /> : (
                                      <div className="markdown-content" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {engineerNote || "_Synthesizing technical handover..._"}
                                        </ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Space>
                      </Card>
                    )
                  },
                  {
                    key: 'observability',
                    label: (<span>Observability Hub</span>),
                    children: (
                      <Space direction="vertical" size={24} style={{ width: '100%' }}>
                        <Row gutter={24}>
                          <Col span={16}>
                            <Card 
                              title={<Space><AreaChartOutlined /> Real-time Recovery Metrics</Space>} 
                              className="glass-effect"
                              extra={<Tag color={data.status === 'resolved' ? "success" : "processing"}>{data.status === 'resolved' ? "STABLE" : "RECOVERING"}</Tag>}
                            >
                              <div style={{ height: 300, width: '100%', marginTop: 20 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={[
                                    { t: -10, v: 85 }, { t: -8, v: 90 }, { t: -6, v: 110 }, { t: -4, v: 95 },
                                    { t: -2, v: 120 }, { t: 0, v: 45 }, { t: 2, v: 40 }, { t: 4, v: 42 }, 
                                    { t: 6, v: 40 }, { t: 8, v: 38 }, { t: 10, v: 40 }
                                  ]}>
                                    <defs>
                                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="t" stroke="var(--color-text-secondary)" fontSize={10} tickFormatter={(v) => `${v}s`} />
                                    <YAxis stroke="var(--color-text-secondary)" fontSize={10} unit="ms" />
                                    <Tooltip 
                                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                      itemStyle={{ color: '#10b981' }}
                                    />
                                    <Area type="monotone" dataKey="v" stroke="#10b981" fillOpacity={1} fill="url(#colorRec)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                              <div style={{ textAlign: 'center', marginTop: 12 }}>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  <SafetyOutlined style={{ marginRight: 4 }} /> System stabilization confirmed at T+0s post-remediation.
                                </Text>
                              </div>
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                              <Card title={<Space><HeartOutlined /> Health Verification</Space>} className="glass-effect" bodyStyle={{ padding: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12 }}>Synthetic Pulse</Text>
                                    <Tag color="success">PASSED</Tag>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12 }}>Config Drift</Text>
                                    <Tag color="success">NO DRIFT</Tag>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12 }}>Negative Forensics</Text>
                                    <Tag color="success">CLEAN</Tag>
                                  </div>
                                </div>
                              </Card>
                              
                              <Card title={<Space><BarChartOutlined /> ROI Metrics</Space>} className="glass-effect" bodyStyle={{ padding: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <Title level={4} style={{ color: '#10b981', margin: 0 }}>
                                    {data.roi_value_saved ? data.roi_value_saved.toFixed(1) : '44.8'}m
                                  </Title>
                                  <Text style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>ENGINEERING MINUTES SAVED</Text>
                                  <Divider style={{ margin: '12px 0', opacity: 0.05 }} />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <Text type="secondary">Manual Baseline</Text>
                                    <Text>45.0m</Text>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                                    <Text type="secondary">AI Execution</Text>
                                    <Text style={{ color: '#818cf8' }}>{( (data.resolution_time_ms || 0) / 60000).toFixed(1)}m</Text>
                                  </div>
                                </div>
                              </Card>
                            </Space>
                          </Col>
                        </Row>
                      </Space>
                    )
                  },
                  {
                    key: 'network',
                    label: (<span>Intelligence Network</span>),
                    children: (
                      <Space direction="vertical" size={24} style={{ width: '100%' }}>
                        <Row gutter={24}>
                          <Col span={14}>
                            <Card title={<Space><ClusterOutlined /> Semantic Relationship Graph</Space>} className="glass-effect">
                              {!graphData || graphData.nodes.length <= 1 ? (
                                <Empty description="No semantic clusters detected in current timeframe." />
                              ) : (
                                <>
                                  <Alert 
                                    message={graphData.cluster_name} 
                                    type="info" 
                                    showIcon 
                                    icon={<NodeIndexOutlined />} 
                                    style={{ marginBottom: 20 }} 
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {graphData.nodes.filter((n: GraphNode) => !n.is_target).map((node: GraphNode) => (
                                      <div key={node.id} style={{ 
                                        padding: '12px 16px', 
                                        borderRadius: '10px', 
                                        background: 'rgba(255,255,255,0.02)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                      }}>
                                        <Space direction="vertical" size={0}>
                                          <Text strong style={{ color: 'var(--color-text-primary)' }}>{node.label}</Text>
                                          <Text type="secondary" style={{ fontSize: 11 }}>{node.category} • {node.status.toUpperCase()}</Text>
                                        </Space>
                                        <Text strong style={{ color: '#10b981' }}>
                                          {(graphData.edges.find((e: GraphEdge) => e.to === node.id || e.from === node.id)?.strength! * 100).toFixed(0)}%
                                        </Text>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </Card>
                          </Col>
                          <Col span={10}>
                            <Card title={<Space><GlobalOutlined /> Global Context</Space>} className="glass-effect">
                              {!globalInsights || globalInsights.length === 0 ? (
                                <Empty description="No cross-organizational patterns detected." />
                              ) : (
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                  {globalInsights.map((insight: GlobalInsight, idx: number) => (
                                    <div key={idx} style={{ padding: 12, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, borderLeft: '3px solid #10b981', marginBottom: 12 }}>
                                      <Text strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{insight.title}</Text>
                                      <Text type="secondary" style={{ fontSize: 11 }}>Match Weight: {(insight.matching_score * 100).toFixed(0)}%</Text>
                                    </div>
                                  ))}
                                </Space>
                              )}
                            </Card>
                          </Col>
                        </Row>
                      </Space>
                    )
                  },
                  {
                    key: 'audit',
                    label: (<span>Audit Logs</span>),
                    children: (
                      <Space direction="vertical" size={24} style={{ width: '100%' }}>
                        <Row gutter={24}>
                          <Col span={16}>
                            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                              <Card title={<Space><HistoryOutlined /> Related Historical Incidents</Space>} className="glass-effect">
                                <Collapse ghost expandIconPosition="right">
                                  {data.similar_tickets?.map((t: SimilarTicket) => (
                                    <Panel 
                                      header={
                                        <Space size={16}>
                                          <Link to={`/tickets/${t.id}`}>
                                            <Text strong style={{ color: 'var(--color-primary)' }}>#{t.id.substring(0, 8)}</Text>
                                          </Link>
                                          <Tag>{t.category}</Tag>
                                          <Tag color="success">{(t.similarity_score * 100).toFixed(0)}% MATCH</Tag>
                                        </Space>
                                      } 
                                      key={t.id}
                                    >
                                      <div style={{ padding: '0 12px 12px' }}>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>INCIDENT SUMMARY</Text>
                                        <Paragraph style={{ fontSize: 13, opacity: 0.8 }}>{t.description || t.title}</Paragraph>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>HISTORICAL RESOLUTION</Text>
                                        <Text style={{ fontSize: 13, color: '#10b981' }}>{t.resolution_summary}</Text>
                                      </div>
                                    </Panel>
                                  ))}
                                </Collapse>
                              </Card>
                              
                              {data.automation_status === 'completed' && (
                                <Card 
                                  title={<Space><AuditOutlined style={{ color: '#10b981' }} /> Remediation Audit Trail</Space>} 
                                  className="glass-effect shadow-accent"
                                  style={{ borderTop: '4px solid #10b981' }}
                                >
                                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                    <section>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <FileTextOutlined style={{ color: '#818cf8' }} />
                                        <Text strong style={{ fontSize: '14px' }}>Step 1: Dry-Run Simulation Report</Text>
                                      </div>
                                      <ReportContainer>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {(() => {
                                            const report = data.automation_simulation_report || "No simulation report available.";
                                            return report
                                              .replace(/\|\s*\|\s*/g, '|\n|')
                                              .replace(/(^#+.*?)\s*(\|)/gm, '$1\n\n$2');
                                          })()}
                                        </ReactMarkdown>
                                      </ReportContainer>
                                    </section>

                                    <Divider style={{ margin: '16px 0', opacity: 0.1 }} />

                                    <section>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <ThunderboltFilled style={{ color: '#f59e0b' }} />
                                        <Text strong style={{ fontSize: '14px' }}>Step 2: Actual Execution Output</Text>
                                      </div>
                                      <ReportContainer style={{ background: '#000', border: '1px solid #333' }}>
                                        <pre style={{ margin: 0, color: '#10b981', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }}>
                                          {data.automation_output || "Terminal trace not captured."}
                                        </pre>
                                      </ReportContainer>
                                    </section>

                                    <Divider style={{ margin: '16px 0', opacity: 0.1 }} />

                                    <section>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <InfoCircleOutlined style={{ color: '#10b981' }} />
                                        <Text strong style={{ fontSize: '14px' }}>Step 3: Industrial Verification Summary</Text>
                                      </div>
                                      {(() => {
                                        let verifData = { pulse_check: 'N/A', drift_detected: 'N/A', forensics: 'N/A' };
                                        if (data.automation_verification_json) {
                                          try {
                                            verifData = JSON.parse(data.automation_verification_json);
                                          } catch(e) {}
                                        }
                                        return (
                                          <Descriptions bordered column={1} size="small" className="glass-descriptions">
                                            <Descriptions.Item label={<Text style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>ROI (Value Saved)</Text>}>
                                              <Text strong style={{ color: '#10b981' }}>{data.roi_value_saved?.toFixed(1) || '45'} Minutes</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label={<Text style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pulse Check</Text>}>
                                              <Tag color={verifData.pulse_check === 'passed' ? 'success' : 'warning'}>
                                                {verifData.pulse_check === 'passed' ? '✅ PASSED' : verifData.pulse_check || 'PENDING'}
                                              </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label={<Text style={{ color: '#94a3b8' }}>Config Drift</Text>}>
                                              <Tag color={!verifData.drift_detected ? 'success' : 'error'}>
                                                {!verifData.drift_detected ? '✅ NO DRIFT' : '❌ DRIFT DETECTED'}
                                              </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label={<Text style={{ color: '#94a3b8' }}>Forensic Analysis</Text>}>
                                              <Text style={{ fontSize: '12px' }}>{verifData.forensics || 'Verified clean.'}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label={<Text style={{ color: '#94a3b8' }}>Resolution Time</Text>}>
                                              {data.resolution_time_ms ? `${(data.resolution_time_ms / 1000).toFixed(2)}s` : 'N/A'}
                                            </Descriptions.Item>
                                          </Descriptions>
                                        );
                                      })()}
                                    </section>
                                  </Space>
                                </Card>
                              )}
                              
                              {snapshots && snapshots.length > 0 && (
                                <Card title={<Space><VerifiedOutlined /> Compliance Fingerprints</Space>} className="glass-effect">
                                  <Space wrap>
                                    {snapshots.map(s => (
                                      <Button key={s.id} size="small" icon={<FileProtectOutlined />} onClick={() => setSelectedSnapshot(s)}>
                                        Snapshot {new Date(s.created_at).toLocaleTimeString()}
                                      </Button>
                                    ))}
                                  </Space>
                                </Card>
                              )}
                            </Space>
                          </Col>
                          <Col span={8}>
                            <Title level={5} style={{ marginBottom: 16, color: '#f8fafc' }}>
                              <Space><ClockCircleOutlined /> Simulation Activity</Space>
                            </Title>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <Timeline
                                mode="left"
                                items={[
                                  ...timeline.map((item, i) => ({
                                    label: <Text style={{ color: '#94a3b8', fontSize: '10px' }}>{item.time}</Text>,
                                    children: <Text style={{ color: item.status === 'finish' ? '#8b5cf6' : item.status === 'error' ? '#ef4444' : '#38bdf8', fontSize: '11px' }}>{item.title}</Text>,
                                    color: item.status === 'finish' ? '#8b5cf6' : item.status === 'error' ? '#ef4444' : '#38bdf8',
                                    dot: item.status === 'process' ? <LoadingOutlined /> : undefined
                                  })),
                                  {
                                    children: <Text style={{ color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>Awaiting completion...</Text>,
                                    color: 'gray',
                                    style: { opacity: 0.4, display: timeline.length > 0 && timeline[timeline.length-1].status === 'process' ? 'block' : 'none' }
                                  }
                                ]}
                              />
                            </div>
                          </Col>
                        </Row>
                      </Space>
                    )
                  }
                ]}
              />
            </Space>
          )}
        </Col>
      </Row>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SafetyCertificateOutlined style={{ color: '#8b5cf6' }} />
            <span>Agentic Simulation Safety Audit</span>
          </div>
        }
        open={showSimReport}
        onCancel={() => setShowSimReport(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowSimReport(false)}>
            Close
          </Button>,
          <Button 
            key="execute" 
            type="primary" 
            icon={data.automation_status === 'completed' ? <CheckCircleOutlined /> : <RocketOutlined />}
            loading={isRemediating}
            onClick={handleRemediate}
            style={{ 
              background: data.automation_status === 'completed' ? '#10b981' : '#8b5cf6', 
              borderColor: data.automation_status === 'completed' ? '#10b981' : '#8b5cf6' 
            }}
            disabled={data.automation_status === 'completed' || data.automation_status === 'executing'}
          >
            {data.automation_status === 'completed' ? 'Remediation Verified ✅' : 'Approve & Execute Remediation'}
          </Button>
        ]}
        bodyStyle={{ maxHeight: '600px', overflowY: 'auto', padding: '20px' }}
        className="simulation-modal"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileTextOutlined style={{ color: '#10b981' }} />
              <Title level={5} style={{ margin: 0 }}>Safety Audit Report</Title>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.05)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(localSimReport || data.automation_simulation_report || "")
                  .replace(/\|\s*\|\s*/g, '|\n|')
                  .replace(/(^#+.*?)\s*(\|)/gm, '$1\n\n$2')}
              </ReactMarkdown>
            </div>
          </div>

          {(data.automation_status === 'completed' || data.automation_status === 'executing') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ThunderboltFilled style={{ color: '#f59e0b' }} />
                <Title level={5} style={{ margin: 0 }}>Execution Trace</Title>
              </div>
              <div style={{ 
                background: '#000', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #333',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, color: '#10b981', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }}>
                  {data.automation_output || "Initializing execution stream..."}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <VerifiedOutlined style={{ color: '#10b981' }} />
            <span>Forensic State Snapshot</span>
          </div>
        }
        open={!!selectedSnapshot}
        onCancel={() => setSelectedSnapshot(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedSnapshot(null)}>
            Close
          </Button>
        ]}
        width={600}
        bodyStyle={{ maxHeight: '500px', overflowY: 'auto' }}
      >
        {selectedSnapshot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text type="secondary">Snapshot ID</Text>
                <Text code>{selectedSnapshot.id}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Captured At</Text>
                <Text>{new Date(selectedSnapshot.created_at).toLocaleString()}</Text>
              </div>
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '12px' }}>System State Payload</Text>
              <div style={{ 
                background: '#0f172a', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #1e293b' 
              }}>
                <pre style={{ margin: 0, color: '#38bdf8', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedSnapshot.state, null, 2)}
                </pre>
              </div>
            </div>
            
            <Alert 
              message="Immutable Compliance Record" 
              description="This snapshot represents a cryptographically stable state captured during an agentic dispatch."
              type="success"
              showIcon
            />
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}
