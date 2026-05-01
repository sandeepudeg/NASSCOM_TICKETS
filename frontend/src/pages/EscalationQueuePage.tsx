import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Select,
  Input,
  message,
  Typography,
  Divider,
  Card,
  Empty,
} from 'antd'
import { WarningOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { classificationApi } from '../api/classification'
import { designSystemStyled } from '@ticketiq/design-system'
import { getUserRole, getUserId } from '../auth/tokenStorage'
import type { EscalationTicket } from '../api/types'

const { Text, Title } = Typography

const PageContainer = designSystemStyled.div`
  max-width: 1600px;
  margin: 0 auto;
`

const CATEGORIES = [
  'Infrastructure',
  'Application',
  'Security',
  'Database',
  'Storage',
  'Network',
  'Access Management',
]

export default function EscalationQueuePage() {
  const [selectedTicket, setSelectedTicket] = useState<EscalationTicket | null>(null)
  const [overrideModalVisible, setOverrideModalVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 25
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['escalations', getUserRole(), getUserId()],
    queryFn: () => classificationApi.getEscalations({ 
      limit: 200,
      owner_id: getUserRole() === 'admin' ? undefined : getUserId() || undefined
    }),
  })

  const overrideMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      classificationApi.overrideEscalation(id, data),
    onSuccess: () => {
      message.success('Escalation overridden successfully')
      setOverrideModalVisible(false)
      setSelectedTicket(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to override escalation')
    },
  })

  const handleOverride = (ticket: EscalationTicket) => {
    setSelectedTicket(ticket)
    form.setFieldsValue({
      original_category: ticket.category,
    })
    setOverrideModalVisible(true)
  }

  const handleOverrideSubmit = (values: any) => {
    if (!selectedTicket) return

    overrideMutation.mutate({
      id: selectedTicket.id,
      data: {
        corrected_category: values.corrected_category,
        agent_id: values.agent_id,
      },
    })
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    params.append('routing_status', 'escalated')
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8005/api/v1/tickets/export-all' : '/api/v1/tickets/export-all'
    window.open(`${baseUrl}?${params.toString()}`, '_blank')
  }

  const columns = [
    {
      title: 'SR. NO.',
      key: 'serial_number',
      width: 70,
      render: (_: any, __: any, index: number) => (
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {(currentPage - 1) * PAGE_SIZE + index + 1}
        </Text>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 120,
      render: (text: string, record: EscalationTicket) => (
        <Link 
          to={`/tickets/${record.id}`} 
          style={{ 
            color: 'var(--color-primary)', 
            fontWeight: 700, 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
            textDecoration: 'none'
          }}
        >
          #{text || `TICK-APP-${record.id.substring(0, 4).toUpperCase()}`}
        </Link>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <Text style={{ 
          color: 'var(--color-text-primary)', 
          fontWeight: 500,
          fontSize: '14px',
          display: 'block'
        }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'User',
      dataIndex: 'owner_id',
      key: 'owner_id',
      width: 120,
      render: (owner: string) => (
        <Text style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'capitalize' }}>
          {owner || 'SYSTEM'}
        </Text>
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
      title: 'Certainty',
      dataIndex: 'confidence_score',
      key: 'confidence_score',
      width: 140,
      render: (score: number) => {
        const percentage = (score * 100).toFixed(1)
        const color = score > 0.8 ? 'var(--color-text-success)' : score > 0.5 ? 'var(--color-text-warning)' : 'var(--color-text-danger)'
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
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => (
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationTicket) => (
        <Button
          type="primary"
          onClick={() => handleOverride(record)}
          size="small"
          style={{ fontSize: '12px' }}
        >
          Override
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            <WarningOutlined style={{ color: 'var(--color-text-warning)', marginRight: '12px' }} />
            Escalation Queue
          </Title>
          <Text style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Manage high-priority tickets requiring manual intervention</Text>
        </div>
        <Space>
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
          >
            Export All
          </Button>
        </Space>
      </div>

      <Card className="glass-effect" bodyStyle={{ padding: 0 }}>
        <Table
          loading={isLoading}
          dataSource={data?.escalations || []}
          columns={columns}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: data?.total || (data?.escalations || []).length,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
            position: ['bottomCenter'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} escalations`
          }}
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
        title="Override Classification"
        open={overrideModalVisible}
        onCancel={() => {
          setOverrideModalVisible(false)
          setSelectedTicket(null)
          form.resetFields()
        }}
        footer={null}
      >
        {selectedTicket && (
          <div style={{ padding: '8px 0' }}>
            <Title level={5} style={{ marginBottom: '8px' }}>{selectedTicket.title}</Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>{selectedTicket.description}</Text>
            <Divider style={{ margin: '16px 0' }} />
            <Form
              form={form}
              layout="vertical"
              onFinish={handleOverrideSubmit}
            >
              <Form.Item label="Original Category" name="original_category">
                <Input disabled variant="filled" />
              </Form.Item>

              <Form.Item
                label="Corrected Category"
                name="corrected_category"
                rules={[{ required: true, message: 'Select the intended category' }]}
              >
                <Select placeholder="Choose Department">
                  {CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Agent ID"
                name="agent_id"
                rules={[{ required: true, message: 'Agent ID is mandatory' }]}
              >
                <Input placeholder="Enter your system identifier" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setOverrideModalVisible(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={overrideMutation.isPending}>
                    Confirm Override
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
