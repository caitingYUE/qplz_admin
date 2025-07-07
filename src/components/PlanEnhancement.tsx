import React, { useState } from 'react';
import { Card, Button, Space, Input, Typography, Row, Col, Tag, message } from 'antd';
import { SendOutlined, LeftOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';

const { TextArea } = Input;
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

interface PlanEnhancementProps {
  selectedOutline: OutlineOption | null;
  enhancedOutlines: OutlineOption[];
  onEnhance: (requirements: string) => void;
  onFinalSelect: (outline: OutlineOption) => void;
  onBack: () => void;
  isGenerating: boolean;
}

const PlanEnhancement: React.FC<PlanEnhancementProps> = ({
  selectedOutline,
  enhancedOutlines,
  onEnhance,
  onFinalSelect,
  onBack,
  isGenerating
}) => {
  const [enhancementText, setEnhancementText] = useState('');

  const handleEnhance = () => {
    if (!enhancementText.trim()) {
      message.warning('请输入优化要求');
      return;
    }
    onEnhance(enhancementText);
  };

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
            🎨 方案优化
          </Title>
          <Text type="secondary">
            基于您选择的方案，告诉我们需要如何优化，我们将生成3个增强版本
          </Text>
        </div>
        <Button 
          icon={<LeftOutlined />} 
          onClick={onBack}
        >
          重新选择方案
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* 已选择的方案 */}
        {selectedOutline && (
          <Card 
            title="当前选择的方案"
            style={{ marginBottom: '20px' }}
            size="small"
          >
            <Row>
              <Col span={12}>
                <div>
                  <Text strong>{selectedOutline.title}</Text>
                  <Paragraph style={{ marginTop: '8px', marginBottom: '12px' }}>
                    {selectedOutline.overview}
                  </Paragraph>
                  <div>
                    <Text strong>活动亮点：</Text>
                    <div style={{ marginTop: '4px' }}>
                      {selectedOutline.highlights.map((highlight, idx) => (
                        <Tag key={idx} style={{ margin: '2px 4px 2px 0' }}>
                          {highlight}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>预算：</Text>
                    <Text style={{ marginLeft: '8px' }}>{selectedOutline.budget}</Text>
                  </div>
                  <div>
                    <Text strong>场地：</Text>
                    <Text style={{ marginLeft: '8px' }}>{selectedOutline.venue}</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* 优化要求输入 */}
        {enhancedOutlines.length === 0 && (
          <Card title="提出优化要求" style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                请描述您希望如何优化这个方案，比如：
              </Text>
              <ul style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                <li>增加更多互动环节</li>
                <li>邀请特定领域的嘉宾</li>
                <li>调整时间安排</li>
                <li>增加特定的活动内容</li>
                <li>优化预算分配</li>
              </ul>
            </div>
            
            <TextArea
              value={enhancementText}
              onChange={(e) => setEnhancementText(e.target.value)}
              placeholder="请详细描述您的优化要求..."
              rows={4}
              style={{ marginBottom: '16px' }}
            />
            
            <Button
              type="primary"
              icon={isGenerating ? <LoadingOutlined /> : <SendOutlined />}
              onClick={handleEnhance}
              loading={isGenerating}
              style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
            >
              {isGenerating ? '正在优化方案...' : '生成优化方案'}
            </Button>
          </Card>
        )}

        {/* 增强版方案 */}
        {enhancedOutlines.length > 0 && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4}>🚀 增强版方案</Title>
              <Text type="secondary">
                根据您的要求，我们生成了3个优化版本，请选择最终方案：
              </Text>
            </div>

            <Row gutter={[16, 16]}>
              {enhancedOutlines.map((outline, index) => (
                <Col span={8} key={outline.id}>
                  <Card
                    hoverable
                    style={{ 
                      height: '100%',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px'
                    }}
                    bodyStyle={{ padding: '16px', height: '100%' }}
                    actions={[
                      <Button 
                        type="primary" 
                        icon={<CheckOutlined />}
                        onClick={() => onFinalSelect(outline)}
                        style={{ 
                          backgroundColor: '#b01c02',
                          borderColor: '#b01c02',
                          width: '90%'
                        }}
                      >
                        确定选择
                      </Button>
                    ]}
                  >
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* 方案标题 */}
                      <div style={{ marginBottom: '12px' }}>
                        <Tag color={index === 0 ? 'volcano' : index === 1 ? 'geekblue' : 'purple'}>
                          增强版 {String.fromCharCode(65 + index)}
                        </Tag>
                        <Title level={5} style={{ margin: '6px 0' }}>
                          {outline.title}
                        </Title>
                      </div>

                      {/* 方案概述 */}
                      <div style={{ marginBottom: '12px' }}>
                        <Text strong style={{ fontSize: '13px' }}>优化概述：</Text>
                        <Paragraph style={{ marginTop: '4px', marginBottom: 0, fontSize: '13px' }}>
                          {outline.overview}
                        </Paragraph>
                      </div>

                      {/* 活动亮点 */}
                      <div style={{ marginBottom: '12px' }}>
                        <Text strong style={{ fontSize: '13px' }}>新增亮点：</Text>
                        <div style={{ marginTop: '4px' }}>
                          {outline.highlights.slice(-2).map((highlight, idx) => (
                            <Tag 
                              key={idx} 
                              color="red"
                              style={{ margin: '2px 4px 2px 0', fontSize: '11px' }}
                            >
                              {highlight}
                            </Tag>
                          ))}
                        </div>
                      </div>

                      {/* 所有亮点 */}
                      <div style={{ marginTop: 'auto' }}>
                        <Text strong style={{ fontSize: '12px' }}>全部亮点：</Text>
                        <div style={{ marginTop: '4px' }}>
                          {outline.highlights.map((highlight, idx) => (
                            <Tag 
                              key={idx} 
                              style={{ margin: '1px 2px', fontSize: '10px' }}
                            >
                              {highlight}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 重新优化按钮 */}
            <div style={{ 
              marginTop: '20px', 
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f6f8fa',
              borderRadius: '6px'
            }}>
              <Text type="secondary" style={{ marginBottom: '12px', display: 'block' }}>
                不满意当前的优化结果？
              </Text>
              <Button
                onClick={() => {
                  setEnhancementText('');
                  // 这里可以清空enhancedOutlines让用户重新输入要求
                }}
              >
                重新提出优化要求
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanEnhancement; 