import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Card, Tag, Space, Select, Button, Typography, Empty, Input } from 'antd'
import { DownloadOutlined, SyncOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons'
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

export default function TicketListPage() {
  const [searchParams] = useSearchParams()
  const folderId = searchParams.get('folder')

  const [filters, setFilters] = useState<{
    status?: string
    category?: string
    routing_status?: string
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
      title: 'Sr. No.',
      key: 'serial',
      width: 70,
      render: (_, __, index) => <Text type="secondary" style={{ fontSize: '11px' }}>{index + 1}</Text>,
    },
    {
      title: 'REF',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 130,
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
        <Link to={`/tickets/${record.id}`} style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: '14px' }}>
          {title}
        </Link>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => (
        <Tag style={{ 
          margin: 0,
          background: 'hsla(var(--slate-500), 0.05)',
          border: '1px solid var(--color-border-primary)',
          color: 'var(--color-text-secondary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600
        }}>
          {category?.toUpperCase() || 'UNCATEGORIZED'}
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
          open: '#10b981',
          in_progress: '#3b82f6',
          resolved: 'var(--color-text-muted)',
          closed: 'var(--color-text-muted)',
        }
        return (
          <Space size={6}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status] || '#94a3b8' }} />
            <Text style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{status}</Text>
          </Space>
        )
      },
    },
    {
      title: 'Intelligence',
      dataIndex: 'routing_status',
      key: 'routing_status',
      width: 160,
      render: (routing_status: string) => {
        const colorMap: Record<string, string> = {
          pending_classification: '#3b82f6',
          routed: '#10b981',
          escalated: '#f59e0b',
          resolved: '#94a3b8',
        }
        return (
          <Tag style={{ 
            color: colorMap[routing_status] || '#94a3b8',
            borderColor: `${colorMap[routing_status]}40`,
            background: `${colorMap[routing_status]}10`,
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '4px'
          }}>
            {(routing_status || 'unknown').replace('_', ' ').toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          low: '#94a3b8',
          medium: '#3b82f6',
          high: '#f59e0b',
          critical: '#ef4444',
        }
        return (
          <Text strong style={{ color: colorMap[priority] || '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
            {priority || 'normal'}
          </Text>
        )
      },
    },
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => (
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
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
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8005/api/v1/tickets/export-all' : '/api/v1/tickets/export-all'
    window.open(`${baseUrl}?${params.toString()}`, '_blank')
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            {folderId ? folderData?.name : 'Universal Queue'}
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {folderId ? `Viewing items in ${folderData?.name}` : 'Comprehensive list of all system records'}
          </Text>
        </div>
        <Space>
          <Input 
            prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
            placeholder="Quick find..."
            style={{ width: 240 }}
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
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-primary)', display: 'flex', gap: '12px' }}>
          <Space size="middle">
            <FilterOutlined style={{ opacity: 0.5 }} />
            <Select
              placeholder="All Statuses"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleFilterChange('status', value)}
              variant="borderless"
            >
              {STATUSES.map((s) => (
                <Select.Option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="All Categories"
              allowClear
              style={{ width: 160 }}
              onChange={(value) => handleFilterChange('category', value)}
              variant="borderless"
            >
              {CATEGORIES.map((c) => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Routing Status"
              allowClear
              style={{ width: 160 }}
              onChange={(value) => handleFilterChange('routing_status', value)}
              variant="borderless"
            >
              {ROUTING_STATUSES.map((rs) => (
                <Select.Option key={rs} value={rs}>{rs.replace('_', ' ').toUpperCase()}</Select.Option>
              ))}
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
            emptyText: <Empty description="no data available for show kindly add tickets" style={{ padding: '40px 0' }} />
          }}
        />

        {data?.next_cursor && (
          <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid var(--color-border-primary)' }}>
            <Button onClick={handleLoadMore} type="text">Load more results</Button>
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
