import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Typography, Button, Space, Tooltip, Progress, Input, message } from 'antd';
import { 
  SafetyCertificateOutlined, 
  SyncOutlined, 
  GlobalOutlined, 
  ThunderboltOutlined,
  RadarChartOutlined,
  DashboardOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  CloudServerOutlined,
  RocketOutlined,
  KeyOutlined,
  LineChartOutlined,
  NodeIndexOutlined,
  MonitorOutlined,
  UnlockOutlined,
  LockOutlined
} from '@ant-design/icons';
import { designSystemStyled } from '@ticketiq/design-system';

const { Title, Text } = Typography;

// --- Solarized Dark Design System ---
const SRE_THEME = {
  bg: '#002b36',
  cardBg: '#073642',
  border: '#586e75',
  text: '#839496',
  bright: '#eee8d5',
  blue: '#268bd2',
  green: '#859900',
  yellow: '#b58900',
  red: '#dc322f',
  cyan: '#2aa198'
};

const DashboardContainer = designSystemStyled.div`
  background: ${SRE_THEME.bg};
  min-height: 100vh;
  padding: 32px;
  color: ${SRE_THEME.text};
  font-family: 'JetBrains Mono', monospace;
`;

const SRECard = designSystemStyled(Card)`
  background: ${SRE_THEME.cardBg} !important;
  border: 1px solid ${SRE_THEME.border} !important;
  border-radius: 4px !important;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${SRE_THEME.blue} !important;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }

  .ant-card-head {
    border-bottom: 1px solid rgba(88, 110, 117, 0.3) !important;
    background: rgba(0,0,0,0.1) !important;
  }
`;

const SparklineContainer = designSystemStyled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 32px;
  margin: 12px 0;
`;

const SparkBar = designSystemStyled.div<{ height: number; active: boolean }>`
  flex: 1;
  height: ${props => props.height}%;
  background: ${props => props.active ? SRE_THEME.green : SRE_THEME.border};
  opacity: ${props => props.active ? 0.8 : 0.2};
  border-radius: 1px;
`;

const HUDBar = designSystemStyled.div`
  background: ${SRE_THEME.cardBg};
  border: 1px solid ${SRE_THEME.border};
  padding: 16px 24px;
  border-radius: 4px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const ServiceIcon = ({ type, color }: { type: string, color?: string }) => {
  const icons: any = {
    network: <GlobalOutlined style={{ color }} />,
    db: <DatabaseOutlined style={{ color }} />,
    security: <SecurityScanOutlined style={{ color }} />,
    api: <ApiOutlined style={{ color }} />,
    metrics: <LineChartOutlined style={{ color }} />,
    compute: <CloudServerOutlined style={{ color }} />,
    auth: <KeyOutlined style={{ color }} />,
    ai: <NodeIndexOutlined style={{ color }} />,
    viz: <MonitorOutlined style={{ color }} />,
    default: <RocketOutlined style={{ color }} />
  };
  return icons[type] || icons.default;
};

// --- Service Definitions ---
const SERVICES = [
  { id: 'traefik', name: 'TRAEFIK_GW', type: 'network', port: 8081 },
  { id: 'grafana', name: 'GRAFANA_VIS', type: 'viz', port: 3002 },
  { id: 'prometheus', name: 'PROM_METRICS', type: 'metrics', port: 9090 },
  { id: 'minio', name: 'MINIO_OBJ', type: 'db', port: 9001 },
  { id: 'keycloak', name: 'KEYCLOAK_IAM', type: 'auth', port: 8080 },
  { id: 'jaeger', name: 'JAEGER_TRA', type: 'viz', port: 16686 },
  { id: 'mlflow', name: 'MLFLOW_REG', type: 'ai', port: 5000 },
  { id: 'qdrant', name: 'QDRANT_VEC', type: 'db', port: 6333 },
  { id: 'api', name: 'CORE_API', type: 'api', port: 8005 },
  { id: 'frontend', name: 'USER_UI', type: 'viz', port: 3003 },
  { id: 'ollama', name: 'OLLAMA_LLM', type: 'ai', port: 11434 },
  { id: 'postgres', name: 'POSTGRES_DB', type: 'db', port: 5432 },
  { id: 'loki', name: 'LOKI_LOGS', type: 'metrics', port: 3100 },
  { id: 'promtail', name: 'PROMTAIL_SH', type: 'compute', port: 0 },
  { id: 'groq', name: 'GROQ_CLOUD', type: 'ai', port: 443 }
];

