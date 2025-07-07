import React from 'react';
import { Card, Button, Space, Tag, Typography, Row, Col } from 'antd';
import { CheckOutlined, ReloadOutlined, LeftOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface OutlineOption {
  id: string;
  title: string;
  overview: string;
  highlights: string[];
  timeline: string[];
  budget: string;
  venue: string;
}

interface OutlineSelectionProps {
  outlines: OutlineOption[];
  onSelect: (outline: OutlineOption) => void;
  onRegenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

const OutlineSelection: React.FC<OutlineSelectionProps> = ({
  outlines,
  onSelect,
  onRegenerate,
  onBack,
  isGenerating
}) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部操作栏 */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            📋 选择您喜欢的活动方案
          </Title>
          <Text type="secondary">
            我们为您生成了3个不同风格的活动方案，请选择一个作为基础进行进一步优化
          </Text>
        </div>
        <Space>
          <Button 
            icon={<LeftOutlined />} 
            onClick={onBack}
          >
            返回修改
          </Button>
          <Button 
            icon={isGenerating ? <LoadingOutlined /> : <ReloadOutlined />}
            onClick={onRegenerate}
            loading={isGenerating}
          >
            {isGenerating ? '生成中...' : '换一批方案'}
          </Button>
        </Space>
      </div>

      {/* 方案卡片区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Row gutter={[16, 16]}>
          {outlines.map((outline, index) => (
            <Col span={8} key={outline.id}>
              <Card
                hoverable
                style={{ 
                  height: '100%',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
                bodyStyle={{ padding: '20px', height: '100%' }}
                actions={[
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => onSelect(outline)}
                    style={{ 
                      backgroundColor: '#b01c02',
                      borderColor: '#b01c02',
                      width: '90%'
                    }}
                  >
                    选择此方案
                  </Button>
                ]}
              >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 方案标题 */}
                  <div style={{ marginBottom: '16px' }}>
                    <Tag color={index === 0 ? 'blue' : index === 1 ? 'green' : 'orange'}>
                      方案 {String.fromCharCode(65 + index)}
                    </Tag>
                    <Title level={4} style={{ margin: '8px 0' }}>
                      {outline.title}
                    </Title>
                  </div>

                  {/* 方案概述 */}
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>活动概述：</Text>
                    <Paragraph style={{ marginTop: '4px', marginBottom: 0 }}>
                      {outline.overview}
                    </Paragraph>
                  </div>

                  {/* 活动亮点 */}
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>活动亮点：</Text>
                    <div style={{ marginTop: '4px' }}>
                      {outline.highlights.map((highlight, idx) => (
                        <Tag 
                          key={idx} 
                          style={{ margin: '2px 4px 2px 0' }}
                        >
                          {highlight}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  {/* 时间安排 */}
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>时间安排：</Text>
                    <div style={{ marginTop: '4px' }}>
                      {outline.timeline.slice(0, 3).map((time, idx) => (
                        <div key={idx} style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                          • {time}
                        </div>
                      ))}
                      {outline.timeline.length > 3 && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          ...等{outline.timeline.length}个环节
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 预算和场地 */}
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '12px' }}>预算：</Text>
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        {outline.budget}
                      </Text>
                    </div>
                    <div>
                      <Text strong style={{ fontSize: '12px' }}>场地：</Text>
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        {outline.venue}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 提示信息 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#f6f8fa', 
          borderRadius: '6px',
          textAlign: 'center' 
        }}>
          <Text type="secondary">
            💡 选择方案后，您还可以进一步提出优化要求，我们会为您生成更详细的方案版本
          </Text>
        </div>
      </div>
    </div>
  );
};

export default OutlineSelection; 