import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, message, Spin, Divider } from 'antd';
import { DownloadOutlined, CodeOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import DesignToolbar from './DesignToolbar';
import ChatInterface from './ChatInterface';
import PosterPreview from './PosterPreview';
import InvitationBatchGenerator from './InvitationBatchGenerator';
import UserGuide from './UserGuide';

import { generatePosterWithDeepSeek } from '../utils/deepseekApi';
import { storageManager, startStorageMonitoring } from '../utils/storageManager';
import type { Event } from '../types';

interface AIDesignDialogProps {
  visible: boolean;
  onClose: () => void;
  eventData: Partial<Event>;
  eventId?: string;
}

// 海报类型配置
const POSTER_TYPES = {
  vertical: {
    name: '竖图海报',
    size: '不固定比例',
    width: 800,
    height: 1200,
    fields: ['title', 'subtitle', 'location', 'time', 'guests', 'description', 'maxParticipants', 'fee', 'qrcode', 'logo']
  },
  invitation: {
    name: '竖图邀请函',
    size: '不固定比例', 
    width: 800,
    height: 1200,
    fields: ['invitationTitle', 'inviter', 'greeting', 'title', 'subtitle', 'time', 'location', 'logo']
  },
  wechat: {
    name: '微信公众号横图海报',
    size: '900 × 383px',
    width: 900,
    height: 383,
    fields: ['title', 'subtitle', 'time', 'location', 'logo']
  },
  xiaohongshu: {
    name: '小红书海报',
    size: '1242 × 1660px',
    width: 1242,
    height: 1660,
    fields: ['title', 'subtitle', 'location', 'time', 'guests', 'description', 'maxParticipants']
  }
};

// 设计资源状态
interface DesignAssets {
  referenceImages: Array<{ id: string; url: string; name: string }>;
  logos: Array<{ id: string; url: string; name: string }>;
  qrCodes: Array<{ id: string; url: string; name: string }>;
  brandColors: string[];
  brandFonts: Array<{ id: string; name: string; url: string }>;
}

// 对话消息类型
interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  posterHtml?: string;
  posterType?: keyof typeof POSTER_TYPES;
}

