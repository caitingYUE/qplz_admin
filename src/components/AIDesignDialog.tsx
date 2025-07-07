import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Spin, Modal, Input, Flex, Select, Alert, Space, Tag } from 'antd';
import { LeftOutlined, SendOutlined, DownloadOutlined, QuestionCircleOutlined, SettingOutlined, ReloadOutlined, FileTextOutlined, CloseOutlined, FieldTimeOutlined, NotificationOutlined, MenuOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import TopDesignToolbar from './TopDesignToolbar';
import ChatInterface from './ChatInterface';
import PosterPreview from './PosterPreview';
import InvitationBatchGenerator from './InvitationBatchGenerator';
import UserGuide from './UserGuide';
import ConfigPanel from './ConfigPanel';
import ResizablePanes from './ResizablePanes';
import DesignToolbar from './DesignToolbar';
import PosterUpdateNotification from './PosterUpdateNotification';
import HtmlEditor from './HtmlEditor';

import { generatePosterWithDeepSeek, applyDesignAssetsToHtml } from '../utils/deepseekApi';
import { storageManager, startStorageMonitoring } from '../utils/storageManager';
import type { Event, DesignAssets } from '../types';

interface AIDesignDialogProps {
  visible: boolean;
  onClose: () => void;
  eventData: Partial<Event>;
  eventId?: string;
  autoGenerateOnOpen?: boolean;
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
  },
  activity: {
    name: '活动行海报',
    size: '1080 × 640px',
    width: 1080,
    height: 640,
    fields: ['title', 'subtitle', 'location', 'time', 'guests', 'description', 'maxParticipants', 'fee', 'qrcode', 'logo']
  }
};

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
  eventId,
  autoGenerateOnOpen = false
}) => {
  // 从localStorage加载上次的海报类型，默认为vertical
  const getInitialPosterType = (): keyof typeof POSTER_TYPES => {
    try {
      const savedType = localStorage.getItem('selectedPosterType');
      if (savedType && savedType in POSTER_TYPES) {
        console.log('🔄 从localStorage恢复海报类型:', savedType);
        return savedType as keyof typeof POSTER_TYPES;
      }
    } catch (error) {
      console.warn('加载海报类型失败:', error);
    }
    console.log('📦 使用默认海报类型: vertical');
    return 'vertical';
  };

  // 核心状态
  const [selectedPosterType, setSelectedPosterType] = useState<keyof typeof POSTER_TYPES>(getInitialPosterType);
  
  // 初始化设计资源 - 避免硬编码默认值，优先从存储加载
  const getInitialDesignAssets = (): DesignAssets => {
    try {
      const savedAssets = localStorage.getItem('designAssets');
      if (savedAssets) {
        const parsed = JSON.parse(savedAssets);
        
        // 确保新的数据结构存在
        const updatedAssets = {
          referenceImages: parsed.referenceImages || [],
          // 新增：按海报类型分类的参考图片（如果不存在则初始化）
          referenceImagesByType: parsed.referenceImagesByType || {
            vertical: [],
            invitation: [],
            wechat: [],
            xiaohongshu: [],
            activity: []
          },
          logos: parsed.logos || [],
          qrCodes: parsed.qrCodes || [],
          brandColors: parsed.brandColors || [],
          brandFonts: parsed.brandFonts || [],
          // 服务器配置默认值
          apiMode: parsed.apiMode || 'local',
          serverAddress: parsed.serverAddress || '',
          serverPort: parsed.serverPort || '3000',
          isServerConnected: parsed.isServerConnected || false,
          isMiniProgramIntegrated: parsed.isMiniProgramIntegrated || false
        };
        
        console.log('🔄 从localStorage加载设计资源:', updatedAssets);
        return updatedAssets;
      }
    } catch (error) {
      console.warn('加载设计资源失败:', error);
    }
    
    // 如果没有保存的资源，使用空配置（用户可以自己添加需要的颜色）
    const emptyAssets: DesignAssets = {
      referenceImages: [],
      // 新增：按海报类型分类的参考图片初始化
      referenceImagesByType: {
        vertical: [],
        invitation: [],
        wechat: [],
        xiaohongshu: [],
        activity: []
      },
      logos: [],
      qrCodes: [],
      brandColors: [], // 初始为空，用户可以自己添加
      brandFonts: [],
      // 服务器配置默认值
      apiMode: 'local',
      serverAddress: '',
      serverPort: '3000',
      isServerConnected: false,
      isMiniProgramIntegrated: false
    };
    
    console.log('📦 使用空白设计资源:', emptyAssets);
    return emptyAssets;
  };
  
  const [designAssets, setDesignAssets] = useState<DesignAssets>(getInitialDesignAssets);
  
  // 对话状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPosterHtml, setCurrentPosterHtml] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // 进度计时器引用
  const progressIntervalRef = useRef<any>(null);
  
  // 邀请函特殊状态
  const [batchGeneratorVisible, setBatchGeneratorVisible] = useState(false);
  
  // 用户引导状态
  const [userGuideVisible, setUserGuideVisible] = useState(false);
  
  // 配置面板状态
  const [configPanelVisible, setConfigPanelVisible] = useState(false);
  const [hasConfigChanged, setHasConfigChanged] = useState(false);
  const [showConfigChangeNotification, setShowConfigChangeNotification] = useState(false);
  
  // HTML编辑器状态
  const [htmlEditorVisible, setHtmlEditorVisible] = useState(false);
  
  // 从localStorage加载上次的字段配置
  const getInitialSelectedFields = (): string[] => {
    try {
      const savedFields = localStorage.getItem('selectedFields');
      if (savedFields) {
        const parsed = JSON.parse(savedFields);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('🔄 从localStorage恢复字段配置:', parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.warn('加载字段配置失败:', error);
    }
    console.log('📦 使用默认字段配置:', ['title', 'subtitle', 'location', 'time']);
    return ['title', 'subtitle', 'location', 'time'];
  };

  // 字段选择状态
  const [selectedFields, setSelectedFields] = useState<string[]>(getInitialSelectedFields);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // 自动保存海报类型到localStorage
  useEffect(() => {
    if (selectedPosterType) {
      try {
        localStorage.setItem('selectedPosterType', selectedPosterType);
        console.log('💾 自动保存海报类型:', selectedPosterType);
      } catch (error) {
        console.warn('保存海报类型失败:', error);
      }
    }
  }, [selectedPosterType]);

  // 自动保存字段配置到localStorage
  useEffect(() => {
    if (selectedFields && selectedFields.length > 0) {
      try {
        localStorage.setItem('selectedFields', JSON.stringify(selectedFields));
        console.log('💾 自动保存字段配置:', selectedFields);
      } catch (error) {
        console.warn('保存字段配置失败:', error);
      }
    }
  }, [selectedFields]);

  // 初始化对话
  useEffect(() => {
    if (visible && eventData.name) {
      initializeChat();
      loadChatHistory();
      startStorageMonitoring();
      
      const hasSeenGuide = localStorage.getItem('hasSeenGuide');
      if (!hasSeenGuide) {
        setUserGuideVisible(true);
        localStorage.setItem('hasSeenGuide', 'true');
      }
    }
  }, [visible, eventData, eventId]);

  // 处理自动生成海报
  useEffect(() => {
    if (visible && autoGenerateOnOpen && eventData.name && !isGenerating) {
      // 延迟一下确保界面完全加载
      const timer = setTimeout(() => {
        handleAutoGenerate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoGenerateOnOpen, eventData.name, isGenerating]);

  // 自动生成海报的处理函数
  const handleAutoGenerate = async () => {
    console.log('🔄 开始自动重新生成海报...');
    
    // 添加一条系统消息表明正在重新生成
    const autoGenerateMessage: ChatMessage = {
      id: `system-auto-${Date.now()}`,
      type: 'system',
      content: '🔄 检测到活动信息更新，正在重新生成海报...',
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, autoGenerateMessage]);
    
    try {
      // 开始生成海报
      await startGeneratePoster();
    } catch (error) {
      console.error('自动生成海报失败:', error);
      
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: `system-error-${Date.now()}`,
        type: 'system',
        content: '❌ 自动重新生成海报失败，请手动重试或检查网络连接。',
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // 处理配置变更
  const handleConfigChange = () => {
    console.log('🔔 检测到配置变更');
    setHasConfigChanged(true);
    
    // 如果当前有生成的海报，显示配置变更通知
    if (currentPosterHtml) {
      setShowConfigChangeNotification(true);
    }
  };

  // 处理用户确认使用新配置重新生成
  const handleRegenerateWithNewConfig = async () => {
    setShowConfigChangeNotification(false);
    setHasConfigChanged(false);
    setConfigPanelVisible(false); // 自动关闭配置面板
    
    // 添加系统消息
    const configChangeMessage: ChatMessage = {
      id: `system-config-${Date.now()}`,
      type: 'system',
      content: '🔧 检测到您更新了配置信息，正在使用新配置重新生成海报...',
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, configChangeMessage]);
    
    try {
      await startGeneratePoster();
    } catch (error) {
      console.error('使用新配置重新生成失败:', error);
      const errorMessage: ChatMessage = {
        id: `system-error-${Date.now()}`,
        type: 'system',
        content: '❌ 重新生成失败，请重试或检查网络连接。',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // 忽略配置变更
  const handleIgnoreConfigChange = () => {
    setShowConfigChangeNotification(false);
    setHasConfigChanged(false);
  };

  // 处理字段选择变更
  const handleFieldsChange = (fields: string[]) => {
    console.log('🔧 字段选择变更:', fields);
    setSelectedFields(fields);
  };

  // 根据字段重新生成海报
  const handleRegenerateWithFields = async () => {
    console.log('🔄 根据字段重新生成海报:', selectedFields);
    
    // 添加系统消息
    const fieldsChangeMessage: ChatMessage = {
      id: `system-fields-${Date.now()}`,
      type: 'system',
      content: `🎨 正在根据选择的字段重新生成海报...\n\n选择的字段：${selectedFields.map(field => {
        switch(field) {
          case 'title': return '标题';
          case 'subtitle': return '副标题';
          case 'location': return '位置';
          case 'time': return '时间';
          case 'guests': return '嘉宾';
          case 'description': return '描述';
          case 'maxParticipants': return '参与人数';
          case 'fee': return '费用';
          case 'qrcode': return '二维码';
          case 'logo': return 'Logo';
          default: return field;
        }
      }).join('、')}`,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, fieldsChangeMessage]);
    
    try {
      await startGeneratePoster();
      message.success('根据字段配置重新生成完成！');
    } catch (error) {
      console.error('根据字段重新生成失败:', error);
      const errorMessage: ChatMessage = {
        id: `system-error-${Date.now()}`,
        type: 'system',
        content: '❌ 重新生成失败，请重试或检查网络连接。',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // 处理设计资源变更
  const handleAssetsChange = (assets: DesignAssets) => {
    setDesignAssets(assets);
  };

  const saveDesignAssets = (assets: DesignAssets) => {
    try {
      localStorage.setItem('designAssets', JSON.stringify(assets));
      console.log('✅ 设计资源已保存');
    } catch (error) {
      console.error('❌ 保存设计资源失败:', error);
    }
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

  // 初始化对话
  const initializeChat = () => {
    if (eventId && localStorage.getItem(getChatHistoryKey())) {
      return;
    }
    
    const welcomeMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      type: 'system',
      content: `🎨 欢迎使用AI海报设计助手！

我将为您设计【${eventData.name || '活动'}】的海报。

活动信息：
• 活动名称：${eventData.name || '待设置'}
• 活动时间：${eventData.startTime || '待设置'}
• 活动地点：${eventData.location || '待设置'}
• 活动介绍：${eventData.description || '待设置'}

💡 现在您可以：
1. 点击"开始生成海报"，我会为您设计初版海报
2. 告诉我您的具体需求，比如风格、色彩偏好等
3. 上传参考图片或Logo，我会参考设计

让我们开始吧！`,
      timestamp: Date.now()
    };
    
    setChatMessages([welcomeMessage]);
    saveChatHistory([welcomeMessage]);
  };

  // 模拟进度更新函数
  const simulateProgress = () => {
    setGenerationProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10 + 5; // 每次增加5-15%
      if (progress >= 95) {
        progress = 95; // 最多到95%，等待实际完成
        clearInterval(interval);
      }
      setGenerationProgress(Math.min(progress, 95));
    }, 500);
    
    // 保存引用以便暂停时清理
    progressIntervalRef.current = interval;
    return interval;
  };

  // 生成海报完成时的进度处理
  const completeProgress = () => {
    setGenerationProgress(100);
    setTimeout(() => {
      setGenerationProgress(0);
    }, 1000);
  };

  // 生成海报
  const startGeneratePoster = async () => {
    if (isGenerating) return;

    // 创建新的AbortController
    const controller = new AbortController();
    setAbortController(controller);
    
    setIsGenerating(true);
    
    // 开始模拟进度
    const progressInterval = simulateProgress();
    
    try {
      const posterData = buildPosterData();
      
      // 根据海报类型确定API接口的类型参数
      const apiPosterType = selectedPosterType === 'vertical' || selectedPosterType === 'xiaohongshu' ? 'general' : selectedPosterType;
      
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userInput || '请为我生成海报',
        timestamp: Date.now()
      };
      
      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      setUserInput('');
      
      // 准备嘉宾详细信息 - 添加容错处理
      let guestDetails: Array<{name: string; title: string; bio?: string; avatar?: string}> = [];
      
      if (eventData.guests) {
        console.log('🔍 原始嘉宾数据:', eventData.guests);
        
        if (Array.isArray(eventData.guests)) {
          guestDetails = eventData.guests.map((guest: any, index: number) => {
            console.log(`👤 处理嘉宾 ${index + 1}:`, guest);
            return {
              name: guest?.name || '',
              title: guest?.title || '',
              bio: guest?.bio || '',
              avatar: guest?.avatar || ''
            };
          });
        } else {
          console.warn('⚠️ 嘉宾数据不是数组格式:', typeof eventData.guests, eventData.guests);
        }
      }
      
      console.log('✅ 处理后的嘉宾数据:', guestDetails);
      
      const result = await generatePosterWithDeepSeek(
        apiPosterType,
        {
          title: posterData.title,
          subtitle: posterData.subtitle,
          time: posterData.date + ' ' + posterData.time,
          location: posterData.location,
          description: posterData.description,
          fee: posterData.fee,
          guests: '',
          maxParticipants: posterData.maxParticipants,
          inviter: posterData.inviter,
          invitationText: posterData.greeting
        },
        getCurrentTypeReferenceImageUrls(),
        posterData.userRequirements,
        // 传递设计素材
        {
          brandColors: designAssets.brandColors,
          logos: designAssets.logos,
          qrCodes: designAssets.qrCodes,
          brandFonts: designAssets.brandFonts
        },
        // 传递嘉宾详细信息
        guestDetails,
        // 传递选择的字段
        selectedFields
      );
      
      if (result.success && result.html) {
        const processedHtml = applyDesignAssetsToHtml(result.html, designAssets);
        
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: '✨ 太棒了！我为您设计了一张精美的海报。您可以继续与我对话来调整设计。',
          timestamp: Date.now(),
          posterHtml: processedHtml,
          posterType: selectedPosterType
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        setChatMessages(finalMessages);
        setCurrentPosterHtml(processedHtml);
        
        saveChatHistory(finalMessages);
        message.success('海报生成成功！');
        // 完成进度条
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        completeProgress();
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error: any) {
      console.error('生成海报失败:', error);
      
      // 清理进度条
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // 如果是用户主动取消，不显示错误
      if (error.name === 'AbortError') {
        console.log('用户取消了海报生成');
        setGenerationProgress(0);
        return;
      }
      
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: `❌ 抱歉，生成海报时遇到了问题：${error.message || '未知错误'}。请重试或检查网络连接。`,
        timestamp: Date.now()
      };
      
      const finalMessages = [...chatMessages, errorMessage];
      setChatMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      message.error(`生成失败: ${error.message || '未知错误'}`);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
      progressIntervalRef.current = null;
    }
  };

  // 获取当前海报类型对应的参考图片URL
  const getCurrentTypeReferenceImageUrls = (): string[] => {
    const currentTypeImages = designAssets.referenceImagesByType[selectedPosterType as keyof typeof designAssets.referenceImagesByType] || [];
    const urls = currentTypeImages.map(img => img.url);
    
    // 如果当前类型没有参考图片，回退到使用统一的参考图片作为兼容
    if (urls.length === 0) {
      const fallbackUrls = designAssets.referenceImages?.map(img => img.url) || [];
      if (fallbackUrls.length > 0) {
        console.log(`📸 ${selectedPosterType}类型暂无专用参考图片，使用通用参考图片:`, fallbackUrls.length, '张');
      }
      return fallbackUrls;
    }
    
    console.log(`📸 使用${selectedPosterType}类型专用参考图片:`, urls.length, '张');
    return urls;
  };

  // 构建海报数据
  const buildPosterData = () => {
    // 根据当前海报类型获取对应的参考图片
    const currentTypeReferenceImages = designAssets.referenceImagesByType[selectedPosterType as keyof typeof designAssets.referenceImagesByType] || [];
    
    return {
      title: eventData.name || '',
      subtitle: eventData.subtitle || '',
      description: eventData.description || '',
      date: eventData.startTime || '',
      time: eventData.endTime || '',
      location: eventData.location || '',
      fee: eventData.fee || '',
      maxParticipants: eventData.maxParticipants?.toString() || '',
      registrationDeadline: '',
      contactInfo: '',
      
      invitationTitle: eventData.name || '',
      inviter: '前排落座女性社区',
      greeting: '诚邀您参加',
      
      // 使用当前海报类型对应的参考图片
      referenceImages: currentTypeReferenceImages,
      // 保持向后兼容，同时保留旧的统一参考图片
      legacyReferenceImages: designAssets.referenceImages,
      logos: designAssets.logos,
      qrCodes: designAssets.qrCodes,
      brandColors: designAssets.brandColors,
      brandFonts: designAssets.brandFonts,
      
      userRequirements: userInput,
      
      posterType: selectedPosterType,
      dimensions: {
        width: POSTER_TYPES[selectedPosterType].width,
        height: POSTER_TYPES[selectedPosterType].height
      }
    };
  };

  // 发送用户消息（用于对话）
  const sendUserMessage = async () => {
    if (!userInput.trim()) return;
    
    if (!currentPosterHtml) {
      await startGeneratePoster();
      return;
    }
    
    // 创建新的AbortController
    const controller = new AbortController();
    setAbortController(controller);
    
    setIsGenerating(true);
    
    // 开始模拟进度
    const progressInterval = simulateProgress();
    
    try {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userInput,
        timestamp: Date.now()
      };
      
      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      
      const posterData = buildPosterData();
      const apiPosterType = selectedPosterType === 'vertical' || selectedPosterType === 'xiaohongshu' ? 'general' : selectedPosterType;
      
      // 准备嘉宾详细信息 - 添加容错处理
      let guestDetails: Array<{name: string; title: string; bio?: string; avatar?: string}> = [];
      
      if (eventData.guests) {
        console.log('🔍 对话中原始嘉宾数据:', eventData.guests);
        
        if (Array.isArray(eventData.guests)) {
          guestDetails = eventData.guests.map((guest: any, index: number) => {
            console.log(`👤 对话中处理嘉宾 ${index + 1}:`, guest);
            return {
              name: guest?.name || '',
              title: guest?.title || '',
              bio: guest?.bio || '',
              avatar: guest?.avatar || ''
            };
          });
        } else {
          console.warn('⚠️ 对话中嘉宾数据不是数组格式:', typeof eventData.guests, eventData.guests);
        }
      }
      
      console.log('✅ 对话中处理后的嘉宾数据:', guestDetails);
      
      setUserInput('');
      
      const result = await generatePosterWithDeepSeek(
        apiPosterType,
        {
          title: posterData.title,
          subtitle: posterData.subtitle,
          time: posterData.date + ' ' + posterData.time,
          location: posterData.location,
          description: posterData.description,
          fee: posterData.fee,
          guests: '',
          maxParticipants: posterData.maxParticipants,
          inviter: posterData.inviter,
          invitationText: posterData.greeting
        },
        getCurrentTypeReferenceImageUrls(),
        userInput,
        // 传递设计素材
        {
          brandColors: designAssets.brandColors,
          logos: designAssets.logos,
          qrCodes: designAssets.qrCodes,
          brandFonts: designAssets.brandFonts
        },
        // 传递嘉宾详细信息
        guestDetails,
        // 传递选择的字段
        selectedFields
      );
      
      if (result.success && result.html) {
        // 应用用户配置的设计素材
        const processedHtml = applyDesignAssetsToHtml(result.html, designAssets);
        
        console.log('🎨 对话中应用用户配置后的HTML长度:', processedHtml.length);
        
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: '✨ 海报已更新！基于您的要求进行了调整。',
          timestamp: Date.now(),
          posterHtml: processedHtml,
          posterType: selectedPosterType
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        setChatMessages(finalMessages);
        setCurrentPosterHtml(processedHtml);
        
        saveChatHistory(finalMessages);
        message.success('海报更新成功！');
        // 完成进度条
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        completeProgress();
      } else {
        throw new Error(result.error || '修改失败');
      }
    } catch (error: any) {
      console.error('修改海报失败:', error);
      
      // 清理进度条
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // 如果是用户主动取消，不显示错误
      if (error.name === 'AbortError') {
        console.log('用户取消了海报修改');
        setGenerationProgress(0);
        return;
      }
      
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: `❌ 抱歉，修改海报时遇到了问题：${error.message || '未知错误'}。请重新描述您的需求。`,
        timestamp: Date.now()
      };
      
      const finalMessages = [...chatMessages, errorMessage];
      setChatMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      message.error(`修改失败: ${error.message || '未知错误'}`);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
      progressIntervalRef.current = null;
    }
  };

  // 打开HTML编辑器
  const openHtmlEditor = () => {
    if (!currentPosterHtml) {
      message.error('没有可编辑的HTML内容');
      return;
    }
    setHtmlEditorVisible(true);
  };

  // 处理HTML更新
  const handleHtmlUpdate = (newHtml: string) => {
    setCurrentPosterHtml(newHtml);
    
    // 添加系统消息记录HTML更新
    const updateMessage: ChatMessage = {
      id: `system-html-update-${Date.now()}`,
      type: 'system',
      content: '✏️ HTML代码已更新，海报预览已刷新',
      timestamp: Date.now(),
      posterHtml: newHtml,
      posterType: selectedPosterType
    };
    
    const updatedMessages = [...chatMessages, updateMessage];
    setChatMessages(updatedMessages);
    saveChatHistory(updatedMessages);
  };

  // 保持原有的downloadHtml函数名，但改为调用编辑器
  const downloadHtml = openHtmlEditor;

  // 下载海报
  const downloadPoster = async () => {
    if (!currentPosterHtml) {
      message.error('没有可下载的海报内容');
      return;
    }

    try {
      message.loading({ content: '正在生成图片...', key: 'download' });
      
      // 创建纯净的海报容器，只包含海报内容本身
      const tempDiv = document.createElement('div');
      
      // 设置为海报的原始尺寸，不缩放
      tempDiv.style.width = `${POSTER_TYPES[selectedPosterType].width}px`;
      tempDiv.style.height = `${POSTER_TYPES[selectedPosterType].height}px`;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.backgroundColor = '#ffffff'; // 白色背景
      tempDiv.style.overflow = 'hidden';
      
      // 直接插入海报HTML内容
      tempDiv.innerHTML = currentPosterHtml;
      
      document.body.appendChild(tempDiv);

      try {
        // 等待渲染和字体加载
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 使用html2canvas截图，确保只截取海报内容
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: '#ffffff',
          scale: 2, // 高清输出
          width: POSTER_TYPES[selectedPosterType].width,
          height: POSTER_TYPES[selectedPosterType].height,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          foreignObjectRendering: false, // 禁用外部对象渲染
          logging: false
        });

        // 验证canvas是否正确生成
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          throw new Error('生成的画布无效，请重试');
        }

        // 下载图片
        const link = document.createElement('a');
        link.download = `${eventData.name || '海报'}_${POSTER_TYPES[selectedPosterType].name}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        message.success({ content: '海报下载成功！', key: 'download' });
      } finally {
        // 确保清理临时元素
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }
    } catch (error) {
      console.error('下载失败:', error);
      message.error({ 
        content: `下载失败：${error instanceof Error ? error.message : '未知错误'}`, 
        key: 'download' 
      });
    }
  };

  // 暂停生成
  const pauseGenerate = () => {
    // 清理进度计时器
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // 中止API请求
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // 重置状态
    setIsGenerating(false);
    setGenerationProgress(0);
    
    // 添加暂停提示消息
    const pauseMessage: ChatMessage = {
      id: `system-pause-${Date.now()}`,
      type: 'system',
      content: '⏸️ 海报生成已暂停。您可以点击右侧的刷新按钮重新生成，或继续与AI对话调整海报。',
      timestamp: Date.now()
    };
    
    const updatedMessages = [...chatMessages, pauseMessage];
    setChatMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    
    message.info('海报生成已暂停');
  };

  // 全屏设计模式
  if (!visible) return null;

  // 左侧海报预览面板
  const leftPane = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: '#ffffff',
      height: '100%'
    }}>
      {/* 预览区域标题 */}
      <div style={{ 
        padding: '12px 16px',
        borderBottom: '1px solid #e8e8e8',
        background: '#fafafa',
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: '14px',
          fontWeight: '600',
          color: '#262626',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          海报预览
          {currentPosterHtml && (
            <span style={{ 
              fontSize: '11px',
              color: '#52c41a',
              background: '#f6ffed',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: '400'
            }}>
              已生成
            </span>
          )}
        </div>
      </div>
      
      {/* 海报预览内容区域 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: '#f8f9fa',
        position: 'relative'
      }}>
        {currentPosterHtml ? (
          <PosterPreview
            ref={previewRef}
            htmlContent={currentPosterHtml}
            posterType={selectedPosterType}
            dimensions={POSTER_TYPES[selectedPosterType]}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '24px',
            color: '#999',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', color: '#999' }}>◇</div>
            <div style={{ 
              fontSize: '18px', 
              maxWidth: '300px',
              lineHeight: '1.6'
            }}>
              {isGenerating ? (
                <>
                  <Spin size="large" style={{ marginBottom: '16px' }} />
                  <br />
                  正在为您设计海报，请稍候...
                </>
              ) : (
                '在右侧与AI助手对话，开始创作您的专属海报'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 右侧聊天面板
  const rightPane = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: '#ffffff',
      height: '100%'
    }}>
      {/* AI助手标题 */}
      <div style={{ 
        padding: '12px 16px',
        borderBottom: '1px solid #e8e8e8',
        background: '#fafafa',
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: '14px',
          fontWeight: '600',
          color: '#262626',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          AI设计助手
          <span style={{ 
            fontSize: '11px',
            color: '#52c41a',
            background: '#f6ffed',
            padding: '2px 6px',
            borderRadius: '6px',
            fontWeight: '400'
          }}>
            在线
          </span>
        </div>
      </div>
      
      {/* 聊天界面 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* 配置变更通知 */}
        {showConfigChangeNotification && (
          <div style={{
            background: '#fff7e6',
            border: '1px solid #ffd666',
            borderRadius: '6px',
            padding: '12px 16px',
            margin: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(255, 214, 102, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔧</span>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px', color: '#ad6800' }}>
                  检测到配置更新
                </div>
                <div style={{ fontSize: '12px', color: '#873800' }}>
                  您更新了海报配置，是否使用新配置重新生成海报？
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="primary"
                size="small"
                onClick={handleRegenerateWithNewConfig}
                style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
              >
                重新生成
              </Button>
              <Button
                size="small"
                onClick={handleIgnoreConfigChange}
              >
                暂时忽略
              </Button>
            </div>
          </div>
        )}
        
        <ChatInterface
          messages={chatMessages}
          userInput={userInput}
          onInputChange={setUserInput}
          onSendMessage={sendUserMessage}
          isGenerating={isGenerating}
          onStartGenerate={startGeneratePoster}
          onRetryGenerate={startGeneratePoster}
          onPauseGenerate={pauseGenerate}
          generationProgress={generationProgress}
          selectedPosterType={selectedPosterType}
          onBatchGenerate={() => setBatchGeneratorVisible(true)}
        />
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f5f5f5',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1001
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={onClose}
            style={{ 
              color: '#ffffff', 
              fontSize: '16px',
              border: 'none',
              padding: '4px 8px'
            }}
            title="返回活动编辑"
          >
            返回
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>
              AI海报设计助手
            </span>
          </div>
        </div>
        
        {/* 顶部配置选项 */}
        <div style={{ flex: 1, marginLeft: '40px' }}>
          <TopDesignToolbar
            selectedPosterType={selectedPosterType}
            onPosterTypeChange={setSelectedPosterType}
            designAssets={designAssets}
            onAssetsChange={handleAssetsChange}
            onConfigClick={() => setConfigPanelVisible(!configPanelVisible)}
            onDownloadPoster={downloadPoster}
            onDownloadHtml={downloadHtml}
            onShowHelp={() => setUserGuideVisible(true)}
            onBatchGenerate={() => setBatchGeneratorVisible(true)}
            hasCurrentPoster={currentPosterHtml !== null}
            selectedFields={selectedFields}
            onFieldsChange={setSelectedFields}
            onRegenerateWithFields={handleRegenerateWithFields}
          />
        </div>
      </div>
      
      {/* 主要内容区域 - 可拖拽分栏 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: '#f5f5f5',
        transition: 'margin-right 0.3s ease',
        marginRight: configPanelVisible ? '400px' : '0'
      }}>
        <ResizablePanes
          leftPane={leftPane}
          rightPane={rightPane}
          defaultLeftWidth={50}
          minLeftWidth={30}
          maxLeftWidth={70}
        />
      </div>
      
      {/* 邀请函批量生成组件 */}
      <InvitationBatchGenerator
        visible={batchGeneratorVisible}
        onClose={() => setBatchGeneratorVisible(false)}
        baseHtmlTemplate={currentPosterHtml || ''}
        eventName={eventData.name || '活动'}
        posterDimensions={POSTER_TYPES[selectedPosterType]}
      />
      
      {/* 用户引导组件 */}
      <UserGuide
        visible={userGuideVisible}
        onClose={() => setUserGuideVisible(false)}
      />
      
      {/* 配置面板 */}
      <ConfigPanel
        visible={configPanelVisible}
        onClose={() => setConfigPanelVisible(false)}
        selectedPosterType={selectedPosterType}
        onPosterTypeChange={setSelectedPosterType}
        designAssets={designAssets}
        onAssetsChange={handleAssetsChange}
        onConfigChange={handleConfigChange}
      />

      {/* HTML编辑器 */}
      <HtmlEditor
        visible={htmlEditorVisible}
        onClose={() => setHtmlEditorVisible(false)}
        htmlContent={currentPosterHtml || ''}
        onUpdate={handleHtmlUpdate}
        posterName={eventData.name || '海报'}
        posterType={POSTER_TYPES[selectedPosterType].name}
      />
    </div>
  );
};

export default AIDesignDialog; 