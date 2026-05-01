import { useState, useEffect } from 'react'
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
import { getUserRole, getUserId } from '../auth/tokenStorage'

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

  // Seed initial filter state from URL params (e.g. ?sla_breach=true from sidebar)
  const [filters, setFilters] = useState<{
    status?: string
    category?: string
    routing_status?: string
    intelligence_priority?: string
    sla_breach?: boolean
    page?: number
    q?: string
  }>(() => ({
    sla_breach: searchParams.get('sla_breach') === 'true' ? true : undefined,
    status: searchParams.get('status') || undefined,
    category: searchParams.get('category') || undefined,
    routing_status: searchParams.get('routing_status') || undefined,
    page: 1,
  }))

  // Re-sync filters when URL changes (sidebar navigation)
  useEffect(() => {
    setFilters({
      sla_breach: searchParams.get('sla_breach') === 'true' ? true : undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      routing_status: searchParams.get('routing_status') || undefined,
      page: 1,
    })
  }, [searchParams.toString()])

  // Fetch folder details if folderId is present
  const { data: folderData } = useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => foldersApi.get(folderId!),
    enabled: !!folderId,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', folderId, filters, getUserRole(), getUserId()],
    queryFn: () => {
      const isAdmin = getUserRole() === 'admin'
      const queryParams = { 
        ...filters, 
        page: filters.page || 1, 
        page_size: 25,
        owner_id: !isAdmin ? getUserId() || undefined : undefined
      }
      
      return folderId 
        ? foldersApi.listTickets(folderId, queryParams)
        : ticketsApi.list(queryParams)
    },
  })



  const columns: ColumnsType<Ticket> = [
    {
      title: 'SR. NO.',
      key: 'sr_no',
      width: 80,
      render: (_: any, __: any, index: number) => {
        const page = filters.page || 1
        const pageSize = 25
        return (page - 1) * pageSize + index + 1
      },
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
      page: key === 'page' ? value : 1, // Reset to page 1 on filter changes
    }))
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
          pagination={{
            current: filters.page || 1,
            pageSize: 25,
            total: data?.total || 0,
            showSizeChanger: false,
            onChange: (page) => handleFilterChange('page', page),
            position: ['bottomCenter'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tickets`
          }}
          className="high-density-table"
          locale={{ 
            emptyText: <Empty description="No records matching current filters" style={{ padding: '40px 0' }} />
          }}
        />
      </Card>
    </PageContainer>
  )
}
