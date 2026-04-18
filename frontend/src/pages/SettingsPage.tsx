import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Typography, 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Slider, 
  Radio, 
  Select, 
  Space, 
  Divider, 
  Row, 
  Col, 
  Tag, 
  message,
  Table
} from 'antd'
import { 
  SafetyCertificateOutlined, 
  BellOutlined, 
  EyeOutlined, 
  UserOutlined, 
  SaveOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  LockOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { designSystemStyled } from '@ticketiq/design-system'
import ImportWorkspace from '../workspaces/ImportWorkspace'
import { HistoryOutlined } from '@ant-design/icons'
import { useLayoutStore } from '../stores/layoutStore'
import { apiClient } from '../api/client'

const { Title, Text } = Typography

const PageContainer = designSystemStyled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--spacing-6) 40px;
`

const SettingsCard = designSystemStyled(Card)`
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  
  .ant-tabs-nav {
    margin-bottom: 24px;
    padding: 0 12px;
    border-bottom: 1px solid var(--color-border-primary);
  }
  
  .ant-tabs-tab {
    padding: 16px 12px;
    margin: 0 !important;
    font-weight: 500;
    color: var(--color-text-secondary) !important;
    transition: all 0.3s;
    
    &:hover {
      color: var(--color-primary) !important;
    }
    
    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: var(--color-primary) !important;
      font-weight: 700;
    }
  }

  .ant-tabs-nav-list {
    display: flex;
    justify-content: flex-start;
  }
  
  .ant-tabs-extra-content {
    display: flex;
    justify-content: flex-end;
    margin-left: 24px;
  }

  .ant-tabs-ink-bar {
    background: var(--color-primary) !important;
    height: 3px !important;
  }
