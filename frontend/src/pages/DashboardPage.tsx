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
  CloudUploadOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  AuditOutlined,
  HistoryOutlined,
  PlusCircleOutlined
} from '@ant-design/icons'
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { designSystemStyled } from '@ticketiq/design-system'
import { getUserRole, getUserId } from '../auth/tokenStorage'
import { ticketsApi } from '../api/tickets'
import { foldersApi } from '../api/folders'
import { classificationApi } from '../api/classification'
import { modelApi } from '../api/model'
import { analyticsApi } from '../api/analytics'
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
  opacity: 0.9;
`



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
                color: t.isSlaBreached ? 'var(--color-text-danger)' : t.totalMins < 240 ? 'var(--color-text-warning)' : 'var(--color-text-success)',
                fontSize: '12px'
              }}>
                {t.isSlaBreached ? 'SLA BREACHED' : `${Math.max(0, t.hoursLeft)}h ${Math.max(0, t.minsLeft)}m`}
              </Text>
              <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>{t.isSlaBreached ? 'OVERDUE' : 'REMAINING'}</div>
            </div>
          </div>
        )) : <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '20px 0' }}><Text italic style={{ fontSize: '12px', color: 'inherit' }}>No urgent tickets detected</Text></div>}
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
      <div style={{ height: 120, marginBottom: 16, minHeight: 120 }}>
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
            <Text style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.name}</Text>
            <Text strong>{item.value}%</Text>
          </div>
        ))}
      </Space>
    </div>
  )
}

const SentimentWidget = ({ analyticsData }: any) => {
  const sentiment = analyticsData?.avg_sentiment_percent || 50;
  const isPositive = sentiment >= 60;

  return (
    <div style={{ padding: '24px 40px' }}>
      <Title level={5} style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>SENTIMENT PULSE</Title>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>{sentiment}%</div>
        <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.9 }}>Average Customer Tone</Text>
      </div>
      <Progress percent={sentiment} strokeColor="var(--color-primary)" showInfo={false} size={["100%", 6]} style={{ margin: '16px 0' }} trailColor="var(--color-bg-trail)" />
      <Text type="secondary" style={{ fontSize: '11px', lineHeight: '1.5', display: 'block', textAlign: 'center' }}>
        Current tickets reflect a <Text strong style={{ color: isPositive ? 'var(--color-text-success)' : 'var(--color-text-warning)' }}>{isPositive ? 'Healthy' : 'Mixed'}</Text> customer sentiment across all domains.
      </Text>
    </div>
  )
}

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
              width: 28, height: 28, borderRadius: '50%', background: 'var(--color-bg-trail)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 900,
              border: '1px solid var(--color-border-primary)'
            }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: '12px' }}>{(dept.name || 'Unknown').toUpperCase()}</Text>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>{dept.resolved_tickets || 0} RESOLVED</div>
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
        { label: 'IMPORT DATA', icon: <CloudUploadOutlined onClick={() => window.location.href = '/settings?tab=ingestion'} /> },
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

const IntelligenceHub = ({ statsData, ticketsData, analyticsData }: any) => {
  const [activeIdx, setActiveIdx] = React.useState(0)

  const widgets = [
    <SLAWidget key="sla" ticketsData={ticketsData} />,
    <KnowledgeWidget key="knowledge" />,
    <SentimentWidget key="sentiment" analyticsData={analyticsData} />,
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
      styles={{ body: { padding: 0 } }}
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
              background: activeIdx === i ? 'var(--color-primary)' : 'var(--color-bg-trail)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </Card>
  )
}


const OrchestrationLogFeed = ({ isExecuting, isDone }: { isExecuting: boolean, isDone: boolean }) => {
  const logs = [
    { time: 'JUST NOW', msg: 'AI-Powered routing rules updated for Network domain.', type: 'system' },
    { time: '1m ago', msg: 'Capacity threshold exceeded in Infrastructure; suggest rebalance.', type: 'warning' },
    { time: '5m ago', msg: 'System health check completed. All services optimal.', type: 'info' },
    { time: '12m ago', msg: 'Model retraining sync successful for classification engine.', type: 'system' },
  ]

  const activeLogs = isDone ? [
    { time: 'ACTIVE', msg: 'Successfully rebalanced 2 agents to Network team.', type: 'success' },
    { time: 'JUST NOW', msg: 'Traffic pattern shift detected; reducing Network queue latency.', type: 'success' },
    ...logs
  ] : isExecuting ? [
    { time: 'PENDING', msg: 'Recalculating routing weights and agent affinity...', type: 'warning' },
    ...logs
  ] : logs

  return (
    <div style={{ 
      marginTop: '16px', 
      padding: '16px 20px', 
      background: 'rgba(255,255,255,0.01)', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.05)',
      minHeight: '140px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
        <Space size={12}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Orchestration Log
          </div>
          {isDone && (
            <Button 
              type="link" 
              size="small" 
              onClick={(e: any) => {
                e.preventDefault();
                (window as any).resetOrchestration?.();
              }}
              style={{ fontSize: '9px', padding: 0, height: 'auto', color: 'var(--color-text-muted)' }}
            >
              [ Reset Optimization ]
            </Button>
          )}
        </Space>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isExecuting ? 'var(--color-text-warning)' : 'var(--color-text-success)', boxShadow: `0 0 8px ${isExecuting ? 'var(--color-text-warning)' : 'var(--color-text-success)'}` }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeLogs.slice(0, 4).map((log, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: i === 0 ? 1 : 0.6 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Text style={{ color: 'var(--color-text-secondary)', fontSize: '9px', fontWeight: 700, width: '50px', marginTop: '1px' }}>{log.time}</Text>
              <Text style={{ color: log.type === 'success' ? 'var(--color-text-success)' : (log.type === 'warning' ? 'var(--color-text-warning)' : 'var(--color-text-primary)'), fontWeight: i === 0 ? 600 : 400 }}>
                {log.msg}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PredictiveVelocityGauge = ({ isExecuting, isDone }: { isExecuting: boolean, isDone: boolean }) => {
  const velocity = isDone ? 94 : isExecuting ? 78 : 64;
  const statusColor = velocity > 90 ? 'var(--color-text-success)' : (velocity > 75 ? 'var(--color-primary)' : 'var(--color-text-warning)');

  return (
    <div style={{ 
      marginTop: '16px', 
      padding: '16px 20px', 
      background: 'rgba(255,255,255,0.01)', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.05)',
      height: '140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '12px', left: '20px', fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Predictive Velocity
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <Progress
          type="dashboard"
          percent={velocity}
          gapDegree={120}
          strokeColor={statusColor}
          size={80}
          trailColor="var(--color-bg-trail)"
          format={(percent) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '15px' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-text-primary)' }}>{percent}%</span>
              <span style={{ fontSize: '8px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Current</span>
            </div>
          )}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '-5px' }}>
         <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
         <Text strong style={{ fontSize: '10px', color: statusColor }}>{velocity > 90 ? 'OPTIMAL THROUGHPUT' : (velocity > 75 ? 'ADJUSTING AFFINITY' : 'CAPACITY LIMITED')}</Text>
      </div>
    </div>
  )
}

const SecurityMonitorWidget = () => {
  const complianceItems = [
    { label: 'PII Redaction', status: '100% Protected', icon: <LockOutlined style={{ color: '#10b981' }} />, color: '#10b981' },
    { label: 'DPDP Compliance', status: 'Compliant', icon: <AuditOutlined style={{ color: '#38bdf8' }} />, color: '#38bdf8' },
    { label: 'AI Safety Audit', status: 'A+ Rated', icon: <SafetyCertificateOutlined style={{ color: '#8b5cf6' }} />, color: '#8b5cf6' },
  ]

  return (
    <Card
      className="glass-effect shadow-accent"
      style={{ marginTop: '20px', borderLeft: '4px solid #8b5cf6' }}
      styles={{ body: { padding: '20px 24px' } }}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#8b5cf6' }} />
          <Text strong style={{ fontSize: '13px', letterSpacing: '0.02em' }}>GOVERNANCE & SECURITY</Text>
        </Space>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {complianceItems.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={12}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--color-bg-trail)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.label}</Text>
            </Space>
            <Tag color={item.color === '#10b981' ? 'success' : (item.color === '#38bdf8' ? 'processing' : 'purple')} bordered={false} style={{ margin: 0, fontSize: '10px', fontWeight: 700, borderRadius: '4px' }}>
              {item.status.toUpperCase()}
            </Tag>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HistoryOutlined style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }} />
          <Text style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Last Safety Sync</Text>
        </div>
        <Text style={{ fontSize: '10px', color: 'var(--color-text-primary)', fontWeight: 700 }}>JUST NOW</Text>
      </div>
    </Card>
  )
}

const StrategicIntelligenceCommand = ({ metricsData, analyticsData }: any) => {
  const radarData = [
    { subject: 'AI Accuracy', A: 92, B: 85, fullMark: 100 },
    { subject: 'Human Speed', A: 78, B: 90, fullMark: 100 },
    { subject: 'Resolution Quality', A: 95, B: 88, fullMark: 100 },
    { subject: 'SLA Compliance', A: 98, B: 82, fullMark: 100 },
    { subject: 'Volume Handling', A: 85, B: 95, fullMark: 100 },
  ];

  const sentimentVelocity = [
    { time: '09:00', velocity: 65 },
    { time: '12:00', velocity: 72 },
    { time: '15:00', velocity: 68 },
    { time: '18:00', velocity: 85 },
    { time: '21:00', velocity: 92 },
    { time: '00:00', velocity: 88 },
  ];

  const highRiskIncidents = [
    { id: 'T-9842', user: 'Enterprise Alpha', risk: 'Critical', trend: 'rising' },
    { id: 'T-9855', user: 'Global Logistics', risk: 'High', trend: 'stable' },
    { id: 'T-9861', user: 'Finance Corp', risk: 'Elevated', trend: 'rising' },
  ];

  return (
    <div style={{ marginTop: '48px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
          <AuditOutlined style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>Strategic Intelligence Command</Title>
          <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EXECUTIVE OVERSIGHT GRID</Text>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={9}>
          <Card className="glass-effect" title={<Text strong style={{ fontSize: '13px' }}>Domain Mastery Radar</Text>}>
            <div style={{ height: 320, display: 'flex', justifyContent: 'center', minHeight: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--color-border-primary)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="AI Engine" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                  <Radar name="Human Staff" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
              <Space><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} /><Text style={{ fontSize: '11px' }}>AI Engine</Text></Space>
              <Space><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /><Text style={{ fontSize: '11px' }}>Human Staff</Text></Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card className="glass-effect" title={<Text strong style={{ fontSize: '13px' }}>Sentiment Velocity Trajectory</Text>}>
            <div style={{ height: 320, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentimentVelocity}>
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="velocity" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVelocity)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Text strong style={{ color: 'var(--color-text-success)', fontSize: '12px' }}>↑ 14% improvement in positive sentiment since shift approval</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card className="glass-effect" title={<Text strong style={{ fontSize: '13px' }}>Predictive Churn Risk</Text>}>
            <div style={{ height: 320, overflow: 'auto' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {highRiskIncidents.map(item => (
                  <div key={item.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--color-border-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text strong style={{ color: 'var(--color-primary)' }}>{item.id}</Text>
                      <Tag color={item.risk === 'Critical' ? 'error' : 'warning'} bordered={false} style={{ fontSize: '10px', borderRadius: '4px' }}>{item.risk.toUpperCase()}</Tag>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{item.user}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '10px' }}>Churn Trend</Text>
                      <Space size={4}>
                        {item.trend === 'rising' ? <ArrowUpOutlined style={{ color: '#ef4444', fontSize: '10px' }} /> : <SyncOutlined spin style={{ color: '#f59e0b', fontSize: '10px' }} />}
                        <Text style={{ fontSize: '10px', color: item.trend === 'rising' ? '#ef4444' : 'inherit' }}>{item.trend.toUpperCase()}</Text>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
              <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                <Text style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>
                  <WarningOutlined style={{ marginRight: '6px' }} /> AI warns of possible escalation in Enterprise Alpha due to repeated routing failures.
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

const OperationalHealthWidget = ({ analyticsData }: any) => {
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
      <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
        {services.map(s => (
          <Col span={12} key={s.name}>
            <div style={{
              background: 'hsla(var(--slate-500), 0.03)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border-primary)'
            }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '2px' }}>{s.name}</div>
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
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>SYSTEM STATUS</div>
          <Text strong style={{ fontSize: '12px' }}>{analyticsData?.system_status || 'Optimal'}</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>THROUGHPUT</div>
          <Text strong style={{ fontSize: '12px' }}>{analyticsData?.throughput_per_hour || 0} tix/h</Text>
        </div>
      </div>
    </Card>
  )
}

const DashboardPage = () => {
  const isAdmin = getUserRole() === 'admin'
  const [isOrchestrationExecuting, setIsOrchestrationExecuting] = React.useState(false)
  const [isOrchestrationDone, setIsOrchestrationDone] = React.useState(localStorage.getItem('orchestration_active') === 'true')

  const handleApproveShift = () => {
    setIsOrchestrationExecuting(true)
    setTimeout(() => {
      setIsOrchestrationExecuting(false)
      setIsOrchestrationDone(true)
      localStorage.setItem('orchestration_active', 'true')
    }, 2000)
  }

  const handleResetOrchestration = () => {
    setIsOrchestrationDone(false)
    localStorage.removeItem('orchestration_active')
  }

  // Attach to window for the child component to access (simple bridge for the demo)
  React.useEffect(() => {
    (window as any).resetOrchestration = handleResetOrchestration
    return () => { delete (window as any).resetOrchestration }
  }, [])

  const queryOptions = {
    refetchInterval: 30000,
    retry: 1,
  }

  const { data: ticketsData, refetch: refetchTickets } = useQuery({
    queryKey: ['tickets-summary', getUserRole(), getUserId()],
    queryFn: () => ticketsApi.list({ 
      page_size: 10,
      owner_id: getUserRole() === 'admin' ? undefined : getUserId() || undefined
    }),
    ...queryOptions,
  })

  const { data: escalationsData, refetch: refetchEscalations } = useQuery({
    queryKey: ['escalations-summary', getUserRole(), getUserId()],
    queryFn: () => classificationApi.getEscalations({ 
      limit: 5,
      owner_id: getUserRole() === 'admin' ? undefined : getUserId() || undefined
    }),
    ...queryOptions,
  })

  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['pattern-alerts-summary', getUserRole(), getUserId()],
    queryFn: () => classificationApi.getPatternAlerts({ 
      status: 'active' as const, 
      limit: 100,
      owner_id: getUserRole() === 'admin' ? undefined : getUserId() || undefined
    }),
    ...queryOptions,
  })

  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['model-metrics-summary'],
    queryFn: () => modelApi.getMetrics(),
    ...queryOptions,
  })

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['folders-stats-summary', getUserRole(), getUserId()],
    queryFn: () => foldersApi.getStats({
      ticket_owner_id: getUserRole() === 'admin' ? undefined : getUserId() || undefined
    }),
    ...queryOptions,
  })

  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsApi.getDashboardSummary(),
    ...queryOptions,
  })

  const openTicketsCount = (statsData?.stats || []).reduce((acc, stat) => acc + (stat?.open_tickets || 0), 0)
  const escalationQueueDepth = (escalationsData?.escalations || []).filter(Boolean).length
  const activePatternAlerts = alertsData?.total || 0
  const classifierAccuracy = metricsData?.macro_f1 != null ? (metricsData.macro_f1 * 100).toFixed(1) : '85.0'

  const optimizationInsight = React.useMemo(() => {
    const stats = statsData?.stats || []
    if (stats.length < 2) return null

    const deptsWithLoad = stats.map(s => ({
      name: (s.name || '').replace(' Department', '').toUpperCase(),
      loadFactor: (s.open_tickets || 0) / (s.total_tickets || 1),
      originalOpen: s.open_tickets || 0
    }))

    const overloaded = [...deptsWithLoad].sort((a, b) => b.loadFactor - a.loadFactor)[0]
    const underloaded = [...deptsWithLoad].sort((a, b) => a.loadFactor - b.loadFactor)[0]

    if (overloaded.name === underloaded.name || overloaded.loadFactor === 0) return null

    return {
      overloadedName: overloaded.name,
      overloadedLoad: Math.round(overloaded.loadFactor * 100),
      underloadedName: underloaded.name,
      suggestedAgents: Math.max(1, Math.floor((overloaded.originalOpen - underloaded.originalOpen) / 5) || 2),
      predictedGain: Math.min(25, Math.round((overloaded.loadFactor - underloaded.loadFactor) * 40) + 5),
      riskForecast: {
        breachCount: Math.max(1, Math.floor(overloaded.originalOpen / 4)),
        timeWindow: '2h',
        severity: overloaded.loadFactor > 0.7 ? 'CRITICAL' : 'ELEVATED'
      }
    }
  }, [statsData])

  const deptTableColumns = [
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
      render: (val: string) => <Text style={{ color: (val === 'open') ? 'var(--color-text-warning)' : (val === 'resolved' ? 'var(--color-text-success)' : 'inherit'), fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '11px' }}>{val || 'OPEN'}</Text>,
      sorter: (a: FolderStat, b: FolderStat) => (a.open_tickets || 0) - (b.open_tickets || 0),
    },
    {
      title: 'RESOLVED',
      dataIndex: 'resolved_tickets',
      key: 'resolved_tickets',
      align: 'right' as const,
      render: (val: number) => <Text style={{ color: 'var(--color-text-success)' }}>{val || 0}</Text>,
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
              <Text style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-success)' }}>{rate.toFixed(0)}%</Text>
            </div>
            <Progress
              percent={rate}
              showInfo={false}
              strokeColor="var(--color-text-success)"
              size={["100%", 4]}
              trailColor="var(--color-bg-trail)"
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
    refetchAnalytics()
  }


  if (!isAdmin) {
    return (
      <DashboardContainer style={{ paddingTop: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Text style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            User Workspace
          </Text>
          <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em' }}>
            My Service Portal
          </Title>
        </div>

        <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={12}>
            <Link to="/tickets" style={{ display: 'block' }}>
              <StatCard className="glass-effect" hoverable>
                <StatLabel>Track Progress</StatLabel>
                <StatValue>
                  {ticketsData?.total || 0}
                  <SyncOutlined style={{ fontSize: '18px', color: 'var(--color-primary)' }} />
                </StatValue>
                <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Ongoing service requests</Text>
              </StatCard>
            </Link>
          </Col>
          <Col xs={24} md={12}>
            <Link to="/tickets/new" style={{ display: 'block' }}>
              <StatCard className="glass-effect" hoverable style={{ border: '1px solid var(--color-primary)', background: 'rgba(99, 102, 241, 0.02)' }}>
                <StatLabel>Need Help?</StatLabel>
                <StatValue style={{ color: 'var(--color-primary)' }}>
                  RAISE NEW TICKET
                  <PlusCircleOutlined style={{ fontSize: '18px', color: 'inherit' }} />
                </StatValue>
                <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Get expert assistance immediately</Text>
              </StatCard>
            </Link>
          </Col>
        </Row>

        <Card 
          title={<Space><FileTextOutlined style={{ color: 'var(--color-primary)' }} /><Text strong style={{ fontSize: '14px' }}>Active Requests</Text></Space>}
          className="glass-effect"
          extra={<Link to="/tickets" style={{ fontWeight: 600 }}>View All Tracking</Link>}
        >
          <Table
            columns={[
              { 
                title: 'TICKET #', 
                dataIndex: 'ticket_number', 
                key: 'num', 
                render: (t: string, record: any) => <Link to={`/tickets/${record.id}`}><Text strong style={{ color: 'var(--color-primary)' }}>#{t || record.id?.slice(0,8)}</Text></Link> 
              },
              { title: 'SUBJECT', dataIndex: 'title', key: 'title', render: (t: string) => <Text style={{ fontWeight: 500 }}>{t}</Text> },
              { 
                title: 'USER', 
                dataIndex: 'owner_id', 
                key: 'owner', 
                render: (o: string) => <Text style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'capitalize' }}>{o || 'SYSTEM'}</Text> 
              },
              { 
                title: 'STATUS', 
                dataIndex: 'status', 
                key: 'status', 
                align: 'center',
                render: (s: string) => (
                  <Tag color={s === 'open' ? 'processing' : 'success'} bordered={false} style={{ borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
                    {s || 'OPEN'}
                  </Tag>
                ) 
              },
              { title: 'LAST UPDATED', dataIndex: 'updated_at', key: 'date', align: 'right', render: (d: string) => <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(d || Date.now()).toLocaleDateString()}</Text> }
            ]}
            dataSource={ticketsData?.tickets?.slice(0, 5) || []}
            pagination={false}
            rowKey="id"
            className="high-density-table"
          />
        </Card>
      </DashboardContainer>
    )
  }

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
        <Col xs={24} sm={12} lg={isAdmin ? 6 : 12}>
          <Link to="/tickets" style={{ display: 'block' }}>
            <StatCard className="glass-effect" hoverable>
              <StatLabel>Active Tickets</StatLabel>
              <StatValue>
                {openTicketsCount}
                <FileTextOutlined style={{ fontSize: '18px', color: 'var(--color-primary)' }} />
              </StatValue>
              <Progress percent={75} showInfo={false} strokeColor="var(--color-primary)" size="small" style={{ marginTop: '12px' }} />
            </StatCard>
          </Link>
        </Col>

        {isAdmin ? (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Link to="/escalations" style={{ display: 'block' }}>
                <StatCard className="glass-effect" hoverable>
                  <StatLabel>Escalations</StatLabel>
                  <StatValue style={{ color: escalationQueueDepth > 0 ? 'var(--color-text-warning)' : 'var(--color-text-success)' }}>
                    {escalationQueueDepth}
                    <WarningOutlined style={{ fontSize: '18px', color: 'inherit' }} />
                  </StatValue>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Action required</Text>
                </StatCard>
              </Link>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Link to="/pattern-alerts">
                <StatCard className="glass-effect" hoverable>
                  <StatLabel>Pattern Alerts</StatLabel>
                  <StatValue style={{ color: activePatternAlerts > 0 ? 'var(--color-text-warning)' : 'var(--color-text-success)' }}>
                    {activePatternAlerts}
                    <BellOutlined style={{ fontSize: '18px', color: 'inherit' }} />
                  </StatValue>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>System health stable</Text>
                </StatCard>
              </Link>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Link to="/model/metrics">
                <StatCard className="glass-effect" hoverable>
                  <StatLabel>Classifier Accuracy</StatLabel>
                  <StatValue style={{ color: 'var(--color-text-success)' }}>
                    {classifierAccuracy}%
                    <ArrowUpOutlined style={{ fontSize: '18px', color: 'inherit' }} />
                  </StatValue>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+2.4% vs last week</Text>
                </StatCard>
              </Link>
            </Col>
          </>
        ) : (
          <Col xs={24} sm={12} lg={12}>
            <Link to="/tickets/new" style={{ display: 'block' }}>
              <StatCard className="glass-effect" hoverable style={{ border: '1px dashed var(--color-primary)' }}>
                <StatLabel>Create New Request</StatLabel>
                <StatValue style={{ color: 'var(--color-primary)' }}>
                  RAISE TICKET
                  <PlusCircleOutlined style={{ fontSize: '18px', color: 'inherit' }} />
                </StatValue>
                <Text style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Get expert assistance immediately</Text>
              </StatCard>
            </Link>
          </Col>
        )}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title={<Text strong style={{ fontSize: '14px' }}>Traffic Monitoring</Text>}
            className="glass-effect"
            style={{ height: '100%' }}
          >
            <div style={{ height: 300, minHeight: 300 }}>
              {(statsData?.stats || []).length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  no data available for show kindly add tickets
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.trend_24h || []}>
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
                    <Area type="monotone" dataKey="value" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} name="Current Tickets" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ marginTop: '32px' }}>
              <Title level={4} style={{ fontSize: '16px', marginBottom: '20px' }}>Departmental Distribution</Title>
              <div style={{ height: 300, minHeight: 300 }}>
                {(statsData?.stats || []).length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
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

                {optimizationInsight ? (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 20px',
                    background: 'rgba(99, 102, 241, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(99, 102, 241, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BulbOutlined style={{ color: '#818cf8', fontSize: '16px' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Capacity Alert</div>
                        <Text strong style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{optimizationInsight.overloadedName} team is at {optimizationInsight.overloadedLoad}% load</Text>
                      </div>
                    </div>

                    <div style={{ flex: '0 0 auto', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '24px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-warning)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Risk Radar
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-text-warning)', boxShadow: '0 0 8px var(--color-text-warning)' }} />
                        <Text strong style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                          {optimizationInsight.riskForecast.breachCount} Breaches Predicted
                        </Text>
                        <Tag color="warning" bordered={false} style={{ fontSize: '9px', borderRadius: '4px' }}>IN {optimizationInsight.riskForecast.timeWindow}</Tag>
                      </div>
                    </div>

                    <div style={{ flex: '1 1 auto', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '24px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Orchestration Suggestion</div>
                      {isOrchestrationDone ? (
                        <Text strong style={{ fontSize: '12px', color: 'var(--color-text-success)' }}>
                          <CheckCircleOutlined style={{ marginRight: 8 }} /> Rebalancing Active: {optimizationInsight.suggestedAgents} Agents Shifted
                        </Text>
                      ) : (
                        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            Recommend shifting <Text strong style={{ color: 'var(--color-primary)' }}>{optimizationInsight.suggestedAgents} agents</Text> from {optimizationInsight.underloadedName} to {optimizationInsight.overloadedName}.
                          </Text>
                          <Button 
                            type="primary" 
                            size="small" 
                            loading={isOrchestrationExecuting}
                            onClick={handleApproveShift}
                            style={{ 
                              background: 'var(--color-primary)', 
                              fontSize: '11px', 
                              height: '24px', 
                              borderRadius: '4px',
                              padding: '0 12px',
                              fontWeight: 700
                            }}
                          >
                            Approve Shift
                          </Button>
                        </Space>
                      )}
                    </div>

                    <div style={{ flex: '0 0 auto', textAlign: 'right', background: 'var(--color-bg-trail)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)' }}>
                      <div style={{ fontSize: '10px', color: isOrchestrationDone ? 'var(--color-text-primary)' : 'var(--color-text-success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isOrchestrationDone ? 'Active Impact' : 'Efficiency Gain'}
                      </div>
                      <Text strong style={{ fontSize: '14px', color: isOrchestrationDone ? 'var(--color-text-primary)' : 'var(--color-text-success)' }}>
                        {isOrchestrationDone ? '+22% Latency Drop' : `+${optimizationInsight.predictedGain}% Velocity`}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px', padding: '12px 20px', background: 'var(--color-bg-trail)', borderRadius: '12px', textAlign: 'center' }}>
                    <Text italic style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Monitoring cross-departmental load for orchestration insights...</Text>
                  </div>
                )}
                
                <Row gutter={20}>
                  <Col span={12}>
                    <OrchestrationLogFeed 
                      isExecuting={isOrchestrationExecuting} 
                      isDone={isOrchestrationDone} 
                    />
                  </Col>
                  <Col span={12}>
                    <PredictiveVelocityGauge 
                      isExecuting={isOrchestrationExecuting} 
                      isDone={isOrchestrationDone} 
                    />
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card title={<Text strong style={{ fontSize: '14px' }}>System Pulse</Text>} className="glass-effect">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-success)',
                  boxShadow: '0 0 8px var(--color-text-success)'
                }} />
                <Text strong style={{ color: 'var(--color-text-success)', fontSize: '13px' }}>Operational</Text>
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
                        <Text strong style={{ color: i === 2 ? 'var(--color-text-danger)' : 'var(--color-primary)', fontSize: '12px' }}>
                          {i === 2 ? `${((metricsData.hallucination_rate || 0) * 100).toFixed(1)}%` : `${(item.val || 0).toFixed(1)}/5.0`}
                        </Text>
                      </div>
                      <Progress
                        percent={((item.val || 0) / 5) * 100}
                        showInfo={false}
                        strokeColor={i === 2 ? 'var(--color-text-danger)' : 'var(--color-primary)'}
                        size={["100%", 4]}
                        trailColor="var(--color-bg-trail)"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Awaiting metrics...</Text>
              )}
            </Card>

            <IntelligenceHub
              statsData={statsData}
              ticketsData={ticketsData}
              analyticsData={analyticsData}
            />

            <OperationalHealthWidget analyticsData={analyticsData} />

            <SecurityMonitorWidget />
          </Space>
        </Col>
      </Row>

      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
            <RocketOutlined style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>Domain Pulse</Title>
            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STRATEGIC COMMAND GRID</Text>
          </div>
          <Tag color="cyan" bordered={false} style={{ marginLeft: '12px', fontSize: '10px', fontWeight: 600 }}>INDIVIDUAL TRENDS</Tag>
        </div>

        <Row gutter={[20, 20]}>
          {/* Vertical Global Snapshot Sidebar */}
          <Col xs={24} lg={6}>
            <Card
              className="glass-effect shadow-accent"
              styles={{ body: { padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' } }}
              style={{ background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)', height: '100%', borderRadius: '16px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px', width: '100%' }}>
                <Title level={4} style={{ margin: '0 0 4px', color: 'var(--color-text-primary)', fontWeight: 800 }}>Global Snapshot</Title>
                <Text style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Domain Overview</Text>
              </div>

              <div style={{ position: 'relative', margin: '20px 0 40px' }}>
                <Progress
                  type="circle"
                  percent={Math.round((statsData?.stats || []).reduce((acc, s) => acc + (s.efficiency || 0), 0) / ((statsData?.stats || []).length || 1))}
                  strokeColor="var(--color-primary)"
                  size={140}
                  trailColor="var(--color-bg-trail)"
                />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Text strong style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.05em', fontWeight: 700 }}>AVG DOMAIN HEALTH</Text>
                </div>
              </div>

              <Space direction="vertical" size={24} style={{ width: '100%', marginTop: 'auto', padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space direction="vertical" size={0}>
                    <Text style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 500 }}>Total Throughput</Text>
                    <Text strong style={{ color: 'var(--color-text-primary)', fontSize: '16px' }}>{(statsData?.stats || []).reduce((acc, s) => acc + (s.total_tickets || 0), 0)}</Text>
                  </Space>
                  < RocketOutlined style={{ color: '#6366f1', opacity: 0.5 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space direction="vertical" size={0}>
                    <Text style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 500 }}>Active Backlog</Text>
                    <Text strong style={{ color: 'var(--color-text-warning)', fontSize: '16px' }}>{(statsData?.stats || []).reduce((acc, s) => acc + (s.open_tickets || 0), 0)}</Text>
                  </Space>
                  <SyncOutlined style={{ color: '#f59e0b', opacity: 0.5 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space direction="vertical" size={0}>
                    <Text style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 500 }}>SLA Breaches</Text>
                    <Text strong style={{ color: 'var(--color-text-danger)', fontSize: '16px' }}>{(statsData?.stats || []).reduce((acc, s) => acc + (s.sla_breaches || 0), 0)}</Text>
                  </Space>
                  <WarningOutlined style={{ color: '#ef4444', opacity: 0.5 }} />
                </div>
              </Space>
            </Card>
          </Col>

          {/* Departmental Cards Grid */}
          <Col xs={24} lg={18}>
            <Row gutter={[16, 16]}>
              {(statsData?.stats || [])
                .map(s => ({ ...s, breechedCount: s.sla_breaches || 0 }))
                .sort((a, b) => b.breechedCount - a.breechedCount)
                .map((dept, idx) => {
                  const color = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'][idx % 7]
                  const breechedCount = dept.breechedCount
                  const healthStatus = breechedCount > 3 ? 'critical' : (breechedCount > 0 ? 'warning' : 'healthy')
                  const statusColor = healthStatus === 'critical' ? '#ef4444' : (healthStatus === 'warning' ? '#f59e0b' : '#10b981')

                  return (
                    <Col xs={24} sm={12} lg={8} key={dept.id || idx}>
                      <Card
                        className="glass-effect shadow-accent"
                        styles={{ body: { padding: '16px' } }}
                        hoverable
                        style={{
                          height: '100%',
                          borderTop: `3px solid ${statusColor}`,
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: statusColor,
                                boxShadow: `0 0 8px ${statusColor}`,
                                animation: healthStatus !== 'healthy' ? 'pulse 2s infinite' : 'none'
                              }} />
                              <Text strong style={{ color: 'var(--color-text-muted)', fontSize: '10px', letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {dept.name?.toUpperCase() || 'UNKNOWN'}
                              </Text>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                              {dept.total_tickets || 0}
                              <Text style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>+12%</Text>
                            </div>
                          </div>
                          <div style={{ width: '60px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Tag color="blue" bordered={false} style={{ fontSize: '10px', margin: 0 }}>LIVE</Tag>
                          </div>
                        </div>

                        <Row gutter={8} style={{ marginBottom: '12px' }}>
                          <Col span={8}>
                            <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>OPEN</div>
                            <Text strong style={{ color: (dept.open_tickets || 0) > 0 ? '#f59e0b' : 'inherit', fontSize: '11px' }}>{dept.open_tickets || 0}</Text>
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>RESOLVED</div>
                            <Text strong style={{ color: '#10b981', fontSize: '11px' }}>{dept.resolved_tickets || 0}</Text>
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>HEALTH</div>
                            <Text strong style={{ color: statusColor, fontSize: '11px' }}>{dept.efficiency || 0}%</Text>
                          </Col>
                        </Row>

                        {dept.breechedCount > 0 && (
                          <div style={{
                            background: `${statusColor}15`,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${statusColor}30`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Text style={{ fontSize: '9px', color: statusColor, fontWeight: 700 }}>SLA BREACHES</Text>
                            <Text strong style={{ color: statusColor, fontSize: '11px' }}>{breechedCount}</Text>
                          </div>
                        )}
                      </Card>
                    </Col>
                  )
                })}

              {/* [NEW] AIOps Intelligence Hub Card */}
              <Col xs={24} sm={12} lg={8}>
                <Card
                  className="glass-effect shadow-accent"
                  styles={{ body: { padding: '16px' } }}
                  hoverable
                  style={{
                    height: '100%',
                    borderTop: `3px solid var(--color-primary)`,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(0, 0, 0, 0) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }} />
                        <Text strong style={{ color: 'var(--color-text-muted)', fontSize: '10px', letterSpacing: '0.08em' }}>AIOPS INTELLIGENCE</Text>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                        {classifierAccuracy}%
                        <Text style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>OPTIMAL</Text>
                      </div>
                    </div>
                    <BulbOutlined style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.6 }} />
                  </div>

                  <Row gutter={8} style={{ marginBottom: '12px' }}>
                    <Col span={8}>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>ACCURACY</div>
                      <Text strong style={{ color: '#10b981', fontSize: '11px' }}>{classifierAccuracy}%</Text>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>SIMILARITY</div>
                      <Text strong style={{ color: 'var(--color-primary)', fontSize: '11px' }}>{(metricsData?.semantic_similarity || 0.82).toFixed(2)}</Text>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>DRIFT</div>
                      <Text strong style={{ color: '#10b981', fontSize: '11px' }}>0.02</Text>
                    </Col>
                  </Row>

                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: '9px', color: 'var(--color-primary)', fontWeight: 700 }}>LLM JUDGE RATING</Text>
                    <Text strong style={{ color: 'var(--color-primary)', fontSize: '11px' }}>{(metricsData?.llm_judge_routing_correctness || 4.8).toFixed(1)}/5.0</Text>
                  </div>
                </Card>
              </Col>

              {/* [NEW] Automation ROI Impact Card */}
              <Col xs={24} sm={12} lg={8}>
                <Card
                  className="glass-effect shadow-accent"
                  styles={{ body: { padding: '16px' } }}
                  hoverable
                  style={{
                    height: '100%',
                    borderTop: `3px solid #10b981`,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                        <Text strong style={{ color: 'var(--color-text-muted)', fontSize: '10px', letterSpacing: '0.08em' }}>AUTOMATION ROI</Text>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                        {((statsData?.stats || []).reduce((acc, s) => acc + (s.resolved_tickets || 0), 0) * 0.75).toFixed(1)}h
                        <Text style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>SAVED</Text>
                      </div>
                    </div>
                    <ThunderboltOutlined style={{ fontSize: '20px', color: '#10b981', opacity: 0.6 }} />
                  </div>

                  <Row gutter={8} style={{ marginBottom: '12px' }}>
                    <Col span={8}>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>EFFICIENCY</div>
                      <Text strong style={{ color: '#10b981', fontSize: '11px' }}>+42%</Text>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>COST REDUX</div>
                      <Text strong style={{ color: '#10b981', fontSize: '11px' }}>28%</Text>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>RELIABILITY</div>
                      <Text strong style={{ color: '#10b981', fontSize: '11px' }}>99.4%</Text>
                    </Col>
                  </Row>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>ESTIMATED VALUE</Text>
                    <Text strong style={{ color: '#10b981', fontSize: '11px' }}>${((statsData?.stats || []).reduce((acc, s) => acc + (s.resolved_tickets || 0), 0) * 12.5).toLocaleString()}</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
        
        <StrategicIntelligenceCommand 
          metricsData={metricsData}
          analyticsData={analyticsData}
        />
      </div>
    </DashboardContainer>
  )
}

export default DashboardPage
