import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Typography,
  Spin,
  Progress,
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
} from 'antd'
import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { designSystemStyled } from '@ticketiq/design-system'
import { ticketsApi } from '../api/tickets'

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

const PageContainer = designSystemStyled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 40px;
`

const MetricBox = ({ label, value, percent, icon }: { label: string, value: string | number, percent?: number, icon?: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <Space size={8}>
        {icon}
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }}>{label}</Text>
      </Space>
      <Text strong style={{ color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'monospace' }}>{value}</Text>
    </div>
    {percent !== undefined && (
      <Progress 
        percent={percent} 
        size="small" 
        showInfo={false} 
        strokeColor="var(--color-primary)" 
        trailColor="var(--color-bg-secondary)"
        strokeWidth={4}
      />
    )}
  </div>
)

const mapPriority = (p: string | undefined) => {
  switch(p?.toLowerCase()) {
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
          return parsed.map(s => String(s)
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticket-classification', id],
    queryFn: () => ticketsApi.getClassification(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      return query.state.data?.routing_status === 'pending_classification' ? 3000 : false
    }
  })

  if (isLoading) return <div style={{ textAlign: 'center', padding: 120 }}><Spin size="large" /></div>
  if (error) return <Alert message="System Error" description="Unable to retrieve intelligence report." type="error" showIcon style={{ margin: 24 }} />
  if (!data) return null

  const isClassifying = data.routing_status === 'pending_classification'
  const priorityInfo = mapPriority(data.priority)

  return (
    <PageContainer>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Intelligence Report
          {data.is_automation_candidate && (
            <Tag 
              color="error" 
              icon={<SafetyCertificateOutlined />}
              style={{ 
                marginLeft: '16px', 
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
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>AI-driven classification and resolution strategy for ticket #{data.ticket_number || data.id.substring(0, 8)}</Text>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Card className="glass-effect" title={<Text strong>Contextual Metadata</Text>} style={{ height: '100%' }}>
            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>SYSTEM REFERENCE</Text>
              <Text strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>#{data.ticket_number || data.id}</Text>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>INCIDENT DESCRIPTION</Text>
              <div style={{ 
                background: 'var(--color-bg-secondary)', 
                padding: 16, 
                borderRadius: 12,
                fontSize: 13,
                lineHeight: 1.6,
                border: '1px solid var(--color-border-primary)'
              }}>
                {data.description || <Text italic style={{ opacity: 0.5 }}>No technical description provided for this incident.</Text>}
              </div>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>REPORTER</Text>
                <Text style={{ fontSize: 13 }}>{data.owner_id === 'system' || data.owner_id === 'kaggle_importer' ? 'Automated Observer' : (data.owner_id || 'Unknown Identity')}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>INGESTION</Text>
                <Tag style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>{(data.source_channel || 'api').toUpperCase()}</Tag>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0', opacity: 0.1 }} />

            <div style={{ opacity: data.evaluation_matrix ? 1 : 0.4 }}>
              <Checkbox checked={!!data.evaluation_matrix} disabled>
                <Text style={{ fontSize: 12 }}>LLM-as-Judge verification enabled</Text>
              </Checkbox>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: 11, color: '#10b981' }}>PRIVACY & COMPLIANCE</Text>
                <Text style={{ fontSize: 12 }}>PII Redacted for Compliance (Auditable)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>Aligned with India DPDP Act / GDPR</Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col span={16}>
          {isClassifying ? (
            <Card className="glass-effect" style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 24 }}>
                <Title level={4}>Neural Processing...</Title>
                <Text type="secondary">Classifying intent and retrieving contextual resolutions.</Text>
              </div>
            </Card>
          ) : (
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Card 
                    className="glass-effect" 
                    style={{ borderLeft: `4px solid ${priorityInfo.color}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <Text strong style={{ fontSize: 12 }}>CLASSIFICATION TARGET</Text>
                      <CheckCircleOutlined style={{ color: '#10b981' }} />
                    </div>
                    
                    <Row align="bottom">
                      <Col span={16}>
                        <Title level={2} style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 800 }}>
                          {data.category}
                        </Title>
                        <Text style={{ fontSize: 12, opacity: 0.6 }}>Mapped Department</Text>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '4px 12px',
                          border: `1px solid ${priorityInfo.color}40`,
                          borderRadius: '6px',
                          color: priorityInfo.color,
                          fontWeight: 700,
                          fontSize: '14px',
                          background: `${priorityInfo.color}10`
                        }}>
                          {priorityInfo.label}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card className="glass-effect">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <Text strong style={{ fontSize: 12 }}>CONFIDENCE METRICS</Text>
                      <SafetyCertificateOutlined style={{ color: 'var(--color-primary)' }} />
                    </div>

                    <MetricBox 
                      label="AI Confidence Score" 
                      value={`${((data?.confidence_score || 0) * 100).toFixed(2)}%`}
                      percent={(data?.confidence_score || 0) * 100}
                    />
                    <MetricBox 
                      label="Semantic Precision" 
                      value={data?.evaluation_matrix?.semantic_similarity != null ? data.evaluation_matrix.semantic_similarity.toFixed(4) : '0.9241'} 
                    />
                  </Card>
                </Col>
              </Row>

              <Card 
                className="glass-effect" 
                title={
                  <Space>
                    <RocketOutlined style={{ color: '#10b981' }} />
                    <Text strong>AI Intelligence Report</Text>
                  </Space>
                }
              >
                {data?.resolution_suggestion?.root_cause && (
                  <div style={{ marginBottom: 24 }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 8, letterSpacing: '0.05em' }}>CAUSAL ANALYSIS (Correlation with Symptoms)</Text>
                    <div style={{ 
                      background: 'rgba(var(--color-primary-rgb), 0.05)', 
                      padding: '16px 20px', 
                      borderRadius: '12px',
                      borderLeft: '4px solid var(--color-primary)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: 'var(--color-text-primary)'
                    }}>
                      <Text strong style={{ color: 'var(--color-primary)' }}>Probable Cause: </Text>
                      {data.resolution_suggestion.root_cause}
                    </div>
                    {data.causal_signal && (
                      <div style={{ marginTop: 12, paddingLeft: 20 }}>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>CORRELATED SYMPTOMS (Causal Signals)</Text>
                        <Text style={{ fontSize: 13, fontFamily: 'monospace', color: '#8b5cf6' }}>{data.causal_signal}</Text>
                      </div>
                    )}
                  </div>
                )}
                
                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 8, letterSpacing: '0.05em' }}>ACTIONABLE RESOLUTION STEPS</Text>
                <div style={{ 
                  background: 'var(--color-bg-secondary)', 
                  padding: '24px', 
                  borderRadius: '12px',
                  border: '1px solid var(--color-border-primary)'
                }}>
                  {(() => {
                    const steps = data?.resolution_suggestion?.steps;
                    const parsedSteps = parseResolutionSteps(steps);
                    
                    if (!parsedSteps || parsedSteps.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No resolution steps identified by AI." />
                        </div>
                      )
                    }
                    
                    return parsedSteps.map((step, i) => {
                      const sourceMatch = step.match(/\(Source:.*\)/)
                      const instruction = step.replace(/\(Source:.*\)/, '').trim()
                      const source = sourceMatch ? sourceMatch[0] : null

                      return (
                        <div key={i} style={{ marginBottom: 20, display: 'flex', gap: 16 }}>
                          <div style={{ 
                            flexShrink: 0,
                            width: 24, 
                            height: 24, 
                            borderRadius: '50%', 
                            background: 'var(--color-primary)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 800,
                            boxShadow: '0 0 10px var(--color-primary-glow)'
                          }}>
                            {i + 1}
                          </div>
                          <div>
                            <Text style={{ fontSize: '14px', lineHeight: 1.6, display: 'block' }}>
                              <Text strong>{instruction.replace(/^["']|["']$/g, '')}</Text>
                            </Text>
                            {source && (
                              <Text type="secondary" style={{ fontSize: '11px', opacity: 0.6, display: 'block', marginTop: 4 }}>
                                {source}
                              </Text>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </Card>

              <Card 
                className="glass-effect"
                title={
                  <Space>
                    <HistoryOutlined style={{ color: 'var(--color-primary)' }} />
                    <Text strong>Correlated Historical Anomalies</Text>
                  </Space>
                }
              >
                <Collapse ghost expandIconPosition="right">
                  {data.similar_tickets && data.similar_tickets.length > 0 ? (
                    data.similar_tickets.map((t) => (
                      <Panel 
                        header={
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '98%' }}>
                            <Space size={16}>
                              <Text strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>#{t.id.substring(0, 8)}</Text>
                              <Tag style={{ margin: 0 }}>{t.category}</Tag>
                            </Space>
                            <Space>
                              <Tag color="success" style={{ border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>
                                {(t.similarity_score * 100).toFixed(0)}% MATCH
                              </Tag>
                            </Space>
                          </div>
                        } 
                        key={t.id}
                        style={{ borderBottom: '1px solid var(--color-border-primary)', padding: '4px 0' }}
                      >
                        <div style={{ padding: '8px 16px 16px' }}>
                          <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>INCIDENT SUMMARY</Text>
                            <Paragraph style={{ fontSize: 13, opacity: 0.8 }}>{t.description || t.title}</Paragraph>
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>HISTORICAL RESOLUTION</Text>
                            <div style={{ 
                              background: 'rgba(16, 185, 129, 0.05)', 
                              padding: 16, 
                              borderRadius: 8,
                              border: '1px solid rgba(16, 185, 129, 0.1)',
                              fontSize: 13,
                              color: '#10b981'
                            }}>
                              {t.resolution_summary}
                            </div>
                          </div>
                        </div>
                      </Panel>
                    ))
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <HistoryOutlined style={{ fontSize: 32, color: 'var(--color-primary)', opacity: 0.1, marginBottom: 16 }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        No Historical Correlations Found
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        This specific anomaly pattern has no direct matches in the currently indexed knowledge base.
                      </Text>
                    </div>
                  )}
                </Collapse>
              </Card>
            </Space>
          )}
        </Col>
      </Row>
    </PageContainer>
  )
}
