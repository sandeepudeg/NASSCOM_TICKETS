import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Card, Tag, Space, Select, Button, Typography, Empty, Input, Tooltip } from 'antd'
import { 
  DownloadOutlined, 
  SyncOutlined, 
  SearchOutlined, 
  FilterOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ticketsApi } from '../api/tickets'
import { foldersApi } from '../api/folders'
import { designSystemStyled } from '@ticketiq/design-system'
import type { Ticket } from '../api/types'

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

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']
const ROUTING_STATUSES = ['pending_classification', 'routed', 'escalated', 'resolved']
const INTEL_PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function TicketListPage() {
  const [searchParams] = useSearchParams()
  const folderId = searchParams.get('folder')

  const [filters, setFilters] = useState<{
    status?: string
    category?: string
    routing_status?: string
    intelligence_priority?: string
    sla_breach?: boolean
    cursor?: string
    q?: string
  }>({})

  // Fetch folder details if folderId is present
  const { data: folderData } = useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => foldersApi.get(folderId!),
    enabled: !!folderId,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', folderId, filters],
    queryFn: () => 
      folderId 
        ? foldersApi.listTickets(folderId, { ...filters, limit: 25 })
        : ticketsApi.list({ ...filters, limit: 25 }),
  })

  const columns: ColumnsType<Ticket> = [
    {
      title: <div style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>SR. NO.</div>,
      key: 'srno',
      width: 85,
      render: (_: any, __: any, index: number) => (
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: 'REF',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 110,
      render: (text: string, record: Ticket) => (
        <Link to={`/tickets/${record.id}`} style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          #{text || record.id.substring(0, 6).toUpperCase()}
        </Link>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Ticket) => (
        <Space direction="vertical" size={0}>
          <Link to={`/tickets/${record.id}`} style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: '14px' }}>
            {title}
          </Link>
          <Space size={8}>
             {record.is_repeated_issue && <Tag color="warning" style={{ fontSize: '9px', borderRadius: '2px', margin: 0 }}>REPEATED</Tag>}
             {record.is_automation_candidate && <Tag color="purple" style={{ fontSize: '9px', borderRadius: '2px', margin: 0 }}>AUTO-READY</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Intel Priority',
      dataIndex: 'intelligence_priority',
      key: 'intelligence_priority',
      width: 130,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          low: 'var(--color-text-secondary)',
          medium: 'var(--color-primary)',
          high: 'var(--color-text-warning)',
          urgent: 'var(--color-text-danger)',
        }
        return (
          <Tag style={{ 
            color: colorMap[priority] || 'var(--color-text-secondary)', 
            borderColor: 'var(--color-border-primary)',
            background: 'var(--color-bg-trail)',
            fontSize: '10px', 
            fontWeight: 800,
            borderRadius: '4px'
          }}>
            <ThunderboltOutlined style={{ marginRight: '4px' }} />
            {(priority || 'medium').toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'SLA Status',
      dataIndex: 'sla_status',
      key: 'sla_status',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          on_track: 'var(--color-text-success)',
          at_risk: 'var(--color-text-warning)',
          breached: 'var(--color-text-danger)',
        }
        return (
          <Space size={6}>
            <ClockCircleOutlined style={{ color: colorMap[status] || '#94a3b8', fontSize: '12px' }} />
            <Text strong style={{ fontSize: '10px', color: colorMap[status] || '#94a3b8', textTransform: 'uppercase' }}>
              {(status || 'on_track').replace('_', ' ')}
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Automation',
      dataIndex: 'automation_status',
      key: 'automation_status',
      width: 130,
      render: (status: string) => (
        <Tag style={{ fontSize: '10px', borderRadius: '4px' }}>
          {(status || 'none').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'State',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const colors: Record<string, string> = {
          open: 'var(--color-text-success)',
          in_progress: 'var(--color-primary)',
          resolved: 'var(--color-text-muted)',
          closed: 'var(--color-text-muted)',
        }
        return (
          <Space size={6}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status] || '#94a3b8' }} />
            <Text style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              whiteSpace: 'nowrap',
              color: 'var(--color-text-primary)' 
            }}>{status}</Text>
          </Space>
        )
      },
    },
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
  ]

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      cursor: undefined,
    }))
  }

  const handleLoadMore = () => {
    if (data?.next_cursor) {
      setFilters((prev) => ({ ...prev, cursor: data.next_cursor! }))
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.category) params.append('category', filters.category)
    if (filters.routing_status) params.append('routing_status', filters.routing_status)
    if (filters.sla_breach) params.append('sla_breach', 'true')
    if (filters.intelligence_priority) params.append('intelligence_priority', filters.intelligence_priority)
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8005/api/v1/tickets/export-all' : '/api/v1/tickets/export-all'
    window.open(`${baseUrl}?${params.toString()}`, '_blank')
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {folderId ? folderData?.name : 'Intelligence Hub Queue'}
          </Title>
          <Text style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {folderId ? `Viewing items in ${folderData?.name}` : 'Real-time orchestration and intelligence view'}
          </Text>
        </div>
        <Space>
          <Input 
            prefix={<SearchOutlined style={{ color: 'var(--color-primary)' }} />}
            placeholder="Quick search..."
            style={{ width: 240, fontWeight: 500 }}
            className="glass-effect"
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
          <Button onClick={() => refetch()} icon={<SyncOutlined />} className="glass-effect" />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        </Space>
      </div>

      <Card className="glass-effect" bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-primary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Space size="middle" wrap>
            <FilterOutlined style={{ color: 'var(--color-primary)', marginRight: '8px' }} />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('status', value)}
              variant="borderless"
            >
              {STATUSES.map((s) => (
                <Select.Option key={s} value={s}>{s.toUpperCase()}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleFilterChange('category', value)}
              variant="borderless"
            >
              {CATEGORIES.map((c) => (
                <Select.Option key={c} value={c}>{c.toUpperCase()}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Intel Priority"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleFilterChange('intelligence_priority', value)}
              variant="borderless"
            >
              {INTEL_PRIORITIES.map((p) => (
                <Select.Option key={p} value={p}>{p.toUpperCase()}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="SLA Status"
              allowClear
              style={{ width: 130 }}
              onChange={(value) => handleFilterChange('sla_breach', value === 'breached')}
              variant="borderless"
            >
              <Select.Option value="all">ALL SLA</Select.Option>
              <Select.Option value="breached">BREACHED</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data?.tickets || []}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          className="high-density-table"
          locale={{ 
            emptyText: <Empty description="No records matching current filters" style={{ padding: '40px 0' }} />
          }}
        />

        {data?.next_cursor && (
          <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid var(--color-border-primary)' }}>
            <Button onClick={handleLoadMore} type="text">Load more records</Button>
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
