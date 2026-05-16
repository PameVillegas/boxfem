import React, { useEffect, useState } from 'react'
import { Table, Typography, Select, Button, Tag, Space, message, Card } from 'antd'
import { LoginOutlined, ReloadOutlined } from '@ant-design/icons'
import { attendanceAPI, clientsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadAttendance(); loadClients() }, [])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const res = await attendanceAPI.getAll(dayjs().format('YYYY-MM-DD'))
      setAttendance(res.data)
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    const res = await clientsAPI.getAll()
    setClients(res.data)
  }

  const todayAttended = new Set(attendance.map(a => a.Client?.id || a.client?.id))

  const activeClients = clients.filter(c => c.status === 'active' && !todayAttended.has(c.id))

  const handleCheckIn = async () => {
    if (!selectedClient) return message.warning('Seleccioná un cliente')
    try {
      await attendanceAPI.checkIn({ clientId: selectedClient, method: 'manual' })
      message.success('Ingreso registrado')
      setSelectedClient(null)
      loadAttendance()
    } catch (error) {
      message.error(error.response?.data?.error || 'Error registrando ingreso')
    }
  }

  const columns = [
    { title: 'Fecha', dataIndex: 'checkInTime', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Hora', dataIndex: 'checkInTime', render: (d) => dayjs(d).format('HH:mm') },
    {
      title: 'Cliente', key: 'client',
      render: (_, r) => {
        const c = r.Client || r.client
        return c ? `${c.name} ${c.lastName}` : 'N/A'
      }
    },
    { title: 'Clase', key: 'class', render: (_, r) => r.Class?.name || r.class?.name || 'General' },
    { title: 'Método', dataIndex: 'method', render: (m) => <Tag>{m === 'qr' ? 'QR' : m === 'code' ? 'Código' : 'Manual'}</Tag> }
  ]

  return (
    <div>
      <Title level={3}>Control de Asistencia</Title>

      <Card style={{ marginBottom: 20 }}>
        <Space style={{ width: '100%' }}>
          <Select
            showSearch
            placeholder="Buscar cliente por nombre..."
            value={selectedClient}
            onChange={setSelectedClient}
            style={{ width: 350 }}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {activeClients.map(c => (
              <Select.Option key={c.id} value={c.id}>
                {c.name} {c.lastName}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<LoginOutlined />} onClick={handleCheckIn}>
            Registrar Ingreso
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAttendance}>
            Actualizar
          </Button>
        </Space>
      </Card>

      <Table
        dataSource={attendance}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    </div>
  )
}

export default Attendance
