import { getApiKey } from '../utils/deepseekApi';

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 平台类型定义
export type Platform = 'wechat_group' | 'wechat_public' | 'xiaohongshu' | 'huodongxing';

// 文本风格定义
export type TextStyle = 'professional' | 'casual' | 'trendy' | 'warm' | 'exciting' | 'elegant';

// 引流内容生成请求参数
export interface TrafficGenerationRequest {
  eventTitle: string;
  eventDescription: string;
  eventDate?: string;
  eventLocation: string;
  targetAudience: string;
  eventHighlights: string[];
  posterUrl?: string;
  platforms: Platform[];
  textStyle: TextStyle;
  customRequirements?: string;
  referenceArticles?: string[];
}

// 平台特定内容
export interface PlatformContent {
  platform: Platform;
  title: string;
  content: string;
  tags: string[];
  callToAction: string;
  tips: string[];
}

// 关键词分析结果
export interface KeywordAnalysis {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  targetTags: string[];
  trendingTerms: string[];
}

// 爆款文分析结果
export interface ViralAnalysis {
  titlePatterns: string[];
  contentFeatures: string[];
  writingStyles: string[];
  engagementTactics: string[];
  recommendations: string[];
}

// 完整的引流方案
export interface TrafficGenerationResult {
  keywords: KeywordAnalysis;
  viralAnalysis: ViralAnalysis;
  platformContents: PlatformContent[];
  overallStrategy: string;
}

// 平台特征配置
const platformConfigs = {
  wechat_group: {
    name: '微信群',
    maxLength: 500,
    characteristics: ['简洁直接', '社群感强', '易转发', '突出福利'],
    format: '群聊式推广文案'
  },
  wechat_public: {
    name: '微信公众号',
    maxLength: 2000,
    characteristics: ['标题吸睛', '内容丰富', '排版精美', '引导关注'],
    format: '公众号推文'
  },
  xiaohongshu: {
    name: '小红书',
    maxLength: 1000,
    characteristics: ['视觉化强', '标签丰富', '种草感强', '生活化表达'],
    format: '小红书笔记'
  },
  huodongxing: {
    name: '活动行',
    maxLength: 1500,
    characteristics: ['信息完整', '专业性强', '报名导向', '活动详情'],
    format: '活动发布页面'
  }
};

// 文本风格配置
const styleConfigs = {
  professional: {
    name: '专业商务',
    tone: '正式、权威、专业',
    vocabulary: '商务术语、行业词汇',
    structure: '逻辑清晰、层次分明'
  },
  casual: {
    name: '轻松随意',
    tone: '亲切、自然、轻松',
    vocabulary: '日常用语、口语化',
    structure: '对话感强、易理解'
  },
  trendy: {
    name: '时尚潮流',
    tone: '时尚、前卫、活力',
    vocabulary: '网络流行语、新词汇',
    structure: '节奏感强、富有创意'
  },
  warm: {
    name: '温馨暖心',
    tone: '温暖、关怀、贴心',
    vocabulary: '情感词汇、温馨表达',
    structure: '情感丰富、感人至深'
  },
  exciting: {
    name: '激情澎湃',
    tone: '激动、兴奋、充满活力',
    vocabulary: '感叹词、动感词汇',
    structure: '节奏紧凑、富有感染力'
  },
  elegant: {
    name: '优雅精致',
    tone: '优雅、精致、有品味',
    vocabulary: '文雅词汇、高级表达',
    structure: '优美流畅、富有美感'
  }
};

