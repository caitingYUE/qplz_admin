// DeepSeek API 配置和操作
const DEEPSEEK_API_KEY = 'sk-cf7a0273c7c3461fb7b5eb520b2ffb54'; // 在这里填写您的API密钥
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 提示词模板配置
const POSTER_PROMPTS = {
  general: `作为专业海报设计师，请为"前排落座"女性社区设计一个现代化活动海报。

活动信息：
- 标题：{title}
- 副标题：{subtitle}
- 时间：{time}
- 地点：{location}
- 描述：{description}
- 费用：{fee}
- 嘉宾：{guests}
- 参与人数：{maxParticipants}

设计要求：
1. 尺寸：1242×1660px（竖图格式）
2. 风格：现代简约，高级感，符合女性社区特色
3. 配色：可以使用渐变色、主题色#b01c02或其他优雅配色
4. 布局：标题突出，信息层次清晰，视觉效果佳
5. 创意：可以添加装饰元素、图标、背景图案等增强视觉效果

请输出完整的HTML代码，包含CSS样式。可以自由发挥创意，使用任何你认为合适的设计元素和布局方式。`,

  wechat: `作为专业社交媒体设计师，请为"前排落座"女性社区设计微信公众号封面海报。

活动信息：
- 标题：{title}
- 副标题：{subtitle}
- 时间：{time}
- 地点：{location}
- 费用：{fee}

设计要求：
1. 尺寸：900×383px（横版格式，适合微信分享）
2. 风格：适合社交媒体传播，现代简约
3. 配色：温暖亲和的色调，适合微信环境
4. 布局：信息简洁明了，适合手机查看
5. 创意：可以使用图标、装饰元素等增强传播效果

请输出完整的HTML代码，包含CSS样式。可以自由设计布局和视觉效果。`,

  invitation: `作为专业邀请函设计师，请为"前排落座"女性社区设计正式活动邀请函。

邀请信息：
- 活动标题：{title}
- 副标题：{subtitle}
- 邀请人：{inviter}
- 邀请内容：{invitationText}
- 时间：{time}
- 地点：{location}
- 费用：{fee}

设计要求：
1. 尺寸：1242×1660px（竖版邀请函格式）
2. 风格：正式典雅，体现尊重感和仪式感
3. 配色：优雅庄重的色调
4. 布局："邀请函"标题突出，内容层次清晰
5. 创意：可以添加边框、装饰图案、logo等元素

请输出完整的HTML代码，包含CSS样式。可以自由发挥创意设计。`
};

export interface DeepSeekResponse {
  success: boolean;
  html?: string;
  error?: string;
  usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export async function generatePosterWithDeepSeek(
  posterType: 'general' | 'wechat' | 'invitation',
  eventData: {
    title: string;
    subtitle?: string;
    time: string;
    location: string;
    description?: string;
    fee?: string;
    guests?: string;
    maxParticipants?: string;
    inviter?: string;
    invitationText?: string;
  },
  referenceImages?: string[],
  customRequirements?: string
): Promise<DeepSeekResponse> {
  try {
    console.log('🔍 DeepSeek API调用开始');
    console.log('API密钥状态:', DEEPSEEK_API_KEY ? `配置正确 (${DEEPSEEK_API_KEY.substring(0, 10)}...)` : '未配置');
    
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.startsWith('sk-xxxxxxxxx')) {
      console.error('❌ API密钥未配置');
      return {
        success: false,
        error: 'API密钥未配置，请在代码中设置正确的DeepSeek API密钥'
      };
    }

    // 获取对应的提示词模板
    const basePrompt = POSTER_PROMPTS[posterType];
    if (!basePrompt) {
      console.error('❌ 无效的海报类型:', posterType);
      return {
        success: false,
        error: `无效的海报类型: ${posterType}`
      };
    }
    
    let prompt = basePrompt;
    console.log('📝 使用的海报类型:', posterType);
    console.log('📝 对应的prompt模板长度:', prompt.length);
    console.log('📋 活动数据:', eventData);
    
    // 显示关键prompt特征
    const promptInfo = {
      general: '通用海报(1242×1660px)',
      wechat: '微信海报(990×383px)', 
      invitation: '邀请函(1242×1660px)'
    };
    console.log('🎯 prompt特征:', promptInfo[posterType]);
    
    // 替换占位符
    Object.entries(eventData).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value || '');
    });

    // 添加参考图片说明
    if (referenceImages && referenceImages.length > 0) {
      prompt += `\n\n参考图片已提供，请参考其风格、配色、排版和设计元素。`;
      console.log('🖼️ 参考图片数量:', referenceImages.length);
    }

    // 添加自定义需求
    if (customRequirements) {
      prompt += `\n\n额外设计要求：${customRequirements}`;
      console.log('✨ 自定义需求:', customRequirements);
    }

    console.log('📤 发送的完整prompt长度:', prompt.length);
    console.log('📤 发送的prompt前500字符:', prompt.substring(0, 500) + '...');
    
    // 验证prompt是否包含对应的尺寸信息
    const sizeVerification = {
      general: prompt.includes('870') && prompt.includes('870'),
      wechat: prompt.includes('1280') && prompt.includes('640'),
      invitation: prompt.includes('870') && prompt.includes('1000')
    };
    
    if (sizeVerification[posterType]) {
      console.log('✅ prompt包含正确的尺寸信息');
    } else {
      console.warn('⚠️ prompt可能不包含正确的尺寸信息');
    }

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的网页设计师，专门负责生成HTML海报代码。请严格按照用户要求输出标准的HTML代码，不要添加任何markdown标记或解释文字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      stream: false
    };

    console.log('📤 请求体大小:', JSON.stringify(requestBody).length, 'bytes');

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ API请求失败，状态码:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ 错误详情:', errorData);
      return {
        success: false,
        error: `API请求失败: ${response.status} ${response.statusText}${errorData.error?.message ? ' - ' + errorData.error.message : ''}`
      };
    }

    const data = await response.json();
    console.log('📥 收到API响应数据:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ API返回数据格式错误:', data);
      return {
        success: false,
        error: 'API返回数据格式错误'
      };
    }

    let htmlContent = data.choices[0].message.content;
    console.log('📝 原始HTML内容长度:', htmlContent?.length || 0);
    console.log('📝 原始HTML内容预览:', htmlContent?.substring(0, 200) + '...');
    
    // 清理返回的内容，提取HTML部分
    htmlContent = cleanHtmlResponse(htmlContent, posterType);
    console.log('🧹 清理后HTML内容长度:', htmlContent?.length || 0);
    console.log('🧹 清理后HTML内容预览:', htmlContent?.substring(0, 200) + '...');
    
    // 针对不同类型验证HTML内容
    const typeValidation = validateHtmlForPosterType(htmlContent, posterType);
    if (!typeValidation.valid) {
      console.warn('⚠️ HTML内容可能不符合海报类型要求:', typeValidation.issues);
    } else {
      console.log('✅ HTML内容符合海报类型要求');
    }

    return {
      success: true,
      html: htmlContent,
      usage: data.usage
    };

  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

