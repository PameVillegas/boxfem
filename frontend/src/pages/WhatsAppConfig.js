import React, { useEffect, useState } from 'react'
import { Card, Typography, Spin, Tag, Image, Button, Input, Space, message, Alert, Divider } from 'antd'
import { ReloadOutlined, LogoutOutlined, WhatsAppOutlined, LinkOutlined, QrcodeOutlined } from '@ant-design/icons'
import { whatsappAPI } from '../services/api'

const { Title, Text } = Typography

function WhatsAppConfig() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testPhone, setTestPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [linkPhone, setLinkPhone] = useState('')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const interval = setInterval(loadStatus, 2500)
    loadStatus()
    return () => clearInterval(interval)
  }, [])

  const loadStatus = async () => {
    try {
      const res = await whatsappAPI.getStatus()
      setStatus(res.data)
    } catch (e) {}
    finally { setLoading(false) }
  }

  const requestCode = async () => {
    if (!linkPhone || linkPhone.length < 10) return message.warning('Ingresá tu número completo')
    setRequesting(true)
    try {
      // Enviar el número tal cual: el backend lo pasa directo a requestPairingCode
      const num = linkPhone.replace(/[^0-9]/g, '')
      await whatsappAPI.connectPhone(num)
      message.info('Solicitando código...')
    } catch (error) {
      message.error(error.response?.data?.error || 'Error')
    } finally {
      setTimeout(() => setRequesting(false), 5000)
    }
  }

  const handleStartQR = async () => {
    try {
      await whatsappAPI.startQR()
      message.info('Generando QR...')
    } catch (error) {
      message.error('Error')
    }
  }

  const sendTest = async () => {
    if (!testPhone) return message.warning('Ingresá un número')
    setSending(true)
    try {
      await whatsappAPI.sendTest(testPhone, `🧤 *BoxFem - Mensaje de prueba*\n\nHola! Este es un mensaje de prueba.\nLos recordatorios se enviarán automáticamente.`)
      message.success('Mensaje enviado!')
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  const triggerCheck = async () => {
    try {
      await whatsappAPI.triggerCheck()
      message.success('Verificación ejecutada')
    } catch (error) {
      message.error('Error')
    }
  }

  const handleRestart = async () => {
    try {
      await whatsappAPI.restart()
      message.info('Reiniciando...')
    } catch (error) {
      message.error('Error')
    }
  }

  const handleLogout = async () => {
    try {
      await whatsappAPI.logout()
      message.success('Sesión cerrada')
    } catch (error) {
      message.error('Error')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const renderConnection = () => {
    const state = status?.connectionState

    // Conectado
    if (status?.isReady) {
      return (
        <div>
          <Tag color="green" style={{ fontSize: 16, padding: '8px 20px' }}>✅ WhatsApp Conectado</Tag>
          <div style={{ marginTop: 20 }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRestart}>Reiniciar</Button>
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>Cerrar Sesión</Button>
            </Space>
          </div>
        </div>
      )
    }

    // Tiene código de pairing
    if (status?.pairingCode) {
      return (
        <div>
          <Title level={4}>Tu código de vinculación:</Title>
          <div style={{
            fontSize: 40, fontWeight: 'bold', letterSpacing: 10,
            padding: '20px 40px', background: '#f0f5ff',
            borderRadius: 12, display: 'inline-block', margin: '16px 0', fontFamily: 'monospace'
          }}>
            {status.pairingCode}
          </div>
          <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 380, margin: '20px auto' }}>
            <p><strong>En tu celular:</strong></p>
            <p>1. Abrí WhatsApp</p>
            <p>2. ⋮ Menú → Dispositivos vinculados</p>
            <p>3. Vincular dispositivo</p>
            <p>4. <strong>"Vincular con número de teléfono"</strong> (abajo del QR)</p>
            <p>5. Ingresá el código de arriba</p>
          </div>
          <Button onClick={handleRestart} style={{ marginTop: 12 }}>Cancelar</Button>
        </div>
      )
    }

    // Tiene QR
    if (status?.qrBase64) {
      return (
        <div>
          <Title level={4}>Escaneá el código QR</Title>
          <Image src={status.qrBase64} preview={false} style={{ width: 280 }} />
          <p style={{ marginTop: 16, color: '#888' }}>
            WhatsApp → Dispositivos vinculados → Vincular dispositivo
          </p>
          <Button icon={<ReloadOutlined />} onClick={handleRestart} style={{ marginTop: 12 }}>
            Generar nuevo QR
          </Button>
        </div>
      )
    }

    // Reconectando
    if (state === 'reconnecting') {
      return (
        <div>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Reconectando... (intento {status.retryCount})</p>
          <Button onClick={handleRestart} style={{ marginTop: 12 }}>Cancelar</Button>
        </div>
      )
    }

    // Solicitando código
    if (state === 'requesting_code') {
      return (
        <div>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Generando código de vinculación...</p>
        </div>
      )
    }

    // Estado inicial: elegir método
    return (
      <div>
        <Title level={4}>Vincular WhatsApp</Title>

        <Card type="inner" title={<span><LinkOutlined /> Opción 1: Código numérico (recomendado)</span>} style={{ marginBottom: 16, textAlign: 'left' }}>
          <p style={{ color: '#666' }}>
            Ingresá tu número <strong>completo con código de país</strong>, sin + ni espacios.
          </p>
          <Alert
            message="Ejemplo Argentina: 5493388431158 (54 + 9 + código área + número)"
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />
          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="large"
              placeholder="5493388431158"
              value={linkPhone}
              onChange={(e) => setLinkPhone(e.target.value)}
            />
            <Button type="primary" size="large" onClick={requestCode} loading={requesting}>
              Obtener Código
            </Button>
          </Space.Compact>
        </Card>

        <Card type="inner" title={<span><QrcodeOutlined /> Opción 2: Código QR</span>} style={{ textAlign: 'left' }}>
          <p style={{ color: '#666' }}>Generá un QR y escanealo desde WhatsApp.</p>
          <Button icon={<QrcodeOutlined />} onClick={handleStartQR}>
            Generar QR
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Title level={3}><WhatsAppOutlined /> WhatsApp</Title>

      <Card style={{ textAlign: 'center', marginBottom: 20 }}>
        {renderConnection()}
      </Card>

      {/* Probar envío */}
      <Card title="Probar Envío" style={{ marginBottom: 16 }}>
        <Alert message="Número sin 0 y sin 15. Ej: 3388431158" type="info" showIcon style={{ marginBottom: 12 }} />
        <Space>
          <Input
            placeholder="3388431158"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            style={{ width: 200 }}
            disabled={!status?.isReady}
          />
          <Button type="primary" onClick={sendTest} loading={sending} disabled={!status?.isReady}>
            Enviar Prueba
          </Button>
        </Space>
      </Card>

      {/* Verificación */}
      <Card title="Verificación de Pagos" style={{ marginBottom: 16 }}>
        <Button onClick={triggerCheck} disabled={!status?.isReady}>
          Ejecutar Verificación Ahora
        </Button>
      </Card>

      {/* Info */}
      <Card title="📅 Mensajes Automáticos">
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>9:30hs diario:</strong> Verifica vencimientos</li>
          <li><strong>Día 5, 8:00hs:</strong> Recordatorio de pago</li>
          <li><strong>Día 10, 8:00hs:</strong> Aviso de recargo 10%</li>
        </ul>
        <Text type="secondary">WhatsApp debe estar conectado para que funcionen.</Text>
      </Card>
    </div>
  )
}

export default WhatsAppConfig
