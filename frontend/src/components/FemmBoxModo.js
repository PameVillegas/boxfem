import React, { useState, useEffect } from 'react'
import { Modal, Typography, Button } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'

const { Title, Text } = Typography

// El codigo guardado en la base es el `key`. Emoji, nombre y mensaje vive
// solo en el frontend, asi la base queda normalizada para futuras estadisticas.
export const MODOS = [
  {
    key: 'guerrera',
    emoji: '🔥',
    name: 'GUERRERA',
    message: '¡Eso queríamos ver! 🔥 Hoy viniste a darlo todo. Disfrutá el entrenamiento y recordá: cada vez que aparecés, estás un paso más cerca de tu objetivo. 💪'
  },
  {
    key: 'tranqui',
    emoji: '😴',
    name: 'TRANQUI',
    message: 'No todos los días tienen que ser iguales. Hoy viniste, y eso ya cuenta. Entrená a tu ritmo y disfrutá el proceso. 💜'
  },
  {
    key: 'descarga',
    emoji: '😤',
    name: 'DESCARGA',
    message: 'Dejá afuera todo lo que te pesa. Este momento es para vos. Respirás, te movés y soltás. 🔥'
  },
  {
    key: 'fuerza',
    emoji: '💪',
    name: 'FUERZA',
    message: 'La fuerza también se construye en los días difíciles. Seguí, aunque hoy cueste un poquito más. 💪'
  },
  {
    key: 'recuperacion',
    emoji: '❤️',
    name: 'RECUPERACIÓN',
    message: 'Escuchar a tu cuerpo también es parte del entrenamiento. Cuidarte hoy también es avanzar. ❤️'
  },
  {
    key: 'sin_ganas',
    emoji: '🥱',
    name: 'SIN GANAS',
    message: 'No siempre vas a tener ganas. Pero hoy viniste igual, y eso también es constancia. 💜 ¡Ahora a entrenar!'
  }
]

export const getModo = (key) => MODOS.find(m => m.key === key)

// Modal de "FemmBox Modo". Es opcional y postergable: elegir "Ahora no" cierra
// sin llamar a onSave, y la asistencia queda como estaba.
function FemmBoxModo({ open, initialMode, saving, saveError, onSave, onClose }) {
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('choose')

  useEffect(() => {
    if (open) {
      setSelected(initialMode || null)
      setPhase(initialMode ? 'message' : 'choose')
    }
  }, [open, initialMode])

  const current = getModo(selected)

  const handleSave = async () => {
    if (!selected) return
    await onSave(selected)
  }

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      width={420}
      centered
      styles={{ content: { borderRadius: 20, background: '#141414', border: '1px solid rgba(255,20,147,0.25)', padding: 20, maxWidth: '94vw' } }}
    >
      <AnimatePresence mode="wait">
        {phase === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: 'center' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: 4 }}>¡Asistencia registrada! ✅</Title>
            <Text style={{ color: '#ff69b4', fontSize: 15, display: 'block', marginBottom: 16 }}>¿Cómo llegaste hoy? 💜</Text>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {MODOS.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setSelected(m.key); setPhase('message') }}
                  style={{
                    background: '#0f0f0f',
                    border: '1px solid #222',
                    borderRadius: 14,
                    padding: '14px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: 24, lineHeight: 1.2 }}>{m.emoji}</div>
                  <div style={{ color: '#ff69b4', fontSize: 11, fontWeight: 600, marginTop: 4 }}>MODO {m.name}</div>
                </button>
              ))}
            </div>

            <Button
              block
              onClick={onClose}
              style={{ marginTop: 14, borderRadius: 12, color: '#888', border: '1px solid #333', background: 'transparent' }}
            >
              Ahora no
            </Button>
            <Text style={{ color: '#555', fontSize: 11, display: 'block', marginTop: 8 }}>
              Tu asistencia ya quedó registrada. Podés elegirlo después, hoy mismo.
            </Text>
          </motion.div>
        )}

        {phase === 'message' && current && (
          <motion.div
            key="message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: 52, lineHeight: 1.1 }}>{current.emoji}</div>
            <Title level={4} style={{ color: '#ff1493', margin: '6px 0 14px' }}>MODO {current.name}</Title>
            <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, textAlign: 'left', display: 'block' }}>
                {current.message}
              </Text>
            </div>

            {saveError && (
              <div style={{ background: '#1f1010', border: '1px solid #5c1c1c', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
                <Text style={{ color: '#ff8f8f', fontSize: 12 }}>{saveError}</Text>
              </div>
            )}

            <Button
              type="primary"
              block
              size="large"
              loading={saving}
              onClick={handleSave}
              style={{ borderRadius: 12, height: 46 }}
            >
              Guardar mi modo
            </Button>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button
                block
                onClick={() => setPhase('choose')}
                disabled={saving}
                style={{ borderRadius: 12, color: '#aaa', border: '1px solid #333', background: 'transparent' }}
              >
                Elegir otro
              </Button>
              <Button
                block
                onClick={onClose}
                disabled={saving}
                style={{ borderRadius: 12, color: '#888', border: '1px solid #333', background: 'transparent' }}
              >
                Ahora no
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

export default FemmBoxModo
