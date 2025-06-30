import React, { useRef, useEffect } from 'react';
import { Button, Input, Avatar, Divider, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  posterHtml?: string;
  posterType?: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  userInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isGenerating: boolean;
  onStartGenerate: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  userInput,
  onInputChange,
  onSendMessage,
  isGenerating,
  onStartGenerate
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (userInput.trim() && !isGenerating) {
        onSendMessage();
      }
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染消息头像
  const renderAvatar = (type: ChatMessage['type']) => {
    switch (type) {
      case 'ai':
        return <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />;
      case 'user':
        return <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />;
      case 'system':
        return <Avatar style={{ backgroundColor: '#faad14' }}>🎨</Avatar>;
      default:
        return <Avatar>?</Avatar>;
    }
  };

  // 检查是否显示生成按钮
  const shouldShowGenerateButton = () => {
    return messages.length > 0 && !messages.some(msg => msg.posterHtml) && !isGenerating;
  };

  // 快捷指令列表
  const quickCommands = [
    { text: '调整标题字体大小', icon: '📝' },
    { text: '更换配色方案', icon: '🎨' },
    { text: '修改布局样式', icon: '📐' },
    { text: '添加装饰元素', icon: '✨' },
    { text: '调整背景样式', icon: '🖼️' },
    { text: '优化整体设计', icon: '🔄' }
  ];

  // 使用快捷指令
  const useQuickCommand = (command: string) => {
    onInputChange(command);
    if (messages.some(msg => msg.posterHtml)) {
      onSendMessage();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      minHeight: '500px'
    }}>
      {/* 对话历史 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '8px 0',
        maxHeight: '400px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#999'
          }}>
            <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>AI设计助手等待为您服务</div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
              }}>
                {renderAvatar(message.type)}
                <div style={{ flex: 1, maxWidth: '80%' }}>
                  <div style={{
                    background: message.type === 'user' 
                      ? '#1890ff' 
                      : message.type === 'system' 
                        ? '#fff2e8' 
                        : '#f6f6f6',
                    color: message.type === 'user' ? '#fff' : '#333',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' 
                      ? '16px 16px 4px 16px' 
                      : '16px 16px 16px 4px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999', 
                    marginTop: '4px',
                    textAlign: message.type === 'user' ? 'right' : 'left'
                  }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* 生成中指示器 */}
        {isGenerating && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '16px',
            background: '#f0f0f0',
            borderRadius: '12px',
            margin: '8px 0'
          }}>
            <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spin size="small" />
                <span style={{ color: '#666' }}>AI正在为您设计海报...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 生成海报按钮 */}
      {shouldShowGenerateButton() && (
        <div style={{ padding: '16px 0' }}>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={onStartGenerate}
            loading={isGenerating}
            block
            style={{
              height: '48px',
              fontSize: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            {isGenerating ? '正在生成海报...' : '🎨 开始生成海报'}
          </Button>
        </div>
      )}

      {/* 快捷指令区域 - 仅在有海报时显示 */}
      {messages.some(msg => msg.posterHtml) && !isGenerating && (
        <div style={{ padding: '12px 0' }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            💡 快捷修改指令
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px'
          }}>
            {quickCommands.map((cmd, index) => (
              <Button
                key={index}
                size="small"
                style={{
                  fontSize: '12px',
                  borderRadius: '16px',
                  border: '1px solid #d9d9d9',
                  background: '#fafafa',
                  color: '#666',
                  padding: '4px 8px',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => useQuickCommand(cmd.text)}
              >
                <span style={{ fontSize: '10px' }}>{cmd.icon}</span>
                {cmd.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* 输入区域 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1 }}>
          <TextArea
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              messages.some(msg => msg.posterHtml) 
                ? "告诉我您想要调整的地方，比如：\n• 改变颜色主题\n• 调整文字大小\n• 更换布局风格\n• 添加装饰元素..."
                : "填写活动信息后，点击上方按钮开始生成海报"
            }
            rows={3}
            disabled={isGenerating || !messages.some(msg => msg.posterHtml)}
            style={{
              resize: 'none',
              borderRadius: '8px',
              border: '1px solid #d9d9d9'
            }}
          />
          <div style={{ 
            fontSize: '12px', 
            color: '#999', 
            marginTop: '4px',
            textAlign: 'right' 
          }}>
            {messages.some(msg => msg.posterHtml) ? 'Enter 发送，Shift+Enter 换行' : ''}
          </div>
        </div>
        
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onSendMessage}
          disabled={!userInput.trim() || isGenerating || !messages.some(msg => msg.posterHtml)}
          size="large"
          style={{
            height: '76px',
            width: '60px',
            borderRadius: '8px'
          }}
        />
      </div>
    </div>
  );
};

export default ChatInterface; 