const AIDesignDialog: React.FC<AIDesignDialogProps> = ({
  visible,
  onClose,
  eventData,
  eventId
}) => {
  // 核心状态
  const [selectedPosterType, setSelectedPosterType] = useState<keyof typeof POSTER_TYPES>('vertical');
  const [designAssets, setDesignAssets] = useState<DesignAssets>({
    referenceImages: [],
    logos: [],
    qrCodes: [],
    brandColors: ['#1890ff', '#52c41a', '#faad14'],
    brandFonts: []
  });
  
  // 对话状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPosterHtml, setCurrentPosterHtml] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  
  // 邀请函特殊状态

  const [batchGeneratorVisible, setBatchGeneratorVisible] = useState(false);
  
  // 用户引导状态
  const [userGuideVisible, setUserGuideVisible] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // 初始化对话
  useEffect(() => {
    if (visible && eventData.name) {
      initializeChat();
      // 加载该活动的聊天记录
      loadChatHistory();
      
      // 启动存储监控
      startStorageMonitoring();
      
      // 检查是否是首次使用，显示用户引导
      const hasSeenGuide = localStorage.getItem('hasSeenUserGuide');
      if (!hasSeenGuide) {
        setUserGuideVisible(true);
        localStorage.setItem('hasSeenUserGuide', 'true');
      }
    }
  }, [visible, eventData, eventId]);

  // 从localStorage加载全局设计资源
  useEffect(() => {
    const savedAssets = localStorage.getItem('designAssets');
    if (savedAssets) {
      try {
        setDesignAssets(JSON.parse(savedAssets));
      } catch (error) {
        console.warn('加载设计资源失败:', error);
      }
    }
  }, []);

  // 保存设计资源到localStorage
  const saveDesignAssets = (assets: DesignAssets) => {
    setDesignAssets(assets);
    localStorage.setItem('designAssets', JSON.stringify(assets));
  };

  // 获取聊天记录存储key
  const getChatHistoryKey = () => {
    return eventId ? `chatHistory_${eventId}` : `chatHistory_temp_${Date.now()}`;
  };

  // 加载聊天记录
  const loadChatHistory = () => {
    if (!eventId) return;
    
    const saved = localStorage.getItem(getChatHistoryKey());
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setChatMessages(history);
        
        // 如果有海报内容，恢复预览
        const lastPosterMessage = history.findLast((msg: ChatMessage) => msg.posterHtml);
        if (lastPosterMessage) {
          setCurrentPosterHtml(lastPosterMessage.posterHtml);
        }
      } catch (error) {
        console.warn('加载聊天记录失败:', error);
      }
    }
  };

  // 保存聊天记录（使用安全存储）
  const saveChatHistory = (messages: ChatMessage[]) => {
    if (!eventId) return;
    
    const key = getChatHistoryKey();
    const value = JSON.stringify(messages);
    
    const success = storageManager.safeSetItem(key, value);
    if (!success) {
      console.warn('保存聊天记录失败，存储空间可能不足');
      message.warning('存储空间不足，已自动清理过期数据');
    }
  };

  // 清空聊天记录 - 暂时注释，避免未使用变量警告
  // const clearChatHistory = () => {
  //   if (!eventId) return;
  //   
  //   localStorage.removeItem(getChatHistoryKey());
  //   setChatMessages([]);
  //   setCurrentPosterHtml('');
  // };

  // 初始化对话
  const initializeChat = () => {
    // 如果已经有聊天记录，不重新初始化
    if (eventId && localStorage.getItem(getChatHistoryKey())) {
      return;
    }
    
    const welcomeMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      type: 'system',
      content: `🎨 欢迎使用AI海报设计助手！
      
我已经获取到您的活动信息：
📅 活动名称：${eventData.name}
📍 活动地点：${eventData.location || '待定'}
⏰ 活动时间：${eventData.startTime || '待定'}

请确认活动信息无误，然后点击【开始生成海报】，我将为您智能设计专属海报！`,
      timestamp: Date.now()
    };
    
    const initialMessages = [welcomeMessage];
    setChatMessages(initialMessages);
    
    // 保存初始消息
    if (eventId) {
      saveChatHistory(initialMessages);
    }
  };

  // 开始生成海报
  const startGeneratePoster = async () => {
    if (!eventData.name) {
      message.error('请先填写活动基本信息');
      return;
    }

    setIsGenerating(true);
    
    try {
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: `请为我生成【${POSTER_TYPES[selectedPosterType].name}】`,
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, userMessage]);

      // 构建海报生成所需的数据
      const posterData = buildPosterData();
      
      // 调用AI生成
      const posterTypeMap = {
        vertical: 'general' as const,
        invitation: 'invitation' as const,
        wechat: 'wechat' as const,
        xiaohongshu: 'general' as const
      };

      const result = await generatePosterWithDeepSeek(
        posterTypeMap[selectedPosterType],
        {
          title: posterData.title || '',
          subtitle: posterData.subtitle || '',
          time: posterData.time || '',
          location: posterData.location || '',
          description: posterData.description || '',
          fee: posterData.fee || '',
          guests: posterData.guests || '',
          maxParticipants: posterData.maxParticipants || '',
          inviter: posterData.inviter || '',
          invitationText: posterData.greeting || ''
        },
        designAssets.referenceImages.map(img => img.url),
        `海报类型: ${POSTER_TYPES[selectedPosterType].name}\n尺寸: ${posterData.dimensions.width}x${posterData.dimensions.height}px`
      );

      if (result.success && result.html) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: '✨ 太好了！我已经为您设计了一款精美的海报，请查看预览效果。如果需要调整，请告诉我您的想法！',
          timestamp: Date.now(),
          posterHtml: result.html,
          posterType: selectedPosterType
        };
        
        const updatedMessages = [...chatMessages, userMessage, aiMessage];
        setChatMessages(updatedMessages);
        setCurrentPosterHtml(result.html);
        
        // 保存聊天记录
        saveChatHistory(updatedMessages);
        
        // 邀请函特殊处理 - 显示批量生成选项
        if (selectedPosterType === 'invitation') {
          const invitationMessage: ChatMessage = {
            id: `system-invitation-${Date.now()}`,
            type: 'system',
            content: '🎉 邀请函生成成功！\n\n您可以：\n1. 直接下载当前邀请函\n2. 批量生成多个邀请人的邀请函',
            timestamp: Date.now()
          };
          setChatMessages(prev => [...prev, invitationMessage]);
        }
        
        message.success('海报生成成功！');
      } else {
        throw new Error(result.error || '生成失败');
      }
      
    } catch (error) {
      console.error('生成海报失败:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: '😔 抱歉，海报生成遇到了问题，请稍后重试或调整设计要求。',
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      message.error('海报生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 构建海报数据
  const buildPosterData = () => {
    const type = POSTER_TYPES[selectedPosterType];
    const data: any = {
      type: selectedPosterType,
      dimensions: {
        width: type.width,
        height: type.height
      },
      brandAssets: designAssets
    };

    // 根据海报类型添加对应字段
    type.fields.forEach(field => {
      switch (field) {
        case 'title':
          data.title = eventData.name;
          break;
        case 'subtitle':
          data.subtitle = eventData.subtitle;
          break;
        case 'location':
          data.location = eventData.location;
          break;
        case 'time':
          data.time = `${eventData.startTime} - ${eventData.endTime}`;
          break;
        case 'description':
          data.description = eventData.description;
          break;
        case 'fee':
          data.fee = eventData.fee;
          break;
        case 'maxParticipants':
          data.maxParticipants = eventData.maxParticipants;
          break;
        case 'guests':
          data.guests = eventData.guests;
          break;
        case 'invitationTitle':
          data.invitationTitle = '邀请函';
          break;
        case 'inviter':
          data.inviter = 'XXX女士';
          break;
        case 'greeting':
          data.greeting = '诚挚邀请您参加';
          break;
      }
    });

    return data;
  };

  // 发送用户消息
  const sendUserMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsGenerating(true);

    try {
      // 调用AI进行海报修改
      const posterTypeMap = {
        vertical: 'general' as const,
        invitation: 'invitation' as const,
        wechat: 'wechat' as const,
        xiaohongshu: 'general' as const
      };

      const posterData = buildPosterData();
      const modifyResult = await generatePosterWithDeepSeek(
        posterTypeMap[selectedPosterType],
        {
          title: posterData.title || '',
          subtitle: posterData.subtitle || '',
          time: posterData.time || '',
          location: posterData.location || '',
          description: posterData.description || '',
          fee: posterData.fee || '',
          guests: posterData.guests || '',
          maxParticipants: posterData.maxParticipants || '',
          inviter: posterData.inviter || '',
          invitationText: posterData.greeting || ''
        },
        designAssets.referenceImages.map(img => img.url),
        `修改要求: ${userInput}\n\n当前海报HTML代码:\n${currentPosterHtml}`
      );

      if (modifyResult.success && modifyResult.html) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: '✨ 已经根据您的要求调整了海报设计，请查看新的效果！',
          timestamp: Date.now(),
          posterHtml: modifyResult.html,
          posterType: selectedPosterType
        };
        
        const updatedMessages = [...chatMessages, userMessage, aiMessage];
        setChatMessages(updatedMessages);
        setCurrentPosterHtml(modifyResult.html);
        
        // 保存聊天记录
        saveChatHistory(updatedMessages);
      } else {
        throw new Error('修改失败');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: '抱歉，我没能理解您的修改要求，请尝试更具体的描述。',
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载海报
  const downloadPoster = async () => {
    if (!previewRef.current) {
      message.error('没有可下载的海报');
      return;
    }

    try {
      message.loading({ content: '正在生成图片...', key: 'download' });
      
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: POSTER_TYPES[selectedPosterType].width,
        height: POSTER_TYPES[selectedPosterType].height
      });
      
      const link = document.createElement('a');
      link.download = `${eventData.name || '海报'}_${POSTER_TYPES[selectedPosterType].name}_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      message.success({ content: '海报下载成功！', key: 'download' });
    } catch (error) {
      console.error('下载失败:', error);
      message.error({ content: '下载失败，请重试', key: 'download' });
    }
  };

  // 下载HTML源码
  const downloadHtml = () => {
    if (!currentPosterHtml) {
      message.error('没有可下载的HTML代码');
      return;
    }

    const blob = new Blob([currentPosterHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventData.name || '海报'}_${POSTER_TYPES[selectedPosterType].name}.html`;
    link.click();
    
    message.success('HTML源码下载成功！');
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: '600' }}>
            🎨 AI海报设计助手
          </span>
          <span style={{ 
            fontSize: '14px', 
            color: '#667eea',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {POSTER_TYPES[selectedPosterType].name}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      style={{ top: 40 }}
      footer={null}
      destroyOnClose
      className="ai-design-modal"
    >
              <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
        {/* 设计工具栏 */}
        <DesignToolbar
          selectedPosterType={selectedPosterType}
          onPosterTypeChange={setSelectedPosterType}
          designAssets={designAssets}
          onAssetsChange={saveDesignAssets}
        />
        
        <Divider style={{ margin: '12px 0' }} />
        
        {/* 主要内容区域 */}
        <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
          {/* 左侧对话区域 - 35% */}
          <div style={{ 
            width: '35%',
            minWidth: '360px',
            display: 'flex', 
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #fafafa 0%, #f0f2f5 100%)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              marginBottom: '16px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🤖 AI设计助手
              <span style={{ 
                fontSize: '12px',
                color: '#52c41a',
                background: '#f6ffed',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: '400'
              }}>
                在线
              </span>
            </div>
            
            <ChatInterface
              messages={chatMessages}
              userInput={userInput}
              onInputChange={setUserInput}
              onSendMessage={sendUserMessage}
              isGenerating={isGenerating}
              onStartGenerate={startGeneratePoster}
            />
          </div>
          
          {/* 右侧预览区域 - 65% */}
          <div style={{ 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            {currentPosterHtml ? (
              <>
                {/* 预览操作栏 - 简化版 */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8',
                  width: '100%'
                }}>
                  {/* 主要操作 */}
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={downloadPoster}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      fontWeight: '500'
                    }}
                  >
                    下载海报
                  </Button>
                  
                  {/* 次要操作 */}
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    onClick={startGeneratePoster}
                    loading={isGenerating}
                    style={{ borderRadius: '8px' }}
                  >
                    重新生成
                  </Button>
                  
                  {/* 更多操作下拉菜单 */}
                  <div style={{ marginLeft: '8px' }}>
                    <Button.Group>
                      <Button
                        icon={<CodeOutlined />}
                        onClick={downloadHtml}
                        title="下载HTML源码"
                        style={{ borderRadius: '8px 0 0 8px' }}
                      />
                      <Button
                        icon={<QuestionCircleOutlined />}
                        onClick={() => setUserGuideVisible(true)}
                        title="使用帮助"
                        style={{ borderRadius: '0 8px 8px 0' }}
                      />
                    </Button.Group>
                  </div>
                  
                  {/* 特殊功能按钮 */}
                  {selectedPosterType === 'invitation' && (
                    <Button
                      type="dashed"
                      onClick={() => setBatchGeneratorVisible(true)}
                      style={{ 
                        borderColor: '#722ed1', 
                        color: '#722ed1',
                        borderRadius: '8px'
                      }}
                    >
                      📋 批量生成
                    </Button>
                  )}
                </div>
                
                {/* 海报预览 */}
                <PosterPreview
                  ref={previewRef}
                  htmlContent={currentPosterHtml}
                  posterType={selectedPosterType}
                  dimensions={POSTER_TYPES[selectedPosterType]}
                />
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '24px',
                color: '#999'
              }}>
                <div style={{ fontSize: '48px' }}>🎨</div>
                <div style={{ fontSize: '16px' }}>
                  {isGenerating ? '正在为您设计海报...' : '点击开始生成海报，AI将为您创作精美设计'}
                </div>
                {isGenerating && <Spin size="large" />}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 邀请函批量生成组件 */}
      <InvitationBatchGenerator
        visible={batchGeneratorVisible}
        onClose={() => setBatchGeneratorVisible(false)}
        baseHtmlTemplate={currentPosterHtml}
        eventName={eventData.name || '活动'}
        posterDimensions={POSTER_TYPES[selectedPosterType]}
      />
      
      {/* 用户引导组件 */}
      <UserGuide
        visible={userGuideVisible}
        onClose={() => setUserGuideVisible(false)}
      />
    </Modal>
  );
};

export default AIDesignDialog; 