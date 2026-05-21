import React, { useState, useEffect } from 'react'
import { Card, Typography, Input, Button, message, Tag, List, Space, Spin, Empty, Row, Col, Alert } from 'antd'
import { UserOutlined, LockOutlined, CalendarOutlined, DollarOutlined, CheckCircleOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { portalAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function ClientPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [lastName, setLastName] = useState('')
  const [code, setCode] = useState('')
  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('horarios')

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (token) {
      setIsLoggedIn(true)
      loadData(token)
    }
  }, [])

  const handleLogin = async () => {
    if (!nameInput || !lastName || !code) return message.warning('Completá todos los campos')
    setLoading(true)
    try {
      const res = await portalAPI.login(nameInput, lastName, code)
      localStorage.setItem('clientToken', res.data.token)
      setProfile(res.data.client)
      setIsLoggedIn(true)
      loadData(res.data.token)
      message.success(`Hola ${res.data.client.name}!`)
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (token) => {
    setDataLoading(true)
    const config = { headers: { Authorization: `Bearer ${token || localStorage.getItem('clientToken')}` } }
    try {
      const [profileRes, paymentsRes, classesRes, attendanceRes] = await Promise.all([
        portalAPI.getProfile(config),
        portalAPI.getPayments(config),
        portalAPI.getClasses(config),
        portalAPI.getAttendance(config)
      ])
      setProfile(profileRes.data)
      setPayments(paymentsRes.data)
      setClasses(classesRes.data)
      setAttendance(attendanceRes.data)
    } catch (error) {
      if (error.response?.status === 401) handleLogout()
    } finally {
      setDataLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('clientToken')
    setIsLoggedIn(false)
    setProfile(null)
  }

  const handleEnroll = async (classId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await portalAPI.enroll(classId, config)
      message.success('Te anotaste!')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error')
    }
  }

  const handleUnenroll = async (classId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await portalAPI.unenroll(classId, config)
      message.success('Te saliste del turno')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error')
    }
  }

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', padding: 16 }}>
        <Card style={{ width: '100%', maxWidth: 380, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: '#2a2a2a', border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/logobox.png" alt="FemmBox" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ff1493' }} />
            <Title level={3} style={{ color: '#ff1493', marginTop: 12, marginBottom: 4 }}>FEMMBOX</Title>
            <Text style={{ color: '#aaa' }}>Portal de Alumnas</Text>
          </div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Tu nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <Input size="large" prefix={<UserOutlined />} placeholder="Tu apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Tu código personal" value={code} onChange={(e) => setCode(e.target.value)} onPressEnter={handleLogin} />
            <Button type="primary" size="large" block onClick={handleLogin} loading={loading}>Entrar</Button>
          </Space>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12 }}>Tu código te lo da la recepción del gym</Text>
        </Card>
      </div>
    )
  }

  // PORTAL
  if (dataLoading && !profile) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const statusColor = profile?.status === 'active' ? 'green' : 'red'
  const statusText = profile?.status === 'active' ? 'Al día' : 'Vencida'
  const daysLeft = profile?.expirationDate ? dayjs(profile.expirationDate).diff(dayjs(), 'day') : 0

  // Días inscriptos
  const enrolledClasses = classes.filter(c => c.isEnrolled)
  const enrolledDaySet = new Set(enrolledClasses.map(c => c.dayOfWeek))
  const enrolledDays = enrolledDaySet.size

  // Plan actual según días inscriptos
  const getPlan = (days) => {
    if (days >= 3) return { label: 'Semana completa (L-M-V)', price: 35000 }
    if (days === 2) return { label: '2 veces por semana', price: 25000 }
    if (days === 1) return { label: '1 vez por semana', price: 25000 }
    return { label: 'Sin plan', price: 0 }
  }
  const currentPlan = getPlan(enrolledDays)

  // Detectar cambio de plan
  const previousPlan = getPlan(enrolledDays) // se actualiza en tiempo real al inscribirse

  // Sorteo
  const today = dayjs()
  const paidBeforeTen = payments.some(p => {
    const payDate = dayjs(p.paymentDate)
    return payDate.month() === today.month() && payDate.year() === today.year() && payDate.date() <= 10
  })

  const whatsappLink = `https://wa.me/5493388414420?text=${encodeURIComponent('Hola! Te envío mi comprobante de pago 🧾')}`

  // Clases agrupadas por día
  const classesByDay = {}
  classes.forEach(c => {
    const day = c.dayOfWeek || 'sin_dia'
    if (!classesByDay[day]) classesByDay[day] = []
    classesByDay[day].push(c)
  })

  const dayNames = { monday: 'Lunes', wednesday: 'Miércoles', friday: 'Viernes' }

  // Secciones del menú
  const sections = [
    { key: 'horarios', icon: <CalendarOutlined />, label: 'Horarios' },
    { key: 'pagos', icon: <DollarOutlined />, label: 'Pagos' },
    { key: 'asistencia', icon: <CheckCircleOutlined />, label: 'Asistencia' },
    { key: 'info', icon: <ClockCircleOutlined />, label: 'Info' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', padding: 12 }}>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 10, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={5} style={{ margin: 0, color: '#ff1493' }}>Hola {profile?.name}! 🥊</Title>
            <Text style={{ fontSize: 12, color: '#666' }}>{currentPlan.label} {currentPlan.price > 0 && `— $${currentPlan.price.toLocaleString()}`}</Text>
          </div>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger size="small" />
        </div>
      </Card>

      {/* Estado + Sorteo en grid */}
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}>
            <Tag color={statusColor} style={{ fontSize: 12 }}>Cuota: {statusText}</Tag>
            {profile?.status === 'active' && (
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#888' }}>Vence {dayjs(profile.expirationDate).format('DD/MM')}</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 10, textAlign: 'center', height: '100%', background: paidBeforeTen ? '#e8f5e9' : '#fff8e1' }}>
            <Text style={{ fontSize: 16 }}>🎉</Text>
            <br />
            <Text style={{ fontSize: 11, color: paidBeforeTen ? '#2e7d32' : '#f57f17' }}>
              {paidBeforeTen ? '¡En el sorteo!' : 'Pagá antes del 10'}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Navegación por secciones - cuadrícula */}
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        {sections.map(s => (
          <Col span={6} key={s.key}>
            <Card
              size="small"
              style={{
                borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                border: activeSection === s.key ? '2px solid #ff1493' : '1px solid #f0f0f0',
                background: activeSection === s.key ? '#1a1a1a' : '#fff'
              }}
              bodyStyle={{ padding: 8 }}
              onClick={() => setActiveSection(s.key)}
            >
              <div style={{ fontSize: 18 }}>{s.icon}</div>
              <Text style={{ fontSize: 10 }}>{s.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Contenido de la sección activa */}
      {activeSection === 'horarios' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>Mis Entrenamientos</Title>

          {/* Resumen: días y horarios inscriptos */}
          {enrolledClasses.length > 0 ? (
            <Card size="small" style={{ marginBottom: 12, background: '#2d2d2d', border: '1px solid #ff1493' }}>
              <Text strong style={{ color: '#ff1493', display: 'block', marginBottom: 6 }}>📋 Estoy inscripta en:</Text>
              {['monday', 'wednesday', 'friday'].map(day => {
                const myClasses = enrolledClasses.filter(c => c.dayOfWeek === day)
                if (myClasses.length === 0) return null
                return (
                  <div key={day} style={{ marginBottom: 4 }}>
                    <Text style={{ color: '#fff' }}>
                      <strong>{dayNames[day]}:</strong> {myClasses.map(c => `${c.startTime}-${c.endTime}`).join(', ')}
                    </Text>
                  </div>
                )
              })}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #444' }}>
                <Text style={{ color: '#fff' }}>
                  Plan: <strong>{currentPlan.label}</strong> — <strong style={{ color: '#ff1493' }}>${currentPlan.price.toLocaleString()}</strong>
                </Text>
              </div>
            </Card>
          ) : (
            <Alert message="Todavía no elegiste tus días. Seleccioná abajo en qué horarios querés entrenar." type="info" showIcon style={{ marginBottom: 12 }} />
          )}

          {/* Aviso de cambio de plan */}
          {enrolledDays === 1 && (
            <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="Si te anotás en otro día, tu plan pasa a 2 veces por semana ($25.000)" />
          )}
          {enrolledDays === 2 && (
            <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="Si te anotás en un día más, tu plan pasa a semana completa ($35.000). Diferencia: $10.000" />
          )}

          {/* Cuotas */}
          <div style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 6 }}>Planes disponibles:</Text>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Tag color={enrolledDays === 2 ? '#ff1493' : 'default'}>2x sem: $25.000</Tag>
              <Tag color={enrolledDays === 3 ? '#ff1493' : 'default'}>3x sem: $30.000</Tag>
              <Tag color={enrolledDays >= 3 ? '#ff1493' : 'default'}>L-M-V: $35.000</Tag>
            </div>
          </div>

          <Text strong style={{ color: '#ff1493', display: 'block', marginBottom: 8 }}>Elegí o cambiá tus días y horarios:</Text>

          {/* Días */}
          {['monday', 'wednesday', 'friday'].map(day => {
            const dayClasses = (classesByDay[day] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
            const isEnrolledInDay = enrolledClasses.some(c => c.dayOfWeek === day)

            return (
              <div key={day} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text strong style={{ color: '#ff1493', fontSize: 14 }}>{dayNames[day]}</Text>
                  {isEnrolledInDay && <Tag color="green" style={{ fontSize: 10 }}>✓ Inscripta</Tag>}
                </div>
                {dayClasses.length > 0 ? dayClasses.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                    background: item.isEnrolled ? '#1a3a1a' : '#2d2d2d',
                    border: item.isEnrolled ? '1px solid #52c41a' : '1px solid #444'
                  }}>
                    <div>
                      <Text style={{ fontSize: 14, color: '#fff' }}>{item.startTime} - {item.endTime}</Text>
                      <Text style={{ fontSize: 10, marginLeft: 8, color: '#888' }}>{item.enrolled}/{item.capacity}</Text>
                    </div>
                    {item.isEnrolled ? (
                      <Button size="small" danger onClick={() => handleUnenroll(item.id)}>Salir</Button>
                    ) : (
                      <Button size="small" type="primary" onClick={() => handleEnroll(item.id)}
                        disabled={item.enrolled >= item.capacity || profile?.status !== 'active'}>
                        Elegir
                      </Button>
                    )}
                  </div>
                )) : (
                  <Text style={{ fontSize: 12, color: '#666' }}>Sin turnos cargados para este día</Text>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {activeSection === 'pagos' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>Mis Pagos</Title>
          <List
            dataSource={payments}
            locale={{ emptyText: <Empty description="Sin pagos registrados" /> }}
            renderItem={(item) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div>
                  <Text strong>${item.amount}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.paymentDate).format('DD/MM/YYYY')}</Text>
                </div>
                <Tag color={item.status === 'paid' ? 'green' : 'orange'} style={{ height: 'fit-content' }}>
                  {item.status === 'paid' ? 'Pagado' : 'Pendiente'}
                </Tag>
              </div>
            )}
          />

          {/* Transferencia */}
          <div style={{ marginTop: 16, textAlign: 'center', padding: 12, background: '#1a3a1a', borderRadius: 8 }}>
            <Text strong style={{ color: '#2e7d32' }}>Alias: FEMMBOX93</Text>
            <br />
            <Button type="primary" size="small" style={{ marginTop: 8, background: '#25d366', borderColor: '#25d366' }} href={whatsappLink} target="_blank">
              📲 Enviar Comprobante
            </Button>
          </div>
        </Card>
      )}

      {activeSection === 'asistencia' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>Mi Asistencia</Title>
          <List
            dataSource={attendance}
            locale={{ emptyText: <Empty description="Sin asistencias" /> }}
            renderItem={(item) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <Text style={{ fontSize: 13 }}>{dayjs(item.date).format('DD/MM/YYYY')} — {item.Class?.name || 'Clase'}</Text>
                <CheckCircleOutlined style={{ color: 'green' }} />
              </div>
            )}
          />
        </Card>
      )}

      {activeSection === 'info' && (
        <div>
          {/* Sorteo */}
          <Card size="small" style={{ borderRadius: 12, marginBottom: 10, background: paidBeforeTen ? '#e8f5e9' : '#fff8e1' }}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 24 }}>🎉</Text>
              <Title level={5} style={{ margin: '4px 0', color: paidBeforeTen ? '#2e7d32' : '#f57f17' }}>Sorteo Mensual</Title>
              <Text style={{ fontSize: 13, color: paidBeforeTen ? '#2e7d32' : '#f57f17' }}>
                {paidBeforeTen ? '¡Estás participando! Pagaste antes del 10. Mucha suerte 🍀' : 'Pagá antes del día 10 y participás del sorteo de la profe. ¡No te lo pierdas!'}
              </Text>
            </div>
          </Card>

          {/* Boxeo */}
          <Card size="small" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #1a1a1a, #f8bbd0)' }}>
            <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>🥊 ¿Por qué entrenar boxeo?</Title>
            <Text style={{ fontSize: 12, color: '#ddd' }}>
              El boxeo mejora tu resistencia, tonifica todo el cuerpo, libera estrés y aumenta tu confianza. Cada sesión quemás entre 400 y 700 calorías. No importa tu nivel — acá crecemos juntas. 💪
            </Text>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ClientPortal
