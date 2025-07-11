import { getApiKey } from '../utils/deepseekApi';
import type { CustomerResource, VenueResource } from '../types';

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface EventPlanningData {
  theme: string;
  description: string;
  participantCount: string;
  userProfile?: string;
  requirements?: string;
  venueNeeds?: string;
  city: string;
  eventDate?: string;
  duration: string;
  organizerName?: string;
  organizerDescription?: string;
}

export interface OutlineOption {
  id: string;
  title: string;
  overview: string;
  highlights: string[];
  timeline: string[];
  budget: string;
  venue: string;
}

// 获取现有资源数据
const getAvailableResources = () => {
  try {
    const customersData = localStorage.getItem('qplz_customers');
    const venuesData = localStorage.getItem('qplz_venues');
    
    const customers: CustomerResource[] = customersData ? JSON.parse(customersData) : [];
    const venues: VenueResource[] = venuesData ? JSON.parse(venuesData) : [];
    
    return { customers, venues };
  } catch (error) {
    console.error('获取资源数据失败:', error);
    return { customers: [], venues: [] };
  }
};

// 生成活动方案大纲的prompt（包含资源匹配）
const generateOutlinePrompt = (data: EventPlanningData) => {
  const { customers, venues } = getAvailableResources();
  
  let resourceSection = '';
  
  if (customers.length > 0 || venues.length > 0) {
    resourceSection = `\n现有资源信息：\n`;
    
    if (customers.length > 0) {
      resourceSection += `客户资源：\n`;
      customers.forEach(customer => {
        resourceSection += `- ${customer.name}（${customer.title}）${customer.rating ? ` - ${customer.rating}星级` : ''}${customer.hasCooperated ? ' - 已合作' : ''}\n`;
      });
    }
    
    if (venues.length > 0) {
      resourceSection += `场地资源：\n`;
      venues.forEach(venue => {
        const capacityInfo = venue.capacity ? ` - 容纳${venue.capacity}人` : '';
        const ratingInfo = venue.rating ? ` - ${venue.rating}星级` : '';
        const cooperationInfo = venue.hasCooperated ? ' - 已合作' : '';
        resourceSection += `- ${venue.name}（${venue.location}）${capacityInfo}${ratingInfo}${cooperationInfo}\n`;
      });
    }
    
    resourceSection += `\n请在三个方案中，至少有一个方案要充分利用这些现有资源，匹配最适合的客户资源和场地资源，并在方案中明确体现。\n`;
  }

  return `你是一个专业的活动策划师，请根据以下信息为女性社区设计3个不同风格的活动策划方案大纲：

活动信息：
- 活动主题：${data.theme}
- 活动描述：${data.description}
- 参与人数：${data.participantCount}
- 举办城市：${data.city}
- 活动时长：${data.duration}
${data.eventDate ? `- 期望日期：${data.eventDate}` : ''}
${data.organizerName ? `- 主办方：${data.organizerName}` : ''}
${data.organizerDescription ? `- 主办方介绍：${data.organizerDescription}` : ''}
${data.userProfile ? `- 目标用户：${data.userProfile}` : ''}
${data.requirements ? `- 特殊要求：${data.requirements}` : ''}
${data.venueNeeds ? `- 场地需求：${data.venueNeeds}` : ''}${resourceSection}

请生成3个不同风格的活动方案，每个方案包含：
1. 方案标题（吸引人的活动名称）
2. 活动概述（100字以内）
3. 活动亮点（3-5个关键词）
4. 时间安排（3-5个主要环节）
5. 预算范围（根据活动规模给出合理区间）
6. 推荐场地（根据城市和需求推荐）

请以JSON格式返回，格式如下：
{
  "outlines": [
    {
      "title": "方案标题",
      "overview": "活动概述",
      "highlights": ["亮点1", "亮点2", "亮点3"],
      "timeline": ["时间安排1", "时间安排2", "时间安排3"],
      "budget": "预算范围描述",
      "venue": "推荐场地描述"
    }
  ]
}

要求：
- 三个方案要有不同的风格和侧重点
- 内容要与用户输入的主题和描述高度相关
- 预算要符合实际情况
- 场地推荐要具体到城市
- 突出女性社区的特色
- 标题和内容不要包含emoji表情符号`;
};

