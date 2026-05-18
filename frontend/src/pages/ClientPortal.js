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
  const [code, setCode] = useState('')
  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (token) {
      localStorage.setItem('token', token)
      setIsLoggedIn(true)
      loadData()
    }
  }, [])

  const handleLogin = async () => {
    if (!phone || !code) return message.warning('Completá teléfono y código')
    setLoading(true)
    try {
      const res = await portalAPI.login(phone, code)
      localStorage.setItem('clientToken', res.data.token)
      localStorage.setItem('token', res.data.token)
      setProfile(res.data.client)
      setIsLoggedIn(true)
      loadData()
      message.success(`Hola ${res.data.client.name}!`)
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    setDataLoading(true)
    try {
      const [profileRes, paymentsRes, classesRes, attendanceRes] = await Promise.all([
        portalAPI.getProfile(),
        portalAPI.getPayments(),
        portalAPI.getClasses(),
        portalAPI.getAttendance()
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
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setProfile(null)
  }

  const handleEnroll = async (classId) => {
    try {
      await portalAPI.enroll(classId)
      message.success('Te inscribiste!')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error')
    }
  }

  const handleUnenroll = async (classId) => {
    try {
      await portalAPI.unenroll(classId)
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
            <img src="/logobox.jpeg" alt="BoxFem" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e91e63' }} />
            <Title level={3} style={{ color: '#e91e63', marginTop: 12, marginBottom: 4 }}>BOXFEM</Title>
            <Text type="secondary">Portal de Alumnas</Text>
          </div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              size="large"
              prefix={<PhoneOutlined />}
              placeholder="Tu teléfono (ej: 3388431158)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

  const tabItems = [
    {
      key: 'classes',
      label: <span><CalendarOutlined /> Clases</span>,
      children: (
        <List
          dataSource={classes}
          locale={{ emptyText: <Empty description="No hay clases disponibles" /> }}
          renderItem={(item) => (
            <Card size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>{item.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayNames[item.dayOfWeek] || item.dayOfWeek} {item.startTime}-{item.endTime} | {item.instructor}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.enrolled}/{item.capacity} inscriptas
                  </Text>
                </div>
                <div>
                  {item.isEnrolled ? (
                    <Button size="small" danger onClick={() => handleUnenroll(item.id)}>Salir</Button>
                  ) : (
                    <Button size="small" type="primary" onClick={() => handleEnroll(item.id)}
                      disabled={item.enrolled >= item.capacity || profile?.status !== 'active'}>
                      Inscribirme
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        />
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

      {/* Tabs */}
      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} defaultActiveKey="classes" />
      </Card>
    </div>
  )
}

export default ClientPortal
