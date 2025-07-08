import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, message, Dropdown, MenuProps } from 'antd';
import { 
  DownloadOutlined, 
  LeftOutlined, 
  ReloadOutlined, 
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  CopyOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { DocumentExporter } from '../utils/documentExport';

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
  const [isExporting, setIsExporting] = useState(false);

  // 改进的Markdown渲染函数
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('# ')) {
        elements.push(
          <Title level={1} key={index} style={{ color: '#b01c02', marginTop: '32px', marginBottom: '16px' }}>
            {trimmedLine.replace('# ', '')}
          </Title>
        );
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <Title level={2} key={index} style={{ marginTop: '28px', marginBottom: '14px', color: '#333' }}>
            {trimmedLine.replace('## ', '')}
          </Title>
        );
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(
          <Title level={3} key={index} style={{ marginTop: '20px', marginBottom: '10px', color: '#555' }}>
            {trimmedLine.replace('### ', '')}
          </Title>
        );
      } else if (trimmedLine.startsWith('#### ')) {
        elements.push(
          <Title level={4} key={index} style={{ marginTop: '16px', marginBottom: '8px', color: '#666' }}>
            {trimmedLine.replace('#### ', '')}
          </Title>
        );
      } else if (trimmedLine.startsWith('- [ ]')) {
        elements.push(
          <div key={index} style={{ 
            marginLeft: '20px', 
            marginBottom: '6px',
            padding: '4px 8px',
            backgroundColor: '#f8f9fa',
            borderLeft: '3px solid #28a745',
            borderRadius: '3px'
          }}>
            ☐ {trimmedLine.replace('- [ ]', '').trim()}
          </div>
        );
      } else if (trimmedLine.startsWith('- [x]')) {
        elements.push(
          <div key={index} style={{ 
            marginLeft: '20px', 
            marginBottom: '6px',
            padding: '4px 8px',
            backgroundColor: '#d4edda',
            borderLeft: '3px solid #28a745',
            borderRadius: '3px'
          }}>
            ☑ {trimmedLine.replace('- [x]', '').trim()}
          </div>
        );
      } else if (trimmedLine.startsWith('- ')) {
        elements.push(
          <div key={index} style={{ marginLeft: '20px', marginBottom: '6px', lineHeight: '1.6' }}>
            • {trimmedLine.replace('- ', '')}
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        elements.push(
          <div key={index} style={{ marginLeft: '20px', marginBottom: '6px', lineHeight: '1.6' }}>
            {trimmedLine}
          </div>
        );
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        elements.push(
          <div key={index} style={{ 
            fontWeight: 'bold', 
            marginBottom: '12px',
            fontSize: '16px',
            color: '#333'
          }}>
            {trimmedLine.replace(/\*\*/g, '')}
          </div>
        );
      } else if (trimmedLine === '') {
        elements.push(<div key={index} style={{ height: '12px' }} />);
      } else if (trimmedLine === '---') {
        elements.push(<Divider key={index} style={{ margin: '24px 0' }} />);
      } else if (trimmedLine !== '') {
        // 处理内联格式
        const processedLine = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        elements.push(
          <Paragraph key={index} style={{ 
            marginBottom: '12px',
            lineHeight: '1.7',
            fontSize: '14px'
          }}>
            <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          </Paragraph>
        );
      }
    });
    
    return elements;
  };

  // 提取活动标题
  const extractTitle = (content: string): string => {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.replace('# ', '').trim();
      }
    }
    return '活动策划方案';
  };

  const handleDownloadWord = async () => {
    setIsExporting(true);
    try {
      const title = extractTitle(finalPlan);
      await DocumentExporter.downloadAsWord(title, finalPlan);
      message.success('Word文档下载成功！');
    } catch (error) {
      message.error('Word文档下载失败，请重试');
      console.error('下载Word失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadText = async () => {
    setIsExporting(true);
    try {
      const title = extractTitle(finalPlan);
      await DocumentExporter.downloadAsText(title, finalPlan);
      message.success('文本文档下载成功！');
    } catch (error) {
      message.error('文本文档下载失败，请重试');
      console.error('下载文本失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await DocumentExporter.copyToClipboard(finalPlan);
      message.success('策划方案已复制到剪贴板！');
    } catch (error) {
      message.error('复制失败，请重试');
      console.error('复制失败:', error);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // 下载选项菜单
  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'word',
      icon: <FileWordOutlined />,
      label: '下载Word文档',
      onClick: handleDownloadWord,
    },
    {
      key: 'text',
      icon: <FileTextOutlined />,
      label: '下载文本文档',
      onClick: handleDownloadText,
    },
    {
      type: 'divider',
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制到剪贴板',
      onClick: handleCopyToClipboard,
    },
    {
      key: 'print',
      icon: <FilePdfOutlined />,
      label: '打印/导出PDF',
      onClick: handlePrintPdf,
    },
  ];

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
            完整活动策划方案
          </Title>
          <Paragraph style={{ margin: '4px 0 0 0', color: '#666' }}>
            您的专业活动策划书已生成完成，包含倒排时间计划
          </Paragraph>
        </div>
        <Space>
          <Button 
            icon={<LeftOutlined />} 
            onClick={onBack}
          >
            返回优化
          </Button>
          <Dropdown
            menu={{ items: downloadMenuItems }}
            trigger={['click']}
            disabled={isExporting}
          >
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              loading={isExporting}
              style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
            >
              下载方案 <MoreOutlined />
            </Button>
          </Dropdown>
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
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ 
          padding: '48px',
          fontFamily: '"Microsoft YaHei", "微软雅黑", "Helvetica Neue", Arial, sans-serif',
          lineHeight: 1.6
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {renderMarkdown(finalPlan)}
        </div>
      </Card>

      {/* 底部提示 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '20px', 
        backgroundColor: '#f6f8fa', 
        borderRadius: '8px',
        textAlign: 'center',
        flexShrink: 0,
        border: '1px solid #e1e8ed'
      }}>
        <Paragraph style={{ margin: 0, fontSize: '14px' }} type="secondary">
          恭喜！您的活动策划方案已完成。建议下载Word格式进行进一步编辑，或使用倒排时间计划来管理项目进度。
        </Paragraph>
      </div>
    </div>
  );
};

export default FinalPlan; 