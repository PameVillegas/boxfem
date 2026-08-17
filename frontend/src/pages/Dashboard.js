import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Typography, Spin, List, Tag, Button, message, Input } from 'antd'
import { 
  UserOutlined, DollarOutlined, WarningOutlined, CheckCircleOutlined, 
  BellOutlined, CloseCircleOutlined, CalendarOutlined, FireOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { dashboardAPI, alertsAPI, phrasesAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const { Text } = Typography

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#1e1e22',
  transition: 'all 0.25s ease',
  overflow: 'hidden'
}

const cardHoverStyle = {
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)'
}

const miniCardStyle = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#1e1e22',
  transition: 'all 0.25s ease',
  overflow: 'hidden'
}

function StatCard({ icon, iconBg, value, label, sub, onClick, valueColor }) {
  const [hover, setHover] = useState(false)
  return (
    <Card
      hoverable
      bodyStyle={{ padding: 0 }}
      style={{ ...cardStyle, ...(hover ? cardHoverStyle : {}), cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div style={{ padding: '20px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: iconBg || 'rgba(255,20,147,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: iconBg ? '#fff' : '#ff1493'
          }}>
            {icon}
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: valueColor || '#fff', lineHeight: 1, marginBottom: 4 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{sub}</div>}
      </div>
    </Card>
  )
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [phrase, setPhrase] = useState('')
  const [savedPhrase, setSavedPhrase] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, alertsRes, phraseRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertsAPI.getAll(),
        phrasesAPI.getToday()
      ])
      setStats(statsRes.data)
      setAlerts(alertsRes.data)
      if (phraseRes.data.phrase) {
        setSavedPhrase(phraseRes.data.phrase)
        setPhrase(phraseRes.data.phrase)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (id) => {
    try {
      await alertsAPI.resolve(id)
      setAlerts(alerts.filter(a => a.id !== id))
      message.success('Alerta resuelta')
    } catch (error) {
      message.error('Error')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" />
    </div>
  )

  const totalClients = stats?.totalClients || 0
  const activeClients = stats?.activeClients || 0
  const expiredClients = stats?.expiredClients || 0
  const todayAttendance = stats?.todayAttendance || 0
  const attendancePct = totalClients > 0 ? Math.round((todayAttendance / totalClients) * 100) : 0
  const activePct = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0
  const chartData = stats?.popularClasses?.map(c => ({ name: c.name, value: c.enrolledCount })) || []
  const totalReservas = chartData.reduce((sum, d) => sum + d.value, 0)

  const getGreeting = () => {
    const h = dayjs().hour()
    if (h < 12) return 'Buenos dias'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#282830', border: '1px solid #333', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>{label}</div>
        <div style={{ color: '#ff1493', marginTop: 2 }}>{payload[0].value} alumnas</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>

      {/* Header: greeting + date + bell */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <Text style={{ fontSize: 26, fontWeight: 700, color: '#fff', display: 'block', lineHeight: 1.2 }}>
            {getGreeting()}, Profe 👋
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 4, display: 'block' }}>
            Este es el resumen de FemmBox de hoy.
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <Text style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            {dayjs().format('dddd D [de] MMMM')}
          </Text>
          <div style={{ position: 'relative' }}>
            <BellOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
            {alerts.length > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                borderRadius: '50%', background: '#ff4d4f', fontSize: 10,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}>
                {alerts.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<UserOutlined />}
            iconBg="rgba(255,20,147,0.15)"
            value={totalClients}
            label="Clientes"
            sub={`${activeClients} activos`}
            onClick={() => navigate('/clients')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            iconBg="rgba(82,196,26,0.15)"
            value={activeClients}
            label="Activas"
            sub={`${activePct}% del total`}
            valueColor="#73d13d"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<WarningOutlined />}
            iconBg="rgba(255,77,79,0.15)"
            value={expiredClients}
            label="Vencidas"
            sub="Requieren atencion"
            valueColor="#ff7875"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<DollarOutlined />}
            iconBg="rgba(255,20,147,0.15)"
            value={`$${(stats?.monthlyIncome || 0).toLocaleString('es-AR')}`}
            label="Ingresos"
            sub="Este mes"
          />
        </Col>
      </Row>

      {/* Attendance + Popular Classes */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}>
          <Card bodyStyle={{ padding: 0 }} style={cardStyle}>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,20,147,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleOutlined style={{ color: '#ff1493', fontSize: 16 }} />
                </div>
                <Text style={{ fontSize: 15, fontWeight: 600, color: '#ddd' }}>Asistencia de hoy</Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{todayAttendance}</span>
                <span style={{ fontSize: 20, color: '#555', fontWeight: 400 }}>/ {totalClients}</span>
              </div>
              <Text style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 18 }}>
                alumnas asistieron hoy
              </Text>

              <div style={{ background: '#2a2a2e', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${attendancePct}%`,
                  borderRadius: 8,
                  background: attendancePct > 50
                    ? 'linear-gradient(90deg, #ff1493, #ff69b4)'
                    : attendancePct > 20
                      ? 'linear-gradient(90deg, #faad14, #ffc53d)'
                      : 'linear-gradient(90deg, #ff4d4f, #ff7875)',
                  transition: 'width 0.8s ease'
                }} />
              </div>
              <Text style={{ fontSize: 12, color: '#555', display: 'block', marginTop: 6 }}>
                {attendancePct}% de asistencia
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card bodyStyle={{ padding: 0 }} style={cardStyle}>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,20,147,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrophyOutlined style={{ color: '#ff1493', fontSize: 16 }} />
                </div>
                <Text style={{ fontSize: 15, fontWeight: 600, color: '#ddd' }}>Clases populares</Text>
              </div>

              {chartData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#999' }}
                        width={90}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#ff1493' : i === 1 ? '#ff69b4' : 'rgba(255,20,147,0.45)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#555' }}>Total de reservas este mes</Text>
                    <Text style={{ fontSize: 14, fontWeight: 700, color: '#ff1493' }}>{totalReservas}</Text>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#555' }}>Sin datos de clases</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Frase */}
      <Card bodyStyle={{ padding: 0 }} style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <Text style={{ fontSize: 15, fontWeight: 600, color: '#ddd' }}>Frase para tus alumnas</Text>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <Input.TextArea
              rows={2}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Escribi una frase motivacional..."
              style={{
                flex: 1,
                borderRadius: 12,
                background: '#161618',
                border: '1px solid #2a2a2e',
                resize: 'none',
                fontSize: 14
              }}
            />
            <Button
              type="primary"
              onClick={async () => { 
                try { 
                  await phrasesAPI.create(phrase)
                  setSavedPhrase(phrase)
                  message.success('Frase guardada!')
                } catch(e) { 
                  message.error('Error') 
                }
              }}
              style={{
                height: 'auto',
                borderRadius: 12,
                fontWeight: 600,
                padding: '0 20px',
                minWidth: 110
              }}
            >
              Guardar ←
            </Button>
          </div>
          {savedPhrase && (
            <div style={{
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(255,20,147,0.06)',
              border: '1px solid rgba(255,20,147,0.1)'
            }}>
              <Text style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Preview</Text>
              <Text style={{ fontSize: 14, color: '#ff69b4', fontStyle: 'italic' }}>
                ✨ "{savedPhrase}"
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Bottom mini modules */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 0 }} style={miniCardStyle}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,20,147,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarOutlined style={{ color: '#ff1493', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 13, color: '#888' }}>Proxima clase</Text>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>—</div>
              <div style={{ fontSize: 12, color: '#555' }}>Sin clases programadas</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 0 }} style={miniCardStyle}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(250,173,20,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarOutlined style={{ color: '#faad14', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 13, color: '#888' }}>Pagos pendientes</Text>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{expiredClients}</div>
              <div style={{ fontSize: 12, color: '#555' }}>alumnas con pago vencido</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: 0 }} style={miniCardStyle}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,77,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FireOutlined style={{ color: '#ff7875', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 13, color: '#888' }}>Racha de asistencia</Text>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>—</div>
              <div style={{ fontSize: 12, color: '#555' }}>datos no disponibles</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card bodyStyle={{ padding: 0 }} style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,77,79,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BellOutlined style={{ color: '#ff7875', fontSize: 16 }} />
              </div>
              <Text style={{ fontSize: 15, fontWeight: 600, color: '#ddd' }}>Alertas y recordatorios</Text>
              <Tag color="red" style={{ marginLeft: 6, borderRadius: 8, fontSize: 12, lineHeight: '18px' }}>{alerts.length}</Tag>
            </div>
            <List
              dataSource={alerts}
              renderItem={(item) => (
                <List.Item
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0' }}
                  actions={[
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseCircleOutlined />}
                      onClick={() => resolveAlert(item.id)}
                      style={{ color: '#666' }}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Tag color={item.type === 'surcharge' ? 'red' : item.type === 'expiration' ? 'orange' : 'blue'} style={{ borderRadius: 6, margin: 0 }}>
                        {item.type === 'surcharge' ? 'Recargo' : item.type === 'expiration' ? 'Vencimiento' : 'Recordatorio'}
                      </Tag>
                    }
                    title={
                      <Text style={{ fontSize: 14, fontWeight: 500, color: '#ddd' }}>
                        {item.Client ? `${item.Client.name} ${item.Client.lastName}` : 'Cliente'}
                      </Text>
                    }
                    description={<Text style={{ fontSize: 13, color: '#777' }}>{item.message}</Text>}
                  />
                </List.Item>
              )}
            />
          </div>
        </Card>
      )}
    </div>
  )
}

export default Dashboard
