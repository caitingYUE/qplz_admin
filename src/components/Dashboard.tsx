import React from 'react';
import { Card, Row, Col, Statistic, List, Typography } from 'antd';
import { CalendarOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useEvents } from '../hooks/useEvents';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { events } = useEvents();

  // 基于真实数据计算统计信息
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(event => event.status === 'published').length,
    totalRegistrations: events.reduce((sum, event) => sum + event.currentParticipants, 0),
    todayRegistrations: Math.floor(Math.random() * 30), // 模拟今日新增
  };

  // 获取最近的活动（最多3个）
  const recentEvents = events
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(event => ({
      id: event.id,
      name: event.name,
      date: event.startTime.split(' ')[0],
      registrations: event.currentParticipants,
    }));

  // 模拟最新报名数据（使用真实活动名称）
  const recentRegistrations = events.slice(0, 3).map((event, index) => ({
    id: `reg-${index + 1}`,
    userName: ['张小明', '李小红', '王小丽'][index] || '匿名用户',
    eventName: event.name,
    time: `${8 + index * 2}:${15 + index * 15}`,
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Title level={2} style={{ margin: '0 0 16px 0', flexShrink: 0 }}>仪表板</Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活动总数"
              value={stats.totalEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#b01c02' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中活动"
              value={stats.activeEvents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总报名人数"
              value={stats.totalRegistrations}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增报名"
              value={stats.todayRegistrations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 内容区域 */}
      <Row gutter={16} style={{ flex: 1, overflow: 'hidden' }}>
        <Col span={12} style={{ height: '100%' }}>
          <Card title="最近活动" bordered={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={recentEvents}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={`${item.date} | ${item.registrations} 人报名`}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
        <Col span={12} style={{ height: '100%' }}>
          <Card title="最新报名" bordered={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={recentRegistrations}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.userName}
                      description={`报名 ${item.eventName} | ${item.time}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 