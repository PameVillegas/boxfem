import React, { useEffect, useState } from 'react'
import { Table, Typography, DatePicker, Statistic, Row, Col, Card, Tag, Space } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import { paymentsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

function Payments() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [month, setMonth] = useState(dayjs().month() + 1)
  const [year, setYear] = useState(dayjs().year())

  useEffect(() => { loadPayments() }, [month, year])

  const loadPayments = async () => {
    try {
      const res = await paymentsAPI.getMonthly(month, year)
      setPayments(res.data.payments)
      setTotal(res.data.total)
    } catch (error) {
      console.error(error)
    }
  }

  const columns = [
    { title: 'Fecha', dataIndex: 'paymentDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Cliente', key: 'client', render: (_, r) => {
      const c = r.Client || r.client
      return c ? `${c.name} ${c.lastName}` : 'N/A'
    } },
    { title: 'Monto', dataIndex: 'amount', render: (v) => `$${v}` },
    { title: 'Método', dataIndex: 'paymentMethod', render: (m) => <Tag>{m === 'cash' ? 'Efectivo' : m === 'transfer' ? 'Transferencia' : m === 'card' ? 'Tarjeta' : 'Mercado Pago'}</Tag> },
    { title: 'Mes Pagado', dataIndex: 'planMonth' },
    { title: 'Comprobante', dataIndex: 'receiptNumber' }
  ]

  return (
    <div>
      <Title level={3}>Pagos</Title>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card>
            <Statistic title="Total del Mes" value={total} prefix={<DollarOutlined />} suffix="$" />
          </Card>
        </Col>
        <Col span={12}>
          <DatePicker
            picker="month"
            value={dayjs(`${year}-${month}`, 'YYYY-MM')}
            onChange={(d) => { setMonth(d.month() + 1); setYear(d.year()) }}
            style={{ marginTop: 20 }}
          />
        </Col>
      </Row>
      <Table dataSource={payments} columns={columns} rowKey="id" />
    </div>
  )
}

export default Payments
