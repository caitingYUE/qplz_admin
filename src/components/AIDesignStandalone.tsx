import React, { useState, useEffect } from 'react';
import { Button, Typography, Alert, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AIDesignDialog from './AIDesignDialog';
import type { Event } from '../types';

const { Title, Paragraph } = Typography;

const AIDesignStandalone: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [eventData, setEventData] = useState<Partial<Event>>({});

  useEffect(() => {
    // 从URL参数获取活动数据
    const urlParams = new URLSearchParams(location.search);
    const eventFromUrl: Partial<Event> = {};
    
    if (urlParams.get('name')) {
      eventFromUrl.name = urlParams.get('name') || '';
    }
    if (urlParams.get('subtitle')) {
      eventFromUrl.subtitle = urlParams.get('subtitle') || '';
    }
    if (urlParams.get('startTime')) {
      eventFromUrl.startTime = urlParams.get('startTime') || '';
    }
    if (urlParams.get('endTime')) {
      eventFromUrl.endTime = urlParams.get('endTime') || '';
    }
    if (urlParams.get('location')) {
      eventFromUrl.location = urlParams.get('location') || '';
    }
    if (urlParams.get('description')) {
      eventFromUrl.description = urlParams.get('description') || '';
    }
    if (urlParams.get('fee')) {
      eventFromUrl.fee = urlParams.get('fee') || '';
    }
    if (urlParams.get('maxParticipants')) {
      const maxParticipants = urlParams.get('maxParticipants');
      eventFromUrl.maxParticipants = maxParticipants ? parseInt(maxParticipants, 10) : undefined;
    }

    // 从localStorage获取活动数据（作为备选）
    const savedEventData = localStorage.getItem('eventFormData');
    if (savedEventData) {
      try {
        const parsedData = JSON.parse(savedEventData);
        setEventData({ ...parsedData, ...eventFromUrl });
      } catch (error) {
        setEventData(eventFromUrl);
      }
    } else {
      setEventData(eventFromUrl);
    }

    // 如果有活动数据，自动打开对话框
    if (eventFromUrl.name || (savedEventData && JSON.parse(savedEventData).name)) {
      setDialogVisible(true);
    }
  }, [location.search]);

  const handleOpenDialog = () => {
    if (!eventData.name) {
      // 如果没有活动数据，跳转到创建活动页面
      navigate('/create-event');
      return;
    }
    setDialogVisible(true);
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      {/* 顶部导航 */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#fff'
            }}
          >
            返回
          </Button>
          <Title level={2} style={{ margin: 0, color: '#fff' }}>
            🎨 AI海报设计工具
          </Title>
        </Space>
      </div>

      {/* 主要内容 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎨</div>
          
          <Title level={1} style={{ color: '#333', marginBottom: '16px' }}>
            AI海报设计助手
          </Title>
          
          <Paragraph style={{ 
            fontSize: '16px', 
            color: '#666', 
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            智能化海报设计工具，支持多种尺寸和风格<br />
            一键生成专业海报，AI助力创意设计
          </Paragraph>

          {eventData.name ? (
            <div style={{ marginBottom: '32px' }}>
              <Alert
                message={`已获取活动信息：${eventData.name}`}
                description={`${eventData.location || '地点待定'} · ${eventData.startTime || '时间待定'}`}
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: '32px' }}>
              <Alert
                message="开始设计海报"
                description="请先创建活动或填写活动信息，然后使用AI生成专属海报"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            </div>
          )}

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleOpenDialog}
              style={{
                height: '56px',
                fontSize: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                width: '100%'
              }}
            >
              {eventData.name ? '🚀 开始AI设计' : '📝 创建活动'}
            </Button>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '32px',
              flexWrap: 'wrap',
              marginTop: '24px'
            }}>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                <div>竖图海报</div>
              </div>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💌</div>
                <div>邀请函</div>
              </div>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                <div>微信海报</div>
              </div>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
                <div>小红书海报</div>
              </div>
            </div>
          </Space>
        </div>
      </div>

      {/* AI设计对话框 */}
      <AIDesignDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        eventData={eventData}
      />
    </div>
  );
};

export default AIDesignStandalone; 