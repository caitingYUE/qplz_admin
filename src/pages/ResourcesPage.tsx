import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Rate, 
  Avatar, 
  Image, 
  Typography, 
  Card,
  message,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  WechatOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CustomerForm from '../components/CustomerForm';
import VenueForm from '../components/VenueForm';
import type { CustomerResource, VenueResource } from '../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ResourcesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState<CustomerResource[]>([]);
  const [venues, setVenues] = useState<VenueResource[]>([]);
  const [customerFormVisible, setCustomerFormVisible] = useState(false);
  const [venueFormVisible, setVenueFormVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResource | undefined>();
  const [editingVenue, setEditingVenue] = useState<VenueResource | undefined>();

  // 初始化数据
  useEffect(() => {
    loadCustomers();
    loadVenues();
  }, []);

  // 加载客户数据
  const loadCustomers = () => {
    const savedCustomers = localStorage.getItem('qplz_customers');
    if (savedCustomers) {
      try {
        setCustomers(JSON.parse(savedCustomers));
      } catch (error) {
        console.error('加载客户数据失败:', error);
      }
    }
  };

  // 加载场地数据
  const loadVenues = () => {
    const savedVenues = localStorage.getItem('qplz_venues');
    if (savedVenues) {
      try {
        setVenues(JSON.parse(savedVenues));
      } catch (error) {
        console.error('加载场地数据失败:', error);
      }
    }
  };

  // 保存客户数据
  const saveCustomers = (newCustomers: CustomerResource[]) => {
    localStorage.setItem('qplz_customers', JSON.stringify(newCustomers));
    setCustomers(newCustomers);
  };

  // 保存场地数据
  const saveVenues = (newVenues: VenueResource[]) => {
    localStorage.setItem('qplz_venues', JSON.stringify(newVenues));
    setVenues(newVenues);
  };

  // 客户相关操作
  const handleAddCustomer = (customerData: Omit<CustomerResource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: CustomerResource = {
      ...customerData,
      id: `customer_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const newCustomers = [...customers, newCustomer];
    saveCustomers(newCustomers);
    setCustomerFormVisible(false);
    message.success('客户资源添加成功！');
  };

  const handleEditCustomer = (customer: CustomerResource) => {
    setEditingCustomer(customer);
    setCustomerFormVisible(true);
  };

  const handleUpdateCustomer = (customerData: Omit<CustomerResource, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCustomer) return;
    
    const updatedCustomer: CustomerResource = {
      ...customerData,
      id: editingCustomer.id,
      createdAt: editingCustomer.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    const newCustomers = customers.map(c => 
      c.id === editingCustomer.id ? updatedCustomer : c
    );
    saveCustomers(newCustomers);
    setCustomerFormVisible(false);
    setEditingCustomer(undefined);
    message.success('客户资源更新成功！');
  };

  const handleDeleteCustomer = (id: string) => {
    const newCustomers = customers.filter(c => c.id !== id);
    saveCustomers(newCustomers);
    message.success('客户资源删除成功！');
  };

  // 场地相关操作
  const handleAddVenue = (venueData: Omit<VenueResource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVenue: VenueResource = {
      ...venueData,
      id: `venue_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const newVenues = [...venues, newVenue];
    saveVenues(newVenues);
    setVenueFormVisible(false);
    message.success('场地资源添加成功！');
  };

  const handleEditVenue = (venue: VenueResource) => {
    setEditingVenue(venue);
    setVenueFormVisible(true);
  };

  const handleUpdateVenue = (venueData: Omit<VenueResource, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingVenue) return;
    
    const updatedVenue: VenueResource = {
      ...venueData,
      id: editingVenue.id,
      createdAt: editingVenue.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    const newVenues = venues.map(v => 
      v.id === editingVenue.id ? updatedVenue : v
    );
    saveVenues(newVenues);
    setVenueFormVisible(false);
    setEditingVenue(undefined);
    message.success('场地资源更新成功！');
  };

  const handleDeleteVenue = (id: string) => {
    const newVenues = venues.filter(v => v.id !== id);
    saveVenues(newVenues);
    message.success('场地资源删除成功！');
  };

  // 客户表格列定义
  const customerColumns: ColumnsType<CustomerResource> = [
    {
      title: '头像',
      dataIndex: 'photo',
      key: 'photo',
      width: 80,
      render: (photo: string) => (
        photo ? (
          <Avatar size={50} src={<Image src={photo} />} />
        ) : (
          <Avatar size={50} icon={<UserOutlined />} />
        )
      )
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.contact && (
            <Text><PhoneOutlined /> {record.contact}</Text>
          )}
          {record.wechat && (
            <Text><WechatOutlined /> {record.wechat}</Text>
          )}
        </Space>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => <Tag color="blue">{source}</Tag>
    },
    {
      title: '星级',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating?: number) => (
        <Rate disabled value={rating || 0} />
      )
    },
    {
      title: '合作状态',
      dataIndex: 'hasCooperated',
      key: 'hasCooperated',
      render: (hasCooperated?: boolean) => (
        <Tag color={hasCooperated ? 'green' : 'orange'}>
          {hasCooperated ? '已合作' : '未合作'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditCustomer(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个客户资源吗？"
            onConfirm={() => handleDeleteCustomer(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 场地表格列定义
  const venueColumns: ColumnsType<VenueResource> = [
    {
      title: '照片',
      dataIndex: 'photo',
      key: 'photo',
      width: 80,
      render: (photo: string) => (
        photo ? (
          <Image 
            width={60} 
            height={60} 
            src={photo} 
            style={{ borderRadius: '6px', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ 
            width: 60, 
            height: 60, 
            background: '#f5f5f5', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <EnvironmentOutlined style={{ color: '#999' }} />
          </div>
        )
      )
    },
    {
      title: '场地名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
    },
    {
      title: '容纳人数',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity?: number) => (
        capacity ? `${capacity}人` : '未设置'
      )
    },
    {
      title: '对接人',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text><UserOutlined /> {record.contactPerson}</Text>
          <Text><PhoneOutlined /> {record.contactPhone}</Text>
        </Space>
      )
    },
    {
      title: '星级',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating?: number) => (
        <Rate disabled value={rating || 0} />
      )
    },
    {
      title: '合作状态',
      dataIndex: 'hasCooperated',
      key: 'hasCooperated',
      render: (hasCooperated?: boolean) => (
        <Tag color={hasCooperated ? 'green' : 'orange'}>
          {hasCooperated ? '已合作' : '未合作'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditVenue(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个场地资源吗？"
            onConfirm={() => handleDeleteVenue(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', height: '100vh', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#b01c02' }}>
          资源宝库
        </Title>
        <Text type="secondary">
          管理您的客户资源和场地资源，助力活动策划和商务合作
        </Text>
      </div>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (activeTab === 'customers') {
                  setEditingCustomer(undefined);
                  setCustomerFormVisible(true);
                } else {
                  setEditingVenue(undefined);
                  setVenueFormVisible(true);
                }
              }}
              style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
            >
              {activeTab === 'customers' ? '添加客户' : '添加场地'}
            </Button>
          }
        >
          <TabPane tab="客户资源" key="customers">
            <Table
              columns={customerColumns}
              dataSource={customers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条客户资源`
              }}
              locale={{
                emptyText: '暂无客户资源，点击添加按钮开始管理您的客户资源'
              }}
            />
          </TabPane>
          <TabPane tab="场地资源" key="venues">
            <Table
              columns={venueColumns}
              dataSource={venues}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条场地资源`
              }}
              locale={{
                emptyText: '暂无场地资源，点击添加按钮开始管理您的场地资源'
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 客户表单弹窗 */}
      <CustomerForm
        visible={customerFormVisible}
        customer={editingCustomer}
        onCancel={() => {
          setCustomerFormVisible(false);
          setEditingCustomer(undefined);
        }}
        onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
      />

      {/* 场地表单弹窗 */}
      <VenueForm
        visible={venueFormVisible}
        venue={editingVenue}
        onCancel={() => {
          setVenueFormVisible(false);
          setEditingVenue(undefined);
        }}
        onSubmit={editingVenue ? handleUpdateVenue : handleAddVenue}
      />
    </div>
  );
};

export default ResourcesPage; 