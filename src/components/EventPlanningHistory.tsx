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
  message
} from 'antd';
import { 
  HistoryOutlined, 
  SearchOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  EditOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useHistory, type EventPlanningHistory } from '../hooks/useHistory';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface EventPlanningHistoryProps {
  onSelectHistory?: (history: EventPlanningHistory) => void;
  onEditHistory?: (history: EventPlanningHistory) => void;
}

const EventPlanningHistoryComponent: React.FC<EventPlanningHistoryProps> = ({
  onSelectHistory,
  onEditHistory
}) => {
  const {
    eventPlanningHistory,
    deleteEventPlanningHistory,
    clearAllEventPlanningHistory,
    searchEventPlanningHistory
  } = useHistory();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<EventPlanningHistory | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const filteredHistory = searchEventPlanningHistory(searchKeyword);

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  const handlePreview = (history: EventPlanningHistory) => {
    setSelectedHistory(history);
    setPreviewModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteEventPlanningHistory(id);
    message.success('历史记录已删除');
  };

  const handleClearAll = () => {
    clearAllEventPlanningHistory();
    message.success('所有历史记录已清空');
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

  const renderPlanningInfo = (planningData: any) => (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Space size={16}>
        <Space size={4}>
          <UserOutlined style={{ color: '#666' }} />
          <Text type="secondary">参与人数: {planningData.participantCount}</Text>
        </Space>
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#666' }} />
          <Text type="secondary">城市: {planningData.city}</Text>
        </Space>
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#666' }} />
          <Text type="secondary">时长: {planningData.duration}</Text>
        </Space>
      </Space>
      {planningData.organizerName && (
        <Space size={4}>
          <TeamOutlined style={{ color: '#666' }} />
          <Text type="secondary">主办方: {planningData.organizerName}</Text>
        </Space>
      )}
    </Space>
  );

  return (
    <div>
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <Title level={4} style={{ margin: 0 }}>活动策划历史记录</Title>
            <Tag color="blue">{eventPlanningHistory.length} 条记录</Tag>
          </Space>
        }
        extra={
          eventPlanningHistory.length > 0 && (
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
            placeholder="搜索活动主题或描述..."
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
                    <Tooltip title="预览方案">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(history)}
                      />
                    </Tooltip>,
                    onEditHistory && (
                      <Tooltip title="编辑方案">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => onEditHistory(history)}
                        />
                      </Tooltip>
                    ),
                    onSelectHistory && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => onSelectHistory(history)}
                      >
                        使用此方案
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
                    title={
                      <Space>
                        <Text strong style={{ fontSize: '16px' }}>
                          {history.title}
                        </Text>
                        {history.updatedAt && (
                          <Tag color="orange">已编辑</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, color: '#666' }}>
                          {history.planningData.description}
                        </Paragraph>
                        {renderPlanningInfo(history.planningData)}
                        <Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            创建时间: {formatDate(history.createdAt)}
                          </Text>
                          {history.updatedAt && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              更新时间: {formatDate(history.updatedAt)}
                            </Text>
                          )}
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
        title={selectedHistory ? `预览方案: ${selectedHistory.title}` : '预览方案'}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          onSelectHistory && selectedHistory && (
            <Button
              key="use"
              type="primary"
              onClick={() => {
                onSelectHistory(selectedHistory);
                setPreviewModalVisible(false);
              }}
            >
              使用此方案
            </Button>
          )
        ].filter(Boolean)}
        style={{ top: 20 }}
      >
        {selectedHistory && (
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* 基础信息 */}
              <Card size="small" title="基础信息">
                {renderPlanningInfo(selectedHistory.planningData)}
              </Card>
              
              {/* 选中的大纲 */}
              <Card size="small" title="活动大纲">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong>{selectedHistory.selectedOutline.title}</Text>
                  <Paragraph>{selectedHistory.selectedOutline.overview}</Paragraph>
                  <div>
                    <Text strong>亮点: </Text>
                    {selectedHistory.selectedOutline.highlights.join('、')}
                  </div>
                  <div>
                    <Text strong>预算: </Text>
                    {selectedHistory.selectedOutline.budget}
                  </div>
                </Space>
              </Card>
              
              {/* 完整方案预览 */}
              <Card size="small" title="完整策划方案">
                <div 
                  style={{ 
                    maxHeight: '400px', 
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}
                >
                  {selectedHistory.finalPlan}
                </div>
              </Card>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventPlanningHistoryComponent; 