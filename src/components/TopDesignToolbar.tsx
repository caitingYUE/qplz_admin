import React, { useState, useEffect } from 'react';
import { Button, Select, Checkbox, Popover, Badge, message } from 'antd';
import { 
  SettingOutlined,
  DownloadOutlined,
  CodeOutlined,
  QuestionCircleOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  DownOutlined
} from '@ant-design/icons';

// 字段配置定义
interface PosterField {
  key: string;
  label: string;
  required: boolean; // 是否为必选字段
  description: string;
}

const POSTER_FIELDS: PosterField[] = [
  { key: 'title', label: '标题', required: true, description: '活动主标题' },
  { key: 'subtitle', label: '副标题', required: true, description: '活动副标题' },
  { key: 'location', label: '位置', required: true, description: '活动地点' },
  { key: 'time', label: '时间', required: true, description: '活动时间' },
  { key: 'guests', label: '嘉宾', required: false, description: '特邀嘉宾信息' },
  { key: 'description', label: '描述', required: false, description: '活动详细描述' },
  { key: 'maxParticipants', label: '参与人数', required: false, description: '最大参与人数' },
  { key: 'fee', label: '费用', required: false, description: '活动费用' },
  { key: 'qrcode', label: '二维码', required: false, description: '报名二维码' },
  { key: 'logo', label: 'Logo', required: false, description: '品牌标识' }
];

interface DesignAssets {
  referenceImages: Array<{ id: string; url: string; name: string }>;
  logos: Array<{ id: string; url: string; name: string }>;
  qrCodes: Array<{ id: string; url: string; name: string }>;
  brandColors: string[];
  brandFonts: Array<{ id: string; name: string; url: string }>;
  // 服务器配置相关
  apiMode: 'local' | 'remote';
  serverAddress: string;
  serverPort: string;
  isServerConnected: boolean;
  isMiniProgramIntegrated: boolean;
}

