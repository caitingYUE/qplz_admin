import React, { useState } from 'react';
import { Button, Upload, ColorPicker, Tag, message, Modal, Input } from 'antd';
import { 
  PictureOutlined, 
  FileImageOutlined, 
  QrcodeOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import PosterTypeSelector from './PosterTypeSelector';

interface DesignAssets {
  referenceImages: Array<{ id: string; url: string; name: string }>;
  logos: Array<{ id: string; url: string; name: string }>;
  qrCodes: Array<{ id: string; url: string; name: string }>;
  brandColors: string[];
  brandFonts: Array<{ id: string; name: string; url: string }>;
}

interface DesignToolbarProps {
  selectedPosterType: string;
  onPosterTypeChange: (type: 'vertical' | 'invitation' | 'wechat' | 'xiaohongshu') => void;
  designAssets: DesignAssets;
  onAssetsChange: (assets: DesignAssets) => void;
}

const DesignToolbar: React.FC<DesignToolbarProps> = ({
  selectedPosterType,
  onPosterTypeChange,
  designAssets,
  onAssetsChange
}) => {

  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [qrCodeText, setQrCodeText] = useState('');

  // 处理文件上传
  const handleFileUpload = (file: File, type: 'referenceImages' | 'logos' | 'brandFonts') => {
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
      message.success(`${file.name} 上传成功`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  // 删除资源
  const removeAsset = (id: string, type: 'referenceImages' | 'logos' | 'qrCodes' | 'brandFonts') => {
    const updatedAssets = {
      ...designAssets,
      [type]: designAssets[type].filter((item: any) => item.id !== id)
    };
    onAssetsChange(updatedAssets);
  };

  // 添加品牌色
  const addBrandColor = (color: string) => {
    if (!designAssets.brandColors.includes(color)) {
      const updatedAssets = {
        ...designAssets,
        brandColors: [...designAssets.brandColors, color]
      };
      onAssetsChange(updatedAssets);
    }
  };

  // 删除品牌色
  const removeBrandColor = (color: string) => {
    const updatedAssets = {
      ...designAssets,
      brandColors: designAssets.brandColors.filter(c => c !== color)
    };
    onAssetsChange(updatedAssets);
  };

  // 添加二维码
  const addQrCode = () => {
    if (!qrCodeText.trim()) {
      message.warning('请输入二维码内容');
      return;
    }

    // 生成二维码（这里简化处理，实际应该调用二维码生成库）
    const newQrCode = {
      id: `qr-${Date.now()}`,
      url: `data:image/svg+xml;base64,${btoa(`<svg>QR: ${qrCodeText}</svg>`)}`, // 简化的二维码
      name: qrCodeText.substring(0, 20) + (qrCodeText.length > 20 ? '...' : '')
    };

    const updatedAssets = {
      ...designAssets,
      qrCodes: [...designAssets.qrCodes, newQrCode]
    };
    
    onAssetsChange(updatedAssets);
    setQrCodeText('');
    setQrCodeModalVisible(false);
    message.success('二维码添加成功');
  };

  return (
    <div style={{
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      borderRadius: '12px',
      border: '1px solid #e8e8e8'
    }}>
      {/* 基础配置区域 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#262626', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎨 基础配置
        </div>
        {/* 使用新的海报类型选择器 */}
        <PosterTypeSelector
          selectedType={selectedPosterType}
          onTypeChange={onPosterTypeChange}
        />
      </div>

      {/* 高级配置区域 - 可折叠 */}
      <div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#262626', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          ⚙️ 高级配置 
          <span style={{ fontSize: '12px', color: '#999' }}>(可选)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

        {/* 参考图上传 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PictureOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: '500', color: '#333' }}>参考图：</span>
          <Upload
            accept="image/*"
            beforeUpload={(file) => handleFileUpload(file, 'referenceImages')}
            showUploadList={false}
            disabled={designAssets.referenceImages.length >= 5}
          >
            <Button 
              icon={<PlusOutlined />} 
              size="small"
              disabled={designAssets.referenceImages.length >= 5}
            >
              上传 ({designAssets.referenceImages.length}/5)
            </Button>
          </Upload>
          {designAssets.referenceImages.map(img => (
            <Tag
              key={img.id}
              closable
              onClose={() => removeAsset(img.id, 'referenceImages')}
              style={{ marginLeft: '4px' }}
            >
              <img src={img.url} alt={img.name} style={{ width: '16px', height: '16px', marginRight: '4px' }} />
              {img.name.length > 10 ? img.name.substring(0, 10) + '...' : img.name}
            </Tag>
          ))}
        </div>

        {/* Logo上传 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileImageOutlined style={{ color: '#fa8c16' }} />
          <span style={{ fontWeight: '500', color: '#333' }}>Logo：</span>
          <Upload
            accept="image/*"
            beforeUpload={(file) => handleFileUpload(file, 'logos')}
            showUploadList={false}
            disabled={designAssets.logos.length >= 5}
          >
            <Button 
              icon={<PlusOutlined />} 
              size="small"
              disabled={designAssets.logos.length >= 5}
            >
              上传 ({designAssets.logos.length}/5)
            </Button>
          </Upload>
          {designAssets.logos.map(logo => (
            <Tag
              key={logo.id}
              closable
              onClose={() => removeAsset(logo.id, 'logos')}
              style={{ marginLeft: '4px' }}
            >
              <img src={logo.url} alt={logo.name} style={{ width: '16px', height: '16px', marginRight: '4px' }} />
              {logo.name.length > 10 ? logo.name.substring(0, 10) + '...' : logo.name}
            </Tag>
          ))}
        </div>

        {/* 二维码 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrcodeOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: '500', color: '#333' }}>二维码：</span>
          <Button 
            icon={<PlusOutlined />} 
            size="small"
            onClick={() => setQrCodeModalVisible(true)}
            disabled={designAssets.qrCodes.length >= 5}
          >
            添加 ({designAssets.qrCodes.length}/5)
          </Button>
          {designAssets.qrCodes.map(qr => (
            <Tag
              key={qr.id}
              closable
              onClose={() => removeAsset(qr.id, 'qrCodes')}
              style={{ marginLeft: '4px' }}
            >
              📱 {qr.name}
            </Tag>
          ))}
        </div>

        {/* 品牌主题色 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BgColorsOutlined style={{ color: '#eb2f96' }} />
          <span style={{ fontWeight: '500', color: '#333' }}>主题色：</span>
          <ColorPicker
            value="#1890ff"
            onChangeComplete={(color) => addBrandColor(color.toHexString())}
            trigger="click"
          >
            <Button 
              icon={<PlusOutlined />} 
              size="small"
              disabled={designAssets.brandColors.length >= 5}
            >
              添加 ({designAssets.brandColors.length}/5)
            </Button>
          </ColorPicker>
          {designAssets.brandColors.map(color => (
            <Tag
              key={color}
              closable
              onClose={() => removeBrandColor(color)}
              style={{ 
                marginLeft: '4px',
                background: color,
                color: '#fff',
                border: `1px solid ${color}`
              }}
            >
              {color}
            </Tag>
          ))}
        </div>

        {/* 品牌字体 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontSizeOutlined style={{ color: '#13c2c2' }} />
          <span style={{ fontWeight: '500', color: '#333' }}>字体：</span>
          <Upload
            accept=".ttf,.otf,.woff,.woff2"
            beforeUpload={(file) => handleFileUpload(file, 'brandFonts')}
            showUploadList={false}
            disabled={designAssets.brandFonts.length >= 5}
          >
            <Button 
              icon={<PlusOutlined />} 
              size="small"
              disabled={designAssets.brandFonts.length >= 5}
            >
              上传 ({designAssets.brandFonts.length}/5)
            </Button>
          </Upload>
          {designAssets.brandFonts.map(font => (
            <Tag
              key={font.id}
              closable
              onClose={() => removeAsset(font.id, 'brandFonts')}
              style={{ marginLeft: '4px' }}
            >
              🔤 {font.name.length > 10 ? font.name.substring(0, 10) + '...' : font.name}
            </Tag>
          ))}
        </div>
      </div>
      </div>

      {/* 二维码添加弹窗 */}
      <Modal
        title="添加二维码"
        open={qrCodeModalVisible}
        onOk={addQrCode}
        onCancel={() => {
          setQrCodeModalVisible(false);
          setQrCodeText('');
        }}
        okText="生成二维码"
        cancelText="取消"
      >
        <div style={{ padding: '16px 0' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            二维码内容：
          </label>
          <Input.TextArea
            value={qrCodeText}
            onChange={(e) => setQrCodeText(e.target.value)}
            placeholder="输入网址、文本或其他信息..."
            rows={3}
            maxLength={500}
            showCount
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            支持网址、微信号、联系方式等信息
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DesignToolbar; 