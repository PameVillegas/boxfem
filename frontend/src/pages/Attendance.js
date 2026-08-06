import React, { useEffect, useState } from 'react'
import { Typography, Select, Button, Tag, message, Card, Checkbox, DatePicker, Popconfirm } from 'antd'
import { CheckCircleOutlined, PlusOutlined, QrcodeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
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
  const [qrData, setQrData] = useState(null)
  // Buscar/agregar manual
  const [searchDate, setSearchDate] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [manualClient, setManualClient] = useState(null)
  const [manualClass, setManualClass] = useState(null)
  const [manualDate, setManualDate] = useState(dayjs())

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [classesRes, clientsRes, attRes] = await Promise.all([
        classesAPI.getAll(), clientsAPI.getAll(),
        attendanceAPI.getAll(dayjs().format('YYYY-MM-DD'))
      ])
      setClasses(classesRes.data); setClients(clientsRes.data)
      setTodayAttendance(attRes.data); autoSelectClass(classesRes.data)
    } catch (e) {}
  }

  const autoSelectClass = (allClasses) => {
    const now = dayjs()
    const currentHour = now.hour()
    const todayDay = now.format('dddd').toLowerCase()
    const dayMap = { lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }
    const todayEng = dayMap[todayDay] || ''
    const todayClasses = allClasses.filter(c => c.dayOfWeek === todayEng)
    let best = null, bestDiff = 999
    todayClasses.forEach(c => { const h = parseInt(c.startTime.split(':')[0]); const d = Math.abs(currentHour - h); if (d < bestDiff) { bestDiff = d; best = c } })
    if (best) { setSelectedClass(best.id); loadEnrolled(best.id, allClasses) }
  }

  const loadEnrolled = (classId, allClasses = classes) => {
    const cls = allClasses.find(c => c.id === classId)
    if (cls && cls.Clients) { setEnrolledInClass(cls.Clients); setCheckedIds(cls.Clients.map(c => c.id)) }
    else { setEnrolledInClass([]); setCheckedIds([]) }
  }

  const handleClassChange = (classId) => { setSelectedClass(classId); loadEnrolled(classId); setExtraClient(null) }
  const toggleClient = (id) => { setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  const selectAll = () => { setCheckedIds([...enrolledInClass.map(c => c.id), ...(extraClient ? [extraClient] : [])]) }
  const deselectAll = () => setCheckedIds([])

  const handleSave = async () => {
    if (!selectedClass) return message.warning('Selecciona un turno')
    if (checkedIds.length === 0) return message.warning('Marca al menos una alumna')
    setSaving(true)
    try {
      for (const clientId of checkedIds) {
        const alreadyMarked = todayAttendance.some(a => (a.Client?.id || a.clientId) === clientId && a.classId === selectedClass)
        if (!alreadyMarked) await attendanceAPI.checkIn({ clientId, classId: selectedClass, date: dayjs().format('YYYY-MM-DD'), method: 'manual' })
      }
      message.success(`Asistencia: ${checkedIds.length} alumnas`); loadAll()
    } catch (e) { message.error('Error') }
    finally { setSaving(false) }
  }

  // Buscar asistencias por fecha
  const handleSearchDate = async (date) => {
    setSearchDate(date)
    if (!date) { setSearchResults([]); return }
    try {
      const res = await attendanceAPI.getAll(date.format('YYYY-MM-DD'))
      setSearchResults(res.data)
    } catch (e) { setSearchResults([]) }
  }

  // Agregar asistencia manual en cualquier fecha
  const handleManualAdd = async () => {
    if (!manualClient || !manualClass) return message.warning('Selecciona alumna y clase')
    try {
      await attendanceAPI.checkIn({ clientId: manualClient, classId: manualClass, date: manualDate.format('YYYY-MM-DD'), method: 'manual' })
      message.success('Asistencia agregada')
      setManualClient(null); setManualClass(null)
      if (searchDate) handleSearchDate(searchDate)
      loadAll()
    } catch (e) { message.error(e.response?.data?.error || 'Error') }
  }

  // Eliminar asistencia
  const handleDelete = async (id) => {
    try {
      await attendanceAPI.remove(id)
      message.success('Asistencia eliminada')
      if (searchDate) handleSearchDate(searchDate)
      loadAll()
    } catch (e) { message.error('Error') }
  }

  const todayDay = dayjs().format('dddd').toLowerCase()
  const dayMap = { lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }
  const todayEng = dayMap[todayDay] || ''
  const todayClasses = classes.filter(c => c.dayOfWeek === todayEng)
  const dayNames = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mie', thursday: 'Jue', friday: 'Vie' }
  const enrolledIds = new Set(enrolledInClass.map(c => c.id))
  const availableExtras = clients.filter(c => !enrolledIds.has(c.id))
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
        <Select value={selectedClass} onChange={handleClassChange} style={{ width: '100%' }} placeholder="Seleccionar turno">
          {todayClasses.length > 0 ? todayClasses.map(c => (
            <Select.Option key={c.id} value={c.id}>{c.name} — {c.startTime} a {c.endTime}</Select.Option>
          )) : classes.map(c => (
            <Select.Option key={c.id} value={c.id}>{dayNames[c.dayOfWeek] || ''} — {c.name} {c.startTime}-{c.endTime}</Select.Option>
          ))}
        </Select>
        {alreadyMarkedToday > 0 && <Tag color="green" style={{ marginTop: 8 }}>{alreadyMarkedToday} ya registradas</Tag>}
      </Card>

      {/* Lista de alumnas del turno */}
      {selectedClass && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text strong style={{ fontSize: 13 }}>Alumnas ({enrolledInClass.length})</Text>
            <div>
              <Button size="small" type="link" onClick={selectAll}>Todas</Button>
              <Button size="small" type="link" danger onClick={deselectAll}>Ninguna</Button>
            </div>
          </div>
          {enrolledInClass.length === 0 ? <Text style={{ color: '#666', fontSize: 12 }}>Sin alumnas en este turno</Text> : (
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
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #222' }}>
            <Text style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}><PlusOutlined /> Agregar extra:</Text>
            <Select showSearch placeholder="Buscar alumna..." value={extraClient} onChange={(val) => { setExtraClient(val); if (val && !checkedIds.includes(val)) setCheckedIds([...checkedIds, val]) }} style={{ width: '100%' }} allowClear filterOption={(input, option) => (option.children || '').toString().toLowerCase().includes(input.toLowerCase())}>
              {availableExtras.map(c => <Select.Option key={c.id} value={c.id}>{c.name || ''} {c.lastName || ''}</Select.Option>)}
            </Select>
          </div>
        </Card>
      )}

      {/* Botones */}
      {selectedClass && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button type="primary" block size="large" onClick={handleSave} loading={saving} style={{ borderRadius: 12, height: 48, fontSize: 16, flex: 2 }}>Registrar ({checkedIds.length})</Button>
          <Button size="large" icon={<QrcodeOutlined />} onClick={async () => { try { const res = await attendanceAPI.getQR(selectedClass); setQrData(res.data) } catch(e) { message.error('Error') } }} style={{ borderRadius: 12, height: 48, flex: 1 }}>QR</Button>
        </div>
      )}

      {/* QR */}
      {qrData && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 12, textAlign: 'center' }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>{qrData.className} ({qrData.time})</Text>
          <img src={qrData.qr} alt="QR" style={{ width: 200, height: 200, borderRadius: 8 }} />
          <Text style={{ display: 'block', marginTop: 8, color: '#888', fontSize: 11 }}>Las alumnas escanean este QR</Text>
          <Button size="small" style={{ marginTop: 8 }} onClick={() => setQrData(null)}>Cerrar</Button>
        </Card>
      )}

      {/* QR fijo */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
        <Button block onClick={async () => { try { const res = await attendanceAPI.getFixedQR(); setQrData({ ...res.data, className: 'FEMMBOX', time: 'Fijo' }) } catch(e) { message.error('Error') } }} style={{ borderRadius: 10 }}>
          Generar QR fijo para imprimir
        </Button>
      </Card>

      {/* === AGREGAR MANUAL + BUSCAR === */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>Agregar asistencia manual</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DatePicker value={manualDate} onChange={(d) => d && setManualDate(d)} style={{ width: '100%' }} placeholder="Fecha" />
          <Select showSearch placeholder="Alumna..." value={manualClient} onChange={setManualClient} style={{ width: '100%' }} allowClear filterOption={(input, option) => (option.children || '').toString().toLowerCase().includes(input.toLowerCase())}>
            {clients.map(c => <Select.Option key={c.id} value={c.id}>{c.name || ''} {c.lastName || ''}</Select.Option>)}
          </Select>
          <Select placeholder="Clase..." value={manualClass} onChange={setManualClass} style={{ width: '100%' }} allowClear>
            {classes.map(c => <Select.Option key={c.id} value={c.id}>{dayNames[c.dayOfWeek] || ''} {c.name} {c.startTime}-{c.endTime}</Select.Option>)}
          </Select>
          <Button type="primary" block onClick={handleManualAdd} style={{ borderRadius: 10 }}>Agregar asistencia</Button>
        </div>
      </Card>

      {/* === BUSCAR POR FECHA === */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}><SearchOutlined /> Buscar por fecha</Text>
        <DatePicker value={searchDate} onChange={handleSearchDate} style={{ width: '100%', marginBottom: 10 }} placeholder="Seleccionar fecha" />
        {searchResults.length > 0 ? searchResults.map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', borderBottom: '1px solid #1a1a1a' }}>
            <div>
              <Text style={{ fontSize: 13, color: '#fff' }}>{a.Client ? `${a.Client.name} ${a.Client.lastName}` : 'Alumna'}</Text>
              <Text style={{ fontSize: 11, color: '#666', display: 'block' }}>{a.Class?.name || ''} — {a.method}</Text>
            </div>
            <Popconfirm title="Seguro que quieres eliminar?" onConfirm={() => handleDelete(a.id)}>
              <Button size="small" icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
          </div>
        )) : searchDate && <Text style={{ color: '#666', fontSize: 12 }}>Sin registros en esta fecha</Text>}
      </Card>

      {/* Resumen de hoy */}
      {todayAttendance.length > 0 && (
        <Card size="small" style={{ borderRadius: 12 }}>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Hoy: {todayAttendance.length} registros</Text>
          {todayAttendance.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1a1a1a' }}>
              <Text style={{ fontSize: 12 }}>{a.Client ? `${a.Client.name} ${a.Client.lastName}` : 'Alumna'} — {a.Class?.name || ''}</Text>
              <Popconfirm title="Eliminar?" onConfirm={() => handleDelete(a.id)}>
                <Button size="small" icon={<DeleteOutlined />} danger type="text" />
              </Popconfirm>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default Attendance
