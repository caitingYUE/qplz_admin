import React from 'react';
import { Card } from 'antd';

interface PosterType {
  value: string;
  label: string;
  icon: string;
  description: string;
  dimensions: string;
  useCase: string;
}

interface PosterTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu' | 'activity') => void;
}

const POSTER_TYPES: PosterType[] = [
  {
    value: 'vertical',
    label: '竖图海报',
    icon: '',
    description: '适合打印和展示',
    dimensions: '800×1200',
    useCase: '线下活动、打印宣传'
  },
  {
    value: 'invitation',
    label: '邀请函',
    icon: '',
    description: '正式邀请场合',
    dimensions: '800×1200',
    useCase: '会议邀请、活动邀请'
  },
  {
    value: 'wechat',
    label: '微信海报',
    icon: '',
    description: '微信公众号头图使用',
    dimensions: '900×383',
    useCase: '社交媒体传播'
  },
  {
    value: 'xiaohongshu',
    label: '小红书海报',
    icon: '',
    description: '小红书平台分享',
    dimensions: '1242×1660',
    useCase: '内容营销推广'
  },
  {
    value: 'activity',
    label: '活动行海报',
    icon: '',
    description: '活动行平台专用',
    dimensions: '1080×640',
    useCase: '活动发布、在线宣传'
  }
];

const PosterTypeSelector: React.FC<PosterTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <div>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: '#262626', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        选择海报类型
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {POSTER_TYPES.map((type) => (
          <Card
            key={type.value}
            hoverable
            size="small"
            style={{
              cursor: 'pointer',
              border: selectedType === type.value 
                ? '2px solid #667eea' 
                : '1px solid #e8e8e8',
              borderRadius: '12px',
              background: selectedType === type.value 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : '#ffffff',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => onTypeChange(type.value as 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu' | 'activity')}
          >
            {/* 选中指示器 */}
            {selectedType === type.value && (
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            )}
            
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              {/* 图标 - 仅在有图标时显示 */}
              {type.icon && (
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '8px',
                  filter: selectedType === type.value ? 'brightness(1.2)' : 'none'
                }}>
                  {type.icon}
                </div>
              )}
              
              {/* 标题 */}
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: selectedType === type.value ? '#667eea' : '#262626',
                marginBottom: '4px'
              }}>
                {type.label}
              </div>
              
              {/* 尺寸 */}
              <div style={{ 
                fontSize: '12px', 
                color: '#999',
                marginBottom: '6px'
              }}>
                {type.dimensions}
              </div>
              
              {/* 描述 */}
              <div style={{ 
                fontSize: '13px', 
                color: '#666',
                marginBottom: '8px'
              }}>
                {type.description}
              </div>
              
              {/* 使用场景 */}
              <div style={{ 
                fontSize: '12px', 
                color: '#999',
                background: selectedType === type.value ? 'rgba(102, 126, 234, 0.1)' : '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '6px',
                margin: '0 auto',
                display: 'inline-block'
              }}>
                {type.useCase}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PosterTypeSelector; 