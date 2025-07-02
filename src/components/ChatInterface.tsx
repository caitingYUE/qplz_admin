import React, { useRef, useEffect } from 'react';
import { Button, Input, Avatar, Spin, Progress } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, PlayCircleOutlined, ReloadOutlined, PauseOutlined } from '@ant-design/icons';
import { message } from 'antd';

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
  onRetryGenerate?: () => void;
  onPauseGenerate?: () => void;
  generationProgress?: number; // 生成进度 0-100
  selectedPosterType?: string; // 海报类型
  onBatchGenerate?: () => void; // 批量生成邀请函
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  userInput,
  onInputChange,
  onSendMessage,
  isGenerating,
  onStartGenerate,
  onRetryGenerate,
  onPauseGenerate,
  generationProgress = 0,
  selectedPosterType,
  onBatchGenerate
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // 智能滚动到底部
  useEffect(() => {
    if (!messagesEndRef.current) return;

    // 如果是初始加载（从其他页面进入），直接定位不滚动
    if (isInitialLoadRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
      prevMessageCountRef.current = messages.length;
      return;
    }

    // 如果有新消息添加，才使用平滑滚动
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating && onPauseGenerate) {
        // 生成过程中按Enter暂停
        onPauseGenerate();
      } else if (userInput.trim() && !isGenerating) {
        // 正常发送消息
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
    // 添加时间戳避免缓存问题
    const timestamp = Date.now();
    if (type === 'user') {
      return <Avatar src={`/me.png?v=${timestamp}`} style={{ backgroundColor: '#1890ff' }}>我</Avatar>;
    } else if (type === 'system') {
      return <Avatar style={{ backgroundColor: '#faad14' }}>📢</Avatar>;
    } else {
      return <Avatar src={`/ai.png?v=${timestamp}`} style={{ backgroundColor: '#722ed1' }}>AI</Avatar>;
    }
  };

  // 检查是否有失败的消息
  const hasFailedGeneration = () => {
    return messages.some(msg => 
      msg.type === 'ai' && 
      msg.content.includes('❌') && 
      (msg.content.includes('生成海报时遇到了问题') || 
       msg.content.includes('修改海报时遇到了问题') ||
       msg.content.includes('生成海报时遇到问题'))
    );
  };

  // 检查是否显示生成按钮
  const shouldShowGenerateButton = () => {
    return !messages.some(msg => msg.posterHtml) && !isGenerating;
  };

  // 快捷指令列表
  const quickCommands = [
    { text: '调整标题字体大小' },
    { text: '更换配色方案' },
    { text: '修改布局样式' },
    { text: '添加装饰元素' },
    { text: '调整背景样式' },
    { text: '优化整体设计' }
  ];

  // 使用快捷指令
  const useQuickCommand = (command: string) => {
    onInputChange(command);
  };

  // 根据消息内容长度计算最适合的对话框宽度
  const getMessageWidth = (content: string) => {
    const length = content.length;
    
    // 短消息（1-20字符）：紧贴内容
    if (length <= 20) {
      return 'auto';
    }
    // 中短消息（21-50字符）：适中宽度
    else if (length <= 50) {
      return '45%';
    }
    // 中等消息（51-100字符）：较大宽度
    else if (length <= 100) {
      return '65%';
    }
    // 长消息（100+字符）：最大宽度
    else {
      return '85%';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      padding: '0 24px 8px 24px', // 进一步减少底部padding
      overflow: 'hidden' // 防止溢出
    }}>
      {/* 对话历史 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '16px 0 4px 0', // 进一步减少边距
        minHeight: 0 // 允许flex子元素缩小
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
            <Avatar 
              src={`/ai.png?v=${Date.now()}`} 
              size={64}
              style={{ 
                backgroundColor: '#667eea',
                marginBottom: '16px'
              }} 
            />
            <div style={{ fontSize: '16px', fontWeight: '500' }}>AI设计助手等待为您服务</div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id} style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                {message.type !== 'user' && renderAvatar(message.type)}
                <div style={{ 
                  flex: 1, 
                  maxWidth: getMessageWidth(message.content),
                  minWidth: '120px', // 确保最小宽度
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    background: message.type === 'user' 
                      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' 
                      : message.type === 'system' 
                        ? 'linear-gradient(135deg, #fff2e8 0%, #ffeaa7 100%)' 
                        : 'linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%)',
                    color: message.type === 'user' ? '#fff' : '#333',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' 
                      ? '18px 18px 6px 18px' 
                      : '18px 18px 18px 6px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: message.type === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    display: 'inline-block',
                    maxWidth: '100%',
                    position: 'relative'
                  }}>
                    {message.content}
                    
                    {/* 失败消息的快捷重新生成按钮 - 移到消息气泡内 */}
                    {message.type === 'ai' && 
                     message.content.includes('❌') && 
                     (message.content.includes('生成海报时遇到了问题') || 
                      message.content.includes('修改海报时遇到了问题') ||
                      message.content.includes('生成海报时遇到问题')) && 
                     onRetryGenerate && !isGenerating && (
                      <div
                        onClick={onRetryGenerate}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '-26px', // 相对于气泡右边缘
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.08)',
                          color: '#999',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          opacity: 0.7,
                          transition: 'all 0.2s ease',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.12)';
                          e.currentTarget.style.color = '#666';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.color = '#999';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="重新生成海报"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999', 
                    marginTop: '6px',
                    textAlign: message.type === 'user' ? 'right' : 'left',
                    paddingLeft: message.type === 'user' ? '0' : '8px',
                    paddingRight: message.type === 'user' ? '8px' : '0'
                  }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.type === 'user' && renderAvatar(message.type)}
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
            background: '#f8f9ff',
            borderRadius: '12px',
            margin: '8px 0',
            border: '1px solid #e6efff'
          }}>
            <Avatar src={`/ai.png?v=${Date.now()}`} style={{ backgroundColor: '#1890ff' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spin size="small" />
                <span style={{ color: '#666' }}>AI正在为您设计海报... 可点击暂停按钮中断</span>
              </div>
              {/* 进度条 */}
              <Progress 
                percent={generationProgress} 
                size="small"
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
                trailColor="#f0f0f0"
                showInfo={true}
                format={(percent) => `${Math.round(percent || 0)}%`}
                style={{ fontSize: '12px', marginTop: '8px' }}
              />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 生成海报按钮 */}
      {shouldShowGenerateButton() && (
        <div style={{ padding: '8px 0 4px 0', flexShrink: 0 }}>
          <Button
            type="primary"
            size="large"
            onClick={onStartGenerate}
            loading={isGenerating}
            block
            style={{
              height: '48px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            {isGenerating ? '正在生成海报...' : '开始生成海报'}
          </Button>
        </div>
      )}

      {/* 快捷指令区域 - 仅在有海报时显示 */}
      {messages.some(msg => msg.posterHtml) && !isGenerating && (
        <div style={{ padding: '4px 0', flexShrink: 0 }}>
          {/* 邀请函特殊功能区域 */}
          {selectedPosterType === 'invitation' && onBatchGenerate && (
            <div style={{ marginBottom: '8px' }}>
              <Button
                type="primary"
                size="small"
                onClick={onBatchGenerate}
                style={{
                  fontSize: '12px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                  border: 'none',
                  padding: '4px 12px',
                  height: 'auto',
                  fontWeight: '500',
                  boxShadow: '0 2px 8px rgba(114, 46, 209, 0.3)'
                }}
              >
                📝 添加邀请人姓名（批量生成）
              </Button>
            </div>
          )}
          
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            快捷修改指令
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
                  border: '1px solid #e1e8ed',
                  background: '#f8f9ff',
                  color: '#667eea',
                  padding: '4px 10px',
                  height: 'auto',
                  fontWeight: '500'
                }}
                onClick={() => useQuickCommand(cmd.text)}
              >
                {cmd.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        alignItems: 'flex-start',
        padding: '4px 0 0 0', // 最小化间距
        flexShrink: 0 // 防止被压缩
      }}>
        <div style={{ flex: 1 }}>
          <TextArea
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isGenerating 
                ? "生成过程中，按Enter或点击暂停按钮可中断生成..."
                : messages.some(msg => msg.posterHtml) 
                  ? "告诉我您想要调整的地方，比如：\n• 改变颜色主题\n• 调整文字大小\n• 更换布局风格\n• 添加装饰元素..."
                  : "填写活动信息后，点击上方按钮开始生成海报"
            }
            rows={2}
            disabled={!isGenerating && !messages.some(msg => msg.posterHtml)}
            style={{
              resize: 'none',
              borderRadius: '12px',
              border: '1px solid #e1e8ed',
              fontSize: '14px',
              lineHeight: '1.5',
              padding: '10px 14px',
              minHeight: '60px' // 减少最小高度
            }}
          />
          <div style={{ 
            fontSize: '11px', 
            color: '#999', 
            marginTop: '4px',
            textAlign: 'right' 
          }}>
            {isGenerating 
              ? 'Enter 暂停生成' 
              : messages.some(msg => msg.posterHtml) 
                ? 'Enter 发送，Shift+Enter 换行' 
                : ''
            }
          </div>
        </div>
        
        <Button
          type="primary"
          icon={isGenerating ? <PauseOutlined /> : <SendOutlined />}
          onClick={isGenerating ? onPauseGenerate : onSendMessage}
          disabled={!isGenerating && (!userInput.trim() || !messages.some(msg => msg.posterHtml))}
          style={{
            height: '60px', // 匹配输入框最小高度
            width: '55px',
            borderRadius: '12px',
            background: isGenerating 
              ? 'linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: isGenerating 
              ? '0 2px 8px rgba(255, 77, 79, 0.3)' 
              : '0 2px 8px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px'
          }}
          title={isGenerating ? '暂停生成' : '发送消息'}
        />
      </div>
    </div>
  );
};

export default ChatInterface; 