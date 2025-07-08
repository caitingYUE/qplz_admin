import React, { useState } from 'react';
import { Card, Steps, Typography, Button, Modal, Progress } from 'antd';
import EventPlanningForm from '../components/EventPlanningForm';
import OutlineSelection from '../components/OutlineSelection';
import PlanEnhancement from '../components/PlanEnhancement';
import FinalPlan from '../components/FinalPlan';
import { 
  generateEventOutlines, 
  generateEnhancedOutlines, 
  generateFinalPlan,
  type EventPlanningData,
  type OutlineOption
} from '../services/eventPlanningService';

const { Title, Paragraph } = Typography;

const EventPlanningPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [planningData, setPlanningData] = useState<EventPlanningData | null>(null);
  const [outlineOptions, setOutlineOptions] = useState<OutlineOption[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<OutlineOption | null>(null);
  const [enhancedOutlines, setEnhancedOutlines] = useState<OutlineOption[]>([]);
  const [finalPlan, setFinalPlan] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(true);
  
  // 进度条和日志状态
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

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
      description: '细化和完善活动方案'
    },
    {
      title: '完整方案',
      description: '查看最终活动策划书'
    }
  ];

  const handleFormSubmit = async (data: EventPlanningData) => {
    setPlanningData(data);
    localStorage.setItem('eventPlanningData', JSON.stringify(data));
    
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
      console.error('生成方案失败:', error);
      finishProgressTracking(false, `生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutlineSelect = async (index: number, enhancement?: string) => {
    const selectedOutlineData = outlineOptions[index];
    setSelectedOutline(selectedOutlineData);
    setIsGenerating(true);
    startProgressTracking('开始优化选定的活动方案...');

    try {
      const baseOutline = outlineOptions[index];
      
      if (enhancement) {
        updateProgress(20, '正在根据您的要求优化方案...');
        const enhancedOutlines = await generateEnhancedOutlines(baseOutline, enhancement, planningData!, updateProgress);
        
        updateProgress(90, '方案优化完成，正在处理数据...');
        setEnhancedOutlines(enhancedOutlines);
        setCurrentStep(2);
        
        finishProgressTracking(true, '方案优化完成！');
      } else {
        updateProgress(50, '使用原始方案，跳转到下一步...');
        setEnhancedOutlines([baseOutline]);
        setCurrentStep(2);
        
        finishProgressTracking(true, '方案选择完成！');
      }
    } catch (error) {
      console.error('优化方案失败:', error);
      finishProgressTracking(false, `优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 为OutlineSelection组件创建简单的选择处理函数
  const handleSimpleOutlineSelect = (outline: OutlineOption) => {
    setSelectedOutline(outline);
    setEnhancedOutlines([outline]);
    setCurrentStep(2);
  };

  const handleRegenerateOutlines = async () => {
    if (!planningData) return;
    
    setIsGenerating(true);
    startProgressTracking('重新生成活动方案...');
    
    try {
      updateProgress(20, '正在连接DeepSeek API...');
      const outlines = await generateEventOutlines(planningData, updateProgress);
      
      updateProgress(90, '新方案生成完成，正在处理数据...');
      setOutlineOptions(outlines);
      
      finishProgressTracking(true, '新方案生成成功！');
    } catch (error) {
      console.error('重新生成失败:', error);
      finishProgressTracking(false, `重新生成失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceOutline = async (enhancementRequirements: string) => {
    if (!selectedOutline || !planningData) return;
    
    setIsGenerating(true);
    startProgressTracking('正在优化活动方案...');
    
    try {
      updateProgress(20, '正在根据您的要求优化方案...');
      const enhancedOptions = await generateEnhancedOutlines(
        selectedOutline, 
        enhancementRequirements, 
        planningData,
        updateProgress
      );
      
      updateProgress(90, '方案优化完成，正在处理数据...');
      setEnhancedOutlines(enhancedOptions);
      
      finishProgressTracking(true, '方案优化完成！');
    } catch (error) {
      console.error('方案优化失败:', error);
      finishProgressTracking(false, `优化失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSelection = async (outline: OutlineOption) => {
    setSelectedOutline(outline);
    setIsGenerating(true);
    startProgressTracking('开始生成完整的活动策划书...');
    
    try {
      updateProgress(20, '正在构建详细的活动策划内容...');
      const plan = await generateFinalPlan(outline, planningData!, updateProgress);
      
      updateProgress(90, '策划书生成完成，正在最后整理...');
      setFinalPlan(plan);
      setCurrentStep(3);
      
      finishProgressTracking(true, '完整活动策划书已生成完成！');
    } catch (error) {
      console.error('生成最终方案失败:', error);
      finishProgressTracking(false, `生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setPlanningData(null);
    setOutlineOptions([]);
    setSelectedOutline(null);
    setEnhancedOutlines([]);
    setFinalPlan('');
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
        <Button 
          type="text" 
          onClick={() => setStepsVisible(!stepsVisible)}
          style={{ fontSize: '12px' }}
        >
          {stepsVisible ? '收起步骤' : '显示步骤'}
        </Button>
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
            onSelect={handleSimpleOutlineSelect}
            onRegenerate={handleRegenerateOutlines}
            onBack={handleBack}
            isGenerating={isGenerating}
          />
        )}
        
        {currentStep === 2 && (
          <PlanEnhancement
            selectedOutline={selectedOutline}
            enhancedOutlines={enhancedOutlines}
            onEnhance={handleEnhanceOutline}
            onFinalSelect={handleFinalSelection}
            onBack={handleBack}
            isGenerating={isGenerating}
          />
        )}
        
        {currentStep === 3 && (
          <FinalPlan
            finalPlan={finalPlan}
            onRestart={handleRestart}
            onBack={handleBack}
          />
        )}
      </div>

      {/* 进度条模态窗口 */}
      <Modal
        title="AI生成进度"
        open={showProgressModal}
        footer={null}
        closable={false}
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
                color: log.includes('失败') || log.includes('错误') ? '#ff4d4f' : '#666'
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
            color: progressLogs[progressLogs.length - 1]?.includes('失败') ? '#ff4d4f' : '#52c41a'
          }}>
            {progressLogs[progressLogs.length - 1]?.includes('失败') ? '⚠️ 生成失败' : '✅ 生成完成'}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventPlanningPage; 