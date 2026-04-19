import { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, Typography, Space, Divider, message, Badge, Tooltip } from 'antd'
import { 
  LockOutlined, 
  SafetyOutlined,
  GoogleOutlined,
  MailOutlined,
  ThunderboltOutlined,
  SecurityScanOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  RobotOutlined,
  VerifiedOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { designSystemStyled } from '@ticketiq/design-system'
import { authApi } from '../auth/authApi'

const { Title, Text } = Typography

// --- THEME DEFINITIONS ---
const THEMES = [
  { id: 'command', name: 'Command Center', image: '/assets/backgrounds/ui_option_1_command_center_1776409314688.png', accent: '#00d4ff', second: '#818cf8', dark: true },
  { id: 'neural', name: 'Neural Prism', image: '/assets/backgrounds/ui_option_2_neural_prism_1776409330497.png', accent: '#b57bff', second: '#818cf8', dark: true },
  { id: 'stream', name: 'Data Stream', image: '/assets/backgrounds/ui_option_3_data_stream_1776409347641.png', accent: '#00e5a0', second: '#00d4ff', dark: true },
  { id: 'sentinel', name: 'The Sentinel', image: '/assets/backgrounds/ui_option_4_sentinel_safe_1776409387911.png', accent: '#f8a220', second: '#ff4f6a', dark: true },
  { id: 'ethereal', name: 'Ethereal Core', image: '/assets/backgrounds/ui_option_5_ethereal_core_1776409405308.png', accent: '#4285f4', second: '#818cf8', dark: false },
  { id: 'quantum', name: 'Quantum Grid', image: '/assets/backgrounds/ui_option_6_quantum_grid_1776409595846.png', accent: '#00ff41', second: '#00d4ff', dark: true },
  { id: 'stellar', name: 'Stellar Logic', image: '/assets/backgrounds/ui_option_7_stellar_logic_1776409613870.png', accent: '#fcc200', second: '#f8a220', dark: true },
  { id: 'luxury', name: 'Obsidian Luxury', image: '/assets/backgrounds/ui_option_8_obsidian_luxury_1776409630994.png', accent: '#ffffff', second: '#6b8aad', dark: true },
  { id: 'organic', name: 'Organic Intel', image: '/assets/backgrounds/ui_option_9_organic_intelligence_1776409653828.png', accent: '#10b981', second: '#818cf8', dark: true },
  { id: 'forge', name: 'Industrial Forge', image: '/assets/backgrounds/ui_option_10_industrial_forge_1776409671260.png', accent: '#ff4f00', second: '#f8a220', dark: true }
]

const FEATURE_CARDS = [
  { id: 1, title: 'LLM Engine', target: 'Intelligent Parsing', metric: '99.2% NLP Accuracy', icon: <RobotOutlined /> },
  { id: 2, title: 'Smart Routing', target: 'Contextual Dispatch', metric: '< 12s Mean Triage', icon: <ArrowRightOutlined /> },
  { id: 3, title: 'Anomaly Alert', target: 'Predictive Awareness', metric: '84% Outage Prev.', icon: <SecurityScanOutlined /> },
  { id: 4, title: 'Escalation', target: 'Critical Awareness', metric: '2x Faster Resolve', icon: <ThunderboltOutlined /> },
  { id: 5, title: 'SLA Sentinel', target: 'Proactive Guard', metric: '99.98% Uptime', icon: <VerifiedOutlined /> },
  { id: 6, title: 'Privacy Shield', target: 'Global PII Mask', metric: 'Zero Breaches', icon: <SafetyOutlined /> },
  { id: 7, title: 'Component Core', target: 'Modular UI', metric: '100% Shared Logic', icon: <AppstoreOutlined /> },
  { id: 8, title: 'Cross-Domain', target: 'Vertical Dispatch', metric: '6+ Industry Sets', icon: <DeploymentUnitOutlined /> }
]

// --- STYLED COMPONENTS ---
const LoginContainer = designSystemStyled.div`
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
  background: #020617;
`

const BackgroundLayer = designSystemStyled(motion.div)<{ image: string }>`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%),
              url(${props => props.image});
  background-size: cover;
  background-position: center;
  z-index: 0;
`

const LeftShowcase = designSystemStyled.div`
  flex: 1.2;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  
  @media (max-width: 1024px) { display: none; }
`

const AuthPanel = designSystemStyled.div<{ dark: boolean }>`
  width: 460px;
  flex-shrink: 0;
  position: relative;
  z-index: 20;
  background: ${props => props.dark ? 'rgba(4, 13, 31, 0.65)' : 'rgba(255, 255, 255, 0.75)'};
  backdrop-filter: blur(40px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 48px;
  color: ${props => props.dark ? '#fff' : '#020617'};
`

const RotatingCardContainer = designSystemStyled.div`
  perspective: 1000px;
  width: 100%;
  height: 140px;
  cursor: pointer;
`

const CardInner = designSystemStyled(motion.div)`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
`

const CardFace = designSystemStyled.div<{ dark: boolean; accent: string }>`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: border-color 0.3s;
  
  &:hover {
    border-color: ${props => props.accent};
  }
`

const CardBack = designSystemStyled(CardFace)`
  transform: rotateY(180deg);
  background: ${props => `rgba(${parseInt(props.accent.slice(1,3),16)}, ${parseInt(props.accent.slice(3,5),16)}, ${parseInt(props.accent.slice(5,7),16)}, 0.1)`};
`

const SwitcherBar = designSystemStyled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  padding: 10px 20px;
  border-radius: 40px;
  display: flex;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
`

const ThemeDot = designSystemStyled.button<{ active: boolean; color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${props => props.active ? '#fff' : 'transparent'};
  background: ${props => props.color};
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
  
  &:hover { transform: scale(1.3); }
`

const MetricFlipCard = ({ item, theme }: { item: any, theme: any }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  
  return (
    <RotatingCardContainer 
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <CardInner
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        <CardFace dark={theme.dark} accent={theme.accent}>
          <div style={{ color: theme.accent, fontSize: '24px', marginBottom: '12px' }}>{item.icon}</div>
          <Text strong style={{ color: '#fff', fontSize: '15px' }}>{item.title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{item.target}</Text>
        </CardFace>
        
        <CardBack dark={theme.dark} accent={theme.accent}>
          <Title level={4} style={{ color: theme.accent, margin: 0, fontSize: '18px', fontWeight: 800 }}>{item.metric}</Title>
          <Text style={{ color: '#fff', fontSize: '11px', opacity: 0.6, display: 'block', marginTop: '4px' }}>Target performance benchmark reached in latest audit.</Text>
        </CardBack>
      </CardInner>
    </RotatingCardContainer>
  )
}

export default function LoginPage() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Pre-load images optionally, but browsers usually handle it well with AnimatePresence
  }, [])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await authApi.login({ 
        username: values.username || 'admin', 
        password: values.password || 'admin' 
      })
      message.success('Synchronizing secure perimeter...')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (e) {
      message.error('Unauthorized entry attempting.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginContainer>
      <AnimatePresence mode="wait">
        <BackgroundLayer 
          key={activeTheme.id}
          image={activeTheme.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      <LeftShowcase>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge count="V2.8 TITAN" style={{ backgroundColor: activeTheme.accent, borderRadius: '4px', marginBottom: '24px' }} />
          <Title level={1} style={{ color: '#fff', fontSize: '56px', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Modular AI <br />
            <span style={{ color: activeTheme.accent }}>Intelligence.</span>
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', display: 'block', margin: '24px 0 60px', maxWidth: '500px', lineHeight: 1.6 }}>
            Enterprise-grade ticket automation utilizing Cross-Domain Logic and Reusable Component Architectures for high-velocity operations.
          </Text>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '800px' }}>
            {FEATURE_CARDS.map(item => (
              <MetricFlipCard key={item.id} item={item} theme={activeTheme} />
            ))}
          </div>
        </motion.div>
      </LeftShowcase>

      <AuthPanel dark={activeTheme.dark}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{ width: 36, height: 36, background: activeTheme.accent, color: activeTheme.dark ? '#000' : '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>IQ</div>
            <Text strong style={{ fontSize: '18px', letterSpacing: '-0.02em', color: activeTheme.dark ? '#fff' : '#020617' }}>TicketIQ Portal</Text>
          </div>

          <Title level={2} style={{ color: activeTheme.dark ? '#fff' : '#020617', margin: '0 0 8px', fontSize: '32px', fontWeight: 800 }}>Welcome back</Title>
          <Text style={{ display: 'block', marginBottom: '40px', color: activeTheme.dark ? 'rgba(255,255,255,0.5)' : '#64748b' }}>Authenticate to access your secure IT workspace.</Text>

          <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
            <Form.Item name="username" label={<Text strong style={{ color: activeTheme.dark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise Email</Text>}>
              <Input placeholder="admin@company.com" prefix={<MailOutlined style={{ opacity: 0.3 }} />} style={{ borderRadius: '12px', background: activeTheme.dark ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: activeTheme.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: activeTheme.dark ? '#fff' : '#020617' }} />
            </Form.Item>
            <Form.Item name="password" label={<Text strong style={{ color: activeTheme.dark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Key</Text>}>
              <Input.Password placeholder="••••••••" prefix={<LockOutlined style={{ opacity: 0.3 }} />} style={{ borderRadius: '12px', background: activeTheme.dark ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: activeTheme.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }} />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <Checkbox style={{ color: activeTheme.dark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: '13px' }}>Trust device</Checkbox>
              <Button type="link" style={{ padding: 0, fontWeight: 700, color: activeTheme.accent }}>Reset access?</Button>
            </div>

            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '54px', borderRadius: '12px', background: activeTheme.accent, border: 'none', fontWeight: 700 }}>
              Initiate Access
            </Button>
          </Form>

          <Divider style={{ margin: '40px 0', borderColor: activeTheme.dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
            <Text style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, color: activeTheme.dark ? '#fff' : '#64748b' }}>SSO Federations</Text>
          </Divider>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block icon={<GoogleOutlined />} style={{ height: '54px', borderRadius: '12px', background: 'transparent', color: activeTheme.dark ? '#fff' : '#020617', border: activeTheme.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>Continue with Workspace</Button>
          </Space>
        </motion.div>
      </AuthPanel>

      <SwitcherBar>
        {THEMES.map(t => (
          <Tooltip key={t.id} title={t.name}>
            <ThemeDot 
              active={activeTheme.id === t.id} 
              color={t.accent} 
              onClick={() => setActiveTheme(t)} 
            />
          </Tooltip>
        ))}
      </SwitcherBar>
    </LoginContainer>
  )
}
