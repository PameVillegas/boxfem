import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Select, Tag, Typography, Space, message, Popconfirm, Alert } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, SearchOutlined } from '@ant-design/icons'
import { clientsAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function Clients() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [newClientCode, setNewClientCode] = useState(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => { loadClients() }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredClients(clients)
    } else {
      const q = search.toLowerCase()
      setFilteredClients(clients.filter(c =>
        `${c.name} ${c.lastName}`.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.planName?.toLowerCase().includes(q) ||
        c.personalCode?.includes(q)
      ))
    }
  }, [search, clients])

  const loadClients = async () => {
    setLoading(true)
    try {
      const res = await clientsAPI.getAll()
      setClients(res.data)
    } catch (error) {
      message.error('Error cargando clientes')
    } finally {
      setLoading(false)
    }
  }

  const generateCode = () => {
    return String(Math.floor(1000 + Math.random() * 9000))
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (selectedClient) {
        await clientsAPI.update(selectedClient.id, values)
        message.success('Cliente actualizado')
        setModalVisible(false)
      } else {
        // Generar código personal automáticamente
        const code = generateCode()
        const res = await clientsAPI.create({ ...values, personalCode: code })
        setNewClientCode({ name: values.name, lastName: values.lastName, code })
        setModalVisible(false)
      }
      form.resetFields()
      loadClients()
    } catch (error) {
      message.error('Error guardando cliente')
    }
  }

  const handlePayment = async () => {
    try {
      const values = await paymentForm.validateFields()
      await clientsAPI.registerPayment(selectedClient.id, values)
      message.success('Pago registrado')
      setPaymentModal(false)
      paymentForm.resetFields()
      loadClients()
    } catch (error) {
      message.error('Error registrando pago')
    }
  }

  const columns = [
    { title: 'Nombre', key: 'name', render: (_, r) => `${r.name} ${r.lastName}`, ellipsis: true },
    { title: 'Teléfono', dataIndex: 'phone', responsive: ['md'] },
    { title: 'Plan', dataIndex: 'planName', ellipsis: true },
    { title: 'Código', dataIndex: 'personalCode', width: 70, render: (c) => <Tag>{c || '-'}</Tag> },
    { title: 'Vence', dataIndex: 'expirationDate', render: (d) => dayjs(d).format('DD/MM/YY'), width: 80 },
    {
      title: 'Estado',
      dataIndex: 'status',
      width: 80,
      render: (s) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? 'Activo' : 'Vencido'}</Tag>
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => { setSelectedClient(r); form.setFieldsValue(r); setModalVisible(true) }} />
          <Button size="small" icon={<DollarOutlined />} onClick={() => { setSelectedClient(r); setPaymentModal(true) }} />
          <Popconfirm title="Eliminar?" onConfirm={async () => { await clientsAPI.remove(r.id); loadClients() }}>
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>Clientes</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedClient(null); form.resetFields(); setModalVisible(true) }}>
          Nueva
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar por nombre, teléfono, plan o código..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 12 }}
      />

      <div style={{ overflowX: 'auto' }}>
        <Table
          dataSource={filteredClients}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 600 }}
        />
      </div>

      {/* Modal código generado */}
      <Modal
        title="✅ Cliente creada"
        open={!!newClientCode}
        onOk={() => setNewClientCode(null)}
        onCancel={() => setNewClientCode(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert
          message={`Código de acceso para ${newClientCode?.name} ${newClientCode?.lastName}`}
          description={
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 6, fontFamily: 'monospace', background: '#f0f5ff', padding: '12px 24px', borderRadius: 8, display: 'inline-block' }}>
                {newClientCode?.code}
              </div>
              <p style={{ marginTop: 12, color: '#666' }}>
                Dáselo a la alumna para que entre al portal desde su celular.
              </p>
            </div>
          }
          type="success"
          showIcon
        />
      </Modal>
      
      {/* Modal crear/editar */}
      <Modal title={selectedClient ? 'Editar Cliente' : 'Nueva Cliente'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical" size="small">
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Apellido" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono" rules={[{ required: true }]}>
            <Input placeholder="Sin 0 ni 15. Ej: 3388431158" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="planName" label="Plan" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar plan">
              <Select.Option value="1 vez por semana">1 vez por semana</Select.Option>
              <Select.Option value="2 veces por semana">2 veces por semana</Select.Option>
              <Select.Option value="3 veces por semana">3 veces por semana</Select.Option>
              <Select.Option value="4 veces por semana">4 veces por semana</Select.Option>
              <Select.Option value="5 veces por semana">5 veces por semana</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="expirationDate" label="Fecha Vencimiento" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {selectedClient && (
            <Form.Item name="personalCode" label="Código Personal">
              <Input placeholder="Código para el portal" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Modal pago */}
      <Modal title="Registrar Pago" open={paymentModal} onOk={handlePayment} onCancel={() => setPaymentModal(false)}>
        <Form form={paymentForm} layout="vertical" size="small">
          <Form.Item name="amount" label="Monto" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Método" initialValue="cash">
            <Select>
              <Select.Option value="cash">Efectivo</Select.Option>
              <Select.Option value="transfer">Transferencia</Select.Option>
              <Select.Option value="card">Tarjeta</Select.Option>
              <Select.Option value="mercadopago">Mercado Pago</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="planMonth" label="Mes Pagado">
            <Input placeholder="Ej: Mayo 2026" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Clients
