import React from 'react';
import { Card, Button, Space, Typography, Divider } from 'antd';
import { DownloadOutlined, LeftOutlined, ReloadOutlined, FilePdfOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface FinalPlanProps {
  finalPlan: string;
  onRestart: () => void;
  onBack: () => void;
}

const FinalPlan: React.FC<FinalPlanProps> = ({
  finalPlan,
  onRestart,
  onBack
}) => {
  // 将Markdown格式的文本转换为JSX渲染
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        elements.push(
          <Title level={1} key={index} style={{ color: '#b01c02', marginTop: '20px' }}>
            {line.replace('# ', '')}
          </Title>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Title level={3} key={index} style={{ marginTop: '24px', marginBottom: '12px' }}>
            {line.replace('## ', '')}
          </Title>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Title level={4} key={index} style={{ marginTop: '16px', marginBottom: '8px' }}>
            {line.replace('### ', '')}
          </Title>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <div key={index} style={{ marginLeft: '20px', marginBottom: '4px' }}>
            • {line.replace('- ', '')}
          </div>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <div key={index} style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {line.replace(/\*\*/g, '')}
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<br key={index} />);
      } else if (line.trim() !== '') {
        elements.push(
          <Paragraph key={index} style={{ marginBottom: '8px' }}>
            {line}
          </Paragraph>
        );
      }
    });
    
    return elements;
  };

  const handleDownload = () => {
    // 创建下载文件
    const blob = new Blob([finalPlan], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `活动策划方案_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    // 简单的打印功能
    window.print();
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
            📄 完整活动策划方案
          </Title>
          <Paragraph style={{ margin: '4px 0 0 0', color: '#666' }}>
            您的专业活动策划书已生成完成
          </Paragraph>
        </div>
        <Space>
          <Button 
            icon={<LeftOutlined />} 
            onClick={onBack}
          >
            返回优化
          </Button>
          <Button 
            icon={<FilePdfOutlined />}
            onClick={handlePrintPdf}
          >
            打印/PDF
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            type="primary"
            style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
          >
            下载方案
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={onRestart}
          >
            重新策划
          </Button>
        </Space>
      </div>

      {/* 方案内容 */}
      <Card 
        style={{ 
          flex: 1, 
          overflow: 'auto',
          backgroundColor: '#fff'
        }}
        bodyStyle={{ 
          padding: '40px',
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
          lineHeight: 1.6
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {renderMarkdown(finalPlan)}
        </div>
      </Card>

      {/* 底部提示 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        backgroundColor: '#f6f8fa', 
        borderRadius: '6px',
        textAlign: 'center',
        flexShrink: 0
      }}>
        <Paragraph style={{ margin: 0 }} type="secondary">
          🎉 恭喜！您的活动策划方案已完成。您可以下载保存，或直接基于此方案创建活动。
        </Paragraph>
      </div>
    </div>
  );
};

export default FinalPlan; 