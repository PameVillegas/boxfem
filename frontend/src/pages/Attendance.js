import React, { useEffect, useState } from 'react'
import { Table, Typography, Select, Button, Tag, Space, message, Card, DatePicker, TimePicker } from 'antd'
import { LoginOutlined, ReloadOutlined } from '@ant-design/icons'
import { attendanceAPI, clientsAPI, classesAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [clients, setClients] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedTime, setSelectedTime] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadAttendance(); loadClients(); loadClasses() }, [])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const res = await attendanceAPI.getAll('')
      setAttendance(res.data)
    } finally { setLoading(false) }
  }

  const loadClients = async () => {
    try { const res = await clientsAPI.getAll(); setClients(res.data) } catch(e) {}
  }

  const loadClasses = async () => {
    try { const res = await classesAPI.getAll(); setClasses(res.data) } catch(e) {}
  }

  const handleCheckIn = async () => {
    if (!selectedClient) return message.warning('Selecciona una alumna')
    try {
      const data = {
        clientId: selectedClient,
        classId: selectedClass || undefined,
        date: selectedDate.format('YYYY-MM-DD'),
        method: 'manual'
      }
      if (selectedTime) {
        data.checkInTime = selectedDate.format('YYYY-MM-DD') + 'T' + selectedTime.format('HH:mm') + ':00'
      }
      await attendanceAPI.checkIn(data)
      message.success('Asistencia registrada')
      setSelectedClient(null)
      setSelectedClass(null)
      setSelectedTime(null)
      loadAttendance()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error registrando asistencia')
    }
  }

  const columns = [
    { title: 'Fecha', dataIndex: 'date', render: (d) => dayjs(d).format('DD/MM/YY'), width: 80 },
    { title: 'Hora', dataIndex: 'checkInTime', render: (d) => dayjs(d).format('HH:mm'), width: 60 },
    { title: 'Alumna', key: 'client', ellipsis: true, render: (_, r) => { const c = r.Client || r.client; return c ? `${c.name} ${c.lastName}` : 'N/A' } },
    { title: 'Clase', key: 'class', render: (_, r) => r.Class?.name || 'General', responsive: ['md'] },
    { title: 'Metodo', dataIndex: 'method', render: (m) => <Tag>{m === 'manual' ? 'Manual' : m}</Tag>, responsive: ['md'] }
  ]

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Title level={4} style={{ marginBottom: 12 }}>Asistencia</Title>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Select
            showSearch
            placeholder="Buscar alumna..."
            value={selectedClient}
            onChange={setSelectedClient}
            style={{ width: '100%' }}
            allowClear
            filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
          >
            {clients.map(c => (
              <Select.Option key={c.id} value={c.id}>{c.name} {c.lastName}</Select.Option>
            ))}
          </Select>
          <Space style={{ width: '100%' }} wrap>
            <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)} style={{ flex: 1 }} />
            <TimePicker value={selectedTime} onChange={setSelectedTime} format="HH:mm" placeholder="Hora" style={{ width: 100 }} />
            <Select placeholder="Clase" value={selectedClass} onChange={setSelectedClass} allowClear style={{ minWidth: 120 }}>
              {classes.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name} - {c.dayOfWeek || ''} {c.startTime}</Select.Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<LoginOutlined />} onClick={handleCheckIn} block>
            Registrar Asistencia
          </Button>
        </Space>
      </Card>

      <div style={{ overflowX: 'auto' }}>
        <Table dataSource={attendance} columns={columns} loading={loading} rowKey="id" size="small" pagination={{ pageSize: 20, size: 'small' }} scroll={{ x: 400 }} />
      </div>
    </div>
  )
}

export default Attendance
