import React, { useState } from 'react';
import { Card, Steps, Typography, message, Button } from 'antd';
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
    // 保存用户数据到localStorage
    localStorage.setItem('eventPlanningData', JSON.stringify(data));
    
    setPlanningData(data);
    setIsGenerating(true);
    
    try {
      message.loading({ content: '正在生成活动方案大纲...', key: 'generating' });
      
      // 调用真实的DeepSeek API
      const outlines = await generateEventOutlines(data);
      
      setOutlineOptions(outlines);
      setCurrentStep(1);
      
      message.success({ content: '活动方案大纲生成成功！', key: 'generating' });
    } catch (error: any) {
      console.error('生成方案失败:', error);
      message.error({ 
        content: error.message || '生成失败，请检查API配置或重试', 
        key: 'generating' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutlineSelect = (outline: OutlineOption) => {
    setSelectedOutline(outline);
    setCurrentStep(2);
  };

  const handleRegenerateOutlines = async () => {
    if (!planningData) return;
    
    setIsGenerating(true);
    try {
      message.loading({ content: '正在重新生成方案...', key: 'regenerating' });
      
      // 调用真实的DeepSeek API重新生成
      const outlines = await generateEventOutlines(planningData);
      
      setOutlineOptions(outlines);
      message.success({ content: '新方案生成成功！', key: 'regenerating' });
    } catch (error: any) {
      console.error('重新生成失败:', error);
      message.error({ 
        content: error.message || '重新生成失败，请重试', 
        key: 'regenerating' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceOutline = async (enhancementRequirements: string) => {
    if (!selectedOutline || !planningData) return;
    
    setIsGenerating(true);
    try {
      message.loading({ content: '正在优化活动方案...', key: 'enhancing' });
      
      // 调用真实的DeepSeek API优化方案
      const enhancedOptions = await generateEnhancedOutlines(
        selectedOutline, 
        enhancementRequirements, 
        planningData
      );
      
      setEnhancedOutlines(enhancedOptions);
      message.success({ content: '方案优化完成！', key: 'enhancing' });
    } catch (error: any) {
      console.error('方案优化失败:', error);
      message.error({ 
        content: error.message || '优化失败，请重试', 
        key: 'enhancing' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSelection = async (outline: OutlineOption) => {
    setSelectedOutline(outline);
    setIsGenerating(true);
    
    try {
      message.loading({ content: '正在生成完整活动策划书...', key: 'finalizing' });
      
      // 模拟生成完整方案
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const mockFinalPlan = `
# ${outline.title} - 完整活动策划书

## 一、活动概述
${outline.overview}

活动主题：${planningData?.theme}
参与人数：${planningData?.participantCount}
活动时长：${planningData?.duration}
举办城市：${planningData?.city}

## 二、活动亮点
${outline.highlights.map(highlight => `- ${highlight}`).join('\n')}

## 三、详细时间安排
${outline.timeline.map(time => `**${time}**`).join('\n')}

## 四、预算说明
${outline.budget}

### 预算明细：
- 场地租赁：占总预算30%
- 嘉宾费用：占总预算25%  
- 物料制作：占总预算20%
- 餐饮服务：占总预算15%
- 其他费用：占总预算10%

## 五、场地建议
${outline.venue}

### 场地要求：
- 容纳人数：${planningData?.participantCount}
- 基础设施：投影设备、音响系统、WiFi覆盖
- 交通便利：地铁/公交直达
- 停车设施：提供充足停车位

## 六、营销推广
- 社交媒体宣传
- 合作伙伴推广
- 邮件营销
- 线下宣传

## 七、风险管控
- 天气因素应对方案
- 技术设备备用方案
- 疫情防控措施
- 紧急情况处理流程

## 八、后续跟进
- 活动效果评估
- 参与者反馈收集
- 合作关系维护
- 下次活动规划
      `;
      
      setFinalPlan(mockFinalPlan);
      setCurrentStep(3);
      
      message.success({ content: '完整活动策划书生成成功！', key: 'finalizing' });
    } catch (error) {
      console.error('生成最终方案失败:', error);
      message.error({ content: '生成失败，请重试', key: 'finalizing' });
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
            🎯 活动策划助手
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
            onSelect={handleOutlineSelect}
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
    </div>
  );
};

export default EventPlanningPage; 