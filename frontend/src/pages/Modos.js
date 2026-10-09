import React, { useEffect, useState } from 'react'
import { Card, Typography, DatePicker, Tag, Spin, Empty } from 'antd'
import { attendanceAPI } from '../services/api'
import { MODOS, getModo } from '../components/FemmBoxModo'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const { Title, Text } = Typography

const CARD_STYLE = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#1e1e22',
  marginBottom: 12
}

function Modos() {
  const [date, setDate] = useState(dayjs())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { load(date) }, [])

  const load = async (d) => {
    setLoading(true)
    try {
      const res = await attendanceAPI.getAll(d.format('YYYY-MM-DD'))
      setRows(res.data)
    } catch (e) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const handleDate = (d) => {
    if (!d) return
    setDate(d)
    load(d)
  }

  const counts = {}
  rows.forEach(a => { const k = a.modo || '__none__'; counts[k] = (counts[k] || 0) + 1 })

  const fecha = date.format('dddd DD [de] MMMM')
  const fechaLabel = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Title level={4} style={{ margin: 0, marginBottom: 6 }}>Modos</Title>
      <Text style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 16 }}>
        Mirá cómo llegaron tus alumnas cada día. 💜
      </Text>

      <Card bodyStyle={{ padding: 16 }} style={CARD_STYLE}>
        <Text style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>Elegí una fecha:</Text>
        <DatePicker value={date} onChange={handleDate} style={{ width: '100%' }} allowClear={false} />
        <Text style={{ fontSize: 12, color: '#666', display: 'block', marginTop: 8 }}>{fechaLabel}</Text>
      </Card>

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : rows.length === 0 ? (
        <Card bodyStyle={{ padding: 24 }} style={CARD_STYLE}>
          <Empty description={<span style={{ color: '#666' }}>Sin asistencias en esta fecha</span>} />
        </Card>
      ) : (
        <>
          <Card bodyStyle={{ padding: 16 }} style={CARD_STYLE}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              Resumen — {rows.length} asistencia{rows.length === 1 ? '' : 's'}
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MODOS.filter(m => counts[m.key] > 0).map(m => (
                <Tag key={m.key} color="magenta" style={{ borderRadius: 10, padding: '4px 10px', fontSize: 12 }}>
                  {m.emoji} {m.name} · {counts[m.key]}
                </Tag>
              ))}
              {counts.__none__ > 0 && (
                <Tag style={{ borderRadius: 10, padding: '4px 10px', fontSize: 12 }}>
                  Sin modo · {counts.__none__}
                </Tag>
              )}
            </div>
          </Card>

          <Card bodyStyle={{ padding: 0 }} style={CARD_STYLE}>
            {rows.map((a) => {
              const m = getModo(a.modo)
              const name = a.Client ? `${a.Client.name || ''} ${a.Client.lastName || ''}`.trim() : 'Alumna'
              return (
                <div
                  key={a.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{m ? m.emoji : '➖'}</span>
                    <div>
                      <Text style={{ color: '#fff', fontSize: 14, display: 'block' }}>{name || 'Alumna'}</Text>
                      <Text style={{ color: '#666', fontSize: 11 }}>
                        {a.Class?.name || 'Sin turno'}{a.Class?.startTime ? ` · ${a.Class.startTime}` : ''}
                      </Text>
                    </div>
                  </div>
                  {m ? (
                    <Tag color="magenta" style={{ borderRadius: 10, margin: 0 }}>MODO {m.name}</Tag>
                  ) : (
                    <Tag style={{ borderRadius: 10, margin: 0, color: '#888' }}>Sin modo</Tag>
                  )}
                </div>
              )
            })}
          </Card>
        </>
      )}
    </div>
  )
}

export default Modos
