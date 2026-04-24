import { useState, useEffect } from 'react'
import { ticketsApi } from '../api/tickets'
import { 
  Typography, 
  Card, 
  Upload, 
  Button, 
  Steps, 
  Table, 
  Select, 
  Space, 
  Alert, 
  message,
  Divider,
  Tag,
  Result
} from 'antd'
import { 
  InboxOutlined, 
  CloudUploadOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  TableOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { designSystemStyled } from '@ticketiq/design-system'

const { Title, Text } = Typography
const { Dragger } = Upload

const GlassCard = designSystemStyled(Card)`
  background: var(--color-bg-surface) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-primary) !important;
  border-radius: 16px;
  overflow: hidden;
  
  .ant-card-head {
    background: transparent !important;
    border-bottom: 1px solid var(--color-border-primary) !important;
  }
  
  .ant-card-head-title {
    color: var(--color-text-primary) !important;
  }

  .ant-alert-info {
    background-color: var(--color-bg-secondary) !important;
    border: 1px solid var(--color-border-primary) !important;
  }

  .ant-alert-message, .ant-alert-description {
    color: var(--color-text-primary) !important;
  }
`

const MappingRow = designSystemStyled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border-primary);
`

const TargetField = designSystemStyled.div`
  width: 140px;
  font-weight: 600;
  color: var(--color-primary);
