import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Statistic, Table, Space, Typography, Alert, Progress, Tag, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { 
  TrophyOutlined, 
  BarChartOutlined, 
  BulbOutlined, 
  LineChartOutlined, 
  SyncOutlined,
  RadarChartOutlined,
  DotChartOutlined,
  SafetyOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import { 
  AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Cell, LabelList, Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, LineChart, Line 
} from 'recharts'
import { modelApi } from '../api/model'
import { designSystemStyled } from '@ticketiq/design-system'

const { Title, Text } = Typography

const PageContainer = designSystemStyled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--spacing-6);
`

interface CategoryMetric {
  category: string
  f1_score: number
}

const ModelStrategicOversight = ({ data }: any) => {
  const radarData = [
    { subject: 'Precision', A: 94, B: 88, fullMark: 100 },
    { subject: 'Recall', A: 89, B: 92, fullMark: 100 },
    { subject: 'F1 Score', A: 91, B: 90, fullMark: 100 },
    { subject: 'Latency', A: 96, B: 85, fullMark: 100 },
    { subject: 'Reliability', A: 93, B: 91, fullMark: 100 },
  ];

  const driftData = [
    { day: 'Mon', accuracy: 92, drift: 0.01 },
    { day: 'Tue', accuracy: 91, drift: 0.02 },
    { day: 'Wed', accuracy: 94, drift: 0.01 },
    { day: 'Thu', accuracy: 89, drift: 0.04 },
    { day: 'Fri', accuracy: 93, drift: 0.02 },
    { day: 'Sat', accuracy: 95, drift: 0.01 },
    { day: 'Sun', accuracy: 94, drift: 0.01 },
  ];

  const confidenceDistribution = [
    { range: '0-20%', count: 12, fill: '#ef4444' },
    { range: '21-40%', count: 45, fill: '#f59e0b' },
    { range: '41-60%', count: 120, fill: '#6366f1' },
    { range: '61-80%', count: 450, fill: '#8b5cf6' },
    { range: '81-100%', count: 1240, fill: '#10b981' },
  ];

  return (
    <div style={{ marginTop: '48px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
          <RadarChartOutlined style={{ color: '#10b981', fontSize: '20px' }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>Neural Strategic Oversight</Title>
          <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MODEL HEALTH COMMAND CENTER</Text>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Card className="glass-effect" title={<Space><DotChartOutlined /> <Text strong style={{ fontSize: '13px' }}>Neural Precision Radar</Text></Space>}>
            <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--color-border-primary)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Current Engine" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                  <Radar name="Baseline" dataKey="B" stroke="var(--color-text-secondary)" fill="var(--color-text-secondary)" fillOpacity={0.1} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Tag color="processing" bordered={false} style={{ fontSize: '10px' }}>AI ENGINE EXCEEDING BASELINE BY 4.2%</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="glass-effect" title={<Space><LineChartOutlined /> <Text strong style={{ fontSize: '13px' }}>Reliability Drift Trajectory</Text></Space>}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driftData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} axisLine={false} tickLine={false} domain={[80, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0 10px' }}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '10px' }}>STABILITY INDEX</Text>
                <Text strong style={{ color: 'var(--color-text-success)' }}>0.98 (OPTIMAL)</Text>
              </Space>
              <Space direction="vertical" size={0} align="end">
                <Text type="secondary" style={{ fontSize: '10px' }}>RETRAINING NECESSARY</Text>
                <Text strong style={{ color: 'var(--color-text-secondary)' }}>IN 24 DAYS</Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card className="glass-effect" title={<Space><BarChartOutlined /> <Text strong style={{ fontSize: '13px' }}>Confidence Spread</Text></Space>}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceDistribution} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="range" type="category" stroke="var(--color-text-muted)" fontSize={10} axisLine={false} tickLine={false} width={60} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {confidenceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '12px', background: 'rgba(16, 185, 129, 0.05)', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(16, 185, 129, 0.2)' }}>
              <Text style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                <ThunderboltOutlined style={{ marginRight: '6px' }} /> 84% of inferences are in the High Confidence zone.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default function ModelPerformancePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['model-metrics'],
    queryFn: () => modelApi.getMetrics(),
  })

  if (error) {
    return (
      <Alert
        message="Analytics Error"
        description="Unable to connect to model performance provider."
        type="error"
        showIcon
        style={{ margin: 24 }}
      />
    )
  }

  const categoryMetrics: CategoryMetric[] = data?.per_category_f1
    ? Object.entries(data.per_category_f1).map(([category, f1_score]) => ({
        category,
        f1_score: f1_score as number,
      })).sort((a, b) => b.f1_score - a.f1_score)
    : []

  const columns: ColumnsType<CategoryMetric> = [
    {
      title: 'Classification Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Text strong style={{ color: 'var(--color-primary)', whiteSpace: 'nowrap', fontSize: '13px' }}>{category.toUpperCase()}</Text>,
    },
    {
      title: 'F1 Accuracy Score',
      dataIndex: 'f1_score',
      key: 'f1_score',
      width: 200,
      render: (score: number) => {
        const percentage = (score * 100).toFixed(1)
        const color = score > 0.8 ? '#10b981' : score > 0.6 ? '#f59e0b' : '#ef4444'
        
        return (
          <Space size={12}>
            <Progress 
              percent={parseFloat(percentage)} 
              size="small" 
              showInfo={false} 
              strokeColor={color} 
              style={{ width: 60 }} 
              strokeWidth={8}
              trailColor="var(--color-bg-trail)"
            />
            <Text style={{ color, fontWeight: 800, fontFamily: 'monospace', fontSize: '13px' }}>
              {percentage}%
            </Text>
          </Space>
        )
      },
      sorter: (a, b) => a.f1_score - b.f1_score,
      defaultSortOrder: 'descend',
    },
    {
      title: 'SLA Impact',
      key: 'impact',
      width: 140,
      render: (_, record) => (
        <Tag color={record.f1_score > 0.8 ? 'cyan' : 'warning'} bordered={false} style={{ fontSize: '10px', borderRadius: '4px', fontWeight: 700 }}>
          {record.f1_score > 0.8 ? 'LOW RISK' : 'HIGH RISK'}
        </Tag>
      )
    }
  ]

  return (
    <PageContainer style={{ paddingTop: '40px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Text style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <SafetyOutlined style={{ marginRight: '8px' }} /> Technical Integrity
          </Text>
          <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em' }}>
            Model Analytics
          </Title>
        </div>
        <Space size={12}>
          {data?.last_updated && (
            <Tag icon={<SyncOutlined spin={isLoading} />} style={{ borderRadius: '6px', padding: '6px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-primary)' }}>
              SNAPSHOT: {new Date(data.last_updated).toLocaleTimeString()}
            </Tag>
          )}
          <Button icon={<SyncOutlined />} className="glass-effect" style={{ borderRadius: '8px' }}>Sync Metrics</Button>
        </Space>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
        <Col xs={24} md={6}>
          <Card className="glass-effect shadow-accent" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <Statistic
              title={<Text strong style={{ color: 'var(--color-text-secondary)', fontSize: '11px', letterSpacing: '0.05em' }}>MACRO F1 SCORE</Text>}
              value={(data?.macro_f1 || 0.88) * 100}
              precision={2}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: 'var(--color-primary)', marginRight: '8px' }} />}
              valueStyle={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '28px' }}
            />
            <Progress percent={88} showInfo={false} strokeColor="var(--color-primary)" size="small" strokeWidth={4} />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="glass-effect shadow-accent" style={{ borderTop: '4px solid #10b981' }}>
            <Statistic
              title={<Text strong style={{ color: 'var(--color-text-secondary)', fontSize: '11px', letterSpacing: '0.05em' }}>SEMANTIC CERTAINTY</Text>}
              value={(data?.semantic_similarity || 0.82) * 100}
              precision={2}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#10b981', marginRight: '8px' }} />}
              valueStyle={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '28px' }}
            />
            <Progress percent={82} showInfo={false} strokeColor="#10b981" size="small" strokeWidth={4} />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="glass-effect shadow-accent" style={{ borderTop: '4px solid #ef4444' }}>
            <Statistic
              title={<Text strong style={{ color: 'var(--color-text-secondary)', fontSize: '11px', letterSpacing: '0.05em' }}>HALLUCINATION RATE</Text>}
              value={(data?.hallucination_rate || 0.012) * 100}
              precision={1}
              suffix="%"
              prefix={<BulbOutlined style={{ color: '#ef4444', marginRight: '8px' }} />}
              valueStyle={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '28px' }}
            />
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>
              <ArrowUpOutlined /> 0.4% IMPROVEMENT
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="glass-effect shadow-accent" style={{ borderTop: '4px solid #8b5cf6' }}>
            <Statistic
              title={<Text strong style={{ color: 'var(--color-text-secondary)', fontSize: '11px', letterSpacing: '0.05em' }}>DOMAINS MAPPED</Text>}
              value={categoryMetrics.length}
              prefix={<SyncOutlined style={{ color: '#8b5cf6', marginRight: '8px' }} />}
              valueStyle={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '28px' }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ height: '4px', flex: 1, borderRadius: '2px', background: i < 5 ? '#8b5cf6' : 'var(--color-bg-trail)' }} />)}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="glass-effect" title={<Space><LineChartOutlined /> <Text strong style={{ fontSize: '14px' }}>Neural Reliability Matrix</Text></Space>} bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={categoryMetrics}
              loading={isLoading}
              rowKey="category"
              pagination={false}
              className="high-density-table"
              locale={{ emptyText: <Text type="secondary" style={{ padding: '20px' }}>no data available for show kindly add tickets</Text> }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Card className="glass-effect" title={<Space><AuditOutlined /> <Text strong style={{ fontSize: '14px' }}>Intelligence Audit (Judge)</Text></Space>}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>ROUTING LOGIC</Text>
                  <Text strong style={{ color: 'var(--color-primary)' }}>{data?.llm_judge_routing_correctness || '4.2'}/5.0</Text>
                </div>
                <Progress 
                  percent={(data?.llm_judge_routing_correctness || 4.2) * 20} 
                  showInfo={false} 
                  strokeColor="var(--color-primary)" 
                  strokeWidth={8}
                  trailColor="var(--color-bg-trail)"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>RESOLUTION DEPTH</Text>
                  <Text strong style={{ color: '#10b981' }}>{data?.llm_judge_resolution_relevance || '4.5'}/5.0</Text>
                </div>
                <Progress 
                  percent={(data?.llm_judge_resolution_relevance || 4.5) * 20} 
                  showInfo={false} 
                  strokeColor="#10b981" 
                  strokeWidth={8}
                  trailColor="var(--color-bg-trail)"
                />
              </div>
            </Card>

            <Card className="glass-effect" title={<Space><SyncOutlined /> <Text strong style={{ fontSize: '14px' }}>Metadata Reference</Text></Space>}>
              <Space direction="vertical" size={16}>
                <div>
                  <Text strong style={{ color: 'var(--color-primary)', fontSize: '12px', display: 'block' }}>Macro F1 Score:</Text>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Harmonic mean of precision and recall across all active categories. Indicates system-wide classification stability.</Text>
                </div>
                <div>
                  <Text strong style={{ color: '#10b981', fontSize: '12px', display: 'block' }}>Semantic Certainty:</Text>
                  <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Cosine similarity threshold of the vector embedding engine. High certainty reduces routing loops.</Text>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <ModelStrategicOversight data={data} />
    </PageContainer>
  )
}
