import React, { useState } from 'react';
import { Modal, Input, Button, List, Tag, message, Space, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;

interface InvitationBatchGeneratorProps {
  visible: boolean;
  onClose: () => void;
  baseHtmlTemplate: string;
  eventName: string;
  posterDimensions: {
    width: number;
    height: number;
  };
}

const InvitationBatchGenerator: React.FC<InvitationBatchGeneratorProps> = ({
  visible,
  onClose,
  baseHtmlTemplate,
  eventName,
  posterDimensions
}) => {
  const [inviterNames, setInviterNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addInviterName = () => {
    if (!currentName.trim()) {
      message.warning('请输入邀请人姓名');
      return;
    }
    
    if (inviterNames.includes(currentName.trim())) {
      message.warning('该姓名已存在');
      return;
    }

    setInviterNames([...inviterNames, currentName.trim()]);
    setCurrentName('');
  };

  const removeInviterName = (nameToRemove: string) => {
    setInviterNames(inviterNames.filter(name => name !== nameToRemove));
  };

  const generateInvitationHtml = (inviterName: string): string => {
    return baseHtmlTemplate.replace(/XXX女士/g, `${inviterName}女士`);
  };

  const generateAndDownloadBatch = async () => {
    if (inviterNames.length === 0) {
      message.warning('请至少添加一个邀请人姓名');
      return;
    }

    setIsGenerating(true);
    
    try {
      for (let i = 0; i < inviterNames.length; i++) {
        const inviterName = inviterNames[i];
        const html = generateInvitationHtml(inviterName);
        
        message.loading({
          content: `正在生成 ${inviterName} 的邀请函... (${i + 1}/${inviterNames.length})`,
          key: 'generating'
        });

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = `${posterDimensions.width}px`;
        tempDiv.style.height = `${posterDimensions.height}px`;
        
        document.body.appendChild(tempDiv);

        try {
          const canvas = await html2canvas(tempDiv, {
            backgroundColor: '#ffffff',
            scale: 2,
            width: posterDimensions.width,
            height: posterDimensions.height,
            useCORS: true,
            allowTaint: true
          });

          const link = document.createElement('a');
          link.download = `${eventName}_${inviterName}_邀请函.png`;
          link.href = canvas.toDataURL();
          link.click();
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
          document.body.removeChild(tempDiv);
        }
      }

      message.success({
        content: `成功生成 ${inviterNames.length} 个邀请函！`,
        key: 'generating'
      });

      onClose();
    } catch (error) {
      console.error('批量生成失败:', error);
      message.error({ content: '批量生成失败，请重试', key: 'generating' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      title="批量生成邀请函"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={generateAndDownloadBatch}
            loading={isGenerating}
            disabled={inviterNames.length === 0}
          >
            批量生成下载 ({inviterNames.length}个)
          </Button>
        </Space>
      }
    >
      <div>
        <Title level={4}>添加邀请人姓名</Title>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Input
            placeholder="请输入邀请人姓名"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            onPressEnter={addInviterName}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addInviterName}
            disabled={!currentName.trim()}
          >
            添加
          </Button>
        </div>

        <Title level={5}>邀请人列表 ({inviterNames.length}人)</Title>

        {inviterNames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
            暂无邀请人，请添加邀请人姓名
          </div>
        ) : (
          <List
            bordered
            dataSource={inviterNames}
            renderItem={(name, index) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeInviterName(name)}
                    size="small"
                  >
                    删除
                  </Button>
                ]}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag color="blue">{index + 1}</Tag>
                  <Text strong>{name}</Text>
                  <Text type="secondary">→ {name}女士</Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};

export default InvitationBatchGenerator; 