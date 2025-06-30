import React from 'react';
import { Modal, Button, Typography, Space, Alert } from 'antd';
import { EditOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface PosterUpdateNotificationProps {
  visible: boolean;
  onClose: () => void;
  onModifyExisting: () => void;
  onRegenerateNew: () => void;
  eventName: string;
  changedFields: string[];
}

const PosterUpdateNotification: React.FC<PosterUpdateNotificationProps> = ({
  visible,
  onClose,
  onModifyExisting,
  onRegenerateNew,
  eventName,
  changedFields
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QuestionCircleOutlined style={{ color: '#faad14' }} />
          <span>检测到活动信息变更</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>
            暂不更新
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={onModifyExisting}
            type="default"
          >
            在原海报上修改
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRegenerateNew}
            type="primary"
          >
            重新生成海报
          </Button>
        </Space>
      }
      width={500}
    >
      <div style={{ padding: '8px 0' }}>
        <Alert
          message="活动信息已更新"
          description={`检测到您修改了"${eventName}"的活动信息，是否需要更新对应的海报？`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Title level={5}>变更的信息：</Title>
        <ul style={{ 
          paddingLeft: '20px', 
          margin: '8px 0 16px 0',
          color: '#666'
        }}>
          {changedFields.map((field, index) => (
            <li key={index}>{field}</li>
          ))}
        </ul>

        <div style={{
          background: '#f6f6f6',
          padding: '12px',
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <Title level={5} style={{ marginBottom: '8px' }}>
            🔧 更新方式说明：
          </Title>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>在原海报上修改：</strong> 直接更新现有海报的对应信息，保持整体设计风格不变
            </div>
            <div>
              <strong>重新生成海报：</strong> 基于新的活动信息重新调用AI设计，可能产生不同的设计风格
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PosterUpdateNotification; 