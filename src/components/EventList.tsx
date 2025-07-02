import React from 'react';
import { Table, Button, Space, Tag, message, Typography, Card, Dropdown, Modal } from 'antd';
import type { MenuProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PictureOutlined, MoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import { useEvents } from '../hooks/useEvents';

const { Title } = Typography;

const EventList: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading, deleteEvent, updateEventStatus } = useEvents();

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个活动吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const result = await deleteEvent(id);
        if (result.success) {
          message.success('删除成功');
        } else {
          message.error(result.error || '删除失败');
        }
      },
    });
  };

  const handleStatusChange = async (id: string, status: Event['status']) => {
    const result = await updateEventStatus(id, status);
    if (result.success) {
      message.success('状态更新成功');
    } else {
      message.error(result.error || '状态更新失败');
    }
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 140,
      render: (startTime: string, record: Event) => (
        <div>
          <div style={{ fontSize: '13px' }}>{startTime.split(' ')[0]}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {startTime.split(' ')[1]} - {record.endTime.split(' ')[1]}
          </div>
        </div>
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 160,
      ellipsis: true,
      render: (location: string) => (
        <div title={location} style={{ maxWidth: '140px' }}>
          {location}
        </div>
      ),
    },
    {
      title: '报名情况',
      key: 'participants',
      width: 100,
      align: 'center' as const,
      render: (record: Event) => {
        const percentage = Math.round((record.currentParticipants / record.maxParticipants) * 100);
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
              {record.currentParticipants}/{record.maxParticipants}
            </div>
            <div style={{ fontSize: '11px', color: percentage > 90 ? '#f5222d' : '#666' }}>
              {percentage}%
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center' as const,
      render: (status: Event['status']) => {
        const statusConfig = {
          draft: { color: 'orange', text: '草稿' },
          published: { color: 'green', text: '已发布' },
          offline: { color: 'red', text: '已下线' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (record: Event) => {
        const getMoreMenuItems = (record: Event): MenuProps['items'] => [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: '预览',
            onClick: () => {/* 预览逻辑 */}
          },
          {
            key: 'poster',
            icon: <PictureOutlined />,
            label: '生成海报',
            onClick: () => {
              // 跳转到活动编辑页面，并通过URL参数触发海报生成
              navigate(`/edit-event/${record.id}?openPoster=true`);
            }
          },
          {
            key: 'status',
            label: record.status === 'published' ? '下线' : '发布',
            onClick: () => {
              const newStatus = record.status === 'published' ? 'offline' : 'published';
              handleStatusChange(record.id, newStatus);
            }
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => handleDelete(record.id)
          },
        ];

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/edit-event/${record.id}`)}
            >
              编辑
            </Button>
            <Dropdown
              menu={{ items: getMoreMenuItems(record) }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="link" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <Title level={2} style={{ margin: 0 }}>活动管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/create-event')}
          style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
        >
          创建活动
        </Button>
      </div>
      
      <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
          scroll={{ x: 850, y: 'calc(100vh - 300px)' }}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `共 ${total} 条记录，显示 ${range[0]}-${range[1]} 条`,
            pageSizeOptions: ['10', '20', '50'],
            position: ['bottomRight'],
          }}
        />
      </Card>
    </div>
  );
};

export default EventList; 