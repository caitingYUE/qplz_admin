import React, { useState } from 'react';
import { Card, Button, Space, Input, Typography, Row, Col, Tag, message } from 'antd';
import { ArrowRightOutlined, LeftOutlined, SendOutlined, FastForwardOutlined } from '@ant-design/icons';

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
  selectedOutlines?: OutlineOption[];
  onOptimize: (outline: OutlineOption, optimizationRequirements?: string) => void;
  onBack: () => void;
  isGenerating: boolean;
  savedOptimizationText?: string;
  onOptimizationTextChange?: (text: string) => void;
}

const PlanEnhancement: React.FC<PlanEnhancementProps> = ({
  selectedOutline,
  selectedOutlines = [],
  onOptimize,
  onBack,
  isGenerating,
  savedOptimizationText = '',
  onOptimizationTextChange
}) => {
  const [optimizationText, setOptimizationText] = useState(savedOptimizationText);

  // 同步外部传入的保存文本
  React.useEffect(() => {
    setOptimizationText(savedOptimizationText);
  }, [savedOptimizationText]);

  const handleOptimize = () => {
    if (selectedOutlines.length > 0) {
      // 多选模式：创建一个综合的 outline
      const combinedOutline: OutlineOption = {
        id: 'combined-' + selectedOutlines.map(o => o.id).join('-'),
        title: `综合方案：${selectedOutlines.map(o => o.title).join(' + ')}`,
        overview: `综合了 ${selectedOutlines.length} 个方案的优点：\n${selectedOutlines.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.overview}`).join('\n')}`,
        highlights: [...new Set(selectedOutlines.flatMap(o => o.highlights))], // 去重合并亮点
        timeline: selectedOutlines[0].timeline, // 使用第一个方案的时间安排作为基础
        budget: selectedOutlines[0].budget, // 使用第一个方案的预算作为基础
        venue: selectedOutlines[0].venue // 使用第一个方案的场地作为基础
      };
      onOptimize(combinedOutline, optimizationText.trim() || undefined);
    } else if (selectedOutline) {
      onOptimize(selectedOutline, optimizationText.trim() || undefined);
    }
  };

  const handleSkip = () => {
    if (selectedOutlines.length > 0) {
      // 多选模式：创建一个综合的 outline
      const combinedOutline: OutlineOption = {
        id: 'combined-' + selectedOutlines.map(o => o.id).join('-'),
        title: `综合方案：${selectedOutlines.map(o => o.title).join(' + ')}`,
        overview: `综合了 ${selectedOutlines.length} 个方案的优点：\n${selectedOutlines.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.overview}`).join('\n')}`,
        highlights: [...new Set(selectedOutlines.flatMap(o => o.highlights))],
        timeline: selectedOutlines[0].timeline,
        budget: selectedOutlines[0].budget,
        venue: selectedOutlines[0].venue
      };
      onOptimize(combinedOutline);
    } else if (selectedOutline) {
      onOptimize(selectedOutline);
    }
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
            {selectedOutlines.length > 0 
              ? `您已选择 ${selectedOutlines.length} 个方案进行综合，我们将融合各方案优点并根据您的建议生成完整的活动策划书`
              : '您可以提出优化建议，我们将基于您的建议生成完整的活动策划书'
            }
          </Text>
        </div>
        <Button 
          icon={<LeftOutlined />} 
          onClick={onBack}
        >
          重新选择方案
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* 已选择的方案 */}
        {selectedOutlines.length > 0 ? (
          <Card 
            title={`已选择的方案 (${selectedOutlines.length}个)`}
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              {selectedOutlines.map((outline, index) => (
                <Col span={selectedOutlines.length === 1 ? 24 : 12} key={outline.id}>
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color={index === 0 ? 'blue' : index === 1 ? 'green' : 'orange'}>
                        方案 {String.fromCharCode(65 + index)}
                      </Tag>
                      <Title level={5} style={{ margin: '4px 0', display: 'inline-block', marginLeft: '8px' }}>
                        {outline.title}
                      </Title>
                    </div>
                    <Paragraph style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
                      {outline.overview}
                    </Paragraph>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '12px' }}>亮点：</Text>
                      <div style={{ marginTop: '4px' }}>
                        {outline.highlights.slice(0, 3).map((highlight, idx) => (
                          <Tag key={idx} style={{ margin: '2px 4px 2px 0', fontSize: '11px' }}>
                            {highlight}
                          </Tag>
                        ))}
                        {outline.highlights.length > 3 && <span style={{ fontSize: '12px', color: '#999' }}>...</span>}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        ) : selectedOutline ? (
          <Card 
            title="当前选择的方案"
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={24}>
              <Col span={16}>
                <div>
                  <Title level={4} style={{ marginBottom: '12px' }}>
                    {selectedOutline.title}
                  </Title>
                  <Paragraph style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}>
                    {selectedOutline.overview}
                  </Paragraph>
                  <div>
                    <Text strong>活动亮点：</Text>
                    <div style={{ marginTop: '8px' }}>
                      {selectedOutline.highlights.map((highlight, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: '4px 8px 4px 0' }}>
                          {highlight}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>预算范围：</Text>
                    <div style={{ marginTop: '4px', color: '#666' }}>
                      {selectedOutline.budget}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>推荐场地：</Text>
                    <div style={{ marginTop: '4px', color: '#666' }}>
                      {selectedOutline.venue}
                    </div>
                  </div>
                  <div>
                    <Text strong>时间安排：</Text>
                    <div style={{ marginTop: '4px' }}>
                      {selectedOutline.timeline.slice(0, 3).map((time, idx) => (
                        <div key={idx} style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', marginBottom: '2px' }}>
                          • {time}
                        </div>
                      ))}
                      {selectedOutline.timeline.length > 3 && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          ...等{selectedOutline.timeline.length}个环节
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        ) : null}

        {/* 优化建议输入 */}
        <Card 
          title="优化建议（可选）"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary">
              如果您对当前方案有特殊要求或优化建议，请在下方详细描述。我们将基于您的建议生成更符合需求的完整策划书：
            </Text>
            <div style={{ marginTop: '12px' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                💡 优化建议示例：
              </Text>
              <ul style={{ marginTop: '8px', color: '#666', fontSize: '13px', paddingLeft: '20px' }}>
                <li>增加更多互动环节，提升参与者体验</li>
                <li>邀请知名女性企业家作为主讲嘉宾</li>
                <li>增加网络直播功能，扩大影响范围</li>
                <li>安排分组讨论和成果展示环节</li>
                <li>预算控制在XX万以内，优化成本分配</li>
                <li>增加后续跟踪服务和社群建设</li>
              </ul>
            </div>
          </div>
          
          <TextArea
            value={optimizationText}
            onChange={(e) => {
              const newValue = e.target.value;
              setOptimizationText(newValue);
              // 实时保存用户输入
              onOptimizationTextChange?.(newValue);
            }}
            placeholder="请详细描述您的优化建议和特殊要求..."
            rows={6}
            style={{ marginBottom: '20px', fontSize: '14px' }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Button
              size="large"
              icon={<FastForwardOutlined />}
              onClick={handleSkip}
              disabled={!selectedOutline && selectedOutlines.length === 0}
              style={{ minWidth: '140px' }}
            >
              跳过优化，直接生成
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleOptimize}
              loading={isGenerating}
              disabled={!selectedOutline && selectedOutlines.length === 0}
              style={{ 
                backgroundColor: '#b01c02', 
                borderColor: '#b01c02',
                minWidth: '140px'
              }}
            >
              {isGenerating ? '正在生成...' : (selectedOutlines.length > 0 ? '综合方案并生成' : '应用优化并生成')}
            </Button>
          </div>
        </Card>

        {/* 提示信息 */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f6f8fa', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #e1e8ed'
        }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {selectedOutlines.length > 0 
              ? `🔄 我们将综合 ${selectedOutlines.length} 个方案的优点，生成包含详细执行方案、时间安排、预算分配、人员配置等完整信息的活动策划书`
              : '📝 接下来我们将为您生成包含详细执行方案、时间安排、预算分配、人员配置等完整信息的活动策划书'
            }
          </Text>
        </div>
      </div>
    </div>
  );
};

export default PlanEnhancement; 