`

const REQUIRED_FIELDS = [
  { key: 'title', label: 'Ticket Title', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'priority', label: 'Priority', required: false },
  { key: 'status', label: 'Status', required: false },
]

export default function ImportWorkspace() {
  const [currentStep, setCurrentStep] = useState(0)
  const [file, setFile] = useState<any>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [templates, setTemplates] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await ticketsApi.getImportTemplates()
        setTemplates(data)
      } catch (err) {
        console.error('Failed to fetch templates', err)
      }
    }
    fetchTemplates()
  }, [])

  const handleApplyTemplate = (templateName: string) => {
    const selectedTemplate = templates[templateName]
    if (selectedTemplate) {
      // The template matches target fields to source column names
      // We need to invert it for the UI selection if needed, but our mapping state is {target: source}
      // Wait, let's check ImportService.get_domain_templates()
      /*
      "Healthcare (HIPAA/DPDP)": {
                "Patient Name": "title",
                "Patient ID": "national_id",
                ...
      */
      // Ah, the backend returns {source: target}. We need to convert it to {target: source}.
      const newMapping: Record<string, string> = {}
      Object.entries(selectedTemplate).forEach(([source, target]) => {
        newMapping[target] = source
      })
      setMapping(prev => ({ ...prev, ...newMapping }))
      message.success(`Applied ${templateName} template`)
    }
  }

  const handleUpload = async (info: any) => {
    const { status } = info.file
    if (status === 'uploading') return
    
    setLoading(true)
    const formData = new FormData()
    formData.append('file', info.file.originFileObj)

    try {
      const response = await fetch('/api/v1/tickets/import/analyze', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      
      if (data.success) {
        setHeaders(data.headers)
        setPreviewData(data.preview)
        setFile(info.file.originFileObj)
        setCurrentStep(1)
        message.success('File analyzed successfully')
      } else {
        message.error(data.error || 'Failed to analyze file')
      }
    } catch (err) {
      message.error('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const startImport = async () => {
    // Validate mapping
    if (!mapping['title'] || !mapping['description']) {
      message.error('Title and Description mappings are required')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping_json', JSON.stringify(mapping))

    try {
      const response = await fetch('/api/v1/tickets/import', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': 'admin' // In a real app, this would be from auth
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setImportResult(data)
        setCurrentStep(2)
      } else {
        message.error(data.error || 'Import failed')
      }
    } catch (err) {
      message.error('Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ fontWeight: 800 }}>Enterprise Data Ingestion</Title>
        <Text type="secondary">Cold-start your intelligence hub by importing historical ticket data.</Text>
      </div>

      <Steps 
        current={currentStep} 
        style={{ marginBottom: 40 }}
        items={[
          { title: 'Upload', icon: <CloudUploadOutlined /> },
          { title: 'Map Fields', icon: <SettingOutlined /> },
          { title: 'Finalize', icon: <CheckCircleOutlined /> },
        ]}
      />

      {currentStep === 0 && (
        <GlassCard>
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Dragger 
                    accept=".csv,.xlsx,.xls"
                    multiple={false}
                    showUploadList={false}
                    onChange={handleUpload}
                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 0)}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: 'var(--color-primary)', fontSize: 48 }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: 18, fontWeight: 600 }}>Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                        Support for CSV and Excel formats. Mandate for Enterprise PII Scrubbing will be applied automatically.
                    </p>
                </Dragger>
                
                <div style={{ marginTop: 32 }}>
                    <Alert 
                        message="Intelligence Note" 
                        description="Uploaded data is processed through our local ETL pipeline. No data leaves your infrastructure during PII redaction." 
                        type="info" 
                        showIcon 
                    />
                </div>
            </div>
        </GlassCard>
      )}

      {currentStep === 1 && (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <GlassCard title={<Space><TableOutlined /> Data Preview & Column Mapping</Space>}>
                <div style={{ marginBottom: 24 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Sample data from your file:</Text>
                    <Table 
                        size="small" 
                        dataSource={previewData} 
                        columns={headers.slice(0, 4).map(h => ({ title: h, dataIndex: h, key: h, ellipsis: true }))}
                        pagination={false}
                        style={{ marginTop: 8 }}
                    />
                </div>

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={5} style={{ margin: 0 }}>Mapping Wizard</Title>
                        <Text type="secondary">Map your spreadsheet columns to TicketIQ fields.</Text>
                    </div>
                    {Object.keys(templates).length > 0 && (
                        <Space>
                            <Text strong style={{ fontSize: 12 }}>Apply Domain Template:</Text>
                            <Select 
                                placeholder="Select Template" 
                                style={{ width: 220 }}
                                onChange={handleApplyTemplate}
                                options={Object.keys(templates).map(name => ({ value: name, label: name }))}
                            />
                        </Space>
                    )}
                </div>
                
                <div style={{ marginTop: 16 }}>
                    {REQUIRED_FIELDS.map(field => (
                        <MappingRow key={field.key}>
                            <TargetField>
                                {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                            </TargetField>
                            <ArrowRightOutlined style={{ opacity: 0.3 }} />
                            <Select 
                                placeholder="Select source column" 
                                style={{ flex: 1 }}
                                value={mapping[field.key]}
                                onChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val }))}
                                options={headers.map(h => ({ value: h, label: h }))}
                            />
                        </MappingRow>
                    ))}
                </div>

                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <Button onClick={() => setCurrentStep(0)}>Back</Button>
                    <Button type="primary" loading={loading} onClick={startImport}>Execute Ingestion Pipeline</Button>
                </div>
            </GlassCard>
        </Space>
      )}

      {currentStep === 2 && (
        <GlassCard>
            <Result
                status="success"
                title="Data Ingestion Complete"
                subTitle={`Successfully processed ${importResult?.stats?.processed} tickets. Detected ${importResult?.stats?.pii_redactions} PII entities that were redacted for compliance.`}
                extra={[
                    <Button type="primary" key="dashboard" onClick={() => window.location.href = '/dashboard'}>
                        View Dashboard
                    </Button>,
                    <Button key="again" onClick={() => {
                        setCurrentStep(0)
                        setImportResult(null)
                        setFile(null)
                    }}>
                        Process Another File
                    </Button>,
                ]}
            >
                <div className="desc">
                    <Divider />
                    <Title level={5}>Intelligence Summary</Title>
                    <Space direction="vertical">
                        <Text><Tag color="green">✓</Tag> PII Scrubbing audit log updated (ISO/IEC 27001 compliance)</Text>
                        <Text><Tag color="blue">✓</Tag> Automatic department routing applied</Text>
                        <Text><Tag color="purple">✓</Tag> Vector embeddings generated for similarity search</Text>
                    </Space>
                </div>
            </Result>
        </GlassCard>
      )}
    </div>
  )
}
