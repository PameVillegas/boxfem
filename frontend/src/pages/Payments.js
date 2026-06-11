import React, { useEffect, useState } from 'react'
import { Table, Typography, DatePicker, Statistic, Row, Col, Card, Tag, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { DollarOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { paymentsAPI, clientsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function Payments() {
  const [payments, setPayments] = useState([])
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [month, setMonth] = useState(dayjs().month() + 1)
  const [year, setYear] = useState(dayjs().year())
  const [modalVisible, setModalVisible] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form] = Form.useForm()

  useEffect(() => { loadPayments(); loadClients() }, [month, year])

  const loadPayments = async () => {
    try {
      const res = await paymentsAPI.getMonthly(month, year)
      setPayments(res.data.payments || [])
      setTotal(res.data.total || 0)
    } catch (error) {
      console.error(error)
    }
  }

  const loadClients = async () => {
    try {
      const res = await clientsAPI.getAll()
      setClients(res.data)
    } catch (e) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await clientsAPI.registerPayment(values.clientId, {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        planMonth: values.planMonth
      })
      message.success('Pago registrado')
      setModalVisible(false)
      form.resetFields()
      loadPayments()
    } catch (error) {
      message.error('Error registrando pago')
    }
  }

  const handleDelete = async (id) => {
    try {
      await paymentsAPI.remove(id)
      message.success('Pago eliminado')
      loadPayments()
    } catch (e) { message.error('Error') }
  }

  const methodLabels = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', mercadopago: 'MercadoPago' }

  const columns = [
    { title: 'Fecha', dataIndex: 'paymentDate', render: (d) => dayjs(d).format('DD/MM/YY'), width: 80 },
    { title: 'Cliente', key: 'client', ellipsis: true, render: (_, r) => {
      const c = r.Client || r.client
      return c ? `${c.name} ${c.lastName}` : 'N/A'
    }},
    { title: 'Monto', dataIndex: 'amount', render: (v) => `$${v}`, width: 80 },
    { title: 'Método', dataIndex: 'paymentMethod', render: (m) => <Tag>{methodLabels[m] || m}</Tag>, responsive: ['md'] },
    { title: 'Mes', dataIndex: 'planMonth', responsive: ['md'] },
    { title: '', key: 'actions', width: 50, render: (_, r) => (
      <Popconfirm title="Segura que quieres eliminar este pago?" onConfirm={() => handleDelete(r.id)}>
        <Button size="small" icon={<DeleteOutlined />} danger type="text" />
      </Popconfirm>
    )}
  ]

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>Pagos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true) }}>
          Registrar Pago
        </Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12}>
          <Card bodyStyle={{ padding: 12 }}>
            <Statistic title="Total del Mes" value={total} prefix={<DollarOutlined />} suffix="$" valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card bodyStyle={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <DatePicker
              picker="month"
              value={dayjs(`${year}-${month}`, 'YYYY-M')}
              onChange={(d) => { if (d) { setMonth(d.month() + 1); setYear(d.year()) } }}
              style={{ width: '100%' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros + Pendientes */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <Button size="small" type={filter === 'all' ? 'primary' : 'default'} onClick={() => setFilter('all')} style={{ borderRadius: 8 }}>Todos</Button>
          <Button size="small" type={filter === 'paid' ? 'primary' : 'default'} onClick={() => setFilter('paid')} style={{ borderRadius: 8 }}>Al dia</Button>
          <Button size="small" type={filter === 'pending' ? 'primary' : 'default'} onClick={() => setFilter('pending')} style={{ borderRadius: 8, background: filter === 'pending' ? '#ff4d4f' : undefined, borderColor: filter === 'pending' ? '#ff4d4f' : undefined }}>Pendientes</Button>
        </div>
        {filter === 'pending' && (
          <div>
            <Text style={{ fontSize: 12, color: '#ff4d4f', display: 'block', marginBottom: 8 }}>Alumnas con cuota vencida:</Text>
            {clients.filter(c => c.status === 'expired').length === 0 ? (
              <Text style={{ color: '#52c41a', fontSize: 12 }}>Todas al dia!</Text>
            ) : (
              clients.filter(c => c.status === 'expired').map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <Text style={{ fontSize: 13 }}>{c.name} {c.lastName}</Text>
                  <Text style={{ fontSize: 11, color: '#ff4d4f' }}>Vencio {dayjs(c.expirationDate).format('DD/MM')}</Text>
                </div>
              ))
            )}
          </div>
        )}
        {filter === 'paid' && (
          <div>
            <Text style={{ fontSize: 12, color: '#52c41a', display: 'block', marginBottom: 8 }}>Alumnas al dia:</Text>
            {clients.filter(c => c.status === 'active').map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                <Text style={{ fontSize: 13 }}>{c.name} {c.lastName}</Text>
                <Text style={{ fontSize: 11, color: '#52c41a' }}>Vence {dayjs(c.expirationDate).format('DD/MM')}</Text>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ overflowX: 'auto' }}>
        <Table dataSource={payments} columns={columns} rowKey="id" size="small" scroll={{ x: 450 }} pagination={{ pageSize: 15, size: 'small' }} />
      </div>

      {/* Modal registrar pago */}
      <Modal title="Registrar Pago" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} okText="Registrar">
        <Form form={form} layout="vertical" size="small">
          <Form.Item name="clientId" label="Alumna" rules={[{ required: true, message: 'Seleccioná una alumna' }]}>
            <Select
              showSearch
              placeholder="Buscar alumna..."
              optionFilterProp="children"
              filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
            >
              {clients.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name} {c.lastName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Monto ($)" rules={[{ required: true, message: 'Selecciona el monto' }]}>
            <Select placeholder="Seleccionar monto">
              <Select.Option value={25000}>$25.000 - 2 veces por semana</Select.Option>
              <Select.Option value={30000}>$30.000 - 3 veces por semana</Select.Option>
              <Select.Option value={35000}>$35.000 - Semana completa</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="paymentMethod" label="Método de Pago" initialValue="cash">
            <Select>
              <Select.Option value="cash">Efectivo</Select.Option>
              <Select.Option value="transfer">Transferencia</Select.Option>
              <Select.Option value="card">Tarjeta</Select.Option>
              <Select.Option value="mercadopago">MercadoPago</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="planMonth" label="Mes que paga">
            <Select placeholder="Seleccionar mes">
              <Select.Option value="Enero 2026">Enero 2026</Select.Option>
              <Select.Option value="Febrero 2026">Febrero 2026</Select.Option>
              <Select.Option value="Marzo 2026">Marzo 2026</Select.Option>
              <Select.Option value="Abril 2026">Abril 2026</Select.Option>
              <Select.Option value="Mayo 2026">Mayo 2026</Select.Option>
              <Select.Option value="Junio 2026">Junio 2026</Select.Option>
              <Select.Option value="Julio 2026">Julio 2026</Select.Option>
              <Select.Option value="Agosto 2026">Agosto 2026</Select.Option>
              <Select.Option value="Septiembre 2026">Septiembre 2026</Select.Option>
              <Select.Option value="Octubre 2026">Octubre 2026</Select.Option>
              <Select.Option value="Noviembre 2026">Noviembre 2026</Select.Option>
              <Select.Option value="Diciembre 2026">Diciembre 2026</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Payments
