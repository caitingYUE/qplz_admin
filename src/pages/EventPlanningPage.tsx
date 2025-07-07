import React, { useState } from 'react';
import { Card, Steps, Typography, message } from 'antd';
import EventPlanningForm from '../components/EventPlanningForm';
import OutlineSelection from '../components/OutlineSelection';
import PlanEnhancement from '../components/PlanEnhancement';
import FinalPlan from '../components/FinalPlan';

const { Title, Paragraph } = Typography;

interface EventPlanningData {
  theme: string;
  description: string;
  participantCount: string;
  userProfile?: string;
  requirements?: string;
  venueNeeds?: string;
  city: string;
  eventDate?: string;
  duration: string;
}

interface OutlineOption {
  id: string;
  title: string;
  overview: string;
  highlights: string[];
  timeline: string[];
  budget: string;
  venue: string;
}

const EventPlanningPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [planningData, setPlanningData] = useState<EventPlanningData | null>(null);
  const [outlineOptions, setOutlineOptions] = useState<OutlineOption[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<OutlineOption | null>(null);
  const [enhancedOutlines, setEnhancedOutlines] = useState<OutlineOption[]>([]);
  const [finalPlan, setFinalPlan] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    
    try {
      // 这里调用DeepSeek API生成三个方案大纲
      message.loading({ content: '正在生成活动方案大纲...', key: 'generating' });
      
      // 模拟API调用 - 后续替换为真实的DeepSeek调用
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockOutlines: OutlineOption[] = [
        {
          id: '1',
          title: '创新科技主题活动',
          overview: '以科技创新为核心的女性专业发展活动',
          highlights: ['主题演讲', '技术工作坊', '网络交流'],
          timeline: ['09:00-09:30 签到', '09:30-10:30 开场演讲', '10:45-12:00 技术分享'],
          budget: '预算范围：3-5万元',
          venue: '推荐场地：创业园区会议中心'
        },
        {
          id: '2', 
          title: '女性领导力峰会',
          overview: '聚焦女性职场发展和领导力提升的高端论坛',
          highlights: ['圆桌论坛', '一对一指导', '成功案例分享'],
          timeline: ['08:30-09:00 签到', '09:00-10:00 主题演讲', '10:15-11:30 圆桌讨论'],
          budget: '预算范围：5-8万元',
          venue: '推荐场地：五星级酒店会议厅'
        },
        {
          id: '3',
          title: '创业女性交流会',
          overview: '为创业女性提供交流平台和资源对接',
          highlights: ['项目路演', '投资人对接', '创业分享'],
          timeline: ['14:00-14:30 签到', '14:30-15:30 项目展示', '15:45-17:00 自由交流'],
          budget: '预算范围：2-4万元',
          venue: '推荐场地：联合办公空间'
        }
      ];
      
      setOutlineOptions(mockOutlines);
      setCurrentStep(1);
      
      message.success({ content: '活动方案大纲生成成功！', key: 'generating' });
    } catch (error) {
      console.error('生成方案失败:', error);
      message.error({ content: '生成失败，请重试', key: 'generating' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutlineSelect = (outline: OutlineOption) => {
    setSelectedOutline(outline);
    setCurrentStep(2);
  };

  const handleRegenerateOutlines = async () => {
    setIsGenerating(true);
    try {
      message.loading({ content: '正在重新生成方案...', key: 'regenerating' });
      
      // 模拟重新生成
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // 生成新的方案选项
      const newMockOutlines: OutlineOption[] = [
        {
          id: '4',
          title: '数字化转型论坛',
          overview: '探讨女性在数字化时代的机遇与挑战',
          highlights: ['数字化案例', '转型策略', '技能培训'],
          timeline: ['09:00-09:30 开场', '09:30-11:00 主题分享', '11:15-12:30 互动讨论'],
          budget: '预算范围：4-6万元',
          venue: '推荐场地：科技园区展示中心'
        },
        {
          id: '5',
          title: '女性健康与平衡论坛',
          overview: '关注职场女性的身心健康和工作生活平衡',
          highlights: ['健康讲座', '瑜伽体验', '营养指导'],
          timeline: ['10:00-10:30 签到', '10:30-12:00 健康讲座', '14:00-15:30 体验活动'],
          budget: '预算范围：3-5万元',
          venue: '推荐场地：健康会所或瑜伽馆'
        },
        {
          id: '6',
          title: '投资理财女性专场',
          overview: '为女性提供专业的投资理财知识和实践指导',
          highlights: ['理财讲座', '投资策略', '风险管理'],
          timeline: ['13:30-14:00 入场', '14:00-15:30 理财分享', '15:45-17:00 咨询服务'],
          budget: '预算范围：2-4万元',
          venue: '推荐场地：金融机构会议室'
        }
      ];
      
      setOutlineOptions(newMockOutlines);
      message.success({ content: '新方案生成成功！', key: 'regenerating' });
    } catch (error) {
      console.error('重新生成失败:', error);
      message.error({ content: '重新生成失败，请重试', key: 'regenerating' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceOutline = async (enhancementRequirements: string) => {
    if (!selectedOutline) return;
    
    setIsGenerating(true);
    try {
      message.loading({ content: '正在优化活动方案...', key: 'enhancing' });
      
      // 模拟方案优化
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const enhancedOptions: OutlineOption[] = [
        {
          ...selectedOutline,
          id: `${selectedOutline.id}-enhanced-1`,
          title: `${selectedOutline.title} - 增强版A`,
          overview: `${selectedOutline.overview}（根据您的要求进行了优化）`,
          highlights: [...selectedOutline.highlights, '个性化定制', '专业咨询']
        },
        {
          ...selectedOutline,
          id: `${selectedOutline.id}-enhanced-2`, 
          title: `${selectedOutline.title} - 增强版B`,
          overview: `${selectedOutline.overview}（融入更多创新元素）`,
          highlights: [...selectedOutline.highlights, '互动游戏', '现场直播']
        },
        {
          ...selectedOutline,
          id: `${selectedOutline.id}-enhanced-3`,
          title: `${selectedOutline.title} - 增强版C`,
          overview: `${selectedOutline.overview}（注重实用性和落地性）`,
          highlights: [...selectedOutline.highlights, '实战案例', '行动计划']
        }
      ];
      
      setEnhancedOutlines(enhancedOptions);
      message.success({ content: '方案优化完成！', key: 'enhancing' });
    } catch (error) {
      console.error('方案优化失败:', error);
      message.error({ content: '优化失败，请重试', key: 'enhancing' });
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
      {/* 页面标题 */}
      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <Title level={2} style={{ margin: 0, color: '#b01c02' }}>
          🎯 活动策划助手
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#666' }}>
          将您的想法转化为专业的活动策划方案
        </Paragraph>
      </div>

      {/* 步骤指示器 */}
      <Card style={{ marginBottom: '20px', flexShrink: 0 }}>
        <Steps 
          current={currentStep} 
          items={steps}
          size="small"
        />
      </Card>

      {/* 主要内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentStep === 0 && (
          <EventPlanningForm 
            onSubmit={handleFormSubmit}
            isGenerating={isGenerating}
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