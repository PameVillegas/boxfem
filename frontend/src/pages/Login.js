import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'

const { Title, Text } = Typography

function Login() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await login(values)
      message.success('Bienvenida')
      navigate('/dashboard')
    } catch (error) {
      message.error('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)'
    }}>
      <Card style={{
        width: 400,
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img
            src="/logobox.png"
            alt="FemmBox"
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 16, border: '3px solid #e91e63' }}
          />
          <Title level={2} style={{ color: '#e91e63', marginBottom: 0 }}>FEMMBOX</Title>
          <Text style={{ color: '#888' }}>Gestión de Gimnasio de Boxeo</Text>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Ingrese usuario' }]}>
            <Input prefix={<UserOutlined />} placeholder="Usuario" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Ingrese contraseña' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#e91e63', borderColor: '#e91e63', height: 44, borderRadius: 8 }}>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
