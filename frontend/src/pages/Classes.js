import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, TimePicker, Tag, Typography, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { classesAPI, clientsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

function Classes() {
  const [classes, setClasses] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [enrollModal, setEnrollModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [form] = Form.useForm()
  const [enrollForm] = Form.useForm()

  useEffect(() => { loadClasses(); loadClients() }, [])

  const loadClasses = async () => {
    setLoading(true)
    try {
      const res = await classesAPI.getAll()
      setClasses(res.data)
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    const res = await clientsAPI.getAll()
    setClients(res.data)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        startTime: values.startTime?.format ? values.startTime.format('HH:mm') : values.startTime,
        endTime: values.endTime?.format ? values.endTime.format('HH:mm') : values.endTime
      }
      if (selectedClass) {
        await classesAPI.update(selectedClass.id, payload)
      } else {
        await classesAPI.create(payload)
      }
      setModalVisible(false)
      form.resetFields()
      loadClasses()
      message.success('Clase guardada')
    } catch (error) {
      message.error('Error guardando clase')
    }
  }

  const handleEnroll = async () => {
    try {
      const values = await enrollForm.validateFields()
      await classesAPI.enroll(selectedClass.id, values.clientId)
      setEnrollModal(false)
      loadClasses()
      message.success('Cliente inscrito')
    } catch (error) {
      message.error('Error inscribiendo cliente')
    }
  }

  const typeLabels = {
    boxing: 'Boxeo', functional: 'Funcional', spinning: 'Spinning', crossfit: 'Crossfit',
    yoga: 'Yoga', pilates: 'Pilates', personal: 'Personal Trainer'
  }

  const columns = [
    { title: 'Clase', dataIndex: 'name' },
    { title: 'Tipo', dataIndex: 'type', render: (t) => <Tag>{typeLabels[t] || t}</Tag> },
    { title: 'Instructor', dataIndex: 'instructor' },
    { title: 'Horario', key: 'time', render: (_, r) => `${r.startTime} - ${r.endTime}` },
    { title: 'Inscritos', key: 'enrolled', render: (_, r) => r.Clients?.length || 0 },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => { setSelectedClass(r); setEnrollModal(true) }} />
          <Button icon={<EditOutlined />} onClick={() => {
            setSelectedClass(r)
            form.setFieldsValue({
              ...r,
              startTime: r.startTime ? dayjs(r.startTime, 'HH:mm') : null,
              endTime: r.endTime ? dayjs(r.endTime, 'HH:mm') : null
            })
            setModalVisible(true)
          }} />
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3}>Clases</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedClass(null); form.resetFields(); setModalVisible(true) }}>
          Nueva Clase
        </Button>
      </div>
      <Table dataSource={classes} columns={columns} loading={loading} rowKey="id" />
      
      <Modal title={selectedClass ? 'Editar Clase' : 'Nueva Clase'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="boxing">Boxeo</Select.Option>
              <Select.Option value="functional">Funcional</Select.Option>
              <Select.Option value="spinning">Spinning</Select.Option>
              <Select.Option value="crossfit">Crossfit</Select.Option>
              <Select.Option value="yoga">Yoga</Select.Option>
              <Select.Option value="pilates">Pilates</Select.Option>
              <Select.Option value="personal">Personal Trainer</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="instructor" label="Instructor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="startTime" label="Hora Inicio" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item name="endTime" label="Hora Fin" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item name="capacity" label="Capacidad" initialValue={20}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Inscribir Cliente" open={enrollModal} onOk={handleEnroll} onCancel={() => setEnrollModal(false)}>
        <Form form={enrollForm} layout="vertical">
          <Form.Item name="clientId" label="Cliente" rules={[{ required: true }]}>
            <Select>
              {clients.filter(c => c.status === 'active').map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name} {c.lastName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Classes
