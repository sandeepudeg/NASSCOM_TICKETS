import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Layout,
  Menu,
  Typography,
  Spin,
  Drawer,
} from 'antd'
import {
  FolderOutlined,
  DashboardOutlined,
  UnorderedListOutlined,
  StarOutlined,
  PlusCircleOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  RocketOutlined,
  SettingOutlined,
  KeyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { foldersApi } from '../api/folders'
import { ticketsApi } from '../api/tickets'
import { classificationApi } from '../api/classification'
import { useFolderStore } from '../stores/folderStore'
import { designSystemStyled } from '@ticketiq/design-system'
import type { MenuProps } from 'antd'

const { Sider } = Layout
const { Text, Title } = Typography

const MOBILE_BREAKPOINT = 1024

const StyledSider = designSystemStyled(Sider)`
  background: var(--color-bg-surface) !important;
  border-right: 1px solid var(--color-border-primary) !important;
  height: 100vh !important;
  position: sticky !important;
  top: 0 !important;
  left: 0 !important;
  transition: all 0.2s var(--transition-bezier) !important;
  z-index: 1000 !important;
  
  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }
`

const SidebarHeader = designSystemStyled.div`
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-primary);
  height: 64px;
`

const SidebarContent = designSystemStyled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 0;
  
  .ant-menu-item {
    transition: all 0.2s var(--transition-bezier) !important;
  }
  
  .ant-menu-item-inner {
    width: 100%;
  }
`

const SidebarFooter = designSystemStyled.div`
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-top: 1px solid var(--color-border-primary);
  
  .settings-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: var(--color-text-secondary);
    border-radius: var(--radius-md);
    transition: all 0.2s;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: rgba(var(--color-primary-rgb), 0.05);
      color: var(--color-primary);
    }
    
    &.active {
      background: rgba(var(--color-primary-rgb), 0.1);
      color: var(--color-primary);
    }
  }
`


export default function FolderSidebar() {
  const navigate = useNavigate()
  const { 
    selectedFolderId, 
    setSelectedFolderId, 
    mobileDrawerOpen,
    setMobileDrawerOpen,
  } = useFolderStore()
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch folders and stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['folders-stats'],
    queryFn: () => foldersApi.getStats(),
  })

  // Fetch all tickets count (just for the count)
  const { data: ticketsData } = useQuery({
    queryKey: ['tickets-count'],
    queryFn: () => ticketsApi.list({ limit: 1 }),
  })

  // Fetch escalations count
  const { data: escalationsData } = useQuery({
    queryKey: ['escalations-count'],
    queryFn: () => classificationApi.getEscalations({ limit: 0 }),
  })

  // Fetch alerts count
  const { data: alertsData } = useQuery({
    queryKey: ['alerts-count'],
    queryFn: () => classificationApi.getPatternAlerts({ status: 'active', limit: 0 }),
  })

  // Fetch automation candidates count
  const { data: automationData } = useQuery({
    queryKey: ['automation-count'],
    queryFn: () => classificationApi.getAutomationCandidates({ limit: 0 }),
  })



  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId)
    navigate(`/tickets?folder=${folderId}`)
    if (isMobile) setMobileDrawerOpen(false)
  }

  const renderBadge = (count: number, color?: string, background?: string) => {
    if (!count && count !== 0) return null
    if (count === 0 && !selectedFolderId) return null // Hide 0 for general labels if needed
    
    return (
      <span style={{ 
        marginLeft: '12px',
        background: background || 'hsla(var(--slate-500), 0.1)',
        color: color || 'var(--color-text-secondary)',
        padding: '0 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        height: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '24px',
        flexShrink: 0
      }}>
        {count}
      </span>
    )
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'main-header',
      type: 'group',
      label: <Text style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700, opacity: 0.6, letterSpacing: '0.12em', paddingLeft: '12px' }}>MAIN</Text>,
      children: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: <DashboardOutlined />,
          onClick: () => navigate('/dashboard'),
        },
        {
          key: 'all-tickets',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span>All Tickets</span>
              {renderBadge(ticketsData?.total || 0)}
            </div>
          ),
          icon: <UnorderedListOutlined />,
          onClick: () => navigate('/tickets'),
        },
        {
          key: 'escalations',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span>Escalations</span>
              {renderBadge(escalationsData?.total || 0, '#fff', '#ef4444')}
            </div>
          ),
          icon: <StarOutlined />,
          onClick: () => navigate('/escalations'),
        },
        {
          key: 'new-ticket',
          label: 'New Ticket',
          icon: <PlusCircleOutlined />,
          onClick: () => navigate('/tickets/new'),
        },
      ]
    },
    {
      key: 'depts-header',
      type: 'group',
      label: <Text style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700, opacity: 0.6, letterSpacing: '0.12em', paddingLeft: '12px' }}>DEPARTMENTS</Text>,
      children: (statsData?.stats || []).map((folder) => {
        const iconMap: Record<string, any> = {
          Storage: <DatabaseOutlined />,
          Security: <SecurityScanOutlined />,
          Network: <GlobalOutlined />,
          Application: <CloudServerOutlined />,
          Infrastructure: <RocketOutlined />,
          'Access Management': <KeyOutlined />,
        }
        return {
          key: folder.id,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', overflow: 'hidden' }}>
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                flex: 1
              }} title={folder.name}>{folder.name}</span>
              {renderBadge(folder.open_tickets, folder.name === 'Security' ? '#f59e0b' : undefined, folder.name === 'Security' ? 'rgba(245, 158, 11, 0.1)' : undefined)}
            </div>
          ),
          icon: iconMap[folder.name] || <FolderOutlined />,
          onClick: () => handleFolderClick(folder.id),
        }
      })
    },
    {
      key: 'intelligence-header',
      type: 'group',
      label: <Text style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700, opacity: 0.6, letterSpacing: '0.12em', paddingLeft: '12px' }}>INTELLIGENCE</Text>,
      children: [
        {
          key: 'alerts',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span>Pattern Alerts</span>
              {renderBadge(alertsData?.alerts.length || 0, '#f59e0b', 'rgba(245, 158, 11, 0.1)')}
            </div>
          ),
          icon: <LineChartOutlined />,
          onClick: () => navigate('/pattern-alerts'),
        },
        {
          key: 'automation-available',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span>Automation Available</span>
              {renderBadge(automationData?.total || 0, '#8b5cf6', 'rgba(139, 92, 246, 0.1)')}
            </div>
          ),
          icon: <ThunderboltOutlined />,
          onClick: () => navigate('/automation-available'),
        },
        {
          key: 'metrics',
          label: 'Model Metrics',
          icon: <ClockCircleOutlined />,
          onClick: () => navigate('/model/metrics'),
        },
      ]
    }
  ]

  const ContentUI = () => (
    <>
      <SidebarHeader style={{ border: 'none', height: '80px', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', background: 'var(--color-primary)', 
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px var(--color-primary-glow)'
          }}>
            <UnorderedListOutlined style={{ color: 'white', fontSize: '18px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Title level={4} style={{ margin: 0, fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em' }}>Ticket IQ</Title>
            <Tag color="blue" bordered={false} style={{ fontSize: '9px', fontWeight: 800, padding: '0 4px', borderRadius: '4px' }}>AI</Tag>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent style={{ padding: '0 8px' }}>
        {isStatsLoading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Spin size="small" />
          </div>
        ) : (
          <Menu
            mode="inline"
            inlineCollapsed={false}
            selectedKeys={[selectedFolderId || 'dashboard']}
            items={menuItems}
            style={{ 
              border: 'none', 
              background: 'transparent',
            }}
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <div 
          className={`settings-link ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => {
            navigate('/settings')
            if (isMobile) setMobileDrawerOpen(false)
          }}
        >
          <SettingOutlined />
          <span>Settings</span>
        </div>
      </SidebarFooter>
    </>
  )

  if (isMobile) {
    return (
      <Drawer
        title="Project Structure"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={340}
        styles={{
          body: { padding: 0, background: 'var(--color-bg-surface)' },
          header: { borderBottom: '1px solid var(--color-border-primary)' },
        }}
      >
        <ContentUI />
      </Drawer>
    )
  }

  return (
    <StyledSider
      width={340}
      collapsedWidth={0}
      collapsible={false}
      collapsed={false}
      trigger={null}
      className="glass-effect"
    >
      <ContentUI />
    </StyledSider>
  )
}
