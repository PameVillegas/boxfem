import React, { useEffect, useState } from 'react'
import { Table, Typography, DatePicker, Statistic, Row, Col, Card, Tag, Button, Modal, Form, Input, Select, message } from 'antd'
import { DollarOutlined, PlusOutlined } from '@ant-design/icons'
import { paymentsAPI, clientsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

function Payments() {
  const [payments, setPayments] = useState([])
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [month, setMonth] = useState(dayjs().month() + 1)
  const [year, setYear] = useState(dayjs().year())
  const [modalVisible, setModalVisible] = useState(false)
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

  const methodLabels = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', mercadopago: 'MercadoPago' }

  const columns = [
    { title: 'Fecha', dataIndex: 'paymentDate', render: (d) => dayjs(d).format('DD/MM/YY'), width: 80 },
    { title: 'Cliente', key: 'client', ellipsis: true, render: (_, r) => {
      const c = r.Client || r.client
      return c ? `${c.name} ${c.lastName}` : 'N/A'
    }},
    { title: 'Monto', dataIndex: 'amount', render: (v) => `$${v}`, width: 80 },
    { title: 'Método', dataIndex: 'paymentMethod', render: (m) => <Tag>{methodLabels[m] || m}</Tag>, responsive: ['md'] },
    { title: 'Mes', dataIndex: 'planMonth', responsive: ['md'] }
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
          <Form.Item name="amount" label="Monto ($)" rules={[{ required: true, message: 'Ingresá el monto' }]}>
            <Input type="number" placeholder="Ej: 15000" />
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
            <Input placeholder="Ej: Junio 2026" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Payments
