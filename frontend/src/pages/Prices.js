import React, { useEffect, useState } from 'react'
import { Card, Typography, InputNumber, Button, Spin, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { settingsAPI } from '../services/api'

const { Title, Text } = Typography

const CARD_STYLE = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#1e1e22'
}

function Prices() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prices, setPrices] = useState({
    price_2x: 25000,
    price_3x: 30000,
    price_completa: 35000
  })

  useEffect(() => {
    loadPrices()
  }, [])

  const loadPrices = async () => {
    setLoading(true)
    try {
      const res = await settingsAPI.getAll()
      const map = {}
      res.data.forEach(s => { map[s.key] = Number(s.value) })
      setPrices({
        price_2x: map.price_2x || 25000,
        price_3x: map.price_3x || 30000,
        price_completa: map.price_completa || 35000
      })
    } catch (e) {
      message.error('Error al cargar precios')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const key of ['price_2x', 'price_3x', 'price_completa']) {
        await settingsAPI.update(key, prices[key])
      }
      message.success('Precios actualizados')
    } catch (e) {
      message.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const fields = [
    { key: 'price_2x', label: '2 veces por semana', desc: 'Plan 2x sem' },
    { key: 'price_3x', label: '3 veces por semana', desc: 'Plan 3x sem' },
    { key: 'price_completa', label: 'Semana completa', desc: 'Plan Completa' }
  ]

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <Title level={4} style={{ margin: 0, marginBottom: 6 }}>Precios</Title>
      <Text style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 20 }}>
        Editá los valores y se reflejarán automáticamente en el panel de alumnas y en el registro de pagos.
      </Text>

      <Card bodyStyle={{ padding: 20 }} style={CARD_STYLE}>
        {fields.map(f => (
          <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <Text style={{ color: '#fff', fontSize: 14, display: 'block' }}>{f.label}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>{f.desc}</Text>
            </div>
            <InputNumber
              min={0}
              value={prices[f.key]}
              onChange={(v) => setPrices(prev => ({ ...prev, [f.key]: v || 0 }))}
              formatter={(v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(v) => v.replace(/\$\s?|\./g, '')}
              style={{ width: 150, borderRadius: 10 }}
            />
          </div>
        ))}
        <div style={{ marginTop: 20 }}>
          <Button type="primary" icon={<SaveOutlined />} block loading={saving} onClick={handleSave} style={{ borderRadius: 12, height: 44, fontWeight: 600 }}>
            Guardar precios
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Prices
