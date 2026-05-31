import React, { useEffect, useState } from 'react'
import { Typography, Select, Button, Tag, message, Card, Row, Col, Checkbox } from 'antd'
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { attendanceAPI, clientsAPI, classesAPI } from '../services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const { Title, Text } = Typography

function Attendance() {
  const [classes, setClasses] = useState([])
  const [clients, setClients] = useState([])
  const [todayAttendance, setTodayAttendance] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [enrolledInClass, setEnrolledInClass] = useState([])
  const [checkedIds, setCheckedIds] = useState([])
  const [extraClient, setExtraClient] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [classesRes, clientsRes, attRes] = await Promise.all([
        classesAPI.getAll(),
        clientsAPI.getAll(),
        attendanceAPI.getAll(dayjs().format('YYYY-MM-DD'))
      ])
      setClasses(classesRes.data)
      setClients(clientsRes.data)
      setTodayAttendance(attRes.data)
      autoSelectClass(classesRes.data)
    } catch (e) {}
  }

  // Auto-detectar turno actual
  const autoSelectClass = (allClasses) => {
    const now = dayjs()
    const currentHour = now.hour()
    const todayDay = now.format('dddd').toLowerCase()
    const dayMap = { lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }
    const todayEng = dayMap[todayDay] || ''

    const todayClasses = allClasses.filter(c => c.dayOfWeek === todayEng)
    // Buscar la clase cuyo horario de inicio es el mas cercano a la hora actual
    let best = null
    let bestDiff = 999
    todayClasses.forEach(c => {
      const startHour = parseInt(c.startTime.split(':')[0])
      const diff = Math.abs(currentHour - startHour)
      if (diff < bestDiff) { bestDiff = diff; best = c }
    })
    if (best) {
      setSelectedClass(best.id)
      loadEnrolled(best.id, allClasses)
    }
  }

  const loadEnrolled = (classId, allClasses = classes) => {
    const cls = allClasses.find(c => c.id === classId)
    if (cls && cls.Clients) {
      setEnrolledInClass(cls.Clients)
      // Pre-marcar todas como presentes
      setCheckedIds(cls.Clients.map(c => c.id))
    } else {
      setEnrolledInClass([])
      setCheckedIds([])
    }
  }

  const handleClassChange = (classId) => {
    setSelectedClass(classId)
    loadEnrolled(classId)
    setExtraClient(null)
  }

  const toggleClient = (clientId) => {
    setCheckedIds(prev => prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId])
  }

  const selectAll = () => {
    const allIds = enrolledInClass.map(c => c.id)
    if (extraClient) allIds.push(extraClient)
    setCheckedIds(allIds)
  }

  const deselectAll = () => setCheckedIds([])

  const handleSave = async () => {
    if (!selectedClass) return message.warning('Selecciona un turno')
    if (checkedIds.length === 0) return message.warning('Marca al menos una alumna')
    setSaving(true)
    try {
      for (const clientId of checkedIds) {
        // Verificar que no se duplique
        const alreadyMarked = todayAttendance.some(a => (a.Client?.id || a.clientId) === clientId && a.classId === selectedClass)
        if (!alreadyMarked) {
          await attendanceAPI.checkIn({ clientId, classId: selectedClass, date: dayjs().format('YYYY-MM-DD'), method: 'manual' })
        }
      }
      message.success(`Asistencia registrada: ${checkedIds.length} alumnas`)
      loadAll()
    } catch (e) {
      message.error('Error registrando asistencia')
    } finally { setSaving(false) }
  }

  // Clases de hoy
  const todayDay = dayjs().format('dddd').toLowerCase()
  const dayMap = { lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }
  const todayEng = dayMap[todayDay] || ''
  const todayClasses = classes.filter(c => c.dayOfWeek === todayEng)
  const dayNames = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miercoles', thursday: 'Jueves', friday: 'Viernes' }

  // Alumnas que no estan inscriptas en esta clase (para agregar extra)
  const enrolledIds = new Set(enrolledInClass.map(c => c.id))
  const availableExtras = clients.filter(c => !enrolledIds.has(c.id))

  // Cuantas ya marcadas hoy en este turno
  const alreadyMarkedToday = todayAttendance.filter(a => a.classId === selectedClass).length

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Title level={4} style={{ marginBottom: 8 }}>Asistencia</Title>
      <Text style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 12 }}>
        {dayjs().format('dddd DD [de] MMMM').charAt(0).toUpperCase() + dayjs().format('dddd DD [de] MMMM').slice(1)}
      </Text>

      {/* Selector de turno */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
        <Text style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>Turno actual:</Text>
        <Select
          value={selectedClass}
          onChange={handleClassChange}
          style={{ width: '100%' }}
          placeholder="Seleccionar turno"
        >
          {todayClasses.length > 0 ? todayClasses.map(c => (
            <Select.Option key={c.id} value={c.id}>{c.name} — {c.startTime} a {c.endTime}</Select.Option>
          )) : classes.map(c => (
            <Select.Option key={c.id} value={c.id}>{dayNames[c.dayOfWeek] || c.dayOfWeek} — {c.name} {c.startTime}-{c.endTime}</Select.Option>
          ))}
        </Select>
        {alreadyMarkedToday > 0 && (
          <Tag color="green" style={{ marginTop: 8 }}>{alreadyMarkedToday} ya registradas hoy en este turno</Tag>
        )}
      </Card>

      {/* Lista de alumnas del turno */}
      {selectedClass && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text strong style={{ fontSize: 13 }}>Alumnas del turno ({enrolledInClass.length})</Text>
            <div>
              <Button size="small" type="link" onClick={selectAll}>Todas</Button>
              <Button size="small" type="link" danger onClick={deselectAll}>Ninguna</Button>
            </div>
          </div>

          {enrolledInClass.length === 0 ? (
            <Text style={{ color: '#666', fontSize: 12 }}>No hay alumnas inscriptas en este turno</Text>
          ) : (
            enrolledInClass.map(client => {
              const isChecked = checkedIds.includes(client.id)
              const alreadyDone = todayAttendance.some(a => (a.Client?.id || a.clientId) === client.id && a.classId === selectedClass)
              return (
                <div key={client.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px', borderRadius: 10, marginBottom: 4, background: alreadyDone ? '#0f2a0f' : isChecked ? '#1a1a2a' : '#141414', border: alreadyDone ? '1px solid #52c41a' : isChecked ? '1px solid #ff1493' : '1px solid #222' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Checkbox checked={isChecked || alreadyDone} disabled={alreadyDone} onChange={() => toggleClient(client.id)} />
                    <Text style={{ color: '#fff', fontSize: 14 }}>{client.name} {client.lastName}</Text>
                  </div>
                  {alreadyDone && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                </div>
              )
            })
          )}

          {/* Agregar alumna extra */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #222' }}>
            <Text style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}><PlusOutlined /> Agregar alumna (cambio de turno):</Text>
            <Select
              showSearch
              placeholder="Buscar alumna..."
              value={extraClient}
              onChange={(val) => { setExtraClient(val); if (val && !checkedIds.includes(val)) setCheckedIds([...checkedIds, val]) }}
              style={{ width: '100%' }}
              allowClear
              filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
            >
              {availableExtras.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name} {c.lastName}</Select.Option>
              ))}
            </Select>
          </div>
        </Card>
      )}

      {/* Boton guardar */}
      {selectedClass && (
        <Button type="primary" block size="large" onClick={handleSave} loading={saving} style={{ borderRadius: 12, height: 48, fontSize: 16 }}>
          Registrar Asistencia ({checkedIds.length})
        </Button>
      )}

      {/* Resumen de hoy */}
      {todayAttendance.length > 0 && (
        <Card size="small" style={{ marginTop: 12, borderRadius: 12 }}>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Registradas hoy: {todayAttendance.length}</Text>
          {todayAttendance.slice(0, 10).map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1a1a1a' }}>
              <Text style={{ fontSize: 12 }}>{a.Client ? `${a.Client.name} ${a.Client.lastName}` : 'Alumna'}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>{a.Class?.name || ''}</Text>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default Attendance