// 生成关键词分析的prompt
const generateKeywordsPrompt = (request: TrafficGenerationRequest) => {
  return `作为专业的活动营销专家，请分析以下活动信息，提取关键词并进行分类：

活动信息：
- 活动标题：${request.eventTitle}
- 活动描述：${request.eventDescription}
- 目标受众：${request.targetAudience}
- 活动亮点：${request.eventHighlights.join('、')}
- 举办地点：${request.eventLocation}
${request.eventDate ? `- 活动时间：${request.eventDate}` : ''}

请进行以下分析：
1. 提取核心关键词（3-5个最重要的词汇）
2. 提取次要关键词（5-8个相关词汇）
3. 生成推广标签（8-12个适合社交媒体的标签）
4. 识别当前热门趋势词汇（结合女性社区、活动类型等）

请以JSON格式返回：
{
  "primaryKeywords": ["核心词1", "核心词2"],
  "secondaryKeywords": ["相关词1", "相关词2"],
  "targetTags": ["#标签1", "#标签2"],
  "trendingTerms": ["热门词1", "热门词2"]
}`;
};

// 生成爆款文分析的prompt
const generateViralAnalysisPrompt = (keywords: KeywordAnalysis, referenceArticles?: string[]) => {
  const keywordStr = [...keywords.primaryKeywords, ...keywords.secondaryKeywords].join('、');
  
  let referenceSection = '';
  if (referenceArticles && referenceArticles.length > 0) {
    referenceSection = `\n参考文章内容：\n${referenceArticles.map((article, index) => `文章${index + 1}：\n${article}\n`).join('\n')}`;
  }

  return `作为内容营销专家，请基于关键词"${keywordStr}"分析相关领域的爆款文特征${referenceSection ? '，并结合提供的参考文章' : ''}：

分析维度：
1. 标题模式分析（爆款标题的常见套路和模式）
2. 内容特征总结（爆款内容的共同特点）
3. 写作风格归纳（表达方式、语言特色）
4. 互动策略分析（提升参与度的技巧）
5. 优化建议（针对女性社区活动的具体建议）

请以JSON格式返回：
{
  "titlePatterns": ["标题模式1", "标题模式2"],
  "contentFeatures": ["内容特征1", "内容特征2"],
  "writingStyles": ["写作风格1", "写作风格2"],
  "engagementTactics": ["互动技巧1", "互动技巧2"],
  "recommendations": ["建议1", "建议2"]
}

要求：
- 每个维度提供3-5个具体的分析要点
- 建议要具体可执行
- 符合女性社区特色`;
};

// 生成平台内容的prompt
const generatePlatformContentPrompt = (
  request: TrafficGenerationRequest,
  platform: Platform,
  keywords: KeywordAnalysis,
  viralAnalysis: ViralAnalysis
) => {
  const platformConfig = platformConfigs[platform];
  const styleConfig = styleConfigs[request.textStyle];
  
  return `作为${platformConfig.name}内容创作专家，请为以下活动创作高质量的推广内容：

活动信息：
- 标题：${request.eventTitle}
- 描述：${request.eventDescription}
- 时间：${request.eventDate || '待定'}
- 地点：${request.eventLocation}
- 目标受众：${request.targetAudience}
- 活动亮点：${request.eventHighlights.join('、')}

平台特征：
- 平台：${platformConfig.name}
- 内容长度：不超过${platformConfig.maxLength}字
- 平台特色：${platformConfig.characteristics.join('、')}
- 内容格式：${platformConfig.format}

文本风格：
- 风格：${styleConfig.name}
- 语调：${styleConfig.tone}
- 用词：${styleConfig.vocabulary}
- 结构：${styleConfig.structure}

关键词信息：
- 核心关键词：${keywords.primaryKeywords.join('、')}
- 推广标签：${keywords.targetTags.join(' ')}
- 热门词汇：${keywords.trendingTerms.join('、')}

爆款文特征参考：
- 标题模式：${viralAnalysis.titlePatterns.join('；')}
- 内容特征：${viralAnalysis.contentFeatures.join('；')}
- 写作风格：${viralAnalysis.writingStyles.join('；')}
- 互动策略：${viralAnalysis.engagementTactics.join('；')}

${request.customRequirements ? `\n用户自定义要求：\n${request.customRequirements}` : ''}

请生成：
1. 吸引人的标题（结合爆款标题模式）
2. 完整的推广内容（符合平台特色和字数限制）
3. 相关标签（8-12个）
4. 行动号召文案（引导报名/参与）
5. 平台优化建议（3-5条）

请以JSON格式返回：
{
  "title": "标题内容",
  "content": "完整的推广文案",
  "tags": ["标签1", "标签2"],
  "callToAction": "行动号召文案",
  "tips": ["优化建议1", "优化建议2"]
}

要求：
- 内容要符合平台调性和字数限制
- 融入关键词和热门话题
- 体现女性社区特色
- 具有强烈的吸引力和转化力
- 不使用emoji表情符号`;
};

