import React, { useState, useEffect } from 'react'
import { Card, Typography, Input, Button, message, Tag, List, Space, Spin, Empty, Row, Col, Alert, Modal } from 'antd'
import { UserOutlined, LockOutlined, CalendarOutlined, DollarOutlined, CheckCircleOutlined, LogoutOutlined, ClockCircleOutlined, EnvironmentOutlined, InstagramOutlined, HomeOutlined, TrophyOutlined, DeleteOutlined, PlusOutlined, LineChartOutlined } from '@ant-design/icons'
import { portalAPI, phrasesAPI, attendanceAPI, weightRecordsAPI, settingsAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const { Title, Text } = Typography

// Animations
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
const stagger = (i) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.3 } })

// Styles
const cardBase = { borderRadius: 16, border: '1px solid #222', background: '#141414' }
const cardGlow = { ...cardBase, border: '1px solid rgba(255,20,147,0.25)', boxShadow: '0 0 20px rgba(255,20,147,0.08)' }

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
  const [activeTab, setActiveTab] = useState('inicio')
  const [dailyPhrase, setDailyPhrase] = useState('')
  const [showSorteoAlert, setShowSorteoAlert] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [weightRecords, setWeightRecords] = useState([])
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [newWeightDate, setNewWeightDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [prices, setPrices] = useState({ price_2x: 25000, price_3x: 30000, price_completa: 35000 })

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (token) { setIsLoggedIn(true); loadData(token) }
    loadPhrase()
    loadPrices()
    // Detectar QR de asistencia en la URL
    const params = new URLSearchParams(window.location.search)
    const qrToken = params.get('qr')
    const autoCheckin = params.get('checkin')
    if (qrToken) {
      localStorage.setItem('pendingQR', qrToken)
      window.history.replaceState({}, '', '/portal')
    }
    if (autoCheckin === 'auto') {
      localStorage.setItem('pendingAutoCheckin', 'true')
      window.history.replaceState({}, '', '/portal')
    }
  }, [])

  const loadPhrase = async () => { try { const r = await phrasesAPI.getToday(); setDailyPhrase(r.data.phrase || '') } catch(e) {} }

  const loadPrices = async () => {
    try {
      const res = await settingsAPI.getAll()
      const map = {}
      res.data.forEach(s => { map[s.key] = Number(s.value) })
      setPrices({
        price_2x: map.price_2x || 25000,
        price_3x: map.price_3x || 30000,
        price_completa: map.price_completa || 35000
      })
    } catch (e) {}
  }

  const handleLogin = async () => {
    if (!nameInput || !lastName || !code) return message.warning('Completa todos los campos')
    setLoading(true)
    try {
      const res = await portalAPI.login(nameInput, lastName, code)
      localStorage.setItem('clientToken', res.data.token)
      setProfile(res.data.client); setIsLoggedIn(true); loadData(res.data.token)
    } catch (error) { message.error(error.response?.data?.error || 'Error') }
    finally { setLoading(false) }
  }

  const loadData = async (token) => {
    setDataLoading(true)
    const config = { headers: { Authorization: `Bearer ${token || localStorage.getItem('clientToken')}` } }
    try {
      const [p, pay, c, a, w] = await Promise.all([portalAPI.getProfile(config), portalAPI.getPayments(config), portalAPI.getClasses(config), portalAPI.getAttendance(config), weightRecordsAPI.getAll(config)])
      setProfile(p.data); setPayments(pay.data); setClasses(c.data); setAttendance(a.data); setWeightRecords(w.data)
      // Mostrar alerta de sorteo si pago antes del 10
      const today = dayjs()
      const hasPaidThisMonth = pay.data.some(payment => {
        const d = dayjs(payment.paymentDate)
        return d.month() === today.month() && d.year() === today.year() && d.date() <= 10
      })
      if (hasPaidThisMonth && today.date() <= 10) setShowSorteoAlert(true)
      // Procesar QR pendiente
      const pendingQR = localStorage.getItem('pendingQR')
      if (pendingQR && p.data.id) {
        try {
          const res = await attendanceAPI.qrCheckIn(pendingQR, p.data.id)
          if (res.data.success) message.success('Asistencia registrada!')
          else message.info(res.data.message || 'Ya registrada')
        } catch (e) { message.error(e.response?.data?.error || 'Error con QR') }
        localStorage.removeItem('pendingQR')
      }
      // Procesar auto-checkin (QR fijo)
      const pendingAuto = localStorage.getItem('pendingAutoCheckin')
      if (pendingAuto && p.data.id) {
        try {
          const res = await attendanceAPI.autoCheckIn(p.data.id)
          if (res.data.success) message.success('Asistencia registrada! ' + (res.data.className || ''))
          else message.info(res.data.message || 'Ya registrada hoy')
        } catch (e) { message.error(e.response?.data?.error || 'Error') }
        localStorage.removeItem('pendingAutoCheckin')
      }
    } catch (e) { if (e.response?.status === 401) handleLogout() }
    finally { setDataLoading(false) }
  }

  const handleLogout = () => { localStorage.removeItem('clientToken'); setIsLoggedIn(false); setProfile(null) }
  const handleEnroll = async (id) => { try { const c = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }; await portalAPI.enroll(id, c); message.success('Anotada!'); loadData() } catch(e) { message.error(e.response?.data?.error || 'Error') } }
  const handleUnenroll = async (id) => { try { const c = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }; await portalAPI.unenroll(id, c); message.success('Saliste'); loadData() } catch(e) { message.error(e.response?.data?.error || 'Error') } }

  const handleSaveWeight = async () => {
    const w = parseFloat(newWeight)
    if (!w || w <= 0) return message.warning('Ingresá un peso válido')
    try {
      const c = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await weightRecordsAPI.create({ weight: w, date: newWeightDate }, c)
      message.success('Peso registrado!')
      setShowWeightModal(false)
      setNewWeight('')
      setNewWeightDate(dayjs().format('YYYY-MM-DD'))
      loadData()
    } catch (e) { message.error(e.response?.data?.error || 'Error') }
  }

  const handleDeleteWeight = async (id) => {
    try {
      const c = { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } }
      await weightRecordsAPI.remove(id, c)
      setWeightRecords(prev => prev.filter(r => r.id !== id))
      message.success('Registro eliminado')
    } catch (e) { message.error('Error') }
  }

  const todayDayName = dayjs().format('dddd').toLowerCase()
  const dayMap = { lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }

  // LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', padding: 16, position: 'relative' }}>
        {/* Splash screen */}
        <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.img src="/screenfemm.png" alt="FemmBox" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ maxWidth: '85%', maxHeight: '85vh', objectFit: 'contain' }} />
          </motion.div>
        )}
        </AnimatePresence>
        <Button type="link" size="small" style={{ position: 'absolute', top: 12, right: 12, color: '#666', fontSize: 11, border: '1px solid #333', borderRadius: 8, padding: '2px 10px' }} href="/login">Admin</Button>
        <motion.div {...fadeUp} style={{ width: '100%', maxWidth: 380 }}>
          <Card style={{ ...cardGlow, padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <img src="/logobox.png" alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff1493', boxShadow: '0 0 24px rgba(255,20,147,0.3)' }} />
              <Title level={3} style={{ color: '#ff1493', marginTop: 16, marginBottom: 4, letterSpacing: 2 }}>FEMMBOX</Title>
              <Text style={{ color: '#666', fontSize: 13 }}>Portal de Alumnas</Text>
            </div>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Input size="large" prefix={<UserOutlined style={{ color: '#555' }} />} placeholder="Tu nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ borderRadius: 12 }} />
              <Input size="large" prefix={<UserOutlined style={{ color: '#555' }} />} placeholder="Tu apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ borderRadius: 12 }} />
              <Input.Password size="large" prefix={<LockOutlined style={{ color: '#555' }} />} placeholder="Codigo personal" value={code} onChange={(e) => setCode(e.target.value)} onPressEnter={handleLogin} style={{ borderRadius: 12 }} />
              <Button type="primary" size="large" block onClick={handleLogin} loading={loading} style={{ borderRadius: 12, height: 48, fontSize: 16 }}>Entrar</Button>
            </Space>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (dataLoading && !profile) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  // Data
  const enrolledClasses = classes.filter(c => c.isEnrolled)
  const enrolledDays = new Set(enrolledClasses.map(c => c.dayOfWeek)).size
  const getPlan = (d) => { if (d > 3) return { l: 'Completa', p: prices.price_completa }; if (d === 3) return { l: '3x sem', p: prices.price_3x }; if (d === 2) return { l: '2x sem', p: prices.price_2x }; return { l: '-', p: 0 } }
  const plan = getPlan(enrolledDays)
  const todayEng = dayMap[todayDayName] || ''
  const hasClassToday = enrolledClasses.some(c => c.dayOfWeek === todayEng)
  const paidBeforeTen = payments.some(p => { const d = dayjs(p.paymentDate); return d.month() === dayjs().month() && d.year() === dayjs().year() && d.date() <= 10 })
  const monthClasses = attendance.length
  const monthGoal = enrolledDays * 4 || 4
  const progress = Math.min(Math.round((monthClasses / monthGoal) * 100), 100)
  const classesByDay = {}; classes.forEach(c => { const d = c.dayOfWeek || 'x'; if (!classesByDay[d]) classesByDay[d] = []; classesByDay[d].push(c) })
  const dayNames = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miercoles', thursday: 'Jueves', friday: 'Viernes' }
  const whatsappLink = `https://wa.me/5493388414420?text=${encodeURIComponent('Hola! Te envio mi comprobante de pago')}`

  // Weight progress data
  const sortedWeight = [...weightRecords].sort((a, b) => new Date(a.date) - new Date(b.date))
  const initialWeight = sortedWeight.length > 0 ? parseFloat(sortedWeight[0].weight) : 0
  const currentWeight = sortedWeight.length > 0 ? parseFloat(sortedWeight[sortedWeight.length - 1].weight) : 0
  const weightDiff = sortedWeight.length >= 2 ? currentWeight - initialWeight : 0
  const chartData = sortedWeight.map(r => ({ date: dayjs(r.date).format('DD/MM'), weight: parseFloat(r.weight) }))

  // Bottom nav tabs
  const tabs = [
    { key: 'inicio', icon: <HomeOutlined />, label: 'Inicio' },
    { key: 'entrenos', icon: <CalendarOutlined />, label: 'Entrenos' },
    { key: 'pagos', icon: <DollarOutlined />, label: 'Pagos' },
    { key: 'progreso', icon: <LineChartOutlined />, label: 'Progreso' },
    { key: 'perfil', icon: <UserOutlined />, label: 'Quien soy?' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 70 }}>

      {/* Alerta fullscreen sorteo */}
      <AnimatePresence>
      {showSorteoAlert && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowSorteoAlert(false)}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ textAlign: 'center', maxWidth: 320 }}>
            <Text style={{ fontSize: 60, display: 'block' }}>🎁</Text>
            <Title level={3} style={{ color: '#52c41a', margin: '16px 0 8px' }}>Estas participando del Sorteo Mensual!</Title>
            <Text style={{ color: '#aaa', fontSize: 15 }}>Por pagar en termino, ya estas en el sorteo de este mes. Mucha suerte!</Text>
            <br /><br />
            <Button type="primary" size="large" onClick={() => setShowSorteoAlert(false)} style={{ borderRadius: 12 }}>Cerrar</Button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <div style={{ padding: '16px 14px 0' }}>

      <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

      {/* ===== INICIO ===== */}
      {activeTab === 'inicio' && (
        <div>
          {/* Saludo */}
          <motion.div {...stagger(0)}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/logobox.png" alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff1493', boxShadow: '0 0 12px rgba(255,20,147,0.3)' }} />
              <div>
                <Text style={{ color: '#666', fontSize: 11 }}>{dayjs().format('dddd DD MMM').toUpperCase()}</Text>
                <Title level={3} style={{ margin: '2px 0 0', background: 'linear-gradient(90deg, #ff1493, #ff69b4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hola {profile?.name}!</Title>
                <Text style={{ color: '#888', fontSize: 13 }}>
                  {hasClassToday ? 'Hoy tenes entrenamiento 🥊' : monthClasses > 0 ? `Esta semana llevas ${monthClasses} entrenamiento${monthClasses > 1 ? 's' : ''}` : 'Bienvenida de nuevo'}
                </Text>
              </div>
            </div>
          </motion.div>

          {/* Progreso principal */}
          <motion.div {...stagger(1)}>
            <Card style={{ ...cardGlow, padding: 20, marginBottom: 14 }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>Tu progreso del mes</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                <div style={{ position: 'relative', width: 64, height: 64 }}>
                  <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#222" strokeWidth="6" />
                    <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#ff1493" strokeWidth="6" strokeLinecap="round" strokeDasharray={176} initial={{ strokeDashoffset: 176 }} animate={{ strokeDashoffset: 176 - (176 * progress / 100) }} transition={{ duration: 1.2, delay: 0.3 }} />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                    <Text style={{ color: '#ff1493', fontSize: 16, fontWeight: 'bold' }}>{progress}%</Text>
                  </div>
                </div>
                <div>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', display: 'block' }}>{monthClasses} clases</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>Meta: {monthGoal} este mes</Text>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Cards secundarias */}
          <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
            <Col span={12}>
              <motion.div {...stagger(2)}>
                <Card style={{ ...cardBase, padding: 14, height: '100%' }}>
                  <Text style={{ color: '#888', fontSize: 11 }}>Cuota</Text>
                  <div style={{ marginTop: 6 }}>
                    <Tag color={profile?.status === 'active' ? '#52c41a' : '#ff4d4f'} style={{ fontSize: 12 }}>{profile?.status === 'active' ? 'Al dia' : 'Vencida'}</Tag>
                  </div>
                  <Text style={{ color: '#555', fontSize: 10, marginTop: 4, display: 'block' }}>Vence {dayjs(profile?.expirationDate).format('DD/MM')}</Text>
                </Card>
              </motion.div>
            </Col>
            <Col span={12}>
              <motion.div {...stagger(3)}>
                <Card style={{ ...cardBase, padding: 14, height: '100%' }}>
                  <Text style={{ color: '#888', fontSize: 11 }}>Plan</Text>
                  <Text style={{ color: '#ff1493', fontSize: 16, fontWeight: 'bold', display: 'block', marginTop: 6 }}>{plan.l}</Text>
                  <Text style={{ color: '#555', fontSize: 10 }}>${plan.p.toLocaleString()}/mes</Text>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Sorteo mensual */}
          <motion.div {...stagger(4)}>
            <Card style={{ ...cardBase, padding: 14, marginBottom: 14, borderColor: paidBeforeTen ? '#52c41a33' : '#d4a01733' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>🎁</Text>
                <div>
                  <Text style={{ color: paidBeforeTen ? '#52c41a' : '#d4a017', fontSize: 13, fontWeight: '600' }}>{paidBeforeTen ? 'Estas participando del Sorteo Mensual!' : 'Sorteo mensual'}</Text>
                  <br />
                  <Text style={{ color: '#888', fontSize: 11 }}>{paidBeforeTen ? 'Por pagar en termino! Mucha suerte!' : 'Paga antes del 10 y participa del sorteo'}</Text>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Frase del dia */}
          {dailyPhrase && (
            <motion.div {...stagger(4)}>
              <Card style={{ ...cardBase, padding: 14, marginBottom: 14, textAlign: 'center' }}>
                <Text style={{ color: '#ff69b4', fontSize: 13, fontStyle: 'italic' }}>"{dailyPhrase}"</Text>
              </Card>
            </motion.div>
          )}

          {/* Calendario visual */}
          <motion.div {...stagger(4)}>
            <Card style={{ ...cardBase, padding: 16, marginBottom: 14 }}>
              <Text style={{ color: '#fff', fontSize: 12, display: 'block', marginBottom: 10 }}>Este mes</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                  <Text key={d} style={{ color: '#555', fontSize: 10, marginBottom: 4 }}>{d}</Text>
                ))}
                {(() => {
                  const startOfMonth = dayjs().startOf('month')
                  const daysInMonth = dayjs().daysInMonth()
                  const startDay = startOfMonth.day()
                  const attendedDates = new Set(attendance.map(a => dayjs(a.date).format('YYYY-MM-DD')))
                  const cells = []
                  for (let i = 0; i < startDay; i++) cells.push(<div key={`empty-${i}`} />)
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = dayjs().date(d).format('YYYY-MM-DD')
                    const attended = attendedDates.has(dateStr)
                    const isToday = d === dayjs().date()
                    cells.push(
                      <div key={d} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: attended ? '#ff1493' : isToday ? '#222' : 'transparent', border: isToday && !attended ? '1px solid #ff1493' : 'none' }}>
                        {attended ? <span style={{ fontSize: 14 }}>🥊</span> : <Text style={{ fontSize: 11, color: isToday ? '#ff1493' : '#555' }}>{d}</Text>}
                      </div>
                    )
                  }
                  return cells
                })()}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>🥊</span><Text style={{ color: '#666', fontSize: 10 }}>Entrene</Text></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid #ff1493' }} /><Text style={{ color: '#666', fontSize: 10 }}>Hoy</Text></div>
              </div>
            </Card>
          </motion.div>

          {/* Logros */}
          <motion.div {...stagger(5)}>
            <Card style={{ ...cardBase, padding: 16, marginBottom: 14 }}>
              <Text style={{ color: '#fff', fontSize: 12, display: 'block', marginBottom: 10 }}>Logros</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {monthClasses >= 1 && <Tag style={{ background: '#1a1a1a', border: '1px solid #ff1493', color: '#ff69b4', borderRadius: 20 }}>🥊 1ra clase</Tag>}
                {monthClasses >= 5 && <Tag style={{ background: '#1a1a1a', border: '1px solid #ff1493', color: '#ff69b4', borderRadius: 20 }}>🔥 5 clases</Tag>}
                {monthClasses >= 10 && <Tag style={{ background: '#1a1a1a', border: '1px solid #ff1493', color: '#ff69b4', borderRadius: 20 }}>💪 10 clases</Tag>}
                {enrolledDays >= 3 && <Tag style={{ background: '#1a1a1a', border: '1px solid #ff1493', color: '#ff69b4', borderRadius: 20 }}>🏆 Completa</Tag>}
                {paidBeforeTen && <Tag style={{ background: '#1a1a1a', border: '1px solid #52c41a', color: '#52c41a', borderRadius: 20 }}>🎁 Sorteo</Tag>}
                {monthClasses === 0 && <Text style={{ color: '#444', fontSize: 11 }}>Entrena para desbloquear</Text>}
              </div>
            </Card>
          </motion.div>

          {/* Sorteo */}
          <motion.div {...stagger(6)}>
            <Card style={{ ...cardBase, padding: 14, marginBottom: 14, borderColor: paidBeforeTen ? '#52c41a33' : '#d4a01733' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>🎁</Text>
                <div>
                  <Text style={{ color: paidBeforeTen ? '#52c41a' : '#d4a017', fontSize: 13, fontWeight: '600' }}>{paidBeforeTen ? 'Participando del Sorteo Mensual!' : 'Sorteo mensual'}</Text>
                  <br />
                  <Text style={{ color: '#555', fontSize: 11 }}>{paidBeforeTen ? 'Por pagar en termino!' : 'Paga antes del 10 y participa'}</Text>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ===== ENTRENOS ===== */}
      {activeTab === 'entrenos' && (
        <div>
          <Title level={4} style={{ color: '#ff1493', marginBottom: 16 }}>Mis Horarios</Title>
          <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 12 }}>Lunes: Piernas y Gluteos | Martes y Jueves: Entrenamiento Fisico | Miercoles: Espalda, Brazos y Boxeo | Viernes: Resistencia</Text>
          {enrolledClasses.length > 0 && !showEditTurnos && (
            <Card style={{ ...cardGlow, padding: 16, marginBottom: 14 }}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                const my = enrolledClasses.filter(c => c.dayOfWeek === day)
                if (!my.length) return null
                return <div key={day} style={{ marginBottom: 6 }}><Text style={{ color: '#fff', fontSize: 14 }}><strong style={{ color: '#ff1493' }}>{dayNames[day]}</strong> — {my.map(c => c.startTime + '-' + c.endTime).join(', ')}</Text></div>
              })}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #222' }}>
                <Text style={{ color: '#888', fontSize: 12 }}>Plan: {plan.l} — <span style={{ color: '#ff1493' }}>${plan.p.toLocaleString()}</span></Text>
              </div>
            </Card>
          )}
          <Button type="primary" block onClick={() => setShowEditTurnos(!showEditTurnos)} style={{ borderRadius: 12, marginBottom: 14 }}>
            {showEditTurnos ? 'Ocultar horarios' : enrolledClasses.length > 0 ? 'Cambiar turno' : 'Elegir horarios'}
          </Button>
          {showEditTurnos && (
            <div>
              {enrolledDays === 1 && <Alert style={{ marginBottom: 10, borderRadius: 10 }} type="warning" showIcon message="Otro dia = 2x sem ($25.000)" />}
              {enrolledDays === 2 && <Alert style={{ marginBottom: 10, borderRadius: 10 }} type="warning" showIcon message="Otro dia = 3x sem ($30.000) +$5.000" />}
              {enrolledDays === 3 && <Alert style={{ marginBottom: 10, borderRadius: 10 }} type="warning" showIcon message="Otro dia = Completa ($35.000) +$5.000" />}
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                const dc = (classesByDay[day] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
                return (
                  <div key={day} style={{ marginBottom: 14 }}>
                    <Text style={{ color: '#ff1493', fontSize: 14, fontWeight: '600' }}>{dayNames[day]}</Text>
                    {dc.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 12, marginTop: 6, background: item.isEnrolled ? '#0f2a0f' : '#141414', border: item.isEnrolled ? '1px solid #52c41a' : '1px solid #222' }}>
                        <Text style={{ color: '#fff', fontSize: 14 }}>{item.startTime} - {item.endTime} <span style={{ color: '#555', fontSize: 11 }}>({item.enrolled}/{item.capacity})</span></Text>
                        {item.isEnrolled ? <Button size="small" danger style={{ borderRadius: 8 }} onClick={() => handleUnenroll(item.id)}>Salir</Button> : <Button size="small" type="primary" style={{ borderRadius: 8 }} onClick={() => handleEnroll(item.id)} disabled={item.enrolled >= item.capacity || profile?.status !== 'active'}>Elegir</Button>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== PAGOS ===== */}
      {activeTab === 'pagos' && (
        <div>
          <Title level={4} style={{ color: '#ff1493', marginBottom: 16 }}>Pagos</Title>
          {/* Sorteo */}
          <Card style={{ ...cardBase, padding: 14, marginBottom: 14, borderColor: paidBeforeTen ? '#52c41a33' : '#d4a01733' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>🎁</Text>
              <div>
                <Text style={{ color: paidBeforeTen ? '#52c41a' : '#d4a017', fontSize: 13, fontWeight: '600' }}>{paidBeforeTen ? 'Estas participando del Sorteo Mensual!' : 'Sorteo mensual'}</Text>
                <br />
                <Text style={{ color: '#888', fontSize: 11 }}>{paidBeforeTen ? 'Por pagar en termino! Mucha suerte!' : 'Paga antes del 10 y participa del sorteo'}</Text>
              </div>
            </div>
          </Card>
          <Card style={{ ...cardBase, padding: 16, marginBottom: 14, textAlign: 'center' }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Transferencia</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', display: 'block', marginTop: 6 }}>FEMMBOX93</Text>
            <Button type="primary" block style={{ marginTop: 12, borderRadius: 12, background: '#25d366', borderColor: '#25d366' }} href={whatsappLink} target="_blank">Enviar comprobante</Button>
          </Card>
          <Card style={{ ...cardBase, padding: 16 }}>
            <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 10 }}>Historial</Text>
            {payments.length === 0 ? <Text style={{ color: '#444' }}>Sin pagos</Text> : payments.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                <div><Text style={{ color: '#fff', fontSize: 13 }}>${p.amount}</Text><br /><Text style={{ color: '#555', fontSize: 11 }}>{dayjs(p.paymentDate).format('DD/MM/YY')}</Text></div>
                <Tag color={p.status === 'paid' ? '#52c41a' : '#faad14'} style={{ height: 'fit-content', borderRadius: 12 }}>{p.status === 'paid' ? 'Pagado' : 'Pendiente'}</Tag>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ===== MI PROGRESO ===== */}
      {activeTab === 'progreso' && (
        <div>
          <Title level={4} style={{ color: '#ff1493', marginBottom: 16 }}>Mi Progreso</Title>

          {/* Registrar peso */}
          <motion.div {...stagger(0)}>
            <Card style={{ ...cardGlow, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Registrar mi peso</Text>
                <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setShowWeightModal(true)} style={{ borderRadius: 8 }}>Registrar peso</Button>
              </div>
              {sortedWeight.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <Text style={{ color: '#888', fontSize: 11 }}>Peso actual</Text>
                      <Text style={{ color: '#ff1493', fontSize: 22, fontWeight: 'bold', display: 'block' }}>{currentWeight} kg</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text style={{ color: '#888', fontSize: 11 }}>Ultimo registro</Text>
                      <Text style={{ color: '#ccc', fontSize: 13, display: 'block' }}>{dayjs(sortedWeight[sortedWeight.length - 1].date).format('DD/MM/YYYY')}</Text>
                    </div>
                  </div>
                </div>
              ) : (
                <Text style={{ color: '#555', fontSize: 13 }}>Todavia no registraaste tu peso. Toca "Registrar peso" para empezar.</Text>
              )}
            </Card>
          </motion.div>

          {/* Resumen */}
          {sortedWeight.length >= 2 && (
            <motion.div {...stagger(1)}>
              <Row gutter={[8, 8]} style={{ marginBottom: 14 }}>
                <Col span={12}>
                  <Card style={{ ...cardBase, padding: 12 }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>Peso inicial</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', display: 'block' }}>{initialWeight} kg</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={{ ...cardBase, padding: 12 }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>Peso actual</Text>
                    <Text style={{ color: '#ff1493', fontSize: 18, fontWeight: 'bold', display: 'block' }}>{currentWeight} kg</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={{ ...cardBase, padding: 12 }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>Diferencia</Text>
                    <Text style={{ color: weightDiff < 0 ? '#52c41a' : weightDiff > 0 ? '#faad14' : '#fff', fontSize: 18, fontWeight: 'bold', display: 'block' }}>{weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg</Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={{ ...cardBase, padding: 12 }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>Registros</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', display: 'block' }}>{sortedWeight.length}</Text>
                  </Card>
                </Col>
              </Row>
            </motion.div>
          )}

          {/* Mensaje motivacional */}
          {sortedWeight.length >= 2 && (
            <motion.div {...stagger(2)}>
              <Card style={{ ...cardBase, padding: 14, marginBottom: 14, borderLeft: '3px solid #ff1493' }}>
                <Text style={{ color: '#ccc', fontSize: 12, display: 'block', marginBottom: 6 }}>Tu progreso no se mide solo en kilos. Cada entrenamiento, cada esfuerzo y cada pequeno cambio cuenta.</Text>
                <Text style={{ color: weightDiff < 0 ? '#52c41a' : weightDiff === 0 ? '#faad14' : '#ff69b4', fontSize: 13, fontWeight: '600', display: 'block' }}>
                  {weightDiff < 0 ? 'Excelente! Estas avanzando. Cada esfuerzo esta dando sus frutos.' : weightDiff === 0 ? 'Mantener tambien es progreso. Lo importante es que seguis adelante.' : 'Un numero no define tu progreso. Segui entrenando y enfocandote en sentirte cada dia mas fuerte.'}
                </Text>
              </Card>
            </motion.div>
          )}

          {/* Grafico */}
          {sortedWeight.length > 0 && (
            <motion.div {...stagger(3)}>
              <Card style={{ ...cardBase, padding: 16, marginBottom: 14 }}>
                <Text style={{ color: '#fff', fontSize: 12, display: 'block', marginBottom: 10 }}>Evolucion de mi peso</Text>
                {sortedWeight.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={{ background: '#1e1e22', border: '1px solid #333', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#fff' }} formatter={(v) => [`${v} kg`, 'Peso']} />
                      <Line type="monotone" dataKey="weight" stroke="#ff1493" strokeWidth={2.5} dot={{ fill: '#ff1493', r: 4 }} activeDot={{ r: 6, fill: '#ff1493' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Text style={{ color: '#555', fontSize: 12, display: 'block', textAlign: 'center', padding: '20px 0' }}>Agrega mas registros para ver tu evolucion</Text>
                )}
              </Card>
            </motion.div>
          )}

          {/* Historial */}
          {sortedWeight.length > 0 && (
            <motion.div {...stagger(4)}>
              <Card style={{ ...cardBase, padding: 16 }}>
                <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 10 }}>Historial de peso</Text>
                {sortedWeight.slice().reverse().map((record) => (
                  <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <Text style={{ color: '#ccc', fontSize: 13 }}>{dayjs(record.date).format('DD/MM/YYYY')} — <Text style={{ color: '#fff', fontWeight: '500' }}>{parseFloat(record.weight)} kg</Text></Text>
                    <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteWeight(record.id)} style={{ color: '#666' }} />
                  </div>
                ))}
              </Card>
            </motion.div>
          )}

          {/* Modal registrar peso */}
          <Modal
            title={<Text style={{ color: '#fff' }}>Registrar peso</Text>}
            open={showWeightModal}
            onOk={handleSaveWeight}
            onCancel={() => { setShowWeightModal(false); setNewWeight(''); setNewWeightDate(dayjs().format('YYYY-MM-DD')) }}
            okText="Guardar"
            cancelText="Cancelar"
            styles={{ body: { padding: '16px 0' }, content: { background: '#1e1e22', border: '1px solid #333' }, header: { background: '#1e1e22' } }}
          >
            <div style={{ marginBottom: 12 }}>
              <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Peso (kg)</Text>
              <Input
                type="number"
                step="0.1"
                min="1"
                placeholder="Ej: 68.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                style={{ borderRadius: 10 }}
              />
            </div>
            <div>
              <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Fecha</Text>
              <Input
                type="date"
                value={newWeightDate}
                onChange={(e) => setNewWeightDate(e.target.value)}
                style={{ borderRadius: 10 }}
              />
            </div>
          </Modal>
        </div>
      )}

      {/* ===== PERFIL ===== */}
      {activeTab === 'perfil' && (
        <div>
          <Title level={4} style={{ color: '#ff1493', marginBottom: 16 }}>Perfil</Title>

          {/* Asistencia */}
          <Card style={{ ...cardBase, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 10 }}>Mis asistencias</Text>
            {attendance.length === 0 ? <Text style={{ color: '#444', fontSize: 12 }}>Sin asistencias registradas</Text> : (
              <div>
                {attendance.slice(0, 8).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <Text style={{ color: '#ccc', fontSize: 12 }}>{dayjs(item.date).format('DD/MM/YY')} — {item.Class?.name || 'Clase'}</Text>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                  </div>
                ))}
                {attendance.length > 8 && <Text style={{ color: '#555', fontSize: 11, marginTop: 6, display: 'block' }}>+{attendance.length - 8} mas...</Text>}
              </div>
            )}
          </Card>

          {/* Profe */}
          <Card style={{ ...cardGlow, padding: 20, marginBottom: 14, textAlign: 'center' }}>
            <motion.div animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }} style={{ display: 'inline-block', marginBottom: 8 }}>
              <img src="/trini.png" alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff1493' }} />
            </motion.div>
            <Title level={5} style={{ color: '#fff', margin: '8px 0 2px' }}>TU ENTRENADORA</Title>
            <Text style={{ color: '#ff69b4', fontSize: 13 }}>Trinidad Guinazu</Text>
            <Text style={{ color: '#666', fontSize: 12, display: 'block', marginTop: 4 }}>Preparadora fisica y coach de boxeo</Text>
            <Text style={{ color: '#888', fontSize: 12, display: 'block', marginTop: 8, lineHeight: 1.6 }}>Entrenamientos dinamicos adaptados a todos los niveles. Estudiante de la FAB (Federacion Argentina de Boxeo). Certificacion de Preparador Fisico de la CIE-DC.</Text>
            <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
              <Col span={8}><Text style={{ color: '#ff1493', fontWeight: 'bold', display: 'block' }}>+1</Text><Text style={{ color: '#555', fontSize: 9 }}>anio</Text></Col>
              <Col span={8}><Text style={{ color: '#ff1493', fontWeight: 'bold', display: 'block' }}>+50</Text><Text style={{ color: '#555', fontSize: 9 }}>alumnas</Text></Col>
              <Col span={8}><Text style={{ color: '#ff1493', fontWeight: 'bold', display: 'block' }}>100%</Text><Text style={{ color: '#555', fontSize: 9 }}>personal</Text></Col>
            </Row>
            <Space style={{ marginTop: 14 }}>
              <Button size="small" style={{ borderRadius: 8, background: '#25d366', borderColor: '#25d366', color: '#fff' }} href="https://wa.me/5493388414420" target="_blank">WhatsApp</Button>
              <Button size="small" style={{ borderRadius: 8, background: '#c2185b', borderColor: '#c2185b', color: '#fff' }} href="https://www.instagram.com/femmbox_?igsh=ZDVtMjlrNHB0Nzho" target="_blank"><InstagramOutlined /> IG</Button>
            </Space>
          </Card>

          {/* Ubicacion */}
          <Card style={{ ...cardBase, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Ubicacion</Text>
            <Text style={{ color: '#fff', fontSize: 15, display: 'block', marginTop: 6 }}>📍 Calle 5 entre 26 y 28</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>Florentino Ameghino</Text>
          </Card>

          {/* Info boxeo */}
          <Card style={{ ...cardBase, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Por que boxeo?</Text>
            <img src="/mujer.jpeg" alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', float: 'right', marginLeft: 10 }} />
            <Text style={{ color: '#ccc', fontSize: 13, lineHeight: 1.7, display: 'block', marginTop: 8 }}>Mejora resistencia, tonifica, libera estres y aumenta confianza. 400-700 cal por sesion.</Text>
          </Card>

          {/* Logout */}
          <Button block danger style={{ borderRadius: 12 }} onClick={handleLogout}>Cerrar sesion</Button>
        </div>
      )}

      </motion.div>
      </AnimatePresence>

      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ textAlign: 'center', padding: '20px 16px 70px', background: '#0a0a0a' }}>
        <Text style={{ fontSize: 12, color: '#555' }}>Desarrollado por{' '}
          <a href="https://www.instagram.com/impulsoweb.pv?igsh=NTNjYXM4ZWdoY3B3" target="_blank" rel="noopener noreferrer" style={{ color: '#ff1493', textDecoration: 'none' }}>Impulso Web PV</a>
        </Text>
        <br />
        <Text style={{ fontSize: 10, color: '#333' }}>© 2026{' '}
          <a href="https://www.instagram.com/impulsoweb.pv?igsh=NTNjYXM4ZWdoY3B3" target="_blank" rel="noopener noreferrer" style={{ color: '#444', textDecoration: 'none' }}>Impulso Web PV</a>
        </Text>
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0a0a', borderTop: '1px solid #1a1a1a', padding: '8px 0 12px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setActiveTab(t.key)} style={{ textAlign: 'center', cursor: 'pointer', flex: 1 }}>
            <div style={{ fontSize: 20, color: activeTab === t.key ? '#ff1493' : '#555', transition: 'color 0.2s' }}>{t.icon}</div>
            <Text style={{ fontSize: 10, color: activeTab === t.key ? '#ff1493' : '#555' }}>{t.label}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClientPortal

