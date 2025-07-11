import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Checkbox, 
  Button, 
  Space, 
  Typography, 
  Tabs, 
  Tag, 
  Divider,
  Modal,
  Progress,
  message,
  Row,
  Col,
  Collapse,
  Tooltip,
  List,
  Upload,
  Radio,
  Spin,
  Alert
} from 'antd';
import { 
  ThunderboltOutlined, 
  PlusOutlined, 
  InfoCircleOutlined,
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  BulbOutlined,
  ShareAltOutlined,
  LinkOutlined,
  DeleteOutlined,
  LoadingOutlined,
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { 
  generateTrafficContent, 
  platformConfigs, 
  styleConfigs,
  type TrafficGenerationRequest,
  type TrafficGenerationResult,
  type Platform,
  type TextStyle,
  type PlatformContent
} from '../services/trafficGenerationService';
import { DocumentExporter } from '../utils/documentExport';
import { WebContentExtractor } from '../utils/webContentExtractor';
import TrafficGenerationHistoryComponent from '../components/TrafficGenerationHistory';
import { useHistory, type TrafficGenerationHistory } from '../hooks/useHistory';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;

// 参考文章数据结构
interface ReferenceArticle {
  id: string;
  type: 'text' | 'url';
  content: string;
  url?: string;
  title?: string;
  platform?: string;
  isLoading?: boolean;
  error?: string;
}

const TrafficGenerationPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [extracting, setExtracting] = useState(false);
  const [extractedContent, setExtractedContent] = useState<string>('');
  
  // 添加缺失的状态变量
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [referenceArticles, setReferenceArticles] = useState<ReferenceArticle[]>([]);
  
  // 历史记录相关状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const { saveTrafficGenerationHistory } = useHistory();

  // 进度控制函数
  const updateProgress = (progress: number, log: string) => {
    setGenerationProgress(progress);
    setProgressLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const resetProgress = () => {
    setGenerationProgress(0);
    setProgressLogs([]);
  };

  const startProgressTracking = (title: string) => {
    resetProgress();
    setShowProgressModal(true);
    updateProgress(0, title);
  };

  const finishProgressTracking = (success: boolean, message: string) => {
    setGenerationProgress(100);
    updateProgress(100, message);
    setTimeout(() => {
      setShowProgressModal(false);
      if (success) {
        resetProgress();
      }
    }, 2000);
  };

  // 从localStorage加载保存的活动数据
  useEffect(() => {
    const savedEventData = localStorage.getItem('eventPlanningData');
    if (savedEventData) {
      try {
        const eventData = JSON.parse(savedEventData);
        form.setFieldsValue({
          eventTitle: eventData.theme,
          eventDescription: eventData.description,
          eventDate: eventData.eventDate,
          eventLocation: `${eventData.city}`,
          targetAudience: eventData.userProfile || '女性社区成员',
          eventHighlights: []
        });
      } catch (error) {
        console.error('加载活动数据失败:', error);
      }
    }
  }, [form]);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setIsGenerating(true);
    startProgressTracking('开始生成多平台引流内容...');

    try {
      const request: TrafficGenerationRequest = {
        eventTitle: values.eventTitle,
        eventDescription: values.eventDescription,
        eventDate: values.eventDate,
        eventLocation: values.eventLocation,
        targetAudience: values.targetAudience,
        eventHighlights: values.eventHighlights || [],
        platforms: values.platforms,
        textStyle: values.textStyle,
        customRequirements: values.customRequirements,
        referenceArticles: referenceArticles
          .filter(article => article.content.trim() !== '' && !article.error)
          .map(article => article.content)
      };

      const result = await generateTrafficContent(request, updateProgress);
      setResult(result);
      
      // 保存到历史记录
      saveTrafficGenerationHistory(request, result);
      
      finishProgressTracking(true, '引流内容生成完成！');
      message.success('多平台引流内容生成成功！');
    } catch (error) {
      console.error('生成失败:', error);
      finishProgressTracking(false, `生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
      message.error('生成失败，请检查配置并重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 添加参考文章
  const addReferenceArticle = (type: 'text' | 'url' = 'text') => {
    const newArticle: ReferenceArticle = {
      id: `article_${Date.now()}`,
      type,
      content: '',
      url: type === 'url' ? '' : undefined
    };
    setReferenceArticles([...referenceArticles, newArticle]);
  };

  // 更新参考文章内容
  const updateReferenceArticle = (id: string, updates: Partial<ReferenceArticle>) => {
    setReferenceArticles(articles => 
      articles.map(article => 
        article.id === id ? { ...article, ...updates } : article
      )
    );
  };

  // 删除参考文章
  const removeReferenceArticle = (id: string) => {
    setReferenceArticles(articles => articles.filter(article => article.id !== id));
  };

  // 从URL提取内容
  const extractContentFromUrl = async (id: string, url: string) => {
    if (!WebContentExtractor.isValidUrl(url)) {
      updateReferenceArticle(id, { error: '请输入有效的网址链接' });
      return;
    }

    updateReferenceArticle(id, { isLoading: true, error: undefined });

    try {
      const result = await WebContentExtractor.extractContentFromUrl(url);
      
      if (result.success) {
        updateReferenceArticle(id, {
          content: `${result.title}\n\n${result.content}`,
          title: result.title,
          platform: result.platform,
          isLoading: false,
          error: undefined
        });
        message.success(`成功提取${WebContentExtractor.getPlatformName(result.platform)}内容！`);
      } else {
        updateReferenceArticle(id, { 
          isLoading: false, 
          error: result.error || '内容提取失败'
        });
        message.error(result.error || '内容提取失败，请手动复制文章内容');
      }
    } catch (error) {
      updateReferenceArticle(id, { 
        isLoading: false, 
        error: '网络错误，请检查链接或手动复制内容'
      });
      message.error('网络错误，请检查链接或手动复制内容');
    }
  };

  // 复制内容到剪贴板
  const copyToClipboard = async (content: string, description: string) => {
    try {
      await DocumentExporter.copyToClipboard(content);
      message.success(`${description}已复制到剪贴板！`);
    } catch (error) {
      message.error('复制失败，请重试');
    }
  };

  // 打开历史记录
  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  // 从历史记录加载内容
  const handleLoadFromHistory = (history: TrafficGenerationHistory) => {
    form.setFieldsValue(history.request);
    setResult(history.result);
    setShowHistoryModal(false);
    message.success('历史内容已加载');
  };

  // 下载完整方案
  const downloadFullPlan = async () => {
    if (!result) return;

    try {
      let fullContent = `# ${form.getFieldValue('eventTitle')} - 多平台引流方案\n\n`;
      
      // 关键词分析
      fullContent += `## 关键词分析\n\n`;
      fullContent += `### 核心关键词\n${result.keywords.primaryKeywords.map((k: string) => `- ${k}`).join('\n')}\n\n`;
      fullContent += `### 相关关键词\n${result.keywords.secondaryKeywords.map((k: string) => `- ${k}`).join('\n')}\n\n`;
      fullContent += `### 推广标签\n${result.keywords.targetTags.join(' ')}\n\n`;
      
      // 爆款文分析
      fullContent += `## 爆款文特征分析\n\n`;
      fullContent += `### 标题模式\n${result.viralAnalysis.titlePatterns.map((p: string) => `- ${p}`).join('\n')}\n\n`;
      fullContent += `### 内容特征\n${result.viralAnalysis.contentFeatures.map((f: string) => `- ${f}`).join('\n')}\n\n`;
      
      // 各平台内容
      fullContent += `## 各平台推广内容\n\n`;
      result.platformContents.forEach((content: any) => {
        const platformName = platformConfigs[content.platform as keyof typeof platformConfigs].name;
        fullContent += `### ${platformName}\n\n`;
        fullContent += `**标题：** ${content.title}\n\n`;
        fullContent += `**正文：**\n${content.content}\n\n`;
        fullContent += `**标签：** ${content.tags.join(' ')}\n\n`;
        fullContent += `**行动号召：** ${content.callToAction}\n\n`;
        fullContent += `**优化建议：**\n${content.tips.map((tip: string) => `- ${tip}`).join('\n')}\n\n`;
      });
      
      // 整体策略
      fullContent += `## 整体营销策略\n\n${result.overallStrategy}\n\n`;
      
      await DocumentExporter.downloadAsWord('多平台引流方案', fullContent);
      message.success('完整方案已下载！');
    } catch (error) {
      message.error('下载失败，请重试');
    }
  };

  // 渲染平台内容卡片
  const renderPlatformContent = (content: PlatformContent) => {
    const platformName = platformConfigs[content.platform].name;
    
    return (
      <Card
        key={content.platform}
        title={
          <Space>
            <ShareAltOutlined />
            {platformName}
          </Space>
        }
        extra={
          <Button 
            type="text" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(
              `标题：${content.title}\n\n${content.content}\n\n标签：${content.tags.join(' ')}\n\n${content.callToAction}`,
              `${platformName}内容`
            )}
          >
            复制
          </Button>
        }
        style={{ marginBottom: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>标题：</Text>
            <Paragraph copyable style={{ marginBottom: '8px' }}>
              {content.title}
            </Paragraph>
          </div>
          
          <div>
            <Text strong>正文：</Text>
            <Paragraph copyable style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
              {content.content}
            </Paragraph>
          </div>
          
          <div>
            <Text strong>标签：</Text>
            <div style={{ marginTop: '4px' }}>
              {content.tags.map((tag: string, index: number) => (
                <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
          
          <div>
            <Text strong>行动号召：</Text>
            <Paragraph copyable style={{ marginBottom: '8px' }}>
              {content.callToAction}
            </Paragraph>
          </div>
          
          <Collapse size="small">
            <Panel header="优化建议" key="tips">
              <List
                size="small"
                dataSource={content.tips}
                renderItem={(tip: string) => (
                  <List.Item>
                    <BulbOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                    {tip}
                  </List.Item>
                )}
              />
            </Panel>
          </Collapse>
        </Space>
      </Card>
    );
  };

  // 渲染参考文章项目
  const renderReferenceArticle = (article: ReferenceArticle, index: number) => {
    return (
      <Card key={article.id} size="small" style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Text strong>参考文章 {index + 1}</Text>
            <Space>
              <Radio.Group 
                value={article.type} 
                onChange={(e) => updateReferenceArticle(article.id, { type: e.target.value, content: '', error: undefined })}
                size="small"
              >
                <Radio.Button value="text">文本内容</Radio.Button>
                <Radio.Button value="url">网页链接</Radio.Button>
              </Radio.Group>
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeReferenceArticle(article.id)}
              />
            </Space>
          </div>

          {article.type === 'url' ? (
            <Space.Compact style={{ width: '100%', marginBottom: '8px' }}>
              <Input
                placeholder="输入文章链接（支持小红书、微信公众号、知乎等）"
                value={article.url || ''}
                onChange={(e) => updateReferenceArticle(article.id, { url: e.target.value })}
                disabled={article.isLoading}
              />
              <Button 
                type="primary"
                icon={article.isLoading ? <LoadingOutlined /> : <LinkOutlined />}
                onClick={() => extractContentFromUrl(article.id, article.url || '')}
                disabled={article.isLoading || !article.url}
                style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
              >
                {article.isLoading ? '提取中' : '提取内容'}
              </Button>
            </Space.Compact>
          ) : null}

          {article.error && (
            <Alert 
              message={article.error} 
              type="error" 
              style={{ marginBottom: '8px', fontSize: '12px' }}
              showIcon
            />
          )}

          {article.title && (
            <div style={{ marginBottom: '8px' }}>
              <Text strong>文章标题：</Text>
              <Text type="secondary">{article.title}</Text>
              {article.platform && (
                <Tag color="blue" style={{ marginLeft: '8px' }}>
                  {WebContentExtractor.getPlatformName(article.platform)}
                </Tag>
              )}
            </div>
          )}

          <TextArea
            rows={article.type === 'url' ? 6 : 4}
            placeholder={
              article.type === 'url' 
                ? '点击"提取内容"按钮自动获取文章内容，或手动粘贴...'
                : '粘贴参考文章的完整内容...'
            }
            value={article.content}
            onChange={(e) => updateReferenceArticle(article.id, { content: e.target.value })}
            disabled={article.isLoading}
          />
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px', height: '100vh', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#b01c02' }}>
            <ThunderboltOutlined style={{ marginRight: '8px' }} />
            引流内容生成器
          </Title>
          <Paragraph style={{ margin: '4px 0 0 0', color: '#666' }}>
            基于活动策划自动生成多平台引流内容，解决流量获取难题
          </Paragraph>
        </div>
        <Button 
          icon={<HistoryOutlined />}
          onClick={handleShowHistory}
          type="primary"
          style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
        >
          历史记录
        </Button>
      </div>

      <Row gutter={24}>
        {/* 左侧：参数设置 */}
        <Col span={result ? 10 : 16}>
          <Card title="活动信息" style={{ height: 'fit-content' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                platforms: ['wechat_group', 'xiaohongshu'],
                textStyle: 'warm'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="活动标题"
                    name="eventTitle"
                    rules={[{ required: true, message: '请输入活动标题' }]}
                  >
                    <Input placeholder="输入活动标题" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="活动时间"
                    name="eventDate"
                  >
                    <Input placeholder="如：2024年1月15日" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="活动描述"
                name="eventDescription"
                rules={[{ required: true, message: '请输入活动描述' }]}
              >
                <Input.TextArea rows={2} placeholder="详细描述活动内容和价值" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="活动地点"
                    name="eventLocation"
                    rules={[{ required: true, message: '请输入活动地点' }]}
                  >
                    <Input placeholder="城市或具体地址" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="目标受众"
                    name="targetAudience"
                    rules={[{ required: true, message: '请输入目标受众' }]}
                  >
                    <Input placeholder="如：25-35岁职场女性" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <Space>
                    活动亮点
                    <Tooltip title="添加3-5个活动的核心亮点">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="eventHighlights"
              >
                <Select
                  mode="tags"
                  placeholder="输入后按回车添加亮点"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Divider orientation="left" plain>推广设置</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="推广平台"
                    name="platforms"
                    rules={[{ required: true, message: '请选择推广平台' }]}
                  >
                    <Checkbox.Group>
                      <Space direction="vertical">
                        {Object.entries(platformConfigs).map(([key, config]) => (
                          <Checkbox key={key} value={key}>
                            {config.name}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="文本风格"
                    name="textStyle"
                    rules={[{ required: true, message: '请选择文本风格' }]}
                  >
                    <Select>
                      {Object.entries(styleConfigs).map(([key, config]) => (
                        <Option key={key} value={key}>
                          {config.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="自定义要求"
                name="customRequirements"
              >
                <Input.TextArea 
                  rows={2} 
                  placeholder="输入特殊要求，如：突出免费参与、强调网络效应等" 
                />
              </Form.Item>

              {/* 参考文章区域 */}
              <Divider orientation="left" plain>参考文章（可选）</Divider>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    支持小红书、微信公众号、知乎等平台链接自动提取，或手动粘贴内容
                  </Text>
                  <Space>
                    <Button 
                      type="dashed" 
                      icon={<FileTextOutlined />} 
                      size="small"
                      onClick={() => addReferenceArticle('text')}
                    >
                      添加文本
                    </Button>
                    <Button 
                      type="dashed" 
                      icon={<LinkOutlined />} 
                      size="small"
                      onClick={() => addReferenceArticle('url')}
                    >
                      添加链接
                    </Button>
                  </Space>
                </div>
                
                {referenceArticles.map((article, index) => 
                  renderReferenceArticle(article, index)
                )}

                {referenceArticles.length === 0 && (
                  <Alert
                    message="添加参考文章可以让AI学习成功案例的写作风格和内容特点"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                )}
              </div>

              <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<ThunderboltOutlined />}
                  loading={isGenerating}
                  block
                  size="large"
                  style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
                >
                  生成引流内容
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：结果展示或提示 */}
        {!result && (
          <Col span={8}>
            <Card style={{ height: 'fit-content' }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <ShareAltOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Title level={4} style={{ color: '#666', marginBottom: '8px' }}>
                  准备生成引流内容
                </Title>
                <Paragraph style={{ color: '#999', marginBottom: '24px' }}>
                  填写左侧表单信息，点击生成按钮，AI将为您创建专业的多平台引流内容
                </Paragraph>
                <div style={{ textAlign: 'left', color: '#666' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <BulbOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                    支持微信群、小红书、知乎等多平台
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <BulbOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                    自动分析关键词和爆款特征
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <BulbOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                    提供详细的营销策略建议
                  </div>
                  <div>
                    <BulbOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                    一键导出完整推广方案
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )}
        
        {/* 右侧：结果展示 */}
        {result && (
          <Col span={14}>
            <Card 
              title="引流内容方案"
              extra={
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadFullPlan}
                  style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
                >
                  下载完整方案
                </Button>
              }
            >
              <Tabs defaultActiveKey="platforms">
                <TabPane tab="平台内容" key="platforms">
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {result.platformContents.map(renderPlatformContent)}
                  </div>
                </TabPane>
                
                <TabPane tab="关键词分析" key="keywords">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card size="small" title="核心关键词">
                        {result.keywords.primaryKeywords.map((keyword: string, index: number) => (
                          <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                            {keyword}
                          </Tag>
                        ))}
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="相关关键词">
                        {result.keywords.secondaryKeywords.map((keyword: string, index: number) => (
                          <Tag key={index} color="green" style={{ marginBottom: '4px' }}>
                            {keyword}
                          </Tag>
                        ))}
                      </Card>
                    </Col>
                  </Row>
                  <Card size="small" title="推广标签" style={{ marginTop: '16px' }}>
                    {result.keywords.targetTags.map((tag: string, index: number) => (
                      <Tag key={index} color="purple" style={{ marginBottom: '4px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </Card>
                </TabPane>
                
                <TabPane tab="爆款分析" key="viral">
                  <Collapse>
                    <Panel header="标题模式" key="titles">
                      <List
                        size="small"
                        dataSource={result.viralAnalysis.titlePatterns}
                        renderItem={(pattern: string) => <List.Item>• {pattern as React.ReactNode}</List.Item>}
                      />
                    </Panel>
                    <Panel header="内容特征" key="content">
                      <List
                        size="small"
                        dataSource={result.viralAnalysis.contentFeatures}
                        renderItem={(feature: string) => <List.Item>• {feature as React.ReactNode}</List.Item>}
                      />
                    </Panel>
                    <Panel header="写作风格" key="style">
                      <List
                        size="small"
                        dataSource={result.viralAnalysis.writingStyles}
                        renderItem={(style: string) => <List.Item>• {style as React.ReactNode}</List.Item>}
                      />
                    </Panel>
                  </Collapse>
                </TabPane>
                
                <TabPane tab="营销策略" key="strategy">
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {result.overallStrategy}
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        )}
      </Row>

      {/* 进度模态窗口 */}
      <Modal
        title="AI生成进度"
        open={showProgressModal}
        footer={null}
        closable={false}
        width={600}
        centered
      >
        <div style={{ marginBottom: '16px' }}>
          <Progress 
            percent={generationProgress} 
            status={generationProgress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#b01c02',
              '100%': '#ff4d4f'
            }}
          />
        </div>
        
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <div style={{ 
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            {progressLogs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                color: log.includes('失败') || log.includes('错误') ? '#ff4d4f' : '#666'
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>
        
        {generationProgress === 100 && (
          <div style={{ 
            marginTop: '16px', 
            textAlign: 'center',
            color: progressLogs[progressLogs.length - 1]?.includes('失败') ? '#ff4d4f' : '#52c41a'
          }}>
            {progressLogs[progressLogs.length - 1]?.includes('失败') ? '生成失败' : '生成完成'}
          </div>
        )}
      </Modal>
      
      {/* 历史记录模态窗口 */}
      <Modal
        title="引流内容历史记录"
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        width={1200}
        footer={null}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        <TrafficGenerationHistoryComponent
          onSelectHistory={handleLoadFromHistory}
        />
      </Modal>
    </div>
  );
};

export default TrafficGenerationPage; 