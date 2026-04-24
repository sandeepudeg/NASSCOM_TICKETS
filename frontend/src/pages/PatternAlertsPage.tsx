import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  DatePicker,
  message,
  Typography,
  Badge,
  Card,
  Empty,
} from 'antd'
import {
  BellOutlined,
  SyncOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { classificationApi } from '../api/classification'
import { designSystemStyled } from '@ticketiq/design-system'
import type { PatternAlert } from '../api/types'

const { Text, Title } = Typography

const PageContainer = designSystemStyled.div`
  max-width: 1600px;
  margin: 0 auto;
`

export default function PatternAlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<PatternAlert | null>(null)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [actionType, setActionType] = useState<'acknowledge' | 'snooze' | 'dismiss'>('acknowledge')
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pattern-alerts'],
    queryFn: () => classificationApi.getPatternAlerts(),
  })

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      classificationApi.updatePatternAlert(id, data),
    onSuccess: () => {
      message.success('Pattern alert updated successfully')
      setActionModalVisible(false)
      setSelectedAlert(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['pattern-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update pattern alert')
    },
  })

  const handleAction = (alert: PatternAlert, action: 'acknowledge' | 'snooze' | 'dismiss') => {
    setSelectedAlert(alert)
    setActionType(action)
    setActionModalVisible(true)
  }

  const handleActionSubmit = (values: any) => {
    if (!selectedAlert) return

    const payload: any = { 
      status: actionType === 'acknowledge' ? 'acknowledged' : (actionType === 'snooze' ? 'snoozed' : 'dismissed') 
    }
    if (actionType === 'snooze' && values.snoozed_until) {
      payload.snoozed_until = values.snoozed_until.toISOString()
    }

    updateAlertMutation.mutate({
      id: selectedAlert.id,
      data: payload,
    })
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
      title: 'Significance',
      dataIndex: 'cluster_size',
      key: 'count',
      width: 100,
      render: (count: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge 
            count={count} 
            overflowCount={99}
            style={{ 
              backgroundColor: count > 10 ? '#ef4444' : '#f59e0b',
              boxShadow: count > 10 ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
              fontSize: '10px',
              fontWeight: 700
            }} 
          />
          <Text style={{ fontSize: '11px', opacity: 0.5 }}>TICKETS</Text>
        </div>
      ),
    },
    {
      title: 'Detected Pattern',
      dataIndex: 'representative_title',
      key: 'title',
      render: (text: string) => (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ color: 'var(--color-text-primary)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
            {text}
          </Text>
          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
            Anomalous recurring issue trend detected by LLM
          </Text>
        </div>
      ),
    },
    {
      title: 'Impact Area',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (category: string) => (
        <Tag style={{ 
          margin: 0,
          background: 'hsla(var(--slate-500), 0.05)',
          border: '1px solid var(--color-border-primary)',
          color: 'var(--color-text-secondary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          {category}
        </Tag>
      ),
    },
    {
      title: 'AI Certainty',
      key: 'confidence',
      width: 140,
      render: () => {
        const score = 0.94
        const percentage = (score * 100).toFixed(1)
        const color = '#10b981'
        return (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <Text style={{ color: color, fontSize: '11px', fontWeight: 700 }}>{percentage}%</Text>
            </div>
            <div style={{ 
              width: '100%', height: '4px', background: 'var(--color-bg-secondary)', 
              borderRadius: '2px', overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${percentage}%`, height: '100%', background: color,
                boxShadow: `0 0 8px ${color}40`
              }} />
            </div>
          </div>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 340,
      align: 'right' as const,
      render: (_: any, record: PatternAlert) => {
        const isInactive = record.status !== 'active'
        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              disabled={record.status === 'acknowledged' || record.status === 'dismissed'}
              onClick={() => handleAction(record, 'acknowledge')}
              icon={<CheckCircleOutlined />}
              style={{ fontSize: '12px' }}
            >
              Resolve
            </Button>
            <Button
              size="small"
              disabled={isInactive}
              onClick={() => handleAction(record, 'snooze')}
              icon={<HistoryOutlined />}
              style={{ fontSize: '12px' }}
            >
              Snooze
            </Button>
            <Button
              danger
              type="text"
              size="small"
              disabled={record.status === 'dismissed'}
              onClick={() => handleAction(record, 'dismiss')}
              icon={<CloseCircleOutlined />}
              style={{ fontSize: '12px' }}
            >
              Dismiss
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            <BellOutlined style={{ color: '#ef4444', marginRight: '12px' }} />
            Intelligence Alerts
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>LLM-driven pattern recognition for recurring service anomalies</Text>
        </div>
        <Button 
          onClick={() => refetch()} 
          icon={<SyncOutlined />}
          className="glass-effect"
        >
          Check for Patterns
        </Button>
      </div>

      <Card className="glass-effect" bodyStyle={{ padding: 0 }}>
        <Table
          loading={isLoading}
          dataSource={(data as any)?.alerts || []}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, position: ['bottomRight'] }}
          className="high-density-table"
          locale={{ 
            emptyText: (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <Empty description={<Text type="secondary">no data available for show kindly add tickets</Text>} />
              </div>
            ) 
          }}
        />
      </Card>

      <Modal
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Intelligence Alert`}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false)
          setSelectedAlert(null)
          form.resetFields()
        }}
        footer={null}
      >
        {selectedAlert && (
          <div style={{ padding: '8px 0' }}>
            <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              {selectedAlert.representative_title}
            </Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              This action will affect {selectedAlert.cluster_size} tickets in this pattern cluster.
            </Text>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleActionSubmit}
              style={{ marginTop: '24px' }}
            >
              {actionType === 'snooze' && (
                <Form.Item
                  label="Re-activate After"
                  name="snoozed_until"
                  rules={[{ required: true, message: 'Specify snooze duration' }]}
                >
                  <DatePicker
                    showTime
                    style={{ width: '100%' }}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              )}

              <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setActionModalVisible(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={updateAlertMutation.isPending}>
                    Confirm {actionType}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}
