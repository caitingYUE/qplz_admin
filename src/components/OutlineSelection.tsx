import React, { useState } from 'react';
import { Card, Button, Space, Tag, Typography, Row, Col, Tooltip, Modal, List, message, Dropdown } from 'antd';
import { 
  CheckOutlined, 
  ReloadOutlined, 
  LeftOutlined, 
  LoadingOutlined, 
  HeartOutlined, 
  HeartFilled,
  StarOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useFavorites } from '../hooks/useFavorites';

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
  onSelect: (outline: OutlineOption | OutlineOption[]) => void;
  onRegenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
  planningDataHash?: string;
}

const OutlineSelection: React.FC<OutlineSelectionProps> = ({
  outlines,
  onSelect,
  onRegenerate,
  onBack,
  isGenerating,
  planningDataHash
}) => {
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [selectedOutlineIds, setSelectedOutlineIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const {
    favoriteOutlines,
    saveOutlineToFavorites,
    removeOutlineFromFavorites,
    isOutlineFavorited
  } = useFavorites();

  // 处理收藏/取消收藏
  const handleFavoriteToggle = (outline: OutlineOption, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isOutlineFavorited(outline.id)) {
      // 如果已收藏，则取消收藏
      const favoriteItem = favoriteOutlines.find(fav => fav.id === outline.id);
      if (favoriteItem) {
        removeOutlineFromFavorites(favoriteItem.favoriteId);
        message.success('已取消收藏');
      }
    } else {
      // 如果未收藏，则添加收藏
      saveOutlineToFavorites(outline, planningDataHash || '');
      message.success('已添加到收藏');
    }
  };

  // 从收藏中选择方案
  const handleSelectFromFavorites = (favoriteOutline: any) => {
    setShowFavoritesModal(false);
    onSelect(favoriteOutline);
    message.success('已选择收藏的方案');
  };

  // 删除收藏项
  const handleRemoveFavorite = (favoriteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeOutlineFromFavorites(favoriteId);
    message.success('已删除收藏');
  };

  // 处理单选
  const handleSingleSelect = (outline: OutlineOption) => {
    onSelect(outline);
  };

  // 处理多选模式切换
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedOutlineIds([]);
  };

  // 处理方案选择（多选模式）
  const toggleOutlineSelection = (outlineId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedOutlineIds(prev => 
      prev.includes(outlineId) 
        ? prev.filter(id => id !== outlineId)
        : [...prev, outlineId]
    );
  };

  // 提交多选方案
  const handleMultiSelect = () => {
    if (selectedOutlineIds.length === 0) {
      message.warning('请至少选择一个方案');
      return;
    }
    const selectedOutlines = outlines.filter(outline => selectedOutlineIds.includes(outline.id));
    onSelect(selectedOutlines);
    message.success(`已选择 ${selectedOutlines.length} 个方案进行综合`);
  };

  // 收藏下拉菜单
  const getFavoritesDropdownItems = () => {
    if (favoriteOutlines.length === 0) {
      return [
        {
          key: 'empty',
          label: (
            <div style={{ padding: '8px', color: '#999', textAlign: 'center' }}>
              暂无收藏的方案
            </div>
          ),
          disabled: true
        }
      ];
    }

    return favoriteOutlines.slice(0, 5).map((fav, index) => ({
      key: fav.favoriteId,
      label: (
        <div 
          style={{ 
            maxWidth: '200px', 
            padding: '4px 8px',
            cursor: 'pointer'
          }}
          onClick={() => handleSelectFromFavorites(fav)}
        >
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>
            {fav.title}
          </div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.2' }}>
            {fav.overview.length > 50 ? fav.overview.substring(0, 50) + '...' : fav.overview}
          </div>
        </div>
      )
    }));
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
            type={isMultiSelectMode ? "primary" : "default"}
            onClick={toggleMultiSelectMode}
          >
            {isMultiSelectMode ? '退出多选' : '多选模式'}
          </Button>

          {isMultiSelectMode && selectedOutlineIds.length > 0 && (
            <Button 
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleMultiSelect}
              style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
            >
              综合选中方案 ({selectedOutlineIds.length})
            </Button>
          )}
          
          {favoriteOutlines.length > 0 && (
            <Dropdown 
              menu={{ items: getFavoritesDropdownItems() }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                icon={<StarOutlined />}
                type="dashed"
              >
                我的收藏 ({favoriteOutlines.length})
              </Button>
            </Dropdown>
          )}

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
                  border: isMultiSelectMode && selectedOutlineIds.includes(outline.id) ? '2px solid #b01c02' : '1px solid #d9d9d9',
                  borderRadius: '8px',
                  backgroundColor: isMultiSelectMode && selectedOutlineIds.includes(outline.id) ? '#fff2f0' : '#fff'
                }}
                bodyStyle={{ padding: '20px', height: '100%' }}
                actions={
                  isMultiSelectMode ? [
                    <Button 
                      key="toggle"
                      type={selectedOutlineIds.includes(outline.id) ? "primary" : "default"}
                      icon={selectedOutlineIds.includes(outline.id) ? <CheckOutlined /> : undefined}
                      onClick={(e) => toggleOutlineSelection(outline.id, e)}
                      style={{ 
                        backgroundColor: selectedOutlineIds.includes(outline.id) ? '#b01c02' : undefined,
                        borderColor: selectedOutlineIds.includes(outline.id) ? '#b01c02' : undefined,
                        width: '90%',
                      }}
                    >
                      {selectedOutlineIds.includes(outline.id) ? '已选择' : '选择'}
                    </Button>
                  ] : [
                    <Button 
                      key="select"
                      type="primary" 
                      icon={<CheckOutlined />}
                      onClick={() => handleSingleSelect(outline)}
                      style={{ 
                        backgroundColor: '#b01c02',
                        borderColor: '#b01c02',
                        width: '90%',
                        border: 'none'
                      }}
                    >
                      选择此方案
                    </Button>
                  ]
                }
              >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 方案标题和收藏按钮 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={index === 0 ? 'blue' : index === 1 ? 'green' : 'orange'}>
                        方案 {String.fromCharCode(65 + index)}
                      </Tag>
                      <Tooltip title={isOutlineFavorited(outline.id) ? "取消收藏" : "收藏方案"}>
                        <Button
                          type="text"
                          shape="circle"
                          icon={
                            isOutlineFavorited(outline.id) ? 
                              <HeartFilled style={{ color: '#ff4d4f' }} /> : 
                              <HeartOutlined />
                          }
                          onClick={(e) => handleFavoriteToggle(outline, e)}
                        />
                      </Tooltip>
                    </div>
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
            {isMultiSelectMode 
              ? '🔄 多选模式：您可以选择多个方案，我们将综合各方案的优点生成更完善的活动策划'
              : '💡 选择方案后，您还可以进一步提出优化要求，我们会为您生成更详细的方案版本。点击"多选模式"可同时选择多个方案进行综合'
            }
          </Text>
        </div>
      </div>

      {/* 收藏方案模态窗口 */}
      <Modal
        title="我的收藏方案"
        open={showFavoritesModal}
        onCancel={() => setShowFavoritesModal(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={favoriteOutlines}
          renderItem={(fav) => (
            <List.Item
              actions={[
                <Button 
                  key="select"
                  type="primary" 
                  size="small"
                  onClick={() => handleSelectFromFavorites(fav)}
                >
                  选择
                </Button>,
                <Button 
                  key="delete"
                  type="text" 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleRemoveFavorite(fav.favoriteId, e)}
                >
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                title={fav.title}
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>{fav.overview}</div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        收藏时间：{new Date(fav.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无收藏的方案' }}
        />
      </Modal>
    </div>
  );
};

export default OutlineSelection; 