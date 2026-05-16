import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Select, Tag, Typography, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons'
import { clientsAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title } = Typography

function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [form] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => { loadClients() }, [])

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (selectedClient) {
        await clientsAPI.update(selectedClient.id, values)
        message.success('Cliente actualizado')
      } else {
        await clientsAPI.create(values)
        message.success('Cliente creado')
      }
      setModalVisible(false)
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
    { title: 'Nombre', key: 'name', render: (_, r) => `${r.name} ${r.lastName}` },
    { title: 'Teléfono', dataIndex: 'phone' },
    { title: 'Plan', dataIndex: 'planName' },
    { title: 'Vencimiento', dataIndex: 'expirationDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Estado',
      dataIndex: 'status',
      render: (s) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? 'Activo' : 'Vencido'}</Tag>
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => { setSelectedClient(r); form.setFieldsValue(r); setModalVisible(true) }} />
          <Button icon={<DollarOutlined />} onClick={() => { setSelectedClient(r); setPaymentModal(true) }} />
          <Popconfirm title="Eliminar cliente?" onConfirm={async () => { await clientsAPI.remove(r.id); loadClients() }}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3}>Clientes</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedClient(null); form.resetFields(); setModalVisible(true) }}>
          Nuevo Cliente
        </Button>
      </div>
      <Table dataSource={clients} columns={columns} loading={loading} rowKey="id" />
      
      <Modal title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Apellido" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono" rules={[{ required: true }]}>
            <Input />
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
        </Form>
      </Modal>

      <Modal title="Registrar Pago" open={paymentModal} onOk={handlePayment} onCancel={() => setPaymentModal(false)}>
        <Form form={paymentForm} layout="vertical">
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
