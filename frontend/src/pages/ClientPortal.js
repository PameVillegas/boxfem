import React, { useState, useEffect } from 'react'
import { Card, Typography, Input, Button, message, Tag, List, Space, Spin, Empty, Row, Col, Alert } from 'antd'
import { UserOutlined, LockOutlined, CalendarOutlined, DollarOutlined, CheckCircleOutlined, LogoutOutlined, ClockCircleOutlined, EnvironmentOutlined, InstagramOutlined } from '@ant-design/icons'
import { portalAPI, phrasesAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
    {children}
  </motion.div>
)

const SectionAnim = ({ children }) => (
  <AnimatePresence mode="wait">
    <motion.div key={Math.random()} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  </AnimatePresence>
)

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
  const [showEditTurnos, setShowEditTurnos] = useState(false)
  const [activeSection, setActiveSection] = useState('horarios')
  const [dailyPhrase, setDailyPhrase] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (token) { setIsLoggedIn(true); loadData(token) }
    loadPhrase()
  }, [])

  const loadPhrase = async () => {
    try { const res = await phrasesAPI.getToday(); setDailyPhrase(res.data.phrase || '') } catch(e) {}
  }

  const handleLogin = async () => {
    if (!nameInput || !lastName || !code) return message.warning('Completa todos los campos')
    setLoading(true)
    try {
      const res = await portalAPI.login(nameInput, lastName, code)
      localStorage.setItem('clientToken', res.data.token)
      setProfile(res.data.client)
      setIsLoggedIn(true)
      loadData(res.data.token)
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al iniciar sesion')
    } finally { setLoading(false) }
  }

  const loadData = async (token) => {
    setDataLoading(true)
    const config = { headers: { Authorization: `Bearer ${token || localStorage.getItem('clientToken')}` } }
    try {
      const [profileRes, paymentsRes, classesRes, attendanceRes] = await Promise.all([
        portalAPI.getProfile(config), portalAPI.getPayments(config),
        portalAPI.getClasses(config), portalAPI.getAttendance(config)
      ])
      setProfile(profileRes.data); setPayments(paymentsRes.data)
      setClasses(classesRes.data); setAttendance(attendanceRes.data)
    } catch (error) { if (error.response?.status === 401) handleLogout() }
    finally { setDataLoading(false) }
  }

  const handleLogout = () => { localStorage.removeItem('clientToken'); setIsLoggedIn(false); setProfile(null) }

  const handleEnroll = async (classId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await portalAPI.enroll(classId, config); message.success('Te anotaste!'); loadData()
    } catch (error) { message.error(error.response?.data?.error || 'Error') }
  }

  const handleUnenroll = async (classId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await portalAPI.unenroll(classId, config); message.success('Te saliste del turno'); loadData()
    } catch (error) { message.error(error.response?.data?.error || 'Error') }
  }

  // Fecha de hoy formateada
  const todayFormatted = dayjs().format('dddd DD [de] MMMM, YYYY')
  const todayDayName = dayjs().format('dddd').toLowerCase()
  const dayMap = { lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday', sabado: 'saturday', domingo: 'sunday' }

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', padding: 16 }}>
        <Card style={{ width: '100%', maxWidth: 380, borderRadius: 16, background: '#2a2a2a', border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>{todayFormatted}</Text>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/logobox.png" alt="FemmBox" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ff1493' }} />
            <Title level={3} style={{ color: '#ff1493', marginTop: 12, marginBottom: 4 }}>FEMMBOX</Title>
            <Text style={{ color: '#aaa' }}>Portal de Alumnas</Text>
          </div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Tu nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <Input size="large" prefix={<UserOutlined />} placeholder="Tu apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Tu codigo personal" value={code} onChange={(e) => setCode(e.target.value)} onPressEnter={handleLogin} />
            <Button type="primary" size="large" block onClick={handleLogin} loading={loading}>Entrar</Button>
          </Space>
          <Text style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12, color: '#888' }}>Tu codigo te lo da la recepcion del gym</Text>
        </Card>
      </div>
    )
  }

  if (dataLoading && !profile) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const statusColor = profile?.status === 'active' ? 'green' : 'red'
  const statusText = profile?.status === 'active' ? 'Al dia' : 'Vencida'
  const enrolledClasses = classes.filter(c => c.isEnrolled)
  const enrolledDays = new Set(enrolledClasses.map(c => c.dayOfWeek)).size
  const getPlan = (days) => {
    if (days >= 3) return { label: 'Semana completa (L-M-V)', price: 35000 }
    if (days === 2) return { label: '2 veces por semana', price: 25000 }
    if (days === 1) return { label: '1 vez por semana', price: 25000 }
    return { label: 'Sin plan', price: 0 }
  }
  const currentPlan = getPlan(enrolledDays)
  const today = dayjs()
  const paidBeforeTen = payments.some(p => {
    const d = dayjs(p.paymentDate)
    return d.month() === today.month() && d.year() === today.year() && d.date() <= 10
  })
  const whatsappLink = `https://wa.me/5493388414420?text=${encodeURIComponent('Hola! Te envio mi comprobante de pago')}`
  const classesByDay = {}
  classes.forEach(c => { const day = c.dayOfWeek || 'x'; if (!classesByDay[day]) classesByDay[day] = []; classesByDay[day].push(c) })
  const dayNames = { monday: 'Lunes', wednesday: 'Miercoles', friday: 'Viernes' }

  // Verificar si hoy tiene turno
  const todayEnglish = dayMap[todayDayName] || ''
  const hasClassToday = enrolledClasses.some(c => c.dayOfWeek === todayEnglish)

  const sections = [
    { key: 'horarios', icon: <CalendarOutlined />, label: 'Horarios' },
    { key: 'pagos', icon: <DollarOutlined />, label: 'Pagos' },
    { key: 'asistencia', icon: <CheckCircleOutlined />, label: 'Asistencia' },
    { key: 'profe', icon: <UserOutlined />, label: 'Profe' },
    { key: 'ubicacion', icon: <EnvironmentOutlined />, label: 'Ubicacion' },
    { key: 'info', icon: <ClockCircleOutlined />, label: 'Info' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', padding: 12 }}>

      {/* Fecha de hoy */}
      <FadeIn>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#888', fontSize: 12 }}>{todayFormatted}</Text>
      </div>
      </FadeIn>

      {/* Aviso si hoy tiene turno */}
      {hasClassToday && (
        <Card size="small" style={{ marginBottom: 10, borderRadius: 10, background: '#1a3a1a', border: '1px solid #52c41a', textAlign: 'center' }}>
          <Text style={{ color: '#52c41a', fontSize: 14 }}>🥊 <strong>Hoy es dia de entrenamiento!</strong></Text>
        </Card>
      )}

      {/* Frase del dia */}
      {dailyPhrase && (
        <Card size="small" style={{ marginBottom: 10, borderRadius: 10, background: '#2d2d2d', border: '1px solid #ff1493', textAlign: 'center' }}>
          <Text style={{ color: '#ff1493', fontSize: 13, fontStyle: 'italic' }}>"{dailyPhrase}"</Text>
        </Card>
      )}

      {/* Header con logo */}
      <Card size="small" style={{ marginBottom: 10, borderRadius: 12, padding: '12px 0', border: '1px solid #ff1493' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logobox.png" alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff1493' }} />
            <div>
              <Title level={4} style={{ margin: 0, color: '#ff1493' }}>Hola {profile?.name}!</Title>
              <Text style={{ fontSize: 14, color: '#ff1493' }}>Bienvenida a Femmbox</Text>
            </div>
          </div>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger size="small" />
        </div>
      </Card>

      {/* Estado + Sorteo */}
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}>
            <Tag color={statusColor} style={{ fontSize: 12 }}>Cuota: {statusText}</Tag>
            {profile?.status === 'active' && <div style={{ marginTop: 4 }}><Text style={{ fontSize: 11, color: '#888' }}>Vence {dayjs(profile.expirationDate).format('DD/MM')}</Text></div>}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 10, textAlign: 'center', height: '100%', background: paidBeforeTen ? '#1a3a1a' : '#3a3000', border: paidBeforeTen ? '1px solid #52c41a' : '1px solid #d4a017' }}>
            <Text style={{ fontSize: 18 }}>🎁</Text>
            <br />
            <Text style={{ fontSize: 11, color: paidBeforeTen ? '#52c41a' : '#d4a017' }}>{paidBeforeTen ? 'En el sorteo!' : 'Paga antes del 10'}</Text>
          </Card>
        </Col>
      </Row>

      {/* Navegacion */}
      <Row gutter={[6, 6]} style={{ marginBottom: 10 }}>
        {sections.map(s => (
          <Col span={8} key={s.key}>
            <Card size="small" style={{ borderRadius: 10, textAlign: 'center', cursor: 'pointer', border: activeSection === s.key ? '2px solid #ff1493' : '1px solid #444', background: activeSection === s.key ? '#3a1a2a' : '#2d2d2d' }} bodyStyle={{ padding: 8 }} onClick={() => setActiveSection(s.key)}>
              <div style={{ fontSize: 18, color: activeSection === s.key ? '#ff1493' : '#ccc' }}>{s.icon}</div>
              <Text style={{ fontSize: 10, color: activeSection === s.key ? '#ff1493' : '#ccc' }}>{s.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <AnimatePresence mode="wait">
      <motion.div key={activeSection} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>

      {/* HORARIOS */}
      {activeSection === 'horarios' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>Mis Entrenamientos</Title>
          {enrolledClasses.length > 0 ? (
            <div>
              <Card size="small" style={{ marginBottom: 12, background: '#2d2d2d', border: '1px solid #ff1493' }}>
                <Text strong style={{ color: '#ff1493', display: 'block', marginBottom: 6 }}>Estoy inscripta en:</Text>
                {['monday', 'wednesday', 'friday'].map(day => {
                  const my = enrolledClasses.filter(c => c.dayOfWeek === day)
                  if (my.length === 0) return null
                  return <div key={day} style={{ marginBottom: 4 }}><Text style={{ color: '#fff' }}><strong>{dayNames[day]}:</strong> {my.map(c => c.startTime + '-' + c.endTime).join(', ')}</Text></div>
                })}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #444' }}>
                  <Text style={{ color: '#fff' }}>Plan: <strong>{currentPlan.label}</strong> — <strong style={{ color: '#ff1493' }}>${currentPlan.price.toLocaleString()}</strong></Text>
                </div>
              </Card>
              <Button type="primary" block onClick={() => setShowEditTurnos(!showEditTurnos)} style={{ marginBottom: 12 }}>
                {showEditTurnos ? 'Ocultar horarios' : 'Editar turno'}
              </Button>
            </div>
          ) : (
            <div>
              <Alert message="Todavia no elegiste tus dias. Selecciona abajo en que horarios queres entrenar." type="info" showIcon style={{ marginBottom: 12 }} />
              <Button type="primary" block onClick={() => setShowEditTurnos(true)} style={{ marginBottom: 12 }}>Elegir dias y horarios</Button>
            </div>
          )}

          {/* Editor de turnos (oculto hasta que aprieta el boton) */}
          {showEditTurnos && (
            <div>
              {enrolledDays === 1 && <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="Si te anotas en otro dia, tu plan pasa a 2 veces por semana ($25.000)" />}
              {enrolledDays === 2 && <Alert style={{ marginBottom: 12 }} type="warning" showIcon message="Si te anotas en un dia mas, tu plan pasa a semana completa ($35.000). Diferencia: $10.000" />}
              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 6 }}>Planes:</Text>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag color={enrolledDays === 2 ? '#ff1493' : 'default'}>2x sem: $25.000</Tag>
                  <Tag color={enrolledDays === 3 ? '#ff1493' : 'default'}>3x sem: $30.000</Tag>
                  <Tag color={enrolledDays >= 3 ? '#ff1493' : 'default'}>L-M-V: $35.000</Tag>
                </div>
              </div>
              <Text strong style={{ color: '#ff1493', display: 'block', marginBottom: 8 }}>Dias y horarios disponibles:</Text>
              {['monday', 'wednesday', 'friday'].map(day => {
                const dayClasses = (classesByDay[day] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
                const isIn = enrolledClasses.some(c => c.dayOfWeek === day)
                return (
                  <div key={day} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text strong style={{ color: '#ff1493', fontSize: 14 }}>{dayNames[day]}</Text>
                      {isIn && <Tag color="green" style={{ fontSize: 10 }}>Inscripta</Tag>}
                    </div>
                    {dayClasses.length > 0 ? dayClasses.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: item.isEnrolled ? '#1a3a1a' : '#2d2d2d', border: item.isEnrolled ? '1px solid #52c41a' : '1px solid #444' }}>
                        <div><Text style={{ fontSize: 14, color: '#fff' }}>{item.startTime} - {item.endTime}</Text><Text style={{ fontSize: 10, marginLeft: 8, color: '#888' }}>{item.enrolled}/{item.capacity}</Text></div>
                        {item.isEnrolled ? <Button size="small" danger onClick={() => handleUnenroll(item.id)}>Salir</Button> : <Button size="small" type="primary" onClick={() => handleEnroll(item.id)} disabled={item.enrolled >= item.capacity || profile?.status !== 'active'}>Elegir</Button>}
                      </div>
                    )) : <Text style={{ fontSize: 12, color: '#666' }}>Sin turnos cargados</Text>}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* PAGOS */}
      {activeSection === 'pagos' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>Mis Pagos</Title>
          <List dataSource={payments} locale={{ emptyText: <Empty description="Sin pagos registrados" /> }} renderItem={(item) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
              <div><Text strong>${item.amount}</Text><br /><Text style={{ fontSize: 11, color: '#888' }}>{dayjs(item.paymentDate).format('DD/MM/YYYY')}</Text></div>
              <Tag color={item.status === 'paid' ? 'green' : 'orange'}>{item.status === 'paid' ? 'Pagado' : 'Pendiente'}</Tag>
            </div>
          )} />
          <div style={{ marginTop: 16, textAlign: 'center', padding: 12, background: '#1a3a1a', borderRadius: 8 }}>
            <Text strong style={{ color: '#52c41a' }}>Alias: FEMMBOX93</Text><br />
            <Button type="primary" size="small" style={{ marginTop: 8, background: '#25d366', borderColor: '#25d366' }} href={whatsappLink} target="_blank">Enviar Comprobante</Button>
          </div>
        </Card>
      )}

      {/* ASISTENCIA */}
      {activeSection === 'asistencia' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 8 }}>Mi Asistencia</Title>
          <List dataSource={attendance} locale={{ emptyText: <Empty description="Sin asistencias" /> }} renderItem={(item) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
              <Text style={{ fontSize: 13 }}>{dayjs(item.date).format('DD/MM/YYYY')} - {item.Class?.name || 'Clase'}</Text>
              <CheckCircleOutlined style={{ color: 'green' }} />
            </div>
          )} />
        </Card>
      )}

      {/* UBICACION */}
      {activeSection === 'ubicacion' && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Title level={5} style={{ color: '#ff1493', marginBottom: 12, textAlign: 'center' }}><EnvironmentOutlined /> Donde estamos</Title>
          <Card size="small" style={{ background: '#2d2d2d', border: '1px solid #444', textAlign: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 20 }}>📍</Text>
            <br />
            <Text style={{ color: '#fff', fontSize: 16, display: 'block', marginTop: 8 }}>Calle 5 entre 26 y 28</Text>
            <Text style={{ color: '#aaa', fontSize: 13 }}>Florentino Ameghino, Buenos Aires</Text>
          </Card>
          <Card size="small" style={{ background: '#2d2d2d', border: '1px solid #444', marginBottom: 12 }}>
            <Text strong style={{ color: '#ff1493', display: 'block', marginBottom: 8 }}>Horarios de atencion:</Text>
            <Text style={{ color: '#ccc', fontSize: 13 }}>Lunes, Miercoles y Viernes</Text>
            <br />
            <Text style={{ color: '#aaa', fontSize: 12 }}>Maniana: 8:00 - 10:00 hs</Text>
            <br />
            <Text style={{ color: '#aaa', fontSize: 12 }}>Tarde: 14:00 - 16:00 hs</Text>
            <br />
            <Text style={{ color: '#aaa', fontSize: 12 }}>Noche: 19:00 - 21:00 hs</Text>
          </Card>
          <Card size="small" style={{ background: '#2d2d2d', border: '1px solid #444', textAlign: 'center' }}>
            <Text strong style={{ color: '#ff1493', display: 'block', marginBottom: 8 }}>Contacto</Text>
            <Button type="primary" size="small" style={{ background: '#25d366', borderColor: '#25d366' }} href="https://wa.me/5493388414420" target="_blank">
              WhatsApp: 3388414420
            </Button>
          </Card>
        </Card>
      )}

      {/* PROFE */}
      {activeSection === 'profe' && (
        <Card size="small" style={{ borderRadius: 12, textAlign: 'center' }}>
          <Title level={4} style={{ color: '#ff1493', marginBottom: 12 }}>Tu Profe</Title>
          <motion.div animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} style={{ display: 'inline-block', fontSize: 48, marginBottom: 8 }}>
            👋
          </motion.div>
          <Title level={5} style={{ color: '#fff', margin: '8px 0' }}>Trinidad Guinazu</Title>
          <Text style={{ fontSize: 14, color: '#ccc', lineHeight: 1.8, display: 'block', maxWidth: 500, margin: '0 auto' }}>
            Tengo 32 anios, soy preparadora fisica de box. Realizo entrenamientos creativos de boxeo adaptados a todos los niveles. Mi objetivo es que cada alumna se supere, se divierta y se sienta fuerte. Te espero en el ring!
          </Text>
        </Card>
      )}

      {/* INFO */}
      {activeSection === 'info' && (
        <div>
          {/* Sorteo */}
          <Card size="small" style={{ borderRadius: 12, marginBottom: 10, background: paidBeforeTen ? '#1a3a1a' : '#3a3000', border: paidBeforeTen ? '1px solid #52c41a' : '1px solid #d4a017' }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
              <Title level={4} style={{ margin: '8px 0', color: paidBeforeTen ? '#52c41a' : '#d4a017', textAlign: 'center' }}>Sorteo Mensual</Title>
              <Text style={{ fontSize: 15, color: paidBeforeTen ? '#52c41a' : '#d4a017' }}>{paidBeforeTen ? 'Estas participando! Pagaste antes del 10. Mucha suerte!' : 'Si pagas antes del 10 de cada mes, participas de un sorteo de un regalo sorpresa!'}</Text>
            </div>
          </Card>

          {/* Boxeo */}
          <Card size="small" style={{ borderRadius: 12, marginBottom: 10, textAlign: 'center' }}>
            <Title level={4} style={{ color: '#ff1493', marginBottom: 12, textAlign: 'center' }}>Por que entrenar boxeo?</Title>
            <img src="/mujer.jpeg" alt="Boxeo" style={{ width: '15%', borderRadius: 8, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />
            <Text style={{ fontSize: 16, color: '#ccc', lineHeight: 1.8, display: 'block', maxWidth: 600, margin: '0 auto' }}>El boxeo mejora tu resistencia, tonifica todo el cuerpo, libera estres y aumenta tu confianza. Cada sesion quemas entre 400 y 700 calorias. No importa tu nivel, aca crecemos juntas!</Text>
          </Card>

          {/* Instagram */}
          <Card size="small" style={{ borderRadius: 12, textAlign: 'center' }}>
            <Button type="primary" size="large" icon={<InstagramOutlined />} style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', borderColor: 'transparent', fontWeight: 'bold' }} href="https://www.instagram.com/femmbox_?igsh=ZDVtMjlrNHB0Nzho" target="_blank" block>
              Seguinos en Instagram
            </Button>
          </Card>
        </div>
      )}

      </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ClientPortal