// 生成优化方案的prompt
const generateEnhancedPrompt = (baseOutline: OutlineOption, enhancementRequirements: string, originalData: EventPlanningData) => {
  return `基于以下基础活动方案，根据用户的优化要求，生成3个增强版本：

基础方案：
- 标题：${baseOutline.title}
- 概述：${baseOutline.overview}
- 亮点：${baseOutline.highlights.join('、')}
- 时间安排：${baseOutline.timeline.join('；')}
- 预算：${baseOutline.budget}
- 场地：${baseOutline.venue}

原始活动信息：
- 主题：${originalData.theme}
- 描述：${originalData.description}
- 参与人数：${originalData.participantCount}
- 城市：${originalData.city}
${originalData.organizerName ? `- 主办方：${originalData.organizerName}` : ''}
${originalData.organizerDescription ? `- 主办方介绍：${originalData.organizerDescription}` : ''}

用户优化要求：
${enhancementRequirements}

请生成3个增强版本，每个版本都要：
1. 保持原方案的核心特色
2. 融入用户的优化要求
3. 在原有亮点基础上增加新的元素
4. 优化时间安排和活动流程
5. 调整预算和场地建议（如需要）

请以JSON格式返回，格式与之前相同：
{
  "outlines": [
    {
      "title": "增强版标题",
      "overview": "优化后的概述",
      "highlights": ["原有亮点", "新增亮点1", "新增亮点2"],
      "timeline": ["优化后的时间安排"],
      "budget": "调整后的预算范围",
      "venue": "优化后的场地建议"
    }
  ]
}

要求：
- 标题和内容不要包含emoji表情符号
- 保持专业性和可执行性`;
};

// 生成完整策划书的prompt
const generateFinalPlanPrompt = (finalOutline: OutlineOption, originalData: EventPlanningData) => {
  const currentDate = new Date();
  const eventDate = originalData.eventDate ? new Date(originalData.eventDate) : null;
  
  let timelineSection = '';
  if (eventDate && eventDate > currentDate) {
    const daysDiff = Math.ceil((eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    timelineSection = `
活动时间信息：
- 当前日期：${currentDate.toISOString().split('T')[0]}
- 活动举办日期：${originalData.eventDate}
- 剩余准备时间：${daysDiff}天

请在策划书中包含一个详细的"倒排时间计划"章节，基于活动举办日期倒推，制定从现在到活动举办的完整时间表。包括：
- 活动前60天、30天、15天、7天、3天、1天的关键节点
- 每个时间节点的具体待办事项
- 责任人分工建议
- 风险预警时间点
`;
  }

  return `基于以下确定的活动方案，生成一份完整详细的活动策划书：

最终方案：
- 标题：${finalOutline.title}
- 概述：${finalOutline.overview}
- 亮点：${finalOutline.highlights.join('、')}
- 时间安排：${finalOutline.timeline.join('；')}
- 预算：${finalOutline.budget}
- 场地：${finalOutline.venue}

活动基础信息：
- 主题：${originalData.theme}
- 描述：${originalData.description}
- 参与人数：${originalData.participantCount}
- 城市：${originalData.city}
- 活动时长：${originalData.duration}
${originalData.organizerName ? `- 主办方：${originalData.organizerName}` : ''}
${originalData.organizerDescription ? `- 主办方介绍：${originalData.organizerDescription}` : ''}${timelineSection}

请生成一份专业完整的活动策划书，包含以下章节：

1. **活动概述**
   - 活动背景与目标
   - 活动主题和亮点
   - 目标受众分析

2. **活动详细方案**
   - 详细的活动流程和时间安排
   - 各环节的具体内容
   - 嘉宾和讲师安排

3. **财务测算表**
   请制作详细的财务预算表，包含：
   
   **成本支出：**
   - 场地费用（租赁费、布置费等）
   - 餐食/下午茶费用（根据人数和标准）
   - 住宿费用（如活动超过1天）
   - 嘉宾费用（讲师费、交通费、住宿费）
   - 宣传物料费用（设计、印刷、制作）
   - 活动器材费用（音响、投影等）
   - 人员费用（工作人员、服务费）
   - 其他杂费（保险、应急费用等）
   
   **收入来源：**
   - 参与者报名费（根据人数和定价）
   - 品牌赞助费（主赞助商、协办商）
   - 其他收入（展位费、广告费等）
   
   **财务分析：**
   - 总成本预算
   - 总收入预期
   - 盈亏平衡点分析
   - 风险评估和应对措施

4. **场地方案**
   - 场地选择标准和推荐
   - 场地布局和设计
   - 设备和设施需求

5. **营销推广策略**
   - 目标受众定位
   - 推广渠道和方式
   - 宣传时间节点

6. **执行团队和分工**
   - 组织架构
   - 关键岗位职责
   - 协调沟通机制

7. **风险管控方案**
   - 潜在风险识别
   - 应急预案
   - 备选方案

8. **成功指标和评估**
   - KPI设定
   - 数据收集方法
   - 效果评估标准

请用Markdown格式输出，确保格式清晰，表格数据准确合理。财务测算要基于实际市场价格，确保数据的可信度和可执行性。`;
};

// 改进的JSON解析函数
const parseAIResponse = (response: string): any => {
  try {
    // 直接尝试解析
    return JSON.parse(response);
  } catch (error) {
    console.log('直接解析失败，尝试提取JSON部分...');
    
    // 查找JSON部分
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd + 1);
      console.log('提取的JSON字符串:', jsonStr);
      
      try {
        return JSON.parse(jsonStr);
      } catch (secondError) {
        console.error('提取JSON后仍解析失败:', secondError);
        console.log('JSON字符串:', jsonStr);
        
        // 尝试修复常见的JSON问题
        let cleanedJson = jsonStr
          .replace(/,(\s*[}\]])/g, '$1') // 移除尾随逗号
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
          .replace(/\n/g, ' ') // 替换换行符
          .replace(/\t/g, ' ') // 替换制表符
          .replace(/\s+/g, ' '); // 压缩空白字符
        
        try {
          return JSON.parse(cleanedJson);
        } catch (finalError) {
          console.error('最终解析失败:', finalError);
          throw new Error(`JSON解析失败: ${finalError instanceof Error ? finalError.message : '未知错误'}`);
        }
      }
    } else {
      throw new Error('未找到有效的JSON数据');
    }
  }
};