interface TopDesignToolbarProps {
  selectedPosterType: string;
  onPosterTypeChange: (type: 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu' | 'activity') => void;
  designAssets: DesignAssets;
  onAssetsChange: (assets: DesignAssets) => void;
  onConfigClick: () => void;
  onDownloadPoster?: () => void;
  onDownloadHtml?: () => void;
  onShowHelp?: () => void;
  onBatchGenerate?: () => void;
  hasCurrentPoster?: boolean;
  selectedFields?: string[]; // 新增：从父组件接收字段状态
  onFieldsChange?: (fields: string[]) => void; // 字段变更回调
  onRegenerateWithFields?: () => void; // 根据字段重新生成
}

const POSTER_TYPE_OPTIONS = [
  {
    value: 'vertical',
    label: '竖图海报',
    description: '800×1200'
  },
  {
    value: 'invitation',
    label: '邀请函',
    description: '800×1200'
  },
  {
    value: 'wechat',
    label: '微信海报',
    description: '900×383'
  },
  {
    value: 'xiaohongshu',
    label: '小红书海报',
    description: '1242×1660'
  },
  {
    value: 'activity',
    label: '活动行海报',
    description: '1080×640'
  }
];

const TopDesignToolbar: React.FC<TopDesignToolbarProps> = ({
  selectedPosterType,
  onPosterTypeChange,
  designAssets,
  onAssetsChange,
  onConfigClick,
  onDownloadPoster,
  onDownloadHtml,
  onShowHelp,
  onBatchGenerate,
  hasCurrentPoster = false,
  selectedFields = [],
  onFieldsChange,
  onRegenerateWithFields
}) => {
  // 字段选择状态
  const [selectedFieldsState, setSelectedFieldsState] = useState<string[]>(selectedFields);
  const [originalFields, setOriginalFields] = useState<string[]>([]);
  const [fieldsPopoverVisible, setFieldsPopoverVisible] = useState(false);

  // 同步父组件的字段状态
  useEffect(() => {
    if (selectedFields && selectedFields.length > 0) {
      setSelectedFieldsState(selectedFields);
      setOriginalFields(selectedFields);
    }
  }, [selectedFields]);

  // 根据海报类型获取默认字段
  const getDefaultFieldsByPosterType = (posterType: string): string[] => {
    const baseFields = ['title', 'subtitle', 'location', 'time']; // 基础必选字段
    
    const typeSpecificFields: { [key: string]: string[] } = {
      vertical: ['title', 'subtitle', 'location', 'time', 'guests', 'description', 'maxParticipants', 'fee', 'qrcode', 'logo'],
      invitation: ['title', 'subtitle', 'location', 'time', 'logo'],
      wechat: ['title', 'subtitle', 'time', 'location', 'logo'],
      xiaohongshu: ['title', 'subtitle', 'location', 'time', 'guests', 'description', 'maxParticipants'],
      activity: ['title', 'subtitle', 'location', 'time', 'guests', 'description', 'maxParticipants', 'fee', 'qrcode', 'logo']
    };
    
    return typeSpecificFields[posterType] || baseFields;
  };

  // 初始化字段选择
  useEffect(() => {
    const defaultFields = getDefaultFieldsByPosterType(selectedPosterType);
    setSelectedFieldsState(defaultFields);
    setOriginalFields(defaultFields);
    if (onFieldsChange) {
      onFieldsChange(defaultFields);
    }
  }, [selectedPosterType]);

  // 处理字段选择变更
  const handleFieldsChange = (checkedFields: string[]) => {
    // 确保必选字段始终被选中
    const requiredFields = POSTER_FIELDS.filter(field => field.required).map(field => field.key);
    const finalFields = [...new Set([...requiredFields, ...checkedFields])];
    
    setSelectedFieldsState(finalFields);
    if (onFieldsChange) {
      onFieldsChange(finalFields);
    }
  };

  // 检查字段是否有变更
  const hasFieldsChanged = () => {
    if (selectedFieldsState.length !== originalFields.length) return true;
    return selectedFieldsState.some(field => !originalFields.includes(field)) ||
           originalFields.some(field => !selectedFieldsState.includes(field));
  };

  // 处理根据字段重新生成
  const handleRegenerateWithFields = () => {
    setOriginalFields([...selectedFieldsState]);
    setFieldsPopoverVisible(false);
    
    if (onRegenerateWithFields) {
      onRegenerateWithFields();
    } else {
      message.success('字段配置已更新！');
    }
  };

  // 取消字段变更
  const handleCancelFieldsChange = () => {
    setSelectedFieldsState([...originalFields]);
    setFieldsPopoverVisible(false);
  };

  // 渲染字段选择器内容
  const renderFieldsSelector = () => {
    const requiredFields = POSTER_FIELDS.filter(field => field.required);
    const optionalFields = POSTER_FIELDS.filter(field => !field.required);
    const fieldsChanged = hasFieldsChanged();

    return (
      <div style={{ width: 'auto', minWidth: 260, maxWidth: 320, maxHeight: 400, overflowY: 'auto' }}>
        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>海报字段配置</div>
          <div style={{ fontSize: '12px', color: '#999' }}>选择要在海报中显示的信息</div>
        </div>

        {/* 必选字段 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '8px', color: '#666' }}>
            📌 基础字段（必选）
          </div>
          <Checkbox.Group
            value={selectedFieldsState.filter(key => requiredFields.some(f => f.key === key))}
            style={{ width: '100%' }}
          >
            {requiredFields.map(field => (
              <div key={field.key} style={{ marginBottom: '6px', width: '100%' }}>
                <Checkbox 
                  value={field.key} 
                  disabled={true}
                  checked={true}
                  style={{ width: '100%' }}
                >
                  <span style={{ fontSize: '13px' }}>{field.label}</span>
                  <div style={{ fontSize: '11px', color: '#999', marginLeft: '24px' }}>
                    {field.description}
                  </div>
                </Checkbox>
              </div>
            ))}
          </Checkbox.Group>
        </div>

        {/* 可选字段 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '8px', color: '#666' }}>
            ⚙️ 可选字段
          </div>
          <Checkbox.Group
            value={selectedFieldsState.filter(key => optionalFields.some(f => f.key === key))}
            onChange={(checkedOptional) => {
              const requiredKeys = requiredFields.map(f => f.key);
              handleFieldsChange([...requiredKeys, ...checkedOptional]);
            }}
            style={{ width: '100%' }}
          >
            {optionalFields.map(field => (
              <div key={field.key} style={{ marginBottom: '6px', width: '100%' }}>
                <Checkbox value={field.key} style={{ width: '100%' }}>
                  <span style={{ fontSize: '13px' }}>{field.label}</span>
                  <div style={{ fontSize: '11px', color: '#999', marginLeft: '24px' }}>
                    {field.description}
                  </div>
                </Checkbox>
              </div>
            ))}
          </Checkbox.Group>
        </div>

        {/* 操作按钮 */}
        {fieldsChanged && (
          <div style={{ 
            borderTop: '1px solid #f0f0f0', 
            paddingTop: '12px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <Button size="small" onClick={handleCancelFieldsChange}>
              取消
            </Button>
            <Button 
              type="primary" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={handleRegenerateWithFields}
            >
              重新生成
            </Button>
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
          已选择 {selectedFieldsState.length} 个字段，当前类型推荐 {getDefaultFieldsByPosterType(selectedPosterType).length} 个字段
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%'
    }}>
      {/* 左侧：海报类型选择器和字段选择器 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 海报类型选择器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>类型：</span>
          <Select
            value={selectedPosterType}
            onChange={(value) => onPosterTypeChange(value as 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu' | 'activity')}
            style={{ width: 180 }}
            size="small"
            options={POSTER_TYPE_OPTIONS.map(option => ({
              value: option.value,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{option.label}</span>
                  <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                    {option.description}
                  </span>
                </div>
              )
            }))}
          />
        </div>

        {/* 字段选择器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>字段：</span>
          <Popover
            content={renderFieldsSelector()}
            trigger="click"
            placement="bottomLeft"
            open={fieldsPopoverVisible}
            onOpenChange={setFieldsPopoverVisible}
            overlayStyle={{ zIndex: 1050 }}
          >
            <Badge 
              count={hasFieldsChanged() ? '已修改' : 0} 
              size="small"
              style={{ 
                backgroundColor: '#52c41a',
                fontSize: '10px'
              }}
            >
              <div
                style={{ 
                  minWidth: '80px',
                  maxWidth: '140px',
                  height: '24px',
                  background: '#ffffff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#000000d9',
                  transition: 'all 0.2s'
                }}
                onClick={() => setFieldsPopoverVisible(!fieldsPopoverVisible)}
              >
                <span style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginRight: '4px'
                }}>
                  {selectedFieldsState.length} 个字段
                </span>
                <DownOutlined 
                  style={{ 
                    fontSize: '12px', 
                    color: '#00000073',
                    transform: fieldsPopoverVisible ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    flexShrink: 0
                  }} 
                />
              </div>
            </Badge>
          </Popover>
        </div>
      </div>

      {/* 分隔线 */}
      <div style={{ 
        width: '1px', 
        height: '20px', 
        background: 'rgba(255, 255, 255, 0.2)' 
      }} />

      {/* 右侧：操作按钮组 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 海报操作按钮 - 仅在有海报时显示 */}
        {hasCurrentPoster && (
          <>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={onDownloadPoster}
              style={{ color: 'rgba(255, 255, 255, 0.8)', border: 'none' }}
              title="下载海报"
            >
              下载海报
            </Button>
            
            <Button
              type="text"
              icon={<CodeOutlined />}
              onClick={onDownloadHtml}
              style={{ color: 'rgba(255, 255, 255, 0.8)', border: 'none' }}
              title="下载HTML源码"
            >
              HTML
            </Button>
          </>
        )}

        {/* 特殊功能按钮 - 邀请函批量生成 */}
        {hasCurrentPoster && selectedPosterType === 'invitation' && (
          <Button
            type="text"
            onClick={onBatchGenerate}
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
            title="批量生成邀请函"
          >
            批量生成
          </Button>
        )}

        <Button
          type="text"
          icon={<QuestionCircleOutlined />}
          onClick={onShowHelp}
          style={{ color: 'rgba(255, 255, 255, 0.8)', border: 'none' }}
          title="使用帮助"
        >
          帮助
        </Button>

        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={onConfigClick}
          style={{ color: 'rgba(255, 255, 255, 0.8)', border: 'none' }}
          title="打开配置面板"
        >
          配置
        </Button>
      </div>
    </div>
  );
};

export default TopDesignToolbar; 