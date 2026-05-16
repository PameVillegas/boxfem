import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Spin, List, Tag, Empty, Button, message } from 'antd'
import { UserOutlined, DollarOutlined, WarningOutlined, CheckCircleOutlined, BellOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { dashboardAPI, alertsAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertsAPI.getAll()
      ])
      setStats(statsRes.data)
      setAlerts(alertsRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (id) => {
    try {
      await alertsAPI.resolve(id)
      setAlerts(alerts.filter(a => a.id !== id))
      message.success('Alerta resuelta')
    } catch (error) {
      message.error('Error')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const chartData = stats?.popularClasses?.map(c => ({ name: c.name, inscritos: c.enrolledCount })) || []

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        </Col>
        <Col>
          {alerts.length > 0 && (
            <Tag color="red" style={{ padding: '4px 12px', fontSize: 14 }}>
              <BellOutlined /> {alerts.length} alerta{alerts.length > 1 ? 's' : ''} pendiente{alerts.length > 1 ? 's' : ''}
            </Tag>
          )}
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable onClick={() => navigate('/clients')}>
            <Statistic title="Total Clientes" value={stats?.totalClients || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="Clientes Activos" value={stats?.activeClients || 0} prefix={<CheckCircleOutlined style={{ color: 'green' }} />} valueStyle={{ color: 'green' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="Cuotas Vencidas" value={stats?.expiredClients || 0} prefix={<WarningOutlined style={{ color: 'red' }} />} valueStyle={{ color: 'red' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="Ingresos del Mes" value={stats?.monthlyIncome || 0} prefix={<DollarOutlined />} suffix="$" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="Asistencia de Hoy">
            <Statistic value={stats?.todayAttendance || 0} suffix="personas" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Clases Más Populares">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inscritos" fill="#e91e63" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {alerts.length > 0 && (
        <Row style={{ marginTop: 20 }}>
          <Col span={24}>
            <Card title={<span><BellOutlined /> Alertas y Recordatorios</span>}>
              <List
                dataSource={alerts}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={() => resolveAlert(item.id)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Tag color={item.type === 'surcharge' ? 'red' : item.type === 'expiration' ? 'orange' : 'blue'}>
                          {item.type === 'surcharge' ? 'Recargo' : item.type === 'expiration' ? 'Vencimiento' : 'Recordatorio'}
                        </Tag>
                      }
                      title={
                        <Text strong>
                          {item.Client ? `${item.Client.name} ${item.Client.lastName}` : 'Cliente'}
                        </Text>
                      }
                      description={item.message}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default Dashboard
