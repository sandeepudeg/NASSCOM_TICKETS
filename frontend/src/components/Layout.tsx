import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Typography, Space, Button, Drawer, Breadcrumb, Tag } from 'antd'
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
} from '@ant-design/icons'
import { designSystemStyled, useThemeMode } from '@ticketiq/design-system'
import FolderSidebar from './FolderSidebar'
import { clearAuthToken } from '../auth/tokenStorage'
import { useFolderStore } from '../stores/folderStore'
import { useTokenRefresh } from '../auth/useTokenRefresh'
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
    background: radial-gradient(circle, rgba(var(--color-primary-rgb), 0.05) 0%, transparent 70%);
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

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setMobileDrawerOpen } = useFolderStore()
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

  const handleLogout = () => {
    clearAuthToken()
    navigate('/login')
  }

  const handleMenuClick = (path: string) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

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
    {
      key: '/model/metrics',
      icon: <BarChartOutlined />,
      label: 'Intelligence',
    },
  ]

  // Breadcrumb items based on path
  const pathSnippets = location.pathname.split('/').filter(i => i)
  const breadcrumbItems = [
    { title: 'Home', href: '/dashboard' },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
      return {
        title: snippet.charAt(0).toUpperCase() + snippet.slice(1).replace('-', ' '),
        href: url
      }
    })
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <Text strong style={{ fontSize: '16px', letterSpacing: '-0.01em' }}>TicketIQ</Text>
              </div>
            )}

            {!isMobile && (
              <Breadcrumb
                items={breadcrumbItems}
                style={{ marginLeft: '12px', fontSize: '13px', opacity: 0.8 }}
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
        <HeroBanner>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag color="cyan" bordered={false} style={{ fontSize: '10px', fontWeight: 800, padding: '0 8px', borderRadius: '4px' }}>ENTERPRISE AI</Tag>
            <Text style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Intelligence Report
            </Text>
          </div>
          <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            AI Powered Intelligent Ticket Routing <span style={{ fontWeight: 400, opacity: 0.6 }}>powered by LLM</span>
          </Title>
          <Text type="secondary" style={{ fontSize: '14px', opacity: 0.7 }}>
            Enterprise-Grade AI Classification & Automated Resolution Engine
          </Text>
        </HeroBanner>

        <StyledContent>
          <Outlet />
        </StyledContent>
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
