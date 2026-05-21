import React, { useState, useEffect } from 'react'
import { Card, Typography, Input, Button, message, Tag, List, Tabs, Space, Spin, Empty, Badge } from 'antd'
import { UserOutlined, PhoneOutlined, LockOutlined, CalendarOutlined, DollarOutlined, CheckCircleOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { portalAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function ClientPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [lastName, setLastName] = useState('')
  const [code, setCode] = useState('')
  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (token) {
      setIsLoggedIn(true)
      loadData(token)
    }
  }, [])

  const handleLogin = async () => {
    if (!phone || !lastName || !code) return message.warning('Completá todos los campos')
    setLoading(true)
    try {
      const res = await portalAPI.login(phone, lastName, code)
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
      if (error.response?.status === 401) {
        handleLogout()
      }
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
      message.success('Te inscribiste!')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error')
    }
  }

  const handleUnenroll = async (classId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await portalAPI.unenroll(classId, config)
      message.success('Te desinscribiste')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error')
    }
  }

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)',
        padding: 16
      }}>
        <Card style={{ width: '100%', maxWidth: 380, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/logobox.png" alt="FemmBox" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e91e63' }} />
            <Title level={3} style={{ color: '#e91e63', marginTop: 12, marginBottom: 4 }}>FEMMBOX</Title>
            <Text type="secondary">Portal de Alumnas</Text>
          </div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Tu nombre"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Tu apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Tu código personal"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onPressEnter={handleLogin}
            />
            <Button type="primary" size="large" block onClick={handleLogin} loading={loading}>
              Entrar
            </Button>
          </Space>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
            Tu código te lo da la recepción del gym
          </Text>
        </Card>
      </div>
    )
  }

  // PORTAL
  if (dataLoading && !profile) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const statusColor = profile?.status === 'active' ? 'green' : 'red'
  const statusText = profile?.status === 'active' ? 'Al día' : 'Vencida'
  const daysLeft = profile?.expirationDate ? dayjs(profile.expirationDate).diff(dayjs(), 'day') : 0

  const dayNames = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' }

  // Precios por cantidad de días
  const pricing = [
    { days: 1, price: 15000 },
    { days: 2, price: 22000 },
    { days: 3, price: 28000 },
    { days: 4, price: 33000 },
    { days: 5, price: 37000 }
  ]

  // Clases agrupadas por día
  const classesByDay = {}
  classes.forEach(c => {
    const day = c.dayOfWeek || 'sin_dia'
    if (!classesByDay[day]) classesByDay[day] = []
    classesByDay[day].push(c)
  })

  // Contar en cuántos días está inscripta
  const enrolledDays = new Set(classes.filter(c => c.isEnrolled).map(c => c.dayOfWeek)).size

  // Verificar si pagó antes del 10 (para el sorteo)
  const today = dayjs()
  const paidBeforeTen = payments.some(p => {
    const payDate = dayjs(p.paymentDate)
    return payDate.month() === today.month() && payDate.year() === today.year() && payDate.date() <= 10
  })

  const tabItems = [
    {
      key: 'classes',
      label: <span><CalendarOutlined /> Clases</span>,
      children: (
        <div>
          {/* Precios */}
          <Card size="small" style={{ marginBottom: 12, background: '#f0f5ff' }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>💰 Precios por frecuencia:</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pricing.map(p => (
                <Tag key={p.days} color={enrolledDays === p.days ? 'green' : 'default'} style={{ fontSize: 12 }}>
                  {p.days}x sem: ${p.price.toLocaleString()}
                </Tag>
              ))}
            </div>
            {enrolledDays > 0 && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                Estás inscripta en {enrolledDays} día{enrolledDays > 1 ? 's' : ''} por semana
              </Text>
            )}
          </Card>

          {/* Clases por día */}
          {Object.keys(dayNames).map(day => {
            const dayClasses = classesByDay[day]
            if (!dayClasses || dayClasses.length === 0) return null
            return (
              <div key={day} style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: '#e91e63' }}>{dayNames[day]}</Text>
                {dayClasses.map(item => (
                  <Card size="small" key={item.id} style={{ marginTop: 4, marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text>{item.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.startTime}-{item.endTime} | {item.instructor} | {item.enrolled}/{item.capacity}
                        </Text>
                      </div>
                      <div>
                        {item.isEnrolled ? (
                          <Button size="small" danger onClick={() => handleUnenroll(item.id)}>Salir</Button>
                        ) : (
                          <Button size="small" type="primary" onClick={() => handleEnroll(item.id)}
                            disabled={item.enrolled >= item.capacity || profile?.status !== 'active'}>
                            Anotarme
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          })}

          {classes.length === 0 && <Empty description="No hay clases disponibles" />}
        </div>
      )
    },
    {
      key: 'payments',
      label: <span><DollarOutlined /> Pagos</span>,
      children: (
        <List
          dataSource={payments}
          locale={{ emptyText: <Empty description="Sin pagos registrados" /> }}
          renderItem={(item) => (
            <Card size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>${item.amount}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.paymentDate).format('DD/MM/YYYY')} - {item.paymentMethod}
                  </Text>
                </div>
                <Tag color={item.status === 'paid' ? 'green' : 'orange'}>
                  {item.status === 'paid' ? 'Pagado' : 'Pendiente'}
                </Tag>
              </div>
            </Card>
          )}
        />
      )
    },
    {
      key: 'attendance',
      label: <span><CheckCircleOutlined /> Asistencia</span>,
      children: (
        <List
          dataSource={attendance}
          locale={{ emptyText: <Empty description="Sin asistencias" /> }}
          renderItem={(item) => (
            <Card size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text>{dayjs(item.date).format('DD/MM/YYYY')}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.Class?.name || 'Clase general'} - {dayjs(item.checkInTime).format('HH:mm')}hs
                  </Text>
                </div>
                <CheckCircleOutlined style={{ color: 'green', fontSize: 18 }} />
              </div>
            </Card>
          )}
        />
      )
    }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fce4ec', padding: 16 }}>
      {/* Header */}
      <Card style={{ marginBottom: 12, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#e91e63' }}>
              Hola {profile?.name}! 🥊
            </Title>
            <Text type="secondary">{profile?.planName || 'Sin plan'}</Text>
          </div>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger />
        </div>
      </Card>

      {/* Estado de cuota */}
      <Card style={{ marginBottom: 12, borderRadius: 12, textAlign: 'center' }}>
        <Tag color={statusColor} style={{ fontSize: 14, padding: '4px 16px' }}>
          Cuota: {statusText}
        </Tag>
        {profile?.status === 'active' && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              <ClockCircleOutlined /> Vence el {dayjs(profile.expirationDate).format('DD/MM/YYYY')}
              {daysLeft <= 5 && daysLeft > 0 && <Text type="warning"> ({daysLeft} días)</Text>}
            </Text>
          </div>
        )}
        {profile?.status === 'expired' && (
          <div style={{ marginTop: 8 }}>
            <Text type="danger">Acercate a renovar para seguir entrenando</Text>
          </div>
        )}
      </Card>

      {/* Sorteo mensual */}
      <Card style={{ marginBottom: 12, borderRadius: 12, background: paidBeforeTen ? '#e8f5e9' : '#fff8e1', border: paidBeforeTen ? '1px solid #a5d6a7' : '1px solid #ffe082' }}>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: 20 }}>🎉</Text>
          <Title level={5} style={{ margin: '4px 0', color: paidBeforeTen ? '#2e7d32' : '#f57f17' }}>
            Sorteo Mensual
          </Title>
          {paidBeforeTen ? (
            <Text style={{ color: '#2e7d32', fontSize: 13 }}>
              <strong>¡Estás participando!</strong> Pagaste antes del 10, ya estás en el sorteo de este mes. ¡Mucha suerte! 🍀
            </Text>
          ) : (
            <Text style={{ color: '#f57f17', fontSize: 13 }}>
              Pagá tu cuota antes del <strong>día 10</strong> y participás del sorteo mensual que realiza la profe. ¡No te lo pierdas!
            </Text>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} defaultActiveKey="classes" />
      </Card>

      {/* Recordatorio de pagos */}
      <Card style={{ marginTop: 12, borderRadius: 12, background: '#fff3e0', border: '1px solid #ffe0b2' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <DollarOutlined style={{ fontSize: 24, color: '#f57c00', marginTop: 2 }} />
          <div>
            <Text strong style={{ color: '#e65100' }}>Recordá mantener tu cuota al día</Text>
            <br />
            <Text style={{ fontSize: 13, color: '#bf360c' }}>
              Abonando antes del día 10 evitás el recargo del 10%. Podés pagar en efectivo, transferencia o MercadoPago.
            </Text>
          </div>
        </div>
      </Card>

      {/* Info sobre boxeo */}
      <Card style={{ marginTop: 12, borderRadius: 12, background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
        <Title level={5} style={{ color: '#c2185b', marginBottom: 8 }}>🥊 ¿Por qué entrenar boxeo?</Title>
        <Text style={{ fontSize: 13, color: '#4a148c' }}>
          El boxeo es uno de los entrenamientos más completos que existen. Mejora tu resistencia cardiovascular, 
          tonifica todo el cuerpo, libera estrés y aumenta tu confianza. Cada sesión quemás entre 400 y 700 calorías 
          mientras desarrollás coordinación, reflejos y fuerza mental. No importa tu nivel — acá crecemos juntas. 💪
        </Text>
      </Card>
    </div>
  )
}

export default ClientPortal