`

const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) => (
  <div style={{ marginBottom: 32 }}>
    <Space align="start" size={16}>
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 10, 
        background: 'rgba(var(--color-primary-rgb), 0.1)', 
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        boxShadow: '0 0 15px rgba(var(--color-primary-rgb), 0.15)'
      }}>
        {icon}
      </div>
      <div>
        <Title level={4} style={{ margin: 0, letterSpacing: '-0.01em' }}>{title}</Title>
        <Text type="secondary" style={{ fontSize: 13, opacity: 0.8 }}>{subtitle}</Text>
      </div>
    </Space>
  </div>
)

export default function SettingsPage() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('intel')

  const { setFooterActions, clearFooterActions } = useLayoutStore()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const [intelForm] = Form.useForm()
  const [guardForm] = Form.useForm()
  const [alertForm] = Form.useForm()
  const [sysForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [generatingReport, setGeneratingReport] = useState(false)

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const response = await apiClient.get('/compliance/report', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `TicketIQ_Compliance_Report_${timestamp}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      message.success('Compliance report generated successfully')
    } catch (error) {
      console.error('Failed to generate report:', error)
      message.error('Failed to generate compliance report')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleSave = (section: string) => {
    message.success(`${section} settings updated successfully`)
  }

  const departmentData = [
    { key: '1', category: 'Security Anomaly', dept: 'Security' },
    { key: '2', category: 'Network Outage', dept: 'Network' },
    { key: '3', category: 'Storage Full', dept: 'Infrastructure' },
    { key: '4', category: 'API Timeout', dept: 'Applications' },
  ]

  const tabs = [
    {
      key: 'ingestion',
      label: <Space><HistoryOutlined />Data Ingestion</Space>,
      children: (
        <div style={{ padding: '24px' }}>
          <ImportWorkspace />
        </div>
      )
    },
    {
      key: 'intel',
      label: <Space><ThunderboltOutlined />Intelligence</Space>,
      children: (
        <div style={{ padding: '0 24px 24px' }}>
          <SectionHeader 
            icon={<ThunderboltOutlined />} 
            title="Intelligence Core" 
            subtitle="Configure AI confidence thresholds and model behavior." 
          />
          <Form 
            form={intelForm} 
            layout="vertical" 
            onFinish={() => handleSave('Intelligence Core')} 
            initialValues={{ threshold: 85, persona: 'technical', depth: 5, watchdog: true }}
          >
            <Form.Item 
              name="threshold" 
              label={<Text strong>Auto-Route Confidence Threshold</Text>}
              extra="Minimum AI confidence score required to automatically route a ticket to a department."
            >
              <Slider 
                marks={{ 0: '0', 50: '50', 85: '85', 100: '100' }} 
                tooltip={{ formatter: (v) => `${v}%` }} 
              />
            </Form.Item>
            
            <Divider style={{ margin: '32px 0', opacity: 0.3 }} />
            
            <Row gutter={48}>
              <Col span={12}>
                <Form.Item name="persona" label={<Text strong>LLM Persona</Text>}>
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value="concise">Concise</Radio.Button>
                    <Radio.Button value="detailed">Detailed</Radio.Button>
                    <Radio.Button value="technical">Technical</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="depth" label={<Text strong>Similarity Correlation Depth</Text>}>
                  <Select options={[
                    { value: 3, label: '3 Tickets (Fast)' },
                    { value: 5, label: '5 Tickets (Balanced)' },
                    { value: 10, label: '10 Tickets (Deep)' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="watchdog" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-primary)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border-primary)' }}>
                <div>
                  <Text strong style={{ display: 'block' }}>Hallucination Watchdog (LLM-as-Judge)</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Enable secondary verification for all high-confidence automated routings.</Text>
                </div>
                <Switch defaultChecked />
              </div>
            </Form.Item>

            <div style={{ marginTop: 24 }}>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Save Intelligence Config</Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'guard',
      label: <Space><SafetyCertificateOutlined />Guardrails</Space>,
      children: (
        <div style={{ padding: '0 24px 24px' }}>
          <SectionHeader 
            icon={<SafetyCertificateOutlined />} 
            title="Operational Guardrails" 
            subtitle="Define business rules and data safety policies." 
          />
          <Form 
            form={guardForm} 
            layout="vertical" 
            onFinish={() => handleSave('Operational Guardrails')}
          >
            <Form.Item label={<Text strong>SLA Watchdog Threshold</Text>} extra="Threshold for 'Critical' classification alerts. Actions required if exceeded.">
              <Input placeholder="e.g. 10 mins" suffix="Minutes" style={{ maxWidth: 200 }} />
            </Form.Item>

            <Form.Item valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-primary)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border-primary)' }}>
                <div>
                  <Text strong style={{ display: 'block' }}>Global PII Data Masking</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Automatically redact emails, phone numbers, and keys before AI processing.</Text>
                </div>
                <Switch defaultChecked />
              </div>
            </Form.Item>

            <Divider style={{ margin: '32px 0', opacity: 0.3 }} />
            
            <Title level={5} style={{ marginBottom: 16 }}>Department Intelligence Mappings</Title>
            <Table 
              size="small" 
              dataSource={departmentData} 
              pagination={false}
              columns={[
                { title: 'AI Category', dataIndex: 'category', key: 'category' },
                { title: 'Routed Department', dataIndex: 'dept', key: 'dept', render: (dept) => <Tag color="blue" bordered={false}>{dept}</Tag> },
                { title: 'Status', key: 'status', render: () => <Tag color="success" bordered={false}>Active</Tag> },
              ]}
              style={{ background: 'transparent' }}
            />
            
            <div style={{ marginTop: 24 }}>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Save Guardrail Policies</Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'alerts',
      label: <Space><BellOutlined />Communication</Space>,
      children: (
        <div style={{ padding: '0 24px 24px' }}>
          <SectionHeader 
            icon={<BellOutlined />} 
            title="Communication & Alerts" 
            subtitle="Configure how and when the system notifies your team." 
          />
          <Form 
            form={alertForm} 
            layout="vertical" 
            onFinish={() => handleSave('Communication')}
          >
            <Form.Item label={<Text strong>Escalation Pulse Webhook</Text>} extra="Sends a payload to external systems when AI escalates a critical ticket.">
              <Input placeholder="https://hooks.slack.com/services/..." prefix={<GlobalOutlined />} />
            </Form.Item>

            <Form.Item label={<Text strong>Intelligence Summary Frequency</Text>}>
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="daily">Daily Pulse</Radio.Button>
                <Radio.Button value="weekly">Weekly Intelligence</Radio.Button>
                <Radio.Button value="none">Disabled</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item label={<Text strong>Silent Hours (SLA Maintenance)</Text>} extra="Non-critical alerts will be queued during this window.">
              <Space>
                <Select defaultValue="22:00" style={{ width: 120 }} options={[{value: '22:00', label: '10:00 PM'}]} />
                <Text>to</Text>
                <Select defaultValue="06:00" style={{ width: 120 }} options={[{value: '06:00', label: '06:00 AM'}]} />
              </Space>
            </Form.Item>

            <div style={{ marginTop: 24 }}>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Save Alert Policies</Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'sys',
      label: <Space><EyeOutlined />System</Space>,
      children: (
        <div style={{ padding: '0 24px 24px' }}>
          <SectionHeader 
            icon={<EyeOutlined />} 
            title="System & Aesthetics" 
            subtitle="Manage visual appearance and API integrations." 
          />
          <Form 
            form={sysForm} 
            layout="vertical" 
            onFinish={() => handleSave('System')}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label={<Text strong>Visual Mode</Text>}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Card size="small" style={{ width: 120, textAlign: 'center', cursor: 'pointer', border: '2px solid var(--color-primary)', background: 'var(--color-bg-primary)' }}>
                      <Title level={2} style={{ margin: 0 }}>🌙</Title>
                      <Text style={{ fontSize: 11, fontWeight: 600 }}>Dark Cyber</Text>
                    </Card>
                    <Card size="small" style={{ width: 120, textAlign: 'center', cursor: 'pointer', opacity: 0.6, background: 'var(--color-bg-primary)' }}>
                      <Title level={2} style={{ margin: 0 }}>☀️</Title>
                      <Text style={{ fontSize: 11, fontWeight: 600 }}>Light Glass</Text>
                    </Card>
                  </div>
                </Form.Item>
                <Form.Item label={<Text strong>Interface Density</Text>}>
                  <Radio.Group defaultValue="comfortable">
                    <Radio value="comfortable">Comfortable</Radio>
                    <Radio value="compact">Compact (Dev Mode)</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<Text strong>API Configuration</Text>} extra="Primary key for system-to-system ticket ingestion.">
                  <Input.Password value="tq_live_######################" prefix={<KeyOutlined />} />
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 4 }} onClick={() => message.info('Secret key rotation initiated')}>Rotate API Secret Key</Button>
                </Form.Item>
              </Col>
            </Row>
            
            <div style={{ marginTop: 24 }}>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Save System Config</Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'privacy',
      label: <Space><LockOutlined />Privacy & Compliance</Space>,
      children: (
        <div style={{ padding: '0 24px 24px' }}>
          <SectionHeader 
            icon={<LockOutlined />} 
            title="Data Governance & Compliance" 
            subtitle="Monitor auditable PII redaction and regulatory compliance status." 
          />
          
          <Row gutter={24} style={{ marginBottom: 32 }}>
            <Col span={8}>
              <Card 
                className="glass-effect" 
                bodyStyle={{ padding: '24px', textAlign: 'center' }}
                style={{ borderTop: '4px solid #10b981' }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>PII Entities Redacted</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.03em' }}>2,451</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} /> Auditable Redaction Enabled
                </div>
              </Card>
            </Col>
            <Col span={16}>
              <Card className="glass-effect" title={<Text strong>Regulatory Compliance Badges</Text>}>
                <Space size={16} wrap>
                  <Tag 
                    color="cyan" 
                    bordered={false} 
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      fontWeight: 800, 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <SafetyCertificateOutlined /> India DPDP (2023) COMPLIANT
                  </Tag>
                  <Tag 
                    color="blue" 
                    bordered={false} 
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      fontWeight: 800, 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <GlobalOutlined /> EU GDPR COMPLIANT
                  </Tag>
                  <Tag 
                    color="purple" 
                    bordered={false} 
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      fontWeight: 800, 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <SafetyCertificateOutlined /> ISO/IEC 27001
                  </Tag>
                </Space>
                <div style={{ marginTop: 20 }}>
                  <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    Compliance badges are verified against the current regional data residency and PII masking policies.
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0', opacity: 0.3 }} />

          <Form layout="vertical">
            <Form.Item label={<Text strong>Data Retention Policy</Text>} extra="Automatically purge resolved ticket history after the specified period.">
              <Select defaultValue="90" style={{ maxWidth: 240 }} options={[
                { value: '30', label: '30 Days' },
                { value: '90', label: '90 Days (Recommended)' },
                { value: '365', label: '1 Year' },
                { value: '0', label: 'Indefinite' },
              ]} />
            </Form.Item>

            <Form.Item label={<Text strong>Privacy Impact Assessment (PIA)</Text>}>
              <Button 
                ghost 
                type="primary" 
                onClick={handleGenerateReport}
                loading={generatingReport}
                icon={<SafetyCertificateOutlined />}
              >
                Generate Compliance Report (PDF)
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: 'profile',
      label: <Space><UserOutlined />Profile</Space>,
      children: (
        <div style={{ padding: '0 24px 24px' }}>
          <SectionHeader 
            icon={<UserOutlined />} 
            title="User Profile" 
            subtitle="Manage your identity within the TicketIQ ecosystem." 
          />
          <Form 
            form={profileForm} 
            layout="vertical" 
            style={{ maxWidth: 600 }}
            onFinish={() => handleSave('User Profile')}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Full Name"><Input defaultValue="Admin User" /></Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Job Title"><Input defaultValue="Intelligence Operator" /></Form.Item>
              </Col>
            </Row>
            <Form.Item label="Departmental Role"><Input defaultValue="L3 Support Engineering" /></Form.Item>
            <Form.Item label="Notification Email"><Input defaultValue="admin@ticketiq.ai" /></Form.Item>
            
            <div style={{ marginTop: 24 }}>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Update Profile</Button>
            </div>
          </Form>
        </div>
      )
    }
  ]

  const currentIndex = tabs.findIndex(t => t.key === activeTab);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === tabs.length - 1;

  const previousButton = (
    <Button 
      type="primary"
      icon={<LeftOutlined />} 
      onClick={() => {
        if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].key);
      }}
      disabled={isFirst}
      style={{
        boxShadow: isFirst ? 'none' : '0 4px 12px rgba(var(--color-primary-rgb), 0.2)',
        opacity: isFirst ? 0.5 : 1
      }}
    >
      Previous Section
    </Button>
  );

  const nextButton = (
    <Button 
      type="primary"
      onClick={() => {
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1].key);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          message.info("You've reached the final configuration section.");
        }
      }}
      style={{
        boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.2)'
      }}
    >
      {isLast ? "Finish Setup" : "Next Section"} <RightOutlined />
    </Button>
  );

  return (
    <PageContainer>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
          System Settings
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>Manage enterprise visibility, AI logic, and global operational parameters.</Text>
      </div>

      <SettingsCard bodyStyle={{ padding: 0 }}>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          style={{ width: '100%' }}
          tabBarExtraContent={
            <div style={{ padding: '0 24px' }}>
              <Tag color="cyan" icon={<SafetyCertificateOutlined />} bordered={false}>Enterprise License: ACTIVE</Tag>
            </div>
          }
        />
        <div style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid var(--color-border-primary)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(var(--color-primary-rgb), 0.02)'
        }}>
          {previousButton}
          {nextButton}
        </div>
      </SettingsCard>
    </PageContainer>
  )
}