// 调用DeepSeek API
const callDeepSeekAPI = async (prompt: string): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('请先配置DeepSeek API密钥');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// 生成活动方案大纲
export const generateEventOutlines = async (
  planningData: EventPlanningData, 
  progressCallback?: (progress: number, message: string) => void
): Promise<OutlineOption[]> => {
  progressCallback?.(10, '正在准备请求数据...');
  
  const prompt = generateOutlinePrompt(planningData);
  
  progressCallback?.(30, '正在调用DeepSeek API...');
  
  const response = await callDeepSeekAPI(prompt);
  
  progressCallback?.(70, '正在解析生成的方案...');
  
  try {
    // 尝试解析JSON响应
    console.log('AI原始响应:', response);
    console.log('响应长度:', response.length);
    console.log('响应前100字符:', response.substring(0, 100));
    
    const parsed = parseAIResponse(response);
    console.log('解析成功，parsed对象:', parsed);
    
    if (!parsed.outlines || !Array.isArray(parsed.outlines)) {
      throw new Error('响应格式错误：缺少outlines数组');
    }
    
    const outlines = parsed.outlines.map((outline: any, index: number) => ({
      id: `outline-${Date.now()}-${index}`,
      title: outline.title,
      overview: outline.overview,
      highlights: outline.highlights || [],
      timeline: outline.timeline || [],
      budget: outline.budget,
      venue: outline.venue
    }));
    
    console.log('处理后的outlines:', outlines);
    return outlines;
  } catch (error) {
    console.error('解析AI响应失败:', error);
    console.log('完整原始响应:', response);
    throw new Error(`AI响应解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 生成增强版方案
export const generateEnhancedOutlines = async (
  baseOutline: OutlineOption, 
  enhancementRequirements: string, 
  originalData: EventPlanningData,
  progressCallback?: (progress: number, message: string) => void
): Promise<OutlineOption[]> => {
  progressCallback?.(10, '正在准备优化请求...');
  
  const prompt = generateEnhancedPrompt(baseOutline, enhancementRequirements, originalData);
  
  progressCallback?.(30, '正在调用DeepSeek API进行方案优化...');
  
  const response = await callDeepSeekAPI(prompt);
  
  progressCallback?.(70, '正在解析优化后的方案...');
  
  try {
    const parsed = parseAIResponse(response);
    const outlines = parsed.outlines.map((outline: any, index: number) => ({
      id: `enhanced-${baseOutline.id}-${Date.now()}-${index}`,
      title: outline.title,
      overview: outline.overview,
      highlights: outline.highlights || [],
      timeline: outline.timeline || [],
      budget: outline.budget,
      venue: outline.venue
    }));
    
    return outlines;
  } catch (error) {
    console.error('解析AI响应失败:', error);
    console.log('原始响应:', response);
    throw new Error('AI响应格式错误，请重试');
  }
};

// 生成完整策划书
export const generateFinalPlan = async (
  finalOutline: OutlineOption, 
  originalData: EventPlanningData,
  progressCallback?: (progress: number, message: string) => void
): Promise<string> => {
  progressCallback?.(10, '正在准备策划书生成请求...');
  
  const prompt = generateFinalPlanPrompt(finalOutline, originalData);
  
  progressCallback?.(30, '正在调用DeepSeek API生成完整策划书...');
  
  const response = await callDeepSeekAPI(prompt);
  
  progressCallback?.(80, '策划书生成完成，正在最终处理...');
  
  return response;
}; 