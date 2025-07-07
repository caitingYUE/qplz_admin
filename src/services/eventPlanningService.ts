import { getApiKey } from '../utils/deepseekApi';

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

// 生成活动方案大纲的prompt
const generateOutlinePrompt = (data: EventPlanningData) => {
  return `你是一个专业的活动策划师，请根据以下信息为女性社区设计3个不同风格的活动策划方案大纲：

活动信息：
- 活动主题：${data.theme}
- 活动描述：${data.description}
- 参与人数：${data.participantCount}
- 举办城市：${data.city}
- 活动时长：${data.duration}
${data.eventDate ? `- 期望日期：${data.eventDate}` : ''}
${data.userProfile ? `- 目标用户：${data.userProfile}` : ''}
${data.requirements ? `- 特殊要求：${data.requirements}` : ''}
${data.venueNeeds ? `- 场地需求：${data.venueNeeds}` : ''}

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
- 突出女性社区的特色`;
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
}`;
};

// 生成完整策划书的prompt
const generateFinalPlanPrompt = (finalOutline: OutlineOption, originalData: EventPlanningData) => {
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

请生成一份专业完整的活动策划书，包含以下章节：
1. 活动概述
2. 活动亮点
3. 详细时间安排
4. 预算说明（包含明细）
5. 场地建议（包含具体要求）
6. 营销推广策略
7. 风险管控方案
8. 后续跟进计划

请用Markdown格式输出，要求内容详实、专业、可执行。`;
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
    const parsed = JSON.parse(response);
    const outlines = parsed.outlines.map((outline: any, index: number) => ({
      id: `outline-${Date.now()}-${index}`,
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
    const parsed = JSON.parse(response);
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