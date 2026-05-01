import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Layout as AntLayout, Menu, Typography, Space, Button, Drawer, Breadcrumb, Tag, Badge, Popover, List } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  PlusOutlined,
  AlertOutlined,
  WarningOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
  FolderOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { designSystemStyled, useThemeMode } from '@ticketiq/design-system'
import FolderSidebar from './FolderSidebar'
import { clearAuthToken, getUserRole, getUserId } from '../auth/tokenStorage'
import { useFolderStore } from '../stores/folderStore'
import { useLayoutStore } from '../stores/layoutStore'
import { useTokenRefresh } from '../auth/useTokenRefresh'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'
import type { MenuProps } from 'antd'

const { Header, Content } = AntLayout
const { Text, Title } = Typography

const MOBILE_BREAKPOINT = 1024

// Styled components using the new design system tokens
const HeroBanner = designSystemStyled.div`
  background: linear-gradient(135deg, var(--color-bg-surface) 0%, var(--color-bg-primary) 100%);
  padding: 24px 40px;
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -10%;
    width: 40%;
    height: 200%;
    background: radial-gradient(circle, var(--color-bg-trail) 0%, transparent 70%);
    pointer-events: none;
  }
`

const StyledLayout = designSystemStyled(AntLayout)`
  min-height: 100vh;
  background: var(--color-bg-primary);
`

const StyledHeader = designSystemStyled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-primary);
  padding: 0 var(--spacing-6);
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 0 var(--spacing-4);
  }
`

const StyledContent = designSystemStyled(Content)`
  padding: var(--spacing-6);
  background: var(--color-bg-primary);
  min-width: 0;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: var(--spacing-4);
  }
`

const ThemeToggleButton = designSystemStyled(Button)`
  background: var(--color-bg-primary) !important;
  border: 1px solid var(--color-border-primary) !important;
  color: var(--color-text-secondary) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0 !important;
  
  &:hover {
    border-color: var(--color-primary) !important;
    color: var(--color-primary) !important;
  }
`

const StyledFooter = designSystemStyled.footer`
  position: sticky;
  bottom: 0;
  z-index: 1000;
  padding: 12px 40px;
  background: var(--color-theme-overlay);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  height: 64px;
  box-shadow: 0 -4px 12px var(--color-bg-trail);
  
  /* Transition for light/dark mode changes */
  transition: background 0.3s ease, border-color 0.3s ease;
