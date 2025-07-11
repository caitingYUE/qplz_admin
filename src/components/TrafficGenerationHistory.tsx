import React, { useState } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Space, 
  Typography, 
  Input, 
  Modal,
  Popconfirm,
  Tag,
  Empty,
  Tooltip,
  message,
  Tabs
} from 'antd';
import { 
  HistoryOutlined, 
  SearchOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CopyOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SoundOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { useHistory, type TrafficGenerationHistory } from '../hooks/useHistory';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

interface TrafficGenerationHistoryProps {
  onSelectHistory?: (history: TrafficGenerationHistory) => void;
}

const TrafficGenerationHistoryComponent: React.FC<TrafficGenerationHistoryProps> = ({
  onSelectHistory
}) => {
  const {
    trafficGenerationHistory,
    deleteTrafficGenerationHistory,
    clearAllTrafficGenerationHistory,
    searchTrafficGenerationHistory
  } = useHistory();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<TrafficGenerationHistory | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const filteredHistory = searchTrafficGenerationHistory(searchKeyword);

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  const handlePreview = (history: TrafficGenerationHistory) => {
    setSelectedHistory(history);
    setPreviewModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteTrafficGenerationHistory(id);
    message.success('历史记录已删除');
  };

  const handleClearAll = () => {
    clearAllTrafficGenerationHistory();
    message.success('所有历史记录已清空');
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('内容已复制到剪贴板');
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentTypeIcon = (type: string) => {
    return <FileTextOutlined style={{ color: '#666' }} />;
  };

  const getContentTypeName = (type: string) => {
    return '引流内容';
  };

  const renderContentPreview = (content: string, maxLength: number = 100) => {
    // 使用第一个平台内容作为预览
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <Title level={4} style={{ margin: 0 }}>引流内容历史记录</Title>
            <Tag color="green">{trafficGenerationHistory.length} 条记录</Tag>
          </Space>
        }
        extra={
          trafficGenerationHistory.length > 0 && (
            <Popconfirm
              title="确定要清空所有历史记录吗？"
              onConfirm={handleClearAll}
              okText="确定"
              cancelText="取消"
            >
              <Button danger size="small">
                清空所有记录
              </Button>
            </Popconfirm>
          )
        }
        style={{ marginBottom: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Search
            placeholder="搜索活动标题或描述..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ maxWidth: '400px' }}
          />

          {filteredHistory.length === 0 ? (
            <Empty
              description={searchKeyword ? "未找到匹配的历史记录" : "暂无历史记录"}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredHistory}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              renderItem={(history) => (
                <List.Item
                  actions={[
                    <Tooltip title="预览内容">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(history)}
                      />
                    </Tooltip>,
                    <Tooltip title="复制主文案">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyContent(history.result.platformContents[0]?.content || '')}
                      />
                    </Tooltip>,
                    onSelectHistory && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => onSelectHistory(history)}
                      >
                        使用此内容
                      </Button>
                    ),
                    <Popconfirm
                      title="确定要删除这条记录吗？"
                      onConfirm={() => handleDelete(history.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除记录">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={getContentTypeIcon('text')}
                    title={
                      <Space>
                        <Text strong style={{ fontSize: '16px' }}>
                          {history.title}
                        </Text>
                        <Tag color="blue">
                          文本内容
                        </Tag>
                        <Tag color="purple">
                          {history.request.platforms.join(', ')}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, color: '#666' }}>
                          {history.request.eventDescription}
                        </Paragraph>
                        <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                          主文案预览: {renderContentPreview(history.result.platformContents[0]?.content || '')}
                        </Paragraph>
                        <Space>
                          <ClockCircleOutlined style={{ color: '#999', fontSize: '12px' }} />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatDate(history.createdAt)}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Card>

      {/* 预览模态窗口 */}
      <Modal
        title={selectedHistory ? `预览内容: ${selectedHistory.title}` : '预览内容'}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          selectedHistory && (
            <Button
              key="copy"
              icon={<CopyOutlined />}
              onClick={() => handleCopyContent(selectedHistory.result.platformContents[0]?.content || '')}
            >
              复制主文案
            </Button>
          ),
          onSelectHistory && selectedHistory && (
            <Button
              key="use"
              type="primary"
              onClick={() => {
                onSelectHistory(selectedHistory);
                setPreviewModalVisible(false);
              }}
            >
              使用此内容
            </Button>
          )
        ].filter(Boolean)}
        style={{ top: 20 }}
      >
        {selectedHistory && (
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* 基础信息 */}
              <Card size="small" title="生成配置">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>
                    <Text strong>平台: </Text>
                    <Tag color="blue">{selectedHistory.request.platforms.join(', ')}</Tag>
                  </div>
                  <div>
                    <Text strong>内容类型: </Text>
                    <Tag color="green">{getContentTypeName('text')}</Tag>
                  </div>
                  <div>
                    <Text strong>目标受众: </Text>
                    <Text>{selectedHistory.request.targetAudience}</Text>
                  </div>
                  <div>
                    <Text strong>活动描述: </Text>
                    <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                      {selectedHistory.request.eventDescription}
                    </Paragraph>
                  </div>
                  {selectedHistory.request.referenceArticles && selectedHistory.request.referenceArticles.length > 0 && (
                    <div>
                      <Text strong>参考内容: </Text>
                      <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                        {selectedHistory.request.referenceArticles.join('\n')}
                      </Paragraph>
                    </div>
                  )}
                </Space>
              </Card>
              
              {/* 生成的内容 */}
              <Card size="small" title="生成内容">
                <Tabs defaultActiveKey="0">
                  {selectedHistory.result.platformContents.map((content, index) => (
                    <TabPane tab={`${content.platform} - ${content.title}`} key={index.toString()}>
                      <div 
                        style={{ 
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                          lineHeight: '1.6',
                          fontSize: '14px',
                          maxHeight: '400px',
                          overflow: 'auto',
                          backgroundColor: '#fafafa',
                          padding: '12px',
                          borderRadius: '4px'
                        }}
                      >
                        <div><strong>标题：</strong> {content.title}</div>
                        <div style={{ marginTop: '8px' }}><strong>内容：</strong></div>
                        <div style={{ marginTop: '4px' }}>{content.content}</div>
                        <div style={{ marginTop: '8px' }}><strong>标签：</strong> {content.tags.join(' ')}</div>
                        <div style={{ marginTop: '8px' }}><strong>行动号召：</strong> {content.callToAction}</div>
                      </div>
                    </TabPane>
                  ))}
                </Tabs>
              </Card>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TrafficGenerationHistoryComponent; 