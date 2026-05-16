import React from 'react'
import { Layout, Menu, Typography, Space } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  DashboardOutlined, 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  WhatsAppOutlined,
  LogoutOutlined 
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'

const { Header } = Layout
const { Text } = Typography

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/clients', icon: <UserOutlined />, label: 'Clientes' },
    { key: '/payments', icon: <DollarOutlined />, label: 'Pagos' },
    { key: '/classes', icon: <CalendarOutlined />, label: 'Clases' },
    { key: '/attendance', icon: <CheckCircleOutlined />, label: 'Asistencia' },
    { key: '/whatsapp', icon: <WhatsAppOutlined />, label: 'WhatsApp' }
  ]

  return (
    <Header style={{
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(90deg, #e91e63, #d81b60)',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100
    }}>
      <img src="/logobox.jpeg" alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 12 }} />
      <div style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginRight: 40 }}>
        BOXFEM
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, background: 'transparent', borderBottom: 'none' }}
      />
      <Space style={{ color: 'white' }}>
        <Text style={{ color: 'white' }}>{user?.name || user?.username}</Text>
        <LogoutOutlined onClick={logout} style={{ fontSize: 18, cursor: 'pointer' }} />
      </Space>
    </Header>
  )
}

export default Navbar
