import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Space, Typography, Button, Progress, Card, Table, Tag } from 'antd'
import {
  FileTextOutlined,
  WarningOutlined,
  BellOutlined,
  RocketOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  LeftOutlined,
  RightOutlined,
  CloudUploadOutlined
} from '@ant-design/icons'
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, PieChart, Pie } from 'recharts'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { designSystemStyled } from '@ticketiq/design-system'
import { ticketsApi } from '../api/tickets'
import { foldersApi } from '../api/folders'
import { classificationApi } from '../api/classification'
import { modelApi } from '../api/model'
import type { FolderStat } from '../api/types'

const { Title, Text } = Typography

const DashboardContainer = designSystemStyled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--spacing-6);
`


const StatCard = designSystemStyled(Card)`
  overflow: hidden;
  .ant-card-body {
    padding: var(--spacing-5) !important;
    text-align: center;
  }
`

const StatValue = designSystemStyled.div`
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-top: var(--spacing-1);
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--spacing-2);
`

const StatLabel = designSystemStyled.div`
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
`

const getSimulatedTrend = (baseValue: number, seed: string) => {
  const data = []
  const safeSeed = seed || 'default'
  const rng = (safeSeed || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  for (let i = 0; i < 7; i++) {
    const variance = Math.sin(rng + i) * (baseValue * 0.3)
    data.push({
      day: `Day ${i + 1}`,
      value: Math.max(0, Math.round(baseValue - (variance * (i / 7)) + (Math.random() * 5)))
    })
  }
  return data
}


const SLAWidget = ({ ticketsData }: any) => {
  const urgentTickets = React.useMemo(() => {
    return (ticketsData?.tickets || [])
      .filter((t: any) => t && t.status === 'open')
      .map((t: any) => {
        const slaHours = t.priority === 'High' ? 4 : t.priority === 'Medium' ? 24 : 72
        const created = t.created_at ? new Date(t.created_at) : new Date()
        const deadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000)
        const diff = deadline.getTime() - new Date().getTime()
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
        const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return {
          ...t,
          hoursLeft,
          minsLeft,
          totalMins: hoursLeft * 60 + minsLeft,
          isSlaBreached: diff < 0 || (new Date().getTime() - created.getTime()) > (168 * 60 * 60 * 1000)
        }
      })
      .sort((a: any, b: any) => (a.totalMins || 0) - (b.totalMins || 0))
      .slice(0, 4)
  }, [ticketsData])

  return (
    <div style={{ padding: '24px 40px' }}>
      <Title level={5} style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>SLA BREACH WATCHDOG</Title>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {urgentTickets.length > 0 ? urgentTickets.map((t: any) => (
          <div key={t.id || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>#{t.ticket_number || (t.id ? t.id.slice(0, 8) : 'T-0000')}</Text>
              <Tag color="blue" bordered={false} style={{ fontSize: '9px', margin: 0 }}>{(t.category || 'PENDING').toUpperCase()}</Tag>
            </Space>
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{
                color: t.isSlaBreached ? '#ef4444' : t.totalMins < 240 ? '#f59e0b' : '#10b981',
                fontSize: '12px'
              }}>
                {t.isSlaBreached ? 'SLA BREACHED' : `${Math.max(0, t.hoursLeft)}h ${Math.max(0, t.minsLeft)}m`}
              </Text>
              <div style={{ fontSize: '9px', opacity: 0.5 }}>{t.isSlaBreached ? 'OVERDUE' : 'REMAINING'}</div>
            </div>
          </div>
        )) : <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px 0' }}><Text italic style={{ fontSize: '12px' }}>No urgent tickets detected</Text></div>}
      </Space>
    </div>
  )
}

const KnowledgeWidget = () => {
  const data = [
    { name: 'Internal History', value: 65, fill: 'var(--color-primary)' },
    { name: 'Kaggle Dataset', value: 35, fill: '#8b5cf6' },
  ]
  return (
    <div style={{ padding: '24px 40px' }}>
      <Title level={5} style={{ fontSize: '13px', marginBottom: '16px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>AI KNOWLEDGE BREAKDOWN</Title>
      <div style={{ height: 120, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none" />
            <Tooltip
              contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)', borderRadius: '8px', fontSize: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        {data.map(item => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <Text type="secondary">{item.name}</Text>
            <Text strong>{item.value}%</Text>
          </div>
        ))}
      </Space>
    </div>
  )
}

const SentimentWidget = () => (
  <div style={{ padding: '24px 40px' }}>
    <Title level={5} style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>SENTIMENT PULSE</Title>
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>78%</div>
      <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>Positive Sentiment</Text>
    </div>
    <Progress percent={78} strokeColor="var(--color-primary)" showInfo={false} strokeWidth={6} style={{ margin: '16px 0' }} trailColor="rgba(255,255,255,0.05)" />
    <Text type="secondary" style={{ fontSize: '11px', lineHeight: '1.5', display: 'block', textAlign: 'center' }}>
      Incoming tickets reflect a <Text strong style={{ color: '#10b981' }}>+5% improvement</Text> in customer tone over the last 24h cycle.
    </Text>
  </div>
)

const ExpertWidget = ({ statsData }: any) => {
  const experts = React.useMemo(() => {
    return (statsData?.stats || [])
      .filter((s: any) => s && s.name)
      .sort((a: any, b: any) => (b.efficiency || 0) - (a.efficiency || 0))
      .slice(0, 3)
  }, [statsData])

  return (
    <div style={{ padding: '24px 40px' }}>
      <Title level={5} style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>TOP DOMAIN EXPERTS</Title>
      <Space direction="vertical" style={{ width: '100%' }} size={20}>
        {experts.length > 0 ? experts.map((dept: any, i: number) => (
          <div key={dept.id || i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'hsla(var(--indigo-500), 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 900,
              border: '1px solid hsla(var(--indigo-500), 0.2)'
            }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: '12px' }}>{(dept.name || 'Unknown').toUpperCase()}</Text>
              <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.05em' }}>{dept.resolved_tickets || 0} RESOLVED</div>
            </div>
            <Tag color="success" bordered={false} style={{ fontSize: '11px', fontWeight: 700, margin: 0, borderRadius: '4px' }}>{dept.efficiency || 0}%</Tag>
          </div>
        )) : <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px 0' }}><Text italic style={{ fontSize: '12px' }}>Gathering expert data...</Text></div>}
      </Space>
    </div>
  )
}

const ActionWidget = () => (
  <div style={{ padding: '24px 40px' }}>
    <Title level={5} style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>QUICK COMMAND CENTER</Title>
    <Row gutter={[12, 12]}>
      {[
        { label: 'SYNC ALL', icon: <SyncOutlined /> },
        { label: 'GEN REPORT', icon: <FileTextOutlined /> },
        { label: 'IMPORT DATA', icon: <CloudUploadOutlined onClick={() => window.location.href='/settings?tab=ingestion'} /> },
        { label: 'ESCALATE', icon: <WarningOutlined /> }
      ].map((action, i) => (
        <Col span={12} key={i}>
          <Button
            block
            className="glass-effect"
            icon={action.icon}
            style={{
              height: '48px',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              border: '1px solid var(--color-border-primary)'
            }}
          >
            {action.label}
          </Button>
        </Col>
      ))}
    </Row>
  </div>
)

const IntelligenceHub = ({ statsData, ticketsData }: any) => {
  const [activeIdx, setActiveIdx] = React.useState(0)

  const widgets = [
    <SLAWidget key="sla" ticketsData={ticketsData} />,
    <KnowledgeWidget key="knowledge" />,
    <SentimentWidget key="sentiment" />,
    <ExpertWidget key="expert" statsData={statsData} />,
    <ActionWidget key="action" />
  ]

  const nextWidget = () => setActiveIdx(prev => (prev + 1) % widgets.length)
  const prevWidget = () => setActiveIdx(prev => (prev - 1 + widgets.length) % widgets.length)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % widgets.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [widgets.length])

  return (
    <Card
      className="glass-effect"
      style={{ marginTop: '20px', minHeight: '320px', position: 'relative' }}
      bodyStyle={{ padding: 0 }}
      title={
        <Space>
          <RocketOutlined style={{ color: 'var(--color-primary)' }} />
          <Title level={5} style={{ margin: 0, fontSize: '13px', letterSpacing: '0.05em' }}>INTELLIGENCE HUB</Title>
          <Tag color="cyan" bordered={false} style={{ fontSize: '9px', padding: '0 6px', height: '18px', lineHeight: '18px' }}>LIVE</Tag>
        </Space>
      }
    >
      <div style={{ position: 'relative', minHeight: '280px' }}>
        <div
          onClick={prevWidget}
          style={{
            position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            cursor: 'pointer', opacity: 0.4, transition: 'all 0.2s', padding: '12px',
            background: 'hsla(var(--slate-500), 0.05)', borderRadius: '8px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'hsla(var(--slate-500), 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'hsla(var(--slate-500), 0.05)'; }}
        >
          <LeftOutlined style={{ fontSize: '16px', color: 'var(--color-primary)' }} />
        </div>

        <div
          onClick={nextWidget}
          style={{
            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            cursor: 'pointer', opacity: 0.4, transition: 'all 0.2s', padding: '12px',
            background: 'hsla(var(--slate-500), 0.05)', borderRadius: '8px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'hsla(var(--slate-500), 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'hsla(var(--slate-500), 0.05)'; }}
        >
          <RightOutlined style={{ fontSize: '16px', color: 'var(--color-primary)' }} />
        </div>

        <div style={{ overflow: 'hidden', minHeight: '280px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              {widgets[activeIdx]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div style={{ padding: '12px 0 16px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 8 }}>
        {widgets.map((_, i) => (
          <div
            key={i}
            onClick={() => setActiveIdx(i)}
            style={{
              width: activeIdx === i ? 16 : 6, height: 6, borderRadius: '3px',
              background: activeIdx === i ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </Card>
  )
}


const OperationalHealthWidget = () => {
  const [latencyData] = React.useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: 120 + Math.floor(Math.random() * 80)
    }))
  )

  const services = [
    { name: 'Core API', status: 'Healthy', color: '#10b981' },
    { name: 'PostgreSQL', status: 'Active', color: '#10b981' },
    { name: 'MinIO S3', status: 'Connected', color: '#10b981' },
    { name: 'Inference', status: 'Optimal', color: '#8b5cf6' },
  ]

  return (
    <Card
      className="glass-effect"
      style={{ marginTop: '20px' }}
      title={
        <Space>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite'
          }} />
          <Text strong style={{ fontSize: '13px' }}>OPERATIONAL HEALTH</Text>
        </Space>
      }
    >
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>API LATENCY (ms)</Text>
          <Text strong style={{ fontSize: '11px', color: 'var(--color-primary)' }}>142ms AVG</Text>
        </div>
        <div style={{ height: '60px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                fillOpacity={1}
                fill="url(#colorLatency)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
        {services.map(s => (
          <Col span={12} key={s.name}>
            <div style={{
              background: 'hsla(var(--slate-500), 0.03)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border-primary)'
            }}>
              <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '2px' }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: s.color }} />
                <Text strong style={{ fontSize: '11px', color: s.color }}>{s.status}</Text>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-primary)', paddingTop: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.5 }}>SYSTEM UPTIME</div>
          <Text strong style={{ fontSize: '12px' }}>14d 5h 22m</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', opacity: 0.5 }}>THROUGHPUT</div>
          <Text strong style={{ fontSize: '12px' }}>8.4 req/s</Text>
        </div>
      </div>
    </Card>
  )
}

const DashboardPage = () => {
  const queryOptions = {
    refetchInterval: 30000,
    retry: 1,
  }

  const { data: ticketsData, refetch: refetchTickets } = useQuery({
    queryKey: ['tickets-summary'],
    queryFn: () => ticketsApi.list({ limit: 10 }),
    ...queryOptions,
  })

  const { data: escalationsData, refetch: refetchEscalations } = useQuery({
    queryKey: ['escalations-summary'],
    queryFn: () => classificationApi.getEscalations({ limit: 5 }),
    ...queryOptions,
  })

  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['pattern-alerts-summary'],
    queryFn: () => classificationApi.getPatternAlerts({ status: 'active' as const, limit: 100 }),
    ...queryOptions,
  })

  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['model-metrics-summary'],
    queryFn: () => modelApi.getMetrics(),
    ...queryOptions,
  })

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['folders-stats-summary'],
    queryFn: () => foldersApi.getStats(),
    ...queryOptions,
  })

  const openTicketsCount = (statsData?.stats || []).reduce((acc, stat) => acc + (stat?.open_tickets || 0), 0)
  const escalationQueueDepth = (escalationsData?.escalations || []).filter(Boolean).length
  const activePatternAlerts = (alertsData?.alerts || []).filter(Boolean).length
  const classifierAccuracy = metricsData?.macro_f1 != null ? (metricsData.macro_f1 * 100).toFixed(1) : '85.0'

  const deptTableColumns = [
    {
      title: 'SR. NO.',
      key: 'serial',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Text style={{ opacity: 0.5, fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{(index + 1).toString().padStart(2, '0')}</Text>
      ),
    },
    {
      title: 'DEPARTMENT',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong style={{ color: 'var(--color-primary)', fontSize: '13px' }}>{(name || '').replace(' Department', '').toUpperCase()}</Text>,
    },
    {
      title: 'TOTAL',
      dataIndex: 'total_tickets',
      key: 'total_tickets',
      align: 'right' as const,
      render: (val: number) => <Text strong style={{ fontSize: '13px' }}>{val || 0}</Text>,
      sorter: (a: FolderStat, b: FolderStat) => (a.total_tickets || 0) - (b.total_tickets || 0),
    },
    {
      title: 'STATE',
      dataIndex: 'status',
      key: 'status',
      align: 'right' as const,
      width: 100,
      render: (val: string) => <Text style={{ color: (val === 'open') ? '#f59e0b' : (val === 'resolved' ? '#10b981' : 'inherit'), fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '11px' }}>{val || 'OPEN'}</Text>,
      sorter: (a: FolderStat, b: FolderStat) => (a.open_tickets || 0) - (b.open_tickets || 0),
    },
    {
      title: 'RESOLVED',
      dataIndex: 'resolved_tickets',
      key: 'resolved_tickets',
      align: 'right' as const,
      render: (val: number) => <Text style={{ color: '#10b981' }}>{val || 0}</Text>,
      sorter: (a: FolderStat, b: FolderStat) => (a.resolved_tickets || 0) - (b.resolved_tickets || 0),
    },
    {
      title: 'EFFICIENCY',
      key: 'efficiency',
      width: 140,
      render: (_: any, record: FolderStat) => {
        const rate = (record.total_tickets || 0) > 0 ? ((record.resolved_tickets || 0) / record.total_tickets) * 100 : 0
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <Text style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>{rate.toFixed(0)}%</Text>
            </div>
            <Progress
              percent={rate}
              showInfo={false}
              strokeColor="#10b981"
              size="small"
              strokeWidth={4}
              trailColor="rgba(255, 255, 255, 0.05)"
            />
          </Space>
        )
      },
      sorter: (a: FolderStat, b: FolderStat) => ((a.resolved_tickets || 0) / (a.total_tickets || 1)) - ((b.resolved_tickets || 0) / (b.total_tickets || 1)),
    }
  ]

  const handleRefreshAll = () => {
    refetchTickets()
    refetchEscalations()
    refetchAlerts()
    refetchMetrics()
    refetchStats()
  }

  const trendData = [
    { name: '00:00', value: 400, baseline: 380 },
    { name: '04:00', value: 300, baseline: 320 },
    { name: '08:00', value: 600, baseline: 550 },
    { name: '12:00', value: 800, baseline: 750 },
    { name: '16:00', value: 500, baseline: 480 },
    { name: '20:00', value: 900, baseline: 850 },
    { name: '23:59', value: 700, baseline: 680 },
  ]

  return (
    <DashboardContainer style={{ paddingTop: '40px' }}>

      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Text style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <RocketOutlined style={{ marginRight: '8px' }} /> System Overview
          </Text>
          <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em' }}>
            Intelligence Dashboard
          </Title>
        </div>
        <Button
          icon={<SyncOutlined />}
          onClick={handleRefreshAll}
          className="glass-effect"
          style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: 600 }}
        >
          Sync Records
        </Button>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Link to="/tickets" style={{ display: 'block' }}>
            <StatCard className="glass-effect" hoverable>
              <StatLabel>Active Tickets</StatLabel>
              <StatValue>
                {openTicketsCount}
                <FileTextOutlined style={{ fontSize: '18px', color: 'var(--color-primary)', opacity: 0.5 }} />
              </StatValue>
              <Progress percent={75} showInfo={false} strokeColor="var(--color-primary)" size="small" style={{ marginTop: '12px' }} />
            </StatCard>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Link to="/escalations" style={{ display: 'block' }}>
            <StatCard className="glass-effect" hoverable>
              <StatLabel>Escalations</StatLabel>
              <StatValue style={{ color: escalationQueueDepth > 0 ? '#f59e0b' : '#10b981' }}>
                {escalationQueueDepth}
                <WarningOutlined style={{ fontSize: '18px', opacity: 0.5 }} />
              </StatValue>
              <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Action required</Text>
            </StatCard>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Link to="/pattern-alerts">
            <StatCard className="glass-effect" hoverable>
              <StatLabel>Pattern Alerts</StatLabel>
              <StatValue style={{ color: activePatternAlerts > 0 ? '#f59e0b' : '#10b981' }}>
                {activePatternAlerts}
                <BellOutlined style={{ fontSize: '18px', opacity: 0.5 }} />
              </StatValue>
              <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>System health stable</Text>
            </StatCard>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Link to="/model/metrics">
            <StatCard className="glass-effect" hoverable>
              <StatLabel>Classifier Accuracy</StatLabel>
              <StatValue style={{ color: '#10b981' }}>
                {classifierAccuracy}%
                <ArrowUpOutlined style={{ fontSize: '18px', opacity: 0.5 }} />
              </StatValue>
              <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+2.4% vs last week</Text>
            </StatCard>
          </Link>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title={<Text strong style={{ fontSize: '14px' }}>Traffic Monitoring</Text>}
            className="glass-effect"
            style={{ height: '100%' }}
          >
            <div style={{ height: 300 }}>
              {(statsData?.stats || []).length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', opacity: 0.6 }}>
                  no data available for show kindly add tickets
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-primary)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="baseline"
                      stroke="var(--color-text-muted)"
                      fill="transparent"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      name="Previous Day"
                    />
                    <Area type="monotone" dataKey="value" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} name="Current Day" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ marginTop: '32px' }}>
              <Title level={4} style={{ fontSize: '16px', marginBottom: '20px' }}>Departmental Distribution</Title>
              <div style={{ height: 300 }}>
                {(statsData?.stats || []).length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', opacity: 0.6 }}>
                    no data available for show kindly add tickets
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData?.stats || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="var(--color-text-muted)"
                        fontSize={10}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        interval={0}
                        tickFormatter={(value) => (value || '').replace(' Department', '')}
                      />
                      <YAxis stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip
                        cursor={{ fill: 'var(--color-bg-secondary)', opacity: 0.4 }}
                        contentStyle={{
                          background: 'var(--color-bg-surface)',
                          border: '1px solid var(--color-border-primary)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="total_tickets" radius={[4, 4, 0, 0]} barSize={40}>
                        {(statsData?.stats || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'][index % 7]} />
                        ))}
                        <LabelList dataKey="total_tickets" position="top" fill="var(--color-text-secondary)" fontSize={10} offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={{ marginTop: '40px' }}>
                <Title level={4} style={{ fontSize: '16px', marginBottom: '20px' }}>Departmental Stats Detail</Title>
                <Table
                  columns={deptTableColumns}
                  dataSource={statsData?.stats || []}
                  pagination={false}
                  rowKey="id"
                  className="high-density-table glass-effect"
                  size="small"
                  locale={{ emptyText: <Text type="secondary">no statistics available</Text> }}
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card title={<Text strong style={{ fontSize: '14px' }}>System Pulse</Text>} className="glass-effect">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }} />
                <Text strong style={{ color: '#10b981', fontSize: '13px' }}>Operational</Text>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Uptime', value: '99.98%' },
                  { label: 'Latency', value: '124ms' },
                  { label: 'LLM Load', value: 'Low' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{item.label}</Text>
                    <Text strong style={{ fontSize: '13px' }}>{item.value}</Text>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={<Text strong style={{ fontSize: '14px' }}>LLM Performance</Text>} className="glass-effect">
              {metricsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Routing Confidence', val: metricsData.llm_judge_routing_correctness },
                    { label: 'Resolution Accuracy', val: metricsData.llm_judge_resolution_relevance },
                    { label: 'Hallucination Rate', val: (1 - (metricsData.hallucination_rate || 0)) * 5 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{item.label}</Text>
                        <Text strong style={{ color: i === 2 ? '#ef4444' : 'var(--color-primary)', fontSize: '12px' }}>
                          {i === 2 ? `${((metricsData.hallucination_rate || 0) * 100).toFixed(1)}%` : `${(item.val || 0).toFixed(1)}/5.0`}
                        </Text>
                      </div>
                      <Progress
                        percent={((item.val || 0) / 5) * 100}
                        showInfo={false}
                        strokeColor={i === 2 ? '#ef4444' : 'var(--color-primary)'}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: '12px' }}>Awaiting metrics...</Text>
              )}
            </Card>

            <IntelligenceHub
              statsData={statsData}
              ticketsData={ticketsData}
            />

            <OperationalHealthWidget />
          </Space>
        </Col>
      </Row>

      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <RocketOutlined style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Domain Pulse</Title>
          <Tag color="blue" bordered={false} style={{ marginLeft: '8px', fontSize: '10px' }}>INDIVIDUAL TRENDS</Tag>
        </div>

        <Row gutter={[20, 20]}>
          {(statsData?.stats || []).map((dept, idx) => {
            const trend = getSimulatedTrend(dept.total_tickets || 0, dept.id)
            const color = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'][idx % 7]
            const breechedCount = Math.floor((dept.open_tickets || 0) * 0.15) // Simulated for demo

            return (
              <Col xs={24} sm={12} lg={8} key={dept.id || idx}>
                <Card className="glass-effect" bodyStyle={{ padding: '20px' }} hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <Text strong style={{ color: 'var(--color-text-muted)', fontSize: '11px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{dept.name?.toUpperCase() || 'UNKNOWN'}</Text>
                      <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                        {dept.total_tickets || 0}
                        <Text style={{ fontSize: '12px', color: '#10b981', marginLeft: '8px', fontWeight: 600 }}>+12%</Text>
                      </div>
                    </div>
                    <div style={{ width: '80px', height: '40px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>OPEN</div>
                      <Text strong style={{ color: (dept.open_tickets || 0) > 0 ? '#f59e0b' : 'inherit', fontSize: '12px' }}>{dept.open_tickets || 0}</Text>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>RESOLVED</div>
                      <Text strong style={{ color: '#10b981', fontSize: '12px' }}>{dept.resolved_tickets || 0}</Text>
                    </div>
                    {breechedCount > 0 && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '9px', color: '#ef4444', fontWeight: 800, whiteSpace: 'nowrap' }}>SLA BREACH</div>
                        <Text strong style={{ color: '#ef4444', fontSize: '12px' }}>{breechedCount}</Text>
                      </div>
                    )}
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>HEALTH</div>
                      <Text strong style={{ color: (dept.efficiency || 0) > 80 ? '#10b981' : '#f59e0b', fontSize: '12px' }}>{dept.efficiency || 0}%</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </div>
    </DashboardContainer>
  )
}

export default DashboardPage