function cleanHtmlResponse(response: string, _posterType?: 'general' | 'wechat' | 'invitation'): string {
  let cleaned = response.trim();
  
  // 移除markdown代码块标记
  cleaned = cleaned.replace(/```html\s*/gi, '').replace(/```\s*$/g, '');
  
  // 移除多余的解释文字（在HTML之前或之后的文字）
  cleaned = cleaned.replace(/^[^<]*(?=<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.replace(/(?<=<\/html>)[^<]*$/i, '');
  
  // 移除多余的空白行
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // 如果找到HTML开始标签，提取完整的HTML文档
  const htmlStart = cleaned.search(/<!DOCTYPE\s+html>|<html[\s>]/i);
  const htmlEnd = cleaned.search(/<\/html>\s*$/i);
  
  if (htmlStart >= 0 && htmlEnd >= 0) {
    cleaned = cleaned.substring(htmlStart, htmlEnd + 7); // 7 = '</html>'.length
  } else if (!cleaned.includes('<!DOCTYPE html>') && !cleaned.includes('<html')) {
    // 如果不是完整的HTML文档，尝试包装
    if (cleaned.includes('<div') || cleaned.includes('<style')) {
      cleaned = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI生成海报</title>
</head>
<body>
${cleaned}
</body>
</html>`;
    }
  }
  
  return cleaned.trim();
}

// 验证HTML内容是否符合海报类型要求
function validateHtmlForPosterType(htmlContent: string, posterType: 'general' | 'wechat' | 'invitation') {
  const issues: string[] = [];
  
  // 检查尺寸信息
  const expectedDimensions = {
    general: { width: 1242, height: 1660 },
    wechat: { width: 900, height: 383 },
    invitation: { width: 1242, height: 1660 }
  };
  
  const expected = expectedDimensions[posterType];
  const hasCorrectWidth = htmlContent.includes(`${expected.width}px`) || htmlContent.includes(`width: ${expected.width}`);
  const hasCorrectHeight = htmlContent.includes(`${expected.height}px`) || htmlContent.includes(`height: ${expected.height}`);
  
  if (!hasCorrectWidth) {
    issues.push(`缺少预期宽度 ${expected.width}px`);
  }
  if (!hasCorrectHeight) {
    issues.push(`缺少预期高度 ${expected.height}px`);
  }
  
  // 检查是否包含HTML结构
  if (!htmlContent.includes('<html') && !htmlContent.includes('<div')) {
    issues.push('缺少有效的HTML结构');
  }
  
  // 检查是否包含样式
  if (!htmlContent.includes('style') && !htmlContent.includes('<style>')) {
    issues.push('缺少样式定义');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// DeepSeek API 集成模块
export interface DeepSeekPosterRequest {
  type: 'general' | 'wechat' | 'invitation';
  eventData: {
    title: string;
    subtitle?: string;
    description?: string;
    startTime: string;
    endTime: string;
    location: string;
    guests?: Array<{
      name: string;
      title: string;
      bio: string;
    }>;
    fee?: string;
    qrCode?: string;
    logos?: string[]; // 1-5个logo URL
    // 邀请函特有字段
    inviterName?: string;
    invitationText?: string;
  };
  referenceImage?: string; // 参考图片的base64或URL
  customRequirements?: string; // 用户自定义要求
}



// 验证API密钥格式
export function validateApiKey(apiKey: string): boolean {
  return Boolean(apiKey && apiKey.length > 10 && apiKey.startsWith('sk-'));
}

// 获取API使用统计
export function getApiUsageInfo() {
  return {
    totalRequests: parseInt(localStorage.getItem('deepseek_total_requests') || '0'),
    monthlyRequests: parseInt(localStorage.getItem('deepseek_monthly_requests') || '0'),
    lastRequestTime: localStorage.getItem('deepseek_last_request'),
  };
}

// 更新API使用统计
export function updateApiUsage() {
  const current = getApiUsageInfo();
  localStorage.setItem('deepseek_total_requests', (current.totalRequests + 1).toString());
  localStorage.setItem('deepseek_monthly_requests', (current.monthlyRequests + 1).toString());
  localStorage.setItem('deepseek_last_request', new Date().toISOString());
} 