// 生成整体策略的prompt
const generateOverallStrategyPrompt = (
  request: TrafficGenerationRequest,
  platformContents: PlatformContent[]
) => {
  const platformNames = request.platforms.map(p => platformConfigs[p].name).join('、');
  
  return `作为活动营销策略专家，请为"${request.eventTitle}"制定多平台引流的整体策略建议：

活动基本信息：
- 活动：${request.eventTitle}
- 受众：${request.targetAudience}
- 平台：${platformNames}

各平台内容已生成完成，请提供：
1. 多平台联动策略（如何协调各平台发布时间和内容）
2. 内容分发时间建议（最佳发布时间和频次）
3. 互动策略建议（如何提升用户参与度）
4. 效果监测指标（关键数据指标和监测方法）
5. 优化迭代建议（根据数据反馈如何调整）

请返回详细的策略建议文本，要求实用性强、可操作性高。`;
};

// 改进的JSON解析函数
const parseAIResponse = (response: string): any => {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.log('直接解析失败，尝试提取JSON部分...');
    
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd + 1);
      
      try {
        return JSON.parse(jsonStr);
      } catch (secondError) {
        let cleanedJson = jsonStr
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ');
        
        try {
          return JSON.parse(cleanedJson);
        } catch (finalError) {
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
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`API调用失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// 主要的引流内容生成函数
export const generateTrafficContent = async (
  request: TrafficGenerationRequest,
  progressCallback?: (progress: number, message: string) => void
): Promise<TrafficGenerationResult> => {
  try {
    progressCallback?.(10, '开始分析活动关键词...');
    
    // 1. 生成关键词分析
    const keywordsPrompt = generateKeywordsPrompt(request);
    const keywordsResponse = await callDeepSeekAPI(keywordsPrompt);
    const keywords = parseAIResponse(keywordsResponse);
    
    progressCallback?.(30, '正在分析爆款文特征...');
    
    // 2. 生成爆款文分析
    const viralPrompt = generateViralAnalysisPrompt(keywords, request.referenceArticles);
    const viralResponse = await callDeepSeekAPI(viralPrompt);
    const viralAnalysis = parseAIResponse(viralResponse);
    
    progressCallback?.(50, '开始生成各平台推广内容...');
    
    // 3. 为每个平台生成内容
    const platformContents: PlatformContent[] = [];
    const totalPlatforms = request.platforms.length;
    
    for (let i = 0; i < totalPlatforms; i++) {
      const platform = request.platforms[i];
      const platformName = platformConfigs[platform].name;
      
      progressCallback?.(50 + (i / totalPlatforms) * 30, `正在生成${platformName}推广内容...`);
      
      const contentPrompt = generatePlatformContentPrompt(request, platform, keywords, viralAnalysis);
      const contentResponse = await callDeepSeekAPI(contentPrompt);
      const contentData = parseAIResponse(contentResponse);
      
      platformContents.push({
        platform,
        ...contentData
      });
    }
    
    progressCallback?.(85, '正在制定整体营销策略...');
    
    // 4. 生成整体策略
    const strategyPrompt = generateOverallStrategyPrompt(request, platformContents);
    const strategyResponse = await callDeepSeekAPI(strategyPrompt);
    
    progressCallback?.(95, '完成内容生成，正在整理结果...');
    
    return {
      keywords,
      viralAnalysis,
      platformContents,
      overallStrategy: strategyResponse
    };
    
  } catch (error) {
    console.error('引流内容生成失败:', error);
    throw error;
  }
};

// 导出平台和风格配置供UI使用
export { platformConfigs, styleConfigs }; 