`

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setMobileDrawerOpen } = useFolderStore()
  const { footerActions } = useLayoutStore()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentTheme, setTheme } = useThemeMode()

  // Enable automatic token refresh
  useTokenRefresh()

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', getUserRole(), getUserId()],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30000, // Every 30 seconds
  })

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  const handleMarkAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id)
    refetchNotifications()
  }

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead()
    refetchNotifications()
  }

  const handleLogout = () => {
    clearAuthToken()
    navigate('/login')
  }

  const handleMenuClick = (path: string) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

  const isAdmin = getUserRole() === 'admin'

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/tickets',
      icon: <FileTextOutlined />,
      label: 'Queue',
    },
    {
      key: '/tickets/new',
      icon: <PlusOutlined />,
      label: 'New Ticket',
    },
    {
      key: '/escalations',
      icon: <AlertOutlined />,
      label: 'Escalations',
    },
    {
      key: '/pattern-alerts',
      icon: <WarningOutlined />,
      label: 'Alerts',
    },
    ...(isAdmin ? [
      {
        key: '/model/metrics',
        icon: <BarChartOutlined />,
        label: 'Intelligence',
      }
    ] : []),
  ]

  // Breadcrumb items based on path
  const pathSnippets = location.pathname.split('/').filter(i => i)
  const isDashboardOnly = pathSnippets.length === 1 && pathSnippets[0] === 'dashboard'
  
  const breadcrumbItems = [
    { 
      title: <Link to="/dashboard" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Home</Link> 
    },
    ...(isDashboardOnly ? [] : pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
      const title = snippet.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      return {
        title: index === pathSnippets.length - 1 ? title : <Link to={url}>{title}</Link>
      }
    }))
  ]

  return (
    <StyledLayout>
      <FolderSidebar />
      <AntLayout style={{ background: 'var(--color-bg-primary)' }}>
        <StyledHeader>
          <Space size="large">
            {isMobile && (
              <Button
                type="text"
                icon={<FolderOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
              />
            )}
            {!isMobile && (
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => navigate('/dashboard')}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--color-primary)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>IQ</div>
                <Text strong style={{ fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>INDIGO IQ</Text>
              </div>
            )}

            {!isMobile && (
              <Breadcrumb
                items={breadcrumbItems}
                className="enterprise-breadcrumbs"
                style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 500 }}
              />
            )}
          </Space>

          <Space size="middle">
            {!isMobile ? (
              <>
                <Menu
                  mode="horizontal"
                  selectedKeys={[location.pathname]}
                  items={menuItems}
                  onClick={({ key }) => handleMenuClick(key)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    minWidth: '500px',
                    lineHeight: '64px'
                  }}
                />
                <ThemeToggleButton
                  icon={currentTheme === 'dark' ? '☀️' : '🌙'}
                  onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                />
                
                <Popover
                  placement="bottomRight"
                  trigger="click"
                  content={
                    <div style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-primary)' }}>
                        <Text strong>Notifications</Text>
                        {unreadCount > 0 && (
                          <Button type="link" size="small" onClick={handleMarkAllRead}>Mark all as read</Button>
                        )}
                      </div>
                      <List
                        itemLayout="horizontal"
                        dataSource={notifications || []}
                        locale={{ emptyText: 'No new notifications' }}
                        renderItem={(item) => (
                          <List.Item 
                            style={{ 
                              padding: '12px 16px', 
                              cursor: 'pointer',
                              background: item.is_read ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.05)',
                              transition: 'background 0.2s'
                            }}
                            onClick={() => {
                              if (!item.is_read) handleMarkAsRead(item.id)
                              if (item.ticket_id) navigate(`/tickets/${item.ticket_id}`)
                            }}
                          >
                            <List.Item.Meta
                              title={<Text style={{ fontSize: '13px', fontWeight: 600 }}>{item.title}</Text>}
                              description={
                                <div style={{ fontSize: '12px' }}>
                                  <Text type="secondary">{item.message}</Text>
                                  <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                    {new Date(item.created_at).toLocaleString()}
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  }
                >
                  <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                    <Button
                      type="text"
                      icon={<BellOutlined style={{ fontSize: '18px', color: unreadCount > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />}
                      style={{ color: 'var(--color-text-secondary)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  </Badge>
                </Popover>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => navigate('/settings')}
                  style={{ color: 'var(--color-text-secondary)' }}
                />
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <ThemeToggleButton
                  icon={currentTheme === 'dark' ? '☀️' : '🌙'}
                  onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                />
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileMenuOpen(true)}
                />
              </>
            )}
          </Space>
        </StyledHeader>


        <StyledContent style={location.pathname === '/master-control' ? { padding: 0, maxWidth: '100%', margin: 0 } : {}}>
          <Outlet />
        </StyledContent>

        {location.pathname !== '/master-control' && (
          <StyledFooter>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 24, height: 24, background: 'var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>IQ</div>
                <Text strong style={{ fontSize: '14px', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>INDIGO IQ</Text>
              </div>
              <Space size="middle" style={{ opacity: 0.9 }}>
                <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>© 2026 Indigo Intelligence Hub</Text>
              </Space>
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {footerActions && (
                <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--color-border-primary)', display: 'flex', alignItems: 'center' }}>
                  {footerActions}
                </div>
              )}
            </div>
          </StyledFooter>
        )}
      </AntLayout>

      {/* Mobile navigation drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          header: { borderBottom: '1px solid var(--color-border-primary)' },
          body: { padding: 0 }
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            ...menuItems,
            { type: 'divider' },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Sign Out',
              onClick: handleLogout,
              danger: true,
            },
          ]}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ border: 'none' }}
        />
      </Drawer>
    </StyledLayout>
  )
}