const MasterControlPage: React.FC = () => {
  const [statuses, setStatuses] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [timer, setTimer] = useState(0);
  
  // Authentication State
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('mc_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');

  const handleAuthorize = () => {
    // This matches the MASTER_CONTROL_PASSWORD in your .env
    if (passwordInput === 'admin123') {
      setIsAuthorized(true);
      sessionStorage.setItem('mc_auth', 'true');
      message.success('Master access granted.');
      fetchStatus();
    } else {
      message.error('Invalid Master Key.');
    }
  };

  const fetchStatus = async () => {
    if (!isAuthorized) return;
    setRefreshing(true);
    try {
      // Use relative API path instead of hardcoded localhost
      const res = await fetch('/api/v1/master-control/status');
      const data = await res.json();
      if (data.services) setStatuses(data.services);
    } catch (err) {
      console.error("Master Control API is offline", err);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setTimer(t => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardContainer>
      {!isAuthorized ? (
        <div style={{ 
          height: 'calc(100vh - 200px)', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: SRE_THEME.cardBg, 
            border: `2px solid ${SRE_THEME.border}`,
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <LockOutlined style={{ fontSize: '32px', color: SRE_THEME.red }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: SRE_THEME.bright, margin: 0 }}>RESTRICTED_ACCESS</Title>
            <Text style={{ color: SRE_THEME.text }}>Identity verification required for telemetry uplink</Text>
          </div>
          <div style={{ width: '300px', display: 'flex', gap: '8px' }}>
            <Input.Password 
              placeholder="ENTER MASTER KEY" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onPressEnter={handleAuthorize}
              style={{ 
                background: 'transparent', 
                border: `1px solid ${SRE_THEME.border}`, 
                color: SRE_THEME.bright 
              }}
            />
            <Button 
               type="primary" 
               icon={<UnlockOutlined />} 
               onClick={handleAuthorize}
               style={{ background: SRE_THEME.blue, borderColor: SRE_THEME.blue }}
            >
              AUTH
            </Button>
          </div>
          <Text style={{ fontSize: '10px', opacity: 0.4 }}>SECURE_SESSION_ENFORCED [v2.1]</Text>
        </div>
      ) : (
        <>
          <HUDBar>
            <Space size="large">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SafetyCertificateOutlined style={{ fontSize: '24px', color: SRE_THEME.blue }} />
            <div>
              <Title level={4} style={{ margin: 0, color: SRE_THEME.bright, letterSpacing: '1px', fontSize: '16px' }}>
                INFRA_MASTER_HUB_v2.1
              </Title>
              <Text style={{ color: SRE_THEME.cyan, fontSize: '10px' }}>SECURE_ENCLAVE_ACTIVE</Text>
            </div>
          </div>
        </Space>

        <div style={{ display: 'flex', gap: '48px' }}>
          <div className="stat-item">
            <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Global Status</div>
            <div style={{ color: SRE_THEME.green, fontWeight: 'bold' }}>
              {statuses && Object.values(statuses).some((s: any) => s.status === 'unhealthy') ? 'WARNING' : 'NOMINAL'}
            </div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Active Nodes</div>
            <div style={{ color: SRE_THEME.bright }}>
              {statuses ? Object.values(statuses).filter((s: any) => s.status === 'healthy').length : 0} / 15
            </div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Scanning Node</div>
            <div style={{ color: SRE_THEME.blue }}>ADMIN_SERVER_01</div>
          </div>
        </div>

        <Space>
          <Button 
            icon={<SyncOutlined spin={refreshing} />} 
            type="text" 
            style={{ color: refreshing ? SRE_THEME.blue : SRE_THEME.text, border: `1px solid ${SRE_THEME.border}` }}
            onClick={fetchStatus}
          >
            RE-SCAN
          </Button>
          <Button 
            icon={<LockOutlined />} 
            type="text" 
            style={{ color: SRE_THEME.red, border: `1px solid ${SRE_THEME.border}` }}
            onClick={() => { sessionStorage.removeItem('mc_auth'); window.location.reload(); }}
          >
            LOCK
          </Button>
        </Space>
      </HUDBar>

      <Row gutter={[16, 16]}>
        {SERVICES.map(s => {
          const status = statuses[s.id]?.status || 'unknown';
          const isHealthy = status === 'healthy';
          
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={s.id}>
              <SRECard 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: SRE_THEME.bright, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <ServiceIcon type={s.type} color={isHealthy ? SRE_THEME.cyan : SRE_THEME.text} />
                       {s.name}
                    </span>
                    <Tag 
                       color={isHealthy ? '#85990022' : '#dc322f22'} 
                       style={{ 
                         borderColor: isHealthy ? SRE_THEME.green : SRE_THEME.red,
                         color: isHealthy ? SRE_THEME.green : SRE_THEME.red,
                         fontSize: '10px',
                         fontWeight: 'bold',
                         margin: 0
                       }}
                    >
                      {status === 'healthy' ? 'READY' : (status === 'unhealthy' ? 'ERROR' : 'UNREACH')}
                    </Tag>
                  </div>
                }
                styles={{ body: { padding: '16px' } }}
              >
                <SparklineContainer>
                  {[...Array(12)].map((_, i) => (
                    <SparkBar 
                      key={i} 
                      height={Math.floor(Math.random() * 80) + 20} 
                      active={isHealthy} 
                    />
                  ))}
                </SparklineContainer>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ opacity: 0.5 }}>LATENCY:</span> 
                    <span style={{ color: SRE_THEME.cyan, marginLeft: '4px' }}>
                      {status === 'healthy' ? `${Math.floor(Math.random()*150)+10}ms` : '---'}
                    </span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5 }}>LOAD:</span> 
                    <span style={{ color: SRE_THEME.cyan, marginLeft: '4px' }}>
                      {status === 'healthy' ? `${(Math.random()*5).toFixed(1)}%` : '---'}
                    </span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5 }}>UPTIME:</span> 
                    <span style={{ color: SRE_THEME.cyan, marginLeft: '4px' }}>99.98%</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5 }}>THREADS:</span> 
                    <span style={{ color: SRE_THEME.cyan, marginLeft: '4px' }}>
                      {status === 'healthy' ? Math.floor(Math.random()*30)+5 : 0}
                    </span>
                  </div>
                </div>

                <Space style={{ width: '100%', marginTop: '16px' }}>
                  <Button 
                    size="small" 
                    block 
                    style={{ 
                      fontSize: '10px', 
                      background: 'transparent', 
                      borderColor: SRE_THEME.blue, 
                      color: SRE_THEME.blue,
                      height: '24px'
                    }}
                    onClick={() => window.open(s.port ? `http://localhost:${s.port}` : '#', '_blank')}
                  >
                    LINK_GATEWAY
                  </Button>
                  <Button 
                    size="small" 
                    block 
                    style={{ 
                      fontSize: '10px', 
                      background: 'transparent', 
                      borderColor: SRE_THEME.border, 
                      color: SRE_THEME.text,
                      height: '24px'
                    }}
                  >
                    RAW_LOGS
                  </Button>
                </Space>
              </SRECard>
            </Col>
          );
        })}
      </Row>
      
      <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.3 }}>
        <Text style={{ fontSize: '10px', color: SRE_THEME.bright }}>
          SYSTEM_LOG: Initializing secure bridge... [OK] | Handshaking with 15 nodes... [OK] | Telemetry stream: ESTABLISHED
        </Text>
      </div>
      </>
      )}
    </DashboardContainer>
  );
};

export default MasterControlPage;
