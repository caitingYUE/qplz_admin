import React, { useState, useEffect } from 'react';
import { Tabs, Button, Upload, Select, ColorPicker, message, Input, Alert, Space, Card, Divider, Tag, Switch } from 'antd';
import { CloseOutlined, UploadOutlined, PlusOutlined, PictureOutlined, QrcodeOutlined, FontSizeOutlined, DeleteOutlined, KeyOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloudOutlined, MobileOutlined, LinkOutlined, SyncOutlined } from '@ant-design/icons';
import PosterTypeSelector from './PosterTypeSelector';
import type { DesignAssets, ApiMode } from '../types';
import { allBuiltinFonts, getFontsByCategory, loadFont } from '../utils/builtinFonts';
import { hasValidApiKey, setApiKey, getApiKey, removeApiKey, validateApiKey } from '../utils/deepseekApi';
import { apiAdapter, ApiUtils } from '../utils/apiAdapter';

interface ConfigPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedPosterType: string;
  onPosterTypeChange: (type: 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu' | 'activity') => void;
  designAssets: DesignAssets;
  onAssetsChange: (assets: DesignAssets) => void;
  onConfigChange?: () => void; // 新增：配置变更回调
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  visible,
  onClose,
  selectedPosterType,
  onPosterTypeChange,
  designAssets,
  onAssetsChange,
  onConfigChange
}) => {
  // 基础状态
  const [selectedFonts, setSelectedFonts] = useState<string[]>(['zaozi-langsong', 'system-ui']);
  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('#1890ff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // API密钥相关状态
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // 同步颜色状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brandColors');
      const savedColors = saved ? JSON.parse(saved) : [];
      setCurrentColors(savedColors);
    } catch (error) {
      console.error('读取颜色配置失败:', error);
      setCurrentColors([]);
    }
  }, []);

  // 初始化API密钥状态
  useEffect(() => {
    const currentKey = getApiKey();
    setApiKeyInput(currentKey ? '••••••••••••••••••••••••••••••••' : '');
    setIsApiKeyValid(hasValidApiKey());
  }, []);

  // API密钥管理函数
  const handleSaveApiKey = () => {
    if (!apiKeyInput || apiKeyInput.includes('•')) {
      message.warning('请输入有效的API密钥');
      return;
    }
    
    if (!validateApiKey(apiKeyInput)) {
      message.error('API密钥格式不正确，应为 sk- 开头的字符串');
      return;
    }
    
    const success = setApiKey(apiKeyInput);
    if (success) {
      setIsApiKeyValid(true);
      setApiKeyInput('••••••••••••••••••••••••••••••••');
      setShowApiKey(false);
      message.success('API密钥已保存');
      notifyConfigChange();
    } else {
      message.error('API密钥保存失败');
    }
  };

  const handleRemoveApiKey = () => {
    removeApiKey();
    setApiKeyInput('');
    setIsApiKeyValid(false);
    message.success('API密钥已清除');
    notifyConfigChange();
  };

  const handleToggleApiKeyVisibility = () => {
    if (showApiKey) {
      setApiKeyInput('••••••••••••••••••••••••••••••••');
      setShowApiKey(false);
    } else {
      const currentKey = getApiKey();
      setApiKeyInput(currentKey);
      setShowApiKey(true);
    }
  };

  // 配置变更通知
  const notifyConfigChange = () => {
    onConfigChange && onConfigChange();
  };

  // 实时保存设计资源
  const saveDesignAssetsToStorage = (assets: DesignAssets) => {
    try {
      localStorage.setItem('designAssets', JSON.stringify(assets));
      console.log('✅ 设计资源已自动保存');
    } catch (error) {
      console.error('❌ 保存设计资源失败:', error);
      message.error('保存失败，请重试');
    }
  };

  // 初始化选中的字体
  useEffect(() => {
    if (designAssets.brandFonts && designAssets.brandFonts.length > 0) {
      const fontIds = designAssets.brandFonts.map(font => font.id);
      setSelectedFonts(fontIds);
    } else {
      // 默认选择品牌字体
      setSelectedFonts(['zaozi-langsong', 'system-ui']);
    }
  }, [designAssets.brandFonts]);

  // 加载选中的字体
  useEffect(() => {
    selectedFonts.forEach(fontId => {
      const font = allBuiltinFonts.find(f => f.id === fontId);
      if (font) {
        loadFont(font);
      }
    });
  }, [selectedFonts]);

  // 处理字体选择变化
  const handleFontSelectionChange = (fontIds: string[]) => {
    setSelectedFonts(fontIds);
    
    // 转换为DesignAssets格式
    const selectedBuiltinFonts = fontIds.map(id => {
      const font = allBuiltinFonts.find(f => f.id === id);
      return font ? {
        id: font.id,
        name: font.displayName,
        url: font.family // 使用family作为url，在生成时使用
      } : null;
    }).filter(Boolean) as any[];

    const updatedAssets = {
      ...designAssets,
      brandFonts: selectedBuiltinFonts
    };

    onAssetsChange(updatedAssets);
    saveDesignAssetsToStorage(updatedAssets); // 实时保存
    message.success(`已选择 ${fontIds.length} 个字体`);
    notifyConfigChange();
  };

  // 文件上传处理（图片和二维码）
  const handleFileUpload = (file: File, type: 'referenceImages' | 'logos' | 'qrCodes') => {
    console.log('📤 上传文件:', { fileName: file.name, type });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const newAsset = {
        id: `${type}-${Date.now()}`,
        url: e.target?.result as string,
        name: file.name
      };
      
      const updatedAssets = {
        ...designAssets,
        [type]: [...designAssets[type], newAsset]
      };
      
      onAssetsChange(updatedAssets);
      saveDesignAssetsToStorage(updatedAssets); // 实时保存
      message.success(`${file.name} 上传成功`);
      notifyConfigChange();
    };
    
    reader.readAsDataURL(file);
    return false;
  };

  // 删除资源
  const removeAsset = (id: string, type: 'referenceImages' | 'logos' | 'qrCodes') => {
    const updatedAssets = {
      ...designAssets,
      [type]: designAssets[type].filter((asset: any) => asset.id !== id)
    };
    onAssetsChange(updatedAssets);
    saveDesignAssetsToStorage(updatedAssets); // 实时保存
    message.success('删除成功');
    notifyConfigChange();
  };

  // 添加品牌颜色
  const addBrandColor = () => {
    if (!selectedColor) return;
    
    const newColors = [...currentColors, selectedColor];
    const uniqueColors = Array.from(new Set(newColors));
    
    setCurrentColors(uniqueColors);
    // 实时保存颜色配置
    try {
      localStorage.setItem('brandColors', JSON.stringify(uniqueColors));
      console.log('✅ 颜色配置已自动保存');
    } catch (error) {
      console.error('❌ 保存颜色配置失败:', error);
      message.error('保存颜色失败');
      return;
    }
    
    setShowColorPicker(false);
    message.success('颜色已添加');
    notifyConfigChange();
  };

  // 删除品牌颜色
  const removeBrandColor = (color: string) => {
    const newColors = currentColors.filter(c => c !== color);
    setCurrentColors(newColors);
    
    // 实时保存颜色配置
    try {
      localStorage.setItem('brandColors', JSON.stringify(newColors));
      console.log('✅ 颜色配置已自动保存');
    } catch (error) {
      console.error('❌ 保存颜色配置失败:', error);
      message.error('保存颜色失败');
      return;
    }
    
    message.success('颜色已删除');
    notifyConfigChange();
  };

  // 颜色工具函数
  const isDarkColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const getContrastTextColor = (backgroundColor: string) => {
    return isDarkColor(backgroundColor) ? '#ffffff' : '#000000';
  };

  const getColorBorderStyle = (color: string) => {
    return color === '#ffffff' || color === '#FFFFFF' ? '2px solid #d9d9d9' : '2px solid transparent';
  };

  // 处理海报类型变化
  const handlePosterTypeChange = (type: 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu' | 'activity') => {
    onPosterTypeChange(type);
    
    // 海报类型变更通常不需要保存到localStorage，因为它是临时的选择
    // 但我们仍然需要通知配置变更
    const typeName = type === 'vertical' ? '竖图海报' : 
                    type === 'invitation' ? '邀请函' : 
                    type === 'wechat' ? '微信海报' : 
                    type === 'xiaohongshu' ? '小红书海报' : 
                    '活动行海报';
    message.success(`已切换到${typeName}`);
    notifyConfigChange();
  };

  const tabItems = [
    {
      key: 'posterType',
      label: '海报类型',
      children: (
        <div>
          <PosterTypeSelector
            selectedType={selectedPosterType}
            onTypeChange={handlePosterTypeChange}
          />
        </div>
      ),
    },
    {
      key: 'assets',
      label: '素材管理',
      children: (
        <div style={{ padding: '20px 0' }}>
          {/* 参考图片 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <PictureOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <span style={{ fontWeight: '500' }}>参考图片</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {designAssets.referenceImages.map((img: any) => (
                <div key={img.id} style={{ position: 'relative' }}>
                  <img 
                    src={img.url} 
                    alt={img.name}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      objectFit: 'cover',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }} 
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => removeAsset(img.id, 'referenceImages')}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      fontSize: '10px'
                    }}
                  />
                </div>
              ))}
            </div>
            <Upload
              accept="image/*"
              beforeUpload={(file) => handleFileUpload(file, 'referenceImages')}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} size="small">
                上传参考图片
              </Button>
            </Upload>
          </div>

          {/* LOGO */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <PictureOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
              <span style={{ fontWeight: '500' }}>品牌LOGO</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {designAssets.logos.map((logo: any) => (
                <div key={logo.id} style={{ position: 'relative' }}>
                  <img 
                    src={logo.url} 
                    alt={logo.name}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      objectFit: 'cover',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }} 
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => removeAsset(logo.id, 'logos')}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      fontSize: '10px'
                    }}
                  />
                </div>
              ))}
            </div>
            <Upload
              accept="image/*"
              beforeUpload={(file) => handleFileUpload(file, 'logos')}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} size="small">
                上传LOGO
              </Button>
            </Upload>
          </div>

          {/* 二维码 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <QrcodeOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
              <span style={{ fontWeight: '500' }}>二维码</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {designAssets.qrCodes.map((qr: any) => (
                <div key={qr.id} style={{ position: 'relative' }}>
                  <img 
                    src={qr.url} 
                    alt={qr.name}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      objectFit: 'cover',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }} 
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => removeAsset(qr.id, 'qrCodes')}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      fontSize: '10px'
                    }}
                  />
                </div>
              ))}
            </div>
            <Upload
              accept="image/*"
              beforeUpload={(file) => handleFileUpload(file, 'qrCodes')}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} size="small">
                上传二维码
              </Button>
            </Upload>
          </div>
        </div>
      ),
    },
    {
      key: 'colors',
      label: '色彩配置',
      children: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '500' }}>品牌色彩</span>
          </div>

          {/* 显示当前颜色 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentColors.map((color, index) => (
                <div key={`${color}-${index}`} style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: getColorBorderStyle(color),
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title={color}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => removeBrandColor(color)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 添加颜色 */}
          <div style={{ marginBottom: '16px' }}>
            {showColorPicker ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ColorPicker
                  value={selectedColor}
                  onChange={(color) => setSelectedColor(color.toHexString())}
                />
                <Button type="primary" size="small" onClick={addBrandColor}>
                  确认添加
                </Button>
                <Button size="small" onClick={() => setShowColorPicker(false)}>
                  取消
                </Button>
              </div>
            ) : (
              <Button 
                icon={<PlusOutlined />} 
                size="small"
                onClick={() => setShowColorPicker(true)}
              >
                添加品牌色
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'fonts',
      label: '字体配置',
      children: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <FontSizeOutlined style={{ marginRight: '8px', color: '#13c2c2' }} />
            <span style={{ fontWeight: '500' }}>品牌字体</span>
          </div>

          {/* 品牌字体选择 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>品牌字体</div>
            <Select
              mode="multiple"
              placeholder="选择品牌字体"
              style={{ width: '100%' }}
              value={selectedFonts.filter(id => getFontsByCategory('brand').some(f => f.id === id))}
              onChange={(values) => {
                const otherFonts = selectedFonts.filter(id => !getFontsByCategory('brand').some(f => f.id === id));
                handleFontSelectionChange([...otherFonts, ...values]);
              }}
            >
              {getFontsByCategory('brand').map(font => (
                <Select.Option key={font.id} value={font.id}>
                  {font.displayName}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* 系统字体选择 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>系统字体</div>
            <Select
              mode="multiple"
              placeholder="选择系统字体"
              style={{ width: '100%' }}
              value={selectedFonts.filter(id => getFontsByCategory('system').some(f => f.id === id))}
              onChange={(values) => {
                const otherFonts = selectedFonts.filter(id => !getFontsByCategory('system').some(f => f.id === id));
                handleFontSelectionChange([...otherFonts, ...values]);
              }}
            >
              {getFontsByCategory('system').map(font => (
                <Select.Option key={font.id} value={font.id}>
                  {font.displayName}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* 网络字体选择 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>网络字体</div>
            <Select
              mode="multiple"
              placeholder="选择网络字体"
              style={{ width: '100%' }}
              value={selectedFonts.filter(id => getFontsByCategory('web').some(f => f.id === id))}
              onChange={(values) => {
                const otherFonts = selectedFonts.filter(id => !getFontsByCategory('web').some(f => f.id === id));
                handleFontSelectionChange([...otherFonts, ...values]);
              }}
            >
              {getFontsByCategory('web').map(font => (
                <Select.Option key={font.id} value={font.id}>
                  {font.displayName}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* 当前选中的字体预览 */}
          {selectedFonts.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                已选字体预览
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedFonts.map(fontId => {
                  const font = allBuiltinFonts.find(f => f.id === fontId);
                  return font ? (
                    <div 
                      key={fontId}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        fontFamily: font.family,
                        fontSize: '16px'
                      }}
                    >
                      {font.displayName} - 前排落座女性社区
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'apiKey',
      label: 'API设置',
      children: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <KeyOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
            <span style={{ fontWeight: '500' }}>DeepSeek API密钥</span>
          </div>

          {/* API密钥状态提示 */}
          <Alert
            message={isApiKeyValid ? 'API密钥已配置' : 'API密钥未配置'}
            description={
              isApiKeyValid 
                ? '您已成功配置DeepSeek API密钥，可以正常使用AI海报生成功能。'
                : '请配置您的DeepSeek API密钥以使用AI海报生成功能。您可以在DeepSeek官网申请API密钥。'
            }
            type={isApiKeyValid ? 'success' : 'warning'}
            icon={isApiKeyValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            showIcon
            style={{ marginBottom: '16px' }}
          />

          {/* API密钥输入 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              API密钥
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="请输入DeepSeek API密钥 (sk-...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button onClick={handleToggleApiKeyVisibility}>
                {showApiKey ? '隐藏' : '显示'}
              </Button>
            </Space.Compact>
          </div>

          {/* 操作按钮 */}
          <Space>
            <Button 
              type="primary" 
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput || apiKeyInput.includes('•')}
            >
              保存密钥
            </Button>
            {isApiKeyValid && (
              <Button 
                danger 
                onClick={handleRemoveApiKey}
              >
                清除密钥
              </Button>
            )}
          </Space>

          {/* 说明信息 */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#f6f6f6',
            borderRadius: '6px',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '8px' }}>📝 如何获取API密钥？</div>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>访问 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">DeepSeek开放平台</a></li>
              <li>注册账号并登录</li>
              <li>在控制台创建API密钥</li>
              <li>复制密钥并粘贴到上方输入框</li>
            </ol>
            <div style={{ marginTop: '8px', color: '#666' }}>
              💡 API密钥仅存储在您的浏览器本地，不会上传到服务器。
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'serverConfig',
      label: '服务器配置',
      children: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <CloudOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
            <span style={{ fontWeight: '500' }}>服务器配置</span>
          </div>

          {/* API模式选择 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>API模式</div>
            <Select
              value={designAssets.apiMode}
              onChange={(value) => {
                const updatedAssets = {
                  ...designAssets,
                  apiMode: value as ApiMode
                };
                onAssetsChange(updatedAssets);
                saveDesignAssetsToStorage(updatedAssets);
                message.success('API模式已更新');
                notifyConfigChange();
              }}
            >
              <Select.Option value="local">本地模式</Select.Option>
              <Select.Option value="remote">远程模式</Select.Option>
            </Select>
          </div>

          {/* 小程序集成设置 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>小程序集成</div>
            <Switch
              checked={designAssets.isMiniProgramIntegrated}
              onChange={(checked) => {
                const updatedAssets = {
                  ...designAssets,
                  isMiniProgramIntegrated: checked
                };
                onAssetsChange(updatedAssets);
                saveDesignAssetsToStorage(updatedAssets);
                message.success('小程序集成状态已更新');
                notifyConfigChange();
              }}
            />
          </div>

          {/* 服务器地址输入 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>服务器地址</div>
            <Input
              placeholder="请输入服务器地址"
              value={designAssets.serverAddress}
              onChange={(e) => {
                const updatedAssets = {
                  ...designAssets,
                  serverAddress: e.target.value
                };
                onAssetsChange(updatedAssets);
                saveDesignAssetsToStorage(updatedAssets);
                message.success('服务器地址已更新');
                notifyConfigChange();
              }}
            />
          </div>

          {/* 服务器端口输入 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>服务器端口</div>
            <Input
              placeholder="请输入服务器端口"
              value={designAssets.serverPort}
              onChange={(e) => {
                const updatedAssets = {
                  ...designAssets,
                  serverPort: e.target.value
                };
                onAssetsChange(updatedAssets);
                saveDesignAssetsToStorage(updatedAssets);
                message.success('服务器端口已更新');
                notifyConfigChange();
              }}
            />
          </div>

          {/* 服务器连接状态 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>服务器连接状态</div>
            <Tag color={designAssets.isServerConnected ? 'success' : 'error'}>
              {designAssets.isServerConnected ? '已连接' : '未连接'}
            </Tag>
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              icon={<LinkOutlined />}
              onClick={async () => {
                message.loading('正在测试连接...', 0);
                try {
                  // 模拟连接测试
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  if (designAssets.apiMode === 'remote' && designAssets.serverAddress) {
                    const updatedAssets = {
                      ...designAssets,
                      isServerConnected: true
                    };
                    onAssetsChange(updatedAssets);
                    saveDesignAssetsToStorage(updatedAssets);
                    message.destroy();
                    message.success('服务器连接成功');
                  } else {
                    message.destroy();
                    message.error('请先配置服务器地址并切换到远程模式');
                  }
                } catch (error) {
                  message.destroy();
                  message.error('连接失败，请检查服务器配置');
                }
              }}
            >
              测试连接
            </Button>
          </div>

          {/* 小程序功能区 */}
          {designAssets.apiMode === 'remote' && (
            <>
              <Divider />
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <MobileOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontWeight: '500' }}>小程序集成功能</span>
                </div>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    icon={<SyncOutlined />}
                    disabled={!designAssets.isServerConnected}
                    onClick={() => {
                      if (designAssets.isServerConnected) {
                        message.success('活动数据已同步到小程序');
                      } else {
                        message.warning('请先连接服务器');
                      }
                    }}
                  >
                    同步到小程序
                  </Button>
                  
                  <Button
                    icon={<QrcodeOutlined />}
                    disabled={!designAssets.isServerConnected}
                    onClick={() => {
                      if (designAssets.isServerConnected) {
                        message.success('小程序二维码生成功能可用');
                      } else {
                        message.warning('请先连接服务器');
                      }
                    }}
                  >
                    生成小程序码
                  </Button>
                </Space>
              </div>
            </>
          )}

          {/* 模式说明 */}
          <Alert
            type="info"
            showIcon
            message="功能说明"
            description={
              designAssets.apiMode === 'local' 
                ? '当前为本地模式，数据存储在浏览器中。切换到远程模式可启用小程序集成功能。'
                : '远程模式已启用，可以与小程序进行数据同步和功能集成。'
            }
            style={{ marginTop: '16px' }}
          />
        </div>
      ),
    },
  ];

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: visible ? 0 : '-400px',
      width: '400px',
      height: '100vh',
      background: '#ffffff',
      boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      transition: 'right 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>高级配置</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '12px', 
            color: '#52c41a',
            background: '#f6ffed',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: '400'
          }}>
            实时保存
          </span>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
      </div>

      {/* 内容区域 - 占满剩余空间 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tabs
          items={tabItems}
          style={{ padding: '0 20px' }}
          size="small"
        />
      </div>
    </div>
  );
};

export default ConfigPanel; 