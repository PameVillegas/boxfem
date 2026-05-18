import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, TimePicker, Tag, Typography, Space, message, List, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, TeamOutlined, UserDeleteOutlined } from '@ant-design/icons'
import { classesAPI, clientsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function Classes() {
  const [classes, setClasses] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [enrollModal, setEnrollModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
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
    try {
      const res = await clientsAPI.getAll()
      setClients(res.data)
    } catch (e) {}
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
      enrollForm.resetFields()
      loadClasses()
      message.success('Alumna inscripta')
    } catch (error) {
      message.error(error.response?.data?.error || 'Error inscribiendo')
    }
  }

  const handleUnenroll = async (classId, clientId) => {
    try {
      await classesAPI.unenroll(classId, clientId)
      loadClasses()
      message.success('Alumna desinscripta')
    } catch (error) {
      message.error('Error')
    }
  }

  const typeLabels = {
    boxing: 'Boxeo', functional: 'Funcional', spinning: 'Spinning', crossfit: 'Crossfit',
    yoga: 'Yoga', pilates: 'Pilates', personal: 'Personal'
  }

  const dayLabels = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
    friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  }

  const columns = [
    { title: 'Clase', dataIndex: 'name', ellipsis: true },
    { title: 'Tipo', dataIndex: 'type', render: (t) => <Tag>{typeLabels[t] || t}</Tag>, responsive: ['md'] },
    { title: 'Día', dataIndex: 'dayOfWeek', render: (d) => dayLabels[d] || d || '-', responsive: ['md'] },
    { title: 'Horario', key: 'time', render: (_, r) => `${r.startTime}-${r.endTime}`, width: 100 },
    { title: 'Alumnas', key: 'enrolled', width: 70, render: (_, r) => (
      <Button type="link" size="small" onClick={() => { setSelectedClass(r); setViewModal(true) }}>
        {r.Clients?.length || 0}/{r.capacity}
      </Button>
    )},
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<TeamOutlined />} onClick={() => { setSelectedClass(r); setEnrollModal(true) }} />
          <Button size="small" icon={<EditOutlined />} onClick={() => {
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

  // Alumnas que no están inscriptas en la clase seleccionada
  const availableClients = clients.filter(c =>
    c.status === 'active' && !selectedClass?.Clients?.some(enrolled => enrolled.id === c.id)
  )

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>Clases</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedClass(null); form.resetFields(); setModalVisible(true) }}>
          Nueva Clase
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <Table dataSource={classes} columns={columns} loading={loading} rowKey="id" size="small" scroll={{ x: 500 }} />
      </div>

      {/* Modal crear/editar clase */}
      <Modal title={selectedClass ? 'Editar Clase' : 'Nueva Clase'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical" size="small">
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
          <Form.Item name="instructor" label="Instructora" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dayOfWeek" label="Día">
            <Select placeholder="Seleccionar día">
              <Select.Option value="monday">Lunes</Select.Option>
              <Select.Option value="tuesday">Martes</Select.Option>
              <Select.Option value="wednesday">Miércoles</Select.Option>
              <Select.Option value="thursday">Jueves</Select.Option>
              <Select.Option value="friday">Viernes</Select.Option>
              <Select.Option value="saturday">Sábado</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="startTime" label="Hora Inicio" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endTime" label="Hora Fin" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="capacity" label="Capacidad" initialValue={20}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal inscribir alumna */}
      <Modal title={`Inscribir en: ${selectedClass?.name || ''}`} open={enrollModal} onOk={handleEnroll} onCancel={() => { setEnrollModal(false); enrollForm.resetFields() }} okText="Inscribir">
        <Form form={enrollForm} layout="vertical">
          <Form.Item name="clientId" label="Alumna" rules={[{ required: true, message: 'Seleccioná una alumna' }]}>
            <Select
              showSearch
              placeholder="Buscar alumna..."
              optionFilterProp="children"
              filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
            >
              {availableClients.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name} {c.lastName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        {selectedClass?.Clients?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Inscriptas ({selectedClass.Clients.length}/{selectedClass.capacity}):</Text>
            <List
              size="small"
              dataSource={selectedClass.Clients}
              renderItem={(c) => (
                <List.Item actions={[
                  <Popconfirm title="Desinscribir?" onConfirm={() => handleUnenroll(selectedClass.id, c.id)}>
                    <Button size="small" icon={<UserDeleteOutlined />} danger type="text" />
                  </Popconfirm>
                ]}>
                  {c.name} {c.lastName}
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      {/* Modal ver alumnas */}
      <Modal title={`Alumnas en: ${selectedClass?.name || ''}`} open={viewModal} onCancel={() => setViewModal(false)} footer={null}>
        {selectedClass?.Clients?.length > 0 ? (
          <List
            dataSource={selectedClass.Clients}
            renderItem={(c) => (
              <List.Item actions={[
                <Popconfirm title="Desinscribir?" onConfirm={() => { handleUnenroll(selectedClass.id, c.id); setViewModal(false) }}>
                  <Button size="small" danger type="text">Quitar</Button>
                </Popconfirm>
              ]}>
                <List.Item.Meta title={`${c.name} ${c.lastName}`} description={c.phone} />
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No hay alumnas inscriptas en esta clase</Text>
        )}
      </Modal>
    </div>
  )
}

export default Classes
