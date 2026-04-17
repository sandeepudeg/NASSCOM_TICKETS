import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Select, Button, Card, message, Space, Alert, Checkbox, Typography, Row, Col } from 'antd'
import { InfoCircleOutlined, RocketOutlined } from '@ant-design/icons'
import { ticketsApi } from '../api/tickets'
import { useFormPersistence, useFormRestore } from '../auth/useFormPersistence'
import { designSystemStyled } from '@ticketiq/design-system'
import type { CreateTicketRequest } from '../api/types'

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
  const [showRestoredNotice, setShowRestoredNotice] = useState(false)

  const restoredData = useFormRestore<any>(FORM_ID)
  const formValues = Form.useWatch([], form)
  const { clear } = useFormPersistence(FORM_ID, formValues, true)

  useEffect(() => {
    if (restoredData) {
      form.setFieldsValue(restoredData)
      if (restoredData.input_format) {
        setInputFormat(restoredData.input_format)
      }
      setShowRestoredNotice(true)
      const timeoutId = setTimeout(() => setShowRestoredNotice(false), 5000)
      return () => clearTimeout(timeoutId)
    }
  }, [restoredData, form])

  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketRequest) => ticketsApi.create(data),
    onSuccess: (response) => {
      message.success('Ticket submitted successfully')
      clear()
      navigate(`/tickets/${response.id}`)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to submit ticket')
    },
  })

  const handleSubmit = (values: any) => {
    const payload: CreateTicketRequest = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      source_channel: values.source_channel,
      enable_judge: values.enable_judge,
    }

    if (inputFormat !== 'text' && values.raw_payload) {
      try {
        payload.structured_payload = JSON.parse(values.raw_payload)
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
        <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Create New Ticket
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>Submit an incident or service request for intelligent classification</Text>
      </div>

      {showRestoredNotice && (
        <Alert
          message="Draft Restored"
          description="We've recovered your unsaved progress from an earlier session."
          type="info"
          showIcon
          closable
          onClose={() => setShowRestoredNotice(false)}
          style={{ marginBottom: '24px', borderRadius: '8px' }}
        />
      )}

      <Card className="glass-effect">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'medium', input_format: 'text', source_channel: 'web', enable_judge: false }}
          requiredMark="optional"
        >
          <Form.Item
            label={<Text strong>Incident Title</Text>}
            name="title"
            rules={[{ required: true, message: 'Please provide a descriptive title' }]}
          >
            <Input placeholder="e.g., Unable to access VPN on mobile device" size="large" />
          </Form.Item>

          <Form.Item
            label={<Text strong>Description</Text>}
            name="description"
            rules={[{ required: true, message: 'Please describe the issue in detail' }]}
          >
            <TextArea
              rows={5}
              placeholder="What happened? What were you doing when the issue occurred?"
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Priority Level</Text>}
                name="priority"
                rules={[{ required: true }]}
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
              <Form.Item label={<Text strong>Submission Channel</Text>} name="source_channel">
                <Select size="large">
                  {CHANNELS.map((ch) => (
                    <Select.Option key={ch.value} value={ch.value}>{ch.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<Text strong>Data ingestion format</Text>} name="input_format">
            <Select onChange={setInputFormat} size="large">
              {INPUT_FORMATS.map((fmt) => (
                <Select.Option key={fmt.value} value={fmt.value}>{fmt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {inputFormat !== 'text' && (
            <Form.Item
              label={<Text strong>Structured Data (JSON)</Text>}
              name="raw_payload"
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
                placeholder={`Paste your ${inputFormat} payload here...`}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </Form.Item>
          )}

          <div style={{ 
            background: 'hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.05)', 
            padding: '16px', 
            borderRadius: '12px',
            border: '1px solid hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)',
            marginBottom: '24px'
          }}>
            <Form.Item name="enable_judge" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>
                <Space direction="vertical" size={0}>
                  <Text strong style={{ color: 'var(--color-primary)' }}>
                    <RocketOutlined style={{ marginRight: '8px' }} />
                    AI Intelligence Pass (Judge Mode)
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Enable rigorous LLM-based verification to ensure maximum classification accuracy.
                  </Text>
                </Space>
              </Checkbox>
            </Form.Item>
          </div>

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
      
      <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
        <InfoCircleOutlined />
        <Text style={{ fontSize: '12px' }}>Your ticket will be processed using high-confidence vector similarity and LLM classification.</Text>
      </div>
    </PageContainer>
  )
}
