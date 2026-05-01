import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Select, Button, Card, message, Space, Typography, Row, Col, Checkbox } from 'antd'
import { InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { ticketsApi } from '../api/tickets'
import { designSystemStyled } from '@ticketiq/design-system'
import type { CreateTicketRequest } from '../api/types'
import { getUserRole, getUserId } from '../auth/tokenStorage'

const { TextArea } = Input
const { Title, Text } = Typography

const PageContainer = designSystemStyled.div`
  max-width: 1000px;
  margin: 0 auto;
`

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#94a3b8' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
]

const INPUT_FORMATS = [
  { value: 'text', label: 'Plain Text' },
  { value: 'json_log', label: 'JSON Log' },
  { value: 'otlp_trace', label: 'OTLP Trace' },
  { value: 'prometheus_alert', label: 'Prometheus Alert' },
]

const CHANNELS = [
  { value: 'web', label: 'Web Portal' },
  { value: 'email', label: 'Email Integration' },
  { value: 'slack', label: 'Slack Bot' },
  { value: 'api', label: 'Direct API' },
]

const FORM_ID = 'ticket-submission-form'

export default function TicketSubmissionForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [inputFormat, setInputFormat] = useState<string>('text')
  const [isPolishing, setIsPolishing] = useState(false)
  
  const userRole = getUserRole()
  const userId = getUserId()
  const isAdmin = userRole === 'admin'
  
  const USERS = [
    { value: 'admin', label: 'Administrator (Self)' },
    ...Array.from({ length: 10 }, (_, i) => ({
      value: `User${i + 1}`,
      label: `User ${i + 1}`
    }))
  ]

  const handlePolish = async () => {
    const text = form.getFieldValue('incident_description_unique')
    if (!text) {
      message.warning('Please enter some text to polish first')
      return
    }

    setIsPolishing(true)
    try {
      const { polished_text } = await ticketsApi.polishDescription(text)
      form.setFieldsValue({ incident_description_unique: polished_text })
      message.success('Description polished and formatted!')
    } catch (error) {
      message.error('Failed to polish description')
    } finally {
      setIsPolishing(false)
    }
  }

  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketRequest) => ticketsApi.create(data),
    onSuccess: (response) => {
      message.success('Ticket submitted successfully')
      navigate(`/tickets/${response.id}`)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to submit ticket')
    },
  })

  const handleSubmit = (values: any) => {
    const payload: CreateTicketRequest = {
      title: values.incident_title_unique,
      description: values.incident_description_unique,
      priority: values.incident_priority_unique,
      source_channel: values.incident_channel_unique,
      enable_judge: values.enable_judge_unique,
      owner_id: values.incident_owner_unique,
    }

    if (inputFormat !== 'text' && values.incident_payload_unique) {
      try {
        payload.structured_payload = JSON.parse(values.incident_payload_unique)
      } catch (error) {
        message.error('Invalid JSON in payload')
        return
      }
    }

    createTicketMutation.mutate(payload)
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: '32px' }}>
        <Title level={4} style={{ margin: 0, fontWeight: 900, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>Ticket IQ</Title>
      </div>

      <Card className="glass-effect">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
          autoComplete="off"
          initialValues={{
            incident_owner_unique: userId,
            incident_priority_unique: 'medium',
            incident_channel_unique: 'web'
          }}
        >
          {isAdmin && (
            <Form.Item
              label={<Text strong>Ticket Owner (Raise on behalf of)</Text>}
              name="incident_owner_unique"
              rules={[{ required: true, message: 'Please select a ticket owner' }]}
            >
              <Select size="large" showSearch optionFilterProp="label">
                {USERS.map((u) => (
                  <Select.Option key={u.value} value={u.value} label={u.label}>
                    {u.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label={<Text strong>Incident Title</Text>}
            name="incident_title_unique"
            rules={[{ required: true, message: 'Please provide a descriptive title' }]}
          >
            <Input 
              size="large" 
              autoComplete="off" 
              spellCheck="false"
            />
          </Form.Item>

          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text strong>Description</Text>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<ThunderboltOutlined style={{ color: '#8b5cf6' }} />} 
                  onClick={handlePolish}
                  loading={isPolishing}
                  style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }}
                >
                  AI Polish & Format
                </Button>
              </div>
            }
            name="incident_description_unique"
            rules={[{ required: true, message: 'Please describe the issue in detail' }]}
          >
            <TextArea
              rows={5}
              autoComplete="off"
              spellCheck="false"
              placeholder="Provide a detailed technical description of the incident..."
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Priority Level</Text>}
                name="incident_priority_unique"
                rules={[{ required: true, message: 'Priority is required' }]}
              >
                <Select size="large">
                  {PRIORITIES.map((p) => (
                    <Select.Option key={p.value} value={p.value}>
                      <Space>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                        {p.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item 
                label={<Text strong>Submission Channel</Text>} 
                name="incident_channel_unique"
                rules={[{ required: true, message: 'Channel is required' }]}
              >
                <Select size="large">
                  {CHANNELS.map((ch) => (
                    <Select.Option key={ch.value} value={ch.value}>{ch.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label={<Text strong>Data ingestion format</Text>} 
            name="incident_format_unique"
            initialValue="text"
          >
            <Select onChange={setInputFormat} size="large">
              {INPUT_FORMATS.map((fmt) => (
                <Select.Option key={fmt.value} value={fmt.value}>{fmt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {inputFormat !== 'text' && (
            <Form.Item
              label={<Text strong>Structured Data (JSON)</Text>}
              name="incident_payload_unique"
              rules={[
                { required: true, message: 'Structured data is required for this format' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve()
                    try { JSON.parse(value); return Promise.resolve() } 
                    catch { return Promise.reject('Format must be valid JSON') }
                  },
                },
              ]}
            >
              <TextArea
                rows={8}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </Form.Item>
          )}

          <Form.Item name="enable_judge_unique" valuePropName="checked">
            <Checkbox>
              <Space direction="vertical" size={0}>
                <Text strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚀 AI Intelligence Pass (Judge Mode)
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Enable rigorous LLM-based verification to ensure maximum classification accuracy.
                </Text>
              </Space>
            </Checkbox>
          </Form.Item>


          <Form.Item style={{ marginBottom: 0 }}>
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                loading={createTicketMutation.isPending}
                size="large"
                style={{ height: '48px', padding: '0 32px', fontWeight: 600 }}
              >
                Launch Ticket
              </Button>
              <Button size="large" onClick={() => form.resetFields()} style={{ height: '48px' }}>Discard Changes</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Space size="middle" style={{ opacity: 0.9, marginTop: '24px' }}>
        <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>© 2026 Indigo Intelligence Hub</Text>
      </Space>
    </PageContainer>
  )
}
