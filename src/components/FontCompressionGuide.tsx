import React from 'react';
import { Modal, Typography, List, Button, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface FontCompressionGuideProps {
  visible: boolean;
  onClose: () => void;
}

export const FontCompressionGuide: React.FC<FontCompressionGuideProps> = ({ visible, onClose }) => {
  const compressionMethods = [
    {
      title: '🔄 格式转换',
      description: 'TTF/OTF → WOFF2',
      benefit: '文件大小减少50-70%',
      howTo: '使用在线工具如 CloudConvert 或 FontSquirrel',
      url: 'https://www.fontsquirrel.com/tools/webfont-generator'
    },
    {
      title: '✂️ 字体子集化',
      description: '只保留需要的字符',
      benefit: '文件大小减少80-90%',
      howTo: '选择常用汉字子集（3500字）',
      url: 'https://font-spider.org/'
    },
    {
      title: '🌐 使用在线字体',
      description: 'Google Fonts 或 Adobe Fonts',
      benefit: '无需上传，节省存储空间',
      howTo: '在CSS中引用在线字体链接',
      url: 'https://fonts.google.com/'
    }
  ];

  const troubleshootingSteps = [
    '🧹 清理浏览器缓存和数据',
    '📱 尝试隐私/无痕模式',
    '🔄 重启浏览器',
    '📂 删除不必要的上传文件',
    '💾 使用存储空间管理工具',
    '📱 更换其他浏览器尝试'
  ];

  return (
    <Modal
      title="🔤 字体文件上传问题解决方案"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          知道了
        </Button>
      ]}
      width={600}
    >
      <Typography>
        <Paragraph>
          <Text strong>遇到存储空间不足？</Text> 这里有几种有效的解决方案：
        </Paragraph>

        <Title level={4}>📦 文件压缩方法</Title>
        <List
          dataSource={compressionMethods}
          renderItem={(item) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>{item.title}</Text>
                  <Text type="success" style={{ marginLeft: '10px', fontSize: '12px' }}>
                    {item.benefit}
                  </Text>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <Text type="secondary">{item.description}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: '12px' }}>💡 {item.howTo}</Text>
                  {item.url && (
                    <Button 
                      type="link" 
                      size="small" 
                      href={item.url} 
                      target="_blank"
                      style={{ padding: '0 8px', fontSize: '12px' }}
                    >
                      打开工具
                    </Button>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />

        <Divider />
        
        <Title level={4}>🔧 故障排除步骤</Title>
        <List
          size="small"
          dataSource={troubleshootingSteps}
          renderItem={(item) => (
            <List.Item style={{ padding: '4px 0' }}>
              <Text>{item}</Text>
            </List.Item>
          )}
        />

        <Divider />

        <Title level={4}>📏 文件大小建议</Title>
        <List size="small">
          <List.Item>
            <Text type="success">✅ 推荐: &lt; 2MB</Text>
            <Text type="secondary" style={{ marginLeft: '20px' }}>上传顺畅，体验良好</Text>
          </List.Item>
          <List.Item>
            <Text type="warning">⚠️ 可接受: 2-5MB</Text>
            <Text type="secondary" style={{ marginLeft: '20px' }}>可能较慢，建议压缩</Text>
          </List.Item>
          <List.Item>
            <Text type="danger">❌ 过大: &gt; 5MB</Text>
            <Text type="secondary" style={{ marginLeft: '20px' }}>需要压缩或转换格式</Text>
          </List.Item>
        </List>

        <Divider />

        <Paragraph style={{ backgroundColor: '#f6f8fa', padding: '12px', borderRadius: '6px' }}>
          <Text strong>💡 最佳实践建议：</Text>
          <br />
          1. 优先使用 WOFF2 格式的字体文件
          <br />
          2. 只上传项目中实际需要的字体
          <br />
          3. 考虑使用系统字体作为备选方案
          <br />
          4. 定期清理不用的字体文件
        </Paragraph>
      </Typography>
    </Modal>
  );
}; 