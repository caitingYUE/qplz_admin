import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Typography, Tooltip, Input } from 'antd';
import { CodeOutlined, EyeOutlined, DownloadOutlined, UndoOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface HtmlEditorProps {
  visible: boolean;
  onClose: () => void;
  htmlContent: string;
  onUpdate: (newHtml: string) => void;
  posterName?: string;
  posterType?: string;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({
  visible,
  onClose,
  htmlContent,
  onUpdate,
  posterName = '海报',
  posterType = '竖图海报'
}) => {
  const [editedHtml, setEditedHtml] = useState(htmlContent);
  const [isChanged, setIsChanged] = useState(false);

  // 当弹框打开时，重置编辑内容
  useEffect(() => {
    if (visible) {
      setEditedHtml(htmlContent);
      setIsChanged(false);
    }
  }, [visible, htmlContent]);

  // 检查内容是否有变化
  useEffect(() => {
    setIsChanged(editedHtml !== htmlContent);
  }, [editedHtml, htmlContent]);

  // 处理HTML内容变化
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedHtml(e.target.value);
  };

  // 取消编辑
  const handleCancel = () => {
    if (isChanged) {
      Modal.confirm({
        title: '确认取消',
        content: '您的修改尚未保存，确定要取消吗？',
        okText: '确定取消',
        cancelText: '继续编辑',
        onOk: () => {
          setEditedHtml(htmlContent);
          setIsChanged(false);
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  // 更新海报
  const handleUpdate = () => {
    if (!editedHtml.trim()) {
      message.error('HTML内容不能为空');
      return;
    }

    // 简单验证HTML格式
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(editedHtml, 'text/html');
      const parserError = doc.querySelector('parsererror');
      
      if (parserError) {
        message.error('HTML格式错误，请检查代码语法');
        return;
      }
    } catch (error) {
      message.error('HTML格式验证失败');
      return;
    }

    onUpdate(editedHtml);
    setIsChanged(false);
    message.success('海报已更新！');
    onClose();
  };

  // 下载HTML文件
  const handleDownload = () => {
    const blob = new Blob([editedHtml], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${posterName}_${posterType}_${new Date().getTime()}.html`;
    link.click();
    message.success('HTML文件下载成功！');
  };

  // 重置到原始内容
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置到原始HTML内容吗？所有修改将丢失。',
      okText: '确定重置',
      cancelText: '取消',
      onOk: () => {
        setEditedHtml(htmlContent);
        setIsChanged(false);
        message.success('已重置到原始内容');
      }
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CodeOutlined style={{ color: '#667eea' }} />
          <span>HTML代码编辑器</span>
          {isChanged && (
            <span style={{ 
              fontSize: '12px', 
              color: '#ff4d4f', 
              background: '#fff2f0', 
              padding: '2px 6px', 
              borderRadius: '4px',
              border: '1px solid #ffccc7'
            }}>
              已修改
            </span>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={900}
      style={{ top: 20 }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左侧工具按钮 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="下载HTML文件">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                size="small"
              >
                下载
              </Button>
            </Tooltip>
            
            <Tooltip title="重置到原始内容">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!isChanged}
                size="small"
              >
                重置
              </Button>
            </Tooltip>
          </div>

          {/* 右侧操作按钮 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleUpdate}
              disabled={!isChanged}
              style={{
                background: isChanged ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                border: 'none'
              }}
            >
              更新海报
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          📝 您可以直接编辑HTML代码，修改样式、内容等。点击"更新海报"后，预览区域将显示修改后的效果。
        </Text>
      </div>

      <div style={{ position: 'relative' }}>
        <TextArea
          value={editedHtml}
          onChange={handleHtmlChange}
          placeholder="请输入HTML代码..."
          rows={24}
          style={{
            fontFamily: 'Monaco, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: '6px'
          }}
        />
        
        {/* 代码行数指示器 */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '11px',
          color: '#999',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 6px',
          borderRadius: '3px',
          backdropFilter: 'blur(4px)'
        }}>
          {editedHtml.split('\n').length} 行 / {editedHtml.length} 字符
        </div>
      </div>

      {/* 快捷提示 */}
      <div style={{ 
        marginTop: '12px', 
        padding: '8px 12px', 
        background: '#f6f8ff', 
        border: '1px solid #d1d9ff',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#556cd6'
      }}>
        💡 <strong>编辑提示：</strong>
        <br />• 可以修改CSS样式来调整颜色、字体、布局等
        <br />• 可以修改文本内容、图片链接等
        <br />• 请保持HTML结构完整，避免删除重要的标签
        <br />• 支持Ctrl+Z撤销操作
      </div>
    </Modal>
  );
};

export default HtmlEditor; 