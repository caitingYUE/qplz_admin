import React, { useState } from 'react';
import { Card, Steps, Button, Typography, message, Modal, Progress, Tooltip, Space } from 'antd';
import { 
  FormOutlined, 
  BulbOutlined, 
  ToolOutlined, 
  CheckCircleOutlined,
  StopOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import EventPlanningForm from '../components/EventPlanningForm';
import OutlineSelection from '../components/OutlineSelection';
import PlanEnhancement from '../components/PlanEnhancement';
import FinalPlan from '../components/FinalPlan';
import EventPlanningHistoryComponent from '../components/EventPlanningHistory';
import { useHistory, type EventPlanningHistory } from '../hooks/useHistory';
import { 
  generateEventOutlines, 
  generateFinalPlan,
  type EventPlanningData, 
  type OutlineOption 
} from '../services/eventPlanningService';
import { useFavorites } from '../hooks/useFavorites';

const { Title, Paragraph } = Typography;

const EventPlanningPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [planningData, setPlanningData] = useState<EventPlanningData | null>(null);
  const [outlineOptions, setOutlineOptions] = useState<OutlineOption[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<OutlineOption | null>(null);
  const [selectedOutlines, setSelectedOutlines] = useState<OutlineOption[]>([]);
  const [finalPlan, setFinalPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  // 新增：保存用户的优化建议
  const [savedOptimizationText, setSavedOptimizationText] = useState('');
  
  // 进度相关状态
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  // 历史记录相关状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  
  const { 
    saveEventPlanningHistory, 
    updateEventPlanningHistory 
  } = useHistory();

  // 收藏功能
  const { generatePlanningDataHash, savePlanToFavorites } = useFavorites();

  // 组件初始化时恢复保存的数据
  React.useEffect(() => {
    const savedData = localStorage.getItem('eventPlanningData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setPlanningData(parsed);
      } catch (error) {
        console.error('恢复保存数据失败:', error);
      }
    }
  }, []);

  // 进度控制函数
  const updateProgress = (progress: number, log: string) => {
    setGenerationProgress(progress);
    setProgressLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const resetProgress = () => {
    setGenerationProgress(0);
    setProgressLogs([]);
  };

  const startProgressTracking = (title: string) => {
    resetProgress();
    setShowProgressModal(true);
    updateProgress(0, title);
  };

  const finishProgressTracking = (success: boolean, message: string) => {
    setGenerationProgress(100);
    updateProgress(100, message);
    setTimeout(() => {
      setShowProgressModal(false);
      if (success) {
        resetProgress();
      }
    }, 2000);
  };

  // 停止生成
  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
      setShowProgressModal(false);
      updateProgress(100, '⚠️ 用户手动停止生成');
      message.warning('已停止生成');
    }
  };

  const steps = [
    {
      title: '活动信息',
      description: '填写活动基本信息'
    },
    {
      title: '方案选择',
      description: '选择喜欢的活动大纲'
    },
    {
      title: '方案优化',
      description: '提出优化建议'
    },
    {
      title: '完整方案',
      description: '查看最终活动策划书'
    }
  ];

  const handleFormSubmit = async (data: EventPlanningData) => {
    setPlanningData(data);
    localStorage.setItem('eventPlanningData', JSON.stringify(data));
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    startProgressTracking('开始生成活动策划方案...');
    
    try {
      updateProgress(20, '正在连接DeepSeek API...');
      const outlines = await generateEventOutlines(data, updateProgress);
      
      updateProgress(90, '方案生成完成，正在处理数据...');
      setOutlineOptions(outlines);
      setCurrentStep(1);
      
      finishProgressTracking(true, '三个活动方案已成功生成！');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateProgress(100, '⚠️ 生成已停止');
        return;
      }
      console.error('生成方案失败:', error);
      finishProgressTracking(false, `生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleOutlineSelect = (outline: OutlineOption | OutlineOption[]) => {
    if (Array.isArray(outline)) {
      // 多选模式
      setSelectedOutlines(outline);
      setSelectedOutline(null); // 清空单选
    } else {
      // 单选模式
      setSelectedOutline(outline);
      setSelectedOutlines([]); // 清空多选
    }
    setCurrentStep(2);
  };

  const handleRegenerateOutlines = async () => {
    if (!planningData) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    startProgressTracking('重新生成活动方案...');
    
    try {
      updateProgress(20, '正在连接DeepSeek API...');
      const outlines = await generateEventOutlines(planningData, updateProgress);
      
      updateProgress(90, '新方案生成完成，正在处理数据...');
      setOutlineOptions(outlines);
      
      finishProgressTracking(true, '新方案生成成功！');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateProgress(100, '⚠️ 生成已停止');
        return;
      }
      console.error('重新生成失败:', error);
      finishProgressTracking(false, `重新生成失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleOptimizeAndGenerate = async (outline: OutlineOption, optimizationRequirements?: string) => {
    setSelectedOutline(outline);
    
    // 保存用户的优化建议
    if (optimizationRequirements) {
      setSavedOptimizationText(optimizationRequirements);
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    startProgressTracking('开始生成完整的活动策划书...');
    
    try {
      updateProgress(20, '正在构建详细的活动策划内容...');
      
      // 如果有优化建议，将其融入到outline的描述中
      let finalOutline = outline;
      if (optimizationRequirements) {
        finalOutline = {
          ...outline,
          overview: `${outline.overview}\n\n优化要求：${optimizationRequirements}`
        };
        updateProgress(40, '正在根据您的优化建议调整方案...');
      }
      
      const plan = await generateFinalPlan(finalOutline, planningData!, updateProgress);
      
      updateProgress(90, '策划书生成完成，正在最后整理...');
      setFinalPlan(plan);
      setCurrentStep(3);
      
      finishProgressTracking(true, '完整活动策划书已生成完成！');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateProgress(100, '⚠️ 生成已停止');
        return;
      }
      console.error('生成最终方案失败:', error);
      finishProgressTracking(false, `生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // 如果用户点击返回修改但没有改动内容，保留之前的方案
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setPlanningData(null);
    setOutlineOptions([]);
    setSelectedOutline(null);
    setSelectedOutlines([]);
    setSavedOptimizationText('');
    setFinalPlan('');
  };

  // 收藏完整方案
  const handleSavePlan = () => {
    if (!selectedOutline || !finalPlan || !planningData) return;
    
    const planningDataHash = generatePlanningDataHash(planningData);
    const planId = savePlanToFavorites(
      selectedOutline.title,
      finalPlan,
      selectedOutline,
      planningDataHash
    );
    
    message.success('方案已收藏到我的方案库');
  };

  // 更新方案内容
  const handlePlanUpdate = (updatedPlan: string) => {
    setFinalPlan(updatedPlan);
    // 如果当前方案来自历史记录，更新历史记录
    if (currentHistoryId) {
      updateEventPlanningHistory(currentHistoryId, updatedPlan);
    }
    message.success('方案已更新');
  };

  // 保存到历史记录
  const handleSaveToHistory = () => {
    if (!selectedOutline || !finalPlan || !planningData) return;
    
    const historyId = saveEventPlanningHistory(planningData, selectedOutline, finalPlan);
    setCurrentHistoryId(historyId);
    message.success('方案已保存到历史记录');
  };

  // 从历史记录加载方案
  const handleLoadFromHistory = (history: EventPlanningHistory) => {
    setPlanningData(history.planningData);
    setSelectedOutline(history.selectedOutline);
    setFinalPlan(history.finalPlan);
    setCurrentHistoryId(history.id);
    setCurrentStep(3); // 直接跳转到最终方案页面
    setShowHistoryModal(false);
    message.success('历史方案已加载');
  };

  // 打开历史记录
  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 页面标题和步骤控制 */}
      <div style={{ 
        marginBottom: '16px', 
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#b01c02' }}>
            活动策划助手
          </Title>
          <Paragraph style={{ margin: '4px 0 0 0', color: '#666' }}>
            将您的想法转化为专业的活动策划方案
          </Paragraph>
        </div>
        <Space>
          <Button 
            icon={<HistoryOutlined />}
            onClick={handleShowHistory}
            type="dashed"
          >
            历史记录
          </Button>
          <Button 
            type="text" 
            onClick={() => setStepsVisible(!stepsVisible)}
            style={{ fontSize: '12px' }}
          >
            {stepsVisible ? '收起步骤' : '显示步骤'}
          </Button>
        </Space>
      </div>

      {/* 步骤指示器 - 可收缩 */}
      {stepsVisible && (
        <Card style={{ marginBottom: '16px', flexShrink: 0 }} size="small">
          <Steps 
            current={currentStep} 
            items={steps}
            size="small"
          />
        </Card>
      )}

      {/* 主要内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentStep === 0 && (
          <EventPlanningForm 
            onSubmit={handleFormSubmit}
            isGenerating={isGenerating}
            initialData={planningData || undefined}
          />
        )}
        
        {currentStep === 1 && (
          <OutlineSelection
            outlines={outlineOptions}
            onSelect={handleOutlineSelect}
            onRegenerate={handleRegenerateOutlines}
            onBack={handleBack}
            isGenerating={isGenerating}
            planningDataHash={planningData ? generatePlanningDataHash(planningData) : undefined}
          />
        )}
        
        {currentStep === 2 && (
          <PlanEnhancement
            selectedOutline={selectedOutline}
            selectedOutlines={selectedOutlines}
            onOptimize={handleOptimizeAndGenerate}
            onBack={handleBack}
            isGenerating={isGenerating}
            savedOptimizationText={savedOptimizationText}
            onOptimizationTextChange={setSavedOptimizationText}
          />
        )}
        
        {currentStep === 3 && (
          <FinalPlan
            finalPlan={finalPlan}
            onRestart={handleRestart}
            onBack={handleBack}
            onSavePlan={handleSavePlan}
            canSave={!!(selectedOutline && finalPlan)}
            onPlanUpdate={handlePlanUpdate}
          />
        )}
      </div>

      {/* 进度条模态窗口 */}
      <Modal
        title="AI生成进度"
        open={showProgressModal}
        footer={
          isGenerating ? (
            <Button 
              danger 
              icon={<StopOutlined />}
              onClick={handleStopGeneration}
            >
              停止生成
            </Button>
          ) : null
        }
        closable={!isGenerating}
        width={600}
        centered
      >
        <div style={{ marginBottom: '16px' }}>
          <Progress 
            percent={generationProgress} 
            status={generationProgress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#b01c02',
              '100%': '#ff4d4f'
            }}
          />
        </div>
        
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <div style={{ 
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            {progressLogs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                color: log.includes('失败') || log.includes('错误') || log.includes('停止') ? '#ff4d4f' : '#666'
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>
        
        {generationProgress === 100 && (
          <div style={{ 
            marginTop: '16px', 
            textAlign: 'center',
            color: progressLogs[progressLogs.length - 1]?.includes('失败') || progressLogs[progressLogs.length - 1]?.includes('停止') ? '#ff4d4f' : '#52c41a'
          }}>
            {progressLogs[progressLogs.length - 1]?.includes('失败') ? '⚠️ 生成失败' : 
             progressLogs[progressLogs.length - 1]?.includes('停止') ? '⚠️ 已停止' : '✅ 生成完成'}
          </div>
        )}
      </Modal>
      
      {/* 历史记录模态窗口 */}
      <Modal
        title="活动策划历史记录"
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        width={1200}
        footer={null}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        <EventPlanningHistoryComponent
          onSelectHistory={handleLoadFromHistory}
          onEditHistory={(history) => {
            handleLoadFromHistory(history);
            // 可以在这里添加编辑模式的逻辑
          }}
        />
      </Modal>
    </div>
  );
};

export default EventPlanningPage; 