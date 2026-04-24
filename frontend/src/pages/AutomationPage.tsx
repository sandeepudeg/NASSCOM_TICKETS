import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Card,
  Tooltip,
} from 'antd'
import { ThunderboltOutlined, DownloadOutlined, SyncOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { classificationApi } from '../api/classification'
import { designSystemStyled } from '@ticketiq/design-system'
import type { AutomationCandidate } from '../api/types'

const { Text, Title } = Typography

const PageContainer = designSystemStyled.div`
  max-width: 1600px;
  margin: 0 auto;
`

export default function AutomationPage() {

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['automation-candidates'],
    queryFn: () => classificationApi.getAutomationCandidates({ limit: 50 }),
  })

  const handleExport = () => {
    const params = new URLSearchParams()
    params.append('is_automation_candidate', 'true')
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8005/api/v1/tickets/export-all' : '/api/v1/tickets/export-all'
    window.open(`${baseUrl}?${params.toString()}`, '_blank')
  }

  const columns = [
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>SR. NO.</div>,
      key: 'srno',
      width: 85,
      render: (_: any, __: any, index: number) => (
        <Text style={{ opacity: 0.5, fontSize: '11px', whiteSpace: 'nowrap' }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 120,
      render: (text: string, record: AutomationCandidate) => (
        <Link 
          to={`/tickets/${record.id}`} 
          style={{ 
            color: 'var(--color-primary)', 
            fontWeight: 700, 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em'
          }}
        >
          #{text || record.id.substring(0, 8).toUpperCase()}
        </Link>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: AutomationCandidate) => (
        <Space direction="vertical" size={0}>
          <Text 
            style={{ 
              color: 'var(--color-text-primary)', 
              fontWeight: 600,
              fontSize: '14px',
              display: 'block'
            }}
          >
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.description.substring(0, 80)}...</Text>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (category: string) => (
        <Tag style={{ 
          margin: 0,
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          color: '#8b5cf6',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}>
          {category}
        </Tag>
      ),
    },
    {
      title: 'Automation Signal',
      dataIndex: 'confidence_score',
      key: 'automation_signal',
      width: 180,
      render: (score: number, record: AutomationCandidate) => {
        const percentage = (score * 100).toFixed(1)
        const isRepeated = record.is_repeated_issue
        
        return (
          <Link to={`/tickets/${record.id}`} style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}>
            <Space direction="vertical" size={4} style={{ width: '100%', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 800 }}>{percentage}% MATCH</Text>
                {isRepeated && (
                  <Tooltip title="Cluster detected: Multiple occurrences of this pattern found">
                    <Tag color="purple" style={{ fontSize: '9px', margin: 0, borderRadius: '4px', fontWeight: 800 }}>REPEATED</Tag>
                  </Tooltip>
                )}
              </div>
              <div style={{ 
                width: '100%', height: '6px', background: 'var(--color-bg-secondary)', 
                borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--color-border-primary)'
              }}>
                <div style={{ 
                  width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                }} />
              </div>
            </Space>
          </Link>
        )
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: AutomationCandidate) => (
        <Space>
           <Tooltip title="View resolution details and promote to script">
            <Button
              type="primary"
              size="small"
              icon={<RobotOutlined />}
              onClick={() => navigate(`/tickets/${record.id}`)}
              style={{ background: '#8b5cf6', borderColor: '#8b5cf6', fontSize: '11px' }}
            >
              Review
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const navigate = useNavigate()

  return (
    <PageContainer>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <ThunderboltOutlined style={{ color: '#8b5cf6', marginRight: '16px' }} />
            Automation Opportunities
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            AI-identified candidates for robotic process automation (RPA) based on high-confidence historical matches
          </Text>
        </div>
        <Space>
          <div style={{ marginRight: '16px', textAlign: 'right' }}>
             <Tag color="#10b981" icon={<CheckCircleOutlined />} bordered={false} style={{ fontWeight: 700, borderRadius: '4px' }}>
               AGENTIC ENGINE ACTIVE
             </Tag>
          </div>
          <Button 
            onClick={() => refetch()} 
            icon={<SyncOutlined />}
            className="glass-effect"
          >
            Refresh
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            Export Candidates
          </Button>
        </Space>
      </div>

      <Card 
        className="glass-effect" 
        bodyStyle={{ padding: 0 }}
        style={{ borderTop: '4px solid #8b5cf6' }}
      >
        <Table
          loading={isLoading}
          dataSource={data?.automation_candidates || []}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 15, position: ['bottomRight'] }}
          className="high-density-table"
          locale={{ 
            emptyText: (
              <div style={{ padding: '64px 0', textAlign: 'center' }}>
                <RobotOutlined style={{ fontSize: 48, color: '#8b5cf6', opacity: 0.2, marginBottom: 16 }} />
                <div>
                  <Title level={5}>No Automation Candidates Detected</Title>
                  <Text type="secondary">The Agentic Engine will surface candidates here when confidence matches exceed 95%.</Text>
                </div>
              </div>
            ) 
          }}
        />
      </Card>
      
      <div style={{ marginTop: 24, padding: 20, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.1)' }}>
        <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>
          <BulbOutlined /> How Automation Candidates are Found
        </Title>
        <Text style={{ fontSize: '13px', lineHeight: 1.6 }}>
          The TicketIQ Agentic Engine continuously monitors incoming tickets. When a new ticket shows a <strong>Semantic Similarity &gt; 95%</strong> with a resolved historical pattern, or when multiple identical issues are clustered within a short time window, it is automatically promoted to this queue for RPA (Robotic Process Automation) review.
        </Text>
      </div>
    </PageContainer>
  )
}

import { BulbOutlined } from '@ant-design/icons'
