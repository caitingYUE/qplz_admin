import React, { useState } from 'react';
import {
  Table,
  Card,
  Typography,
  Space,
  Button,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { Registration } from '../types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const RegistrationList: React.FC = () => {
  // 模拟数据
  const [registrations] = useState<Registration[]>([
    {
      id: '1',
      eventId: '1',
      eventName: '女性创业分享会',
      userName: '张小明',
      phone: '13800138001',
      wechat: 'zhangxiaoming',
      note: '对创业话题很感兴趣',
      registeredAt: '2024-01-10 14:30:00',
      status: 'confirmed',
    },
    {
      id: '2',
      eventId: '1',
      eventName: '女性创业分享会',
      userName: '李小红',
      phone: '13800138002',
      wechat: 'lixiaohong',
      note: '',
      registeredAt: '2024-01-11 09:15:00',
      status: 'confirmed',
    },
    {
      id: '3',
      eventId: '2',
      eventName: '职场沟通技巧工作坊',
      userName: '王小丽',
      phone: '13800138003',
      wechat: 'wangxiaoli',
      note: '希望提升沟通能力',
      registeredAt: '2024-01-12 16:45:00',
      status: 'confirmed',
    },
  ]);

  const [filteredData, setFilteredData] = useState(registrations);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    eventName: '',
    userName: '',
    status: '',
    dateRange: null as any,
  });

  // 统计数据
  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
    today: registrations.filter(r => 
      new Date(r.registeredAt).toDateString() === new Date().toDateString()
    ).length,
  };

  // 搜索过滤
  const handleSearch = () => {
    let filtered = registrations;

    if (filters.eventName) {
      filtered = filtered.filter(item => 
        item.eventName.toLowerCase().includes(filters.eventName.toLowerCase())
      );
    }

    if (filters.userName) {
      filtered = filtered.filter(item => 
        item.userName.toLowerCase().includes(filters.userName.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.registeredAt);
        return itemDate >= start.toDate() && itemDate <= end.toDate();
      });
    }

    setFilteredData(filtered);
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({
      eventName: '',
      userName: '',
      status: '',
      dateRange: null,
    });
    setFilteredData(registrations);
  };

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['活动名称', '姓名', '电话', '微信号', '备注', '报名时间', '状态'].join(','),
      ...filteredData.map(item => [
        item.eventName,
        item.userName,
        item.phone,
        item.wechat,
        item.note || '',
        item.registeredAt,
        item.status === 'confirmed' ? '已确认' : '已取消'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '报名数据.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('导出成功！');
  };

  // 查看详情
  const handleViewDetail = (record: Registration) => {
    setSelectedRegistration(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'eventName',
      key: 'eventName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '姓名',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      width: 120,
    },
    {
      title: '报名时间',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      width: 150,
      render: (text: string) => text.replace(' ', '\n'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: Registration['status']) => (
        <Tag color={status === 'confirmed' ? 'green' : 'red'}>
          {status === 'confirmed' ? '已确认' : '已取消'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (record: Registration) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>报名管理</Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
        >
          导出数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总报名数"
              value={stats.total}
              valueStyle={{ color: '#b01c02' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已确认"
              value={stats.confirmed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已取消"
              value={stats.cancelled}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={stats.today}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索过滤 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Input
              placeholder="活动名称"
              value={filters.eventName}
              onChange={(e) => setFilters({ ...filters, eventName: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="姓名"
              value={filters.userName}
              onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `共 ${total} 条记录，显示 ${range[0]}-${range[1]} 条`,
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="报名详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedRegistration && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="活动名称">
              {selectedRegistration.eventName}
            </Descriptions.Item>
            <Descriptions.Item label="姓名">
              {selectedRegistration.userName}
            </Descriptions.Item>
            <Descriptions.Item label="电话">
              {selectedRegistration.phone}
            </Descriptions.Item>
            <Descriptions.Item label="微信号">
              {selectedRegistration.wechat}
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {selectedRegistration.note || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="报名时间">
              {selectedRegistration.registeredAt}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedRegistration.status === 'confirmed' ? 'green' : 'red'}>
                {selectedRegistration.status === 'confirmed' ? '已确认' : '已取消'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationList; 