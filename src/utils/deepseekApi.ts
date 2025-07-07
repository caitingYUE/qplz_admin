// DeepSeek API 配置和操作
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || localStorage.getItem('deepseek_api_key') || '';
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

{guestDetails}

{brandAssets}

设计要求：
1. 尺寸：800×1200px（竖图格式）
2. 风格：现代简约，高级感，符合女性社区特色
3. 配色：优先使用提供的品牌色彩，如果没有则可以使用渐变色、主题色#b01c02或其他优雅配色
4. 布局：标题突出，信息层次清晰，视觉效果佳
5. 创意：可以添加装饰元素、图标、背景图案等增强视觉效果
6. 素材运用：{assetUsageInstructions}

请输出完整的HTML代码，包含CSS样式。可以自由发挥创意，使用任何你认为合适的设计元素和布局方式。`,

  wechat: `作为专业社交媒体设计师，请为"前排落座"女性社区设计微信公众号封面海报。

活动信息：
- 标题：{title}
- 副标题：{subtitle}
- 时间：{time}
- 地点：{location}
- 嘉宾：{guests}

{guestDetails}

{brandAssets}

设计要求：
1. 尺寸：900×383px（横版格式，适合微信分享）
2. 风格：适合社交媒体传播，现代简约
3. 配色：优先使用提供的品牌色彩，如果没有则使用温暖亲和的色调，适合微信环境
4. 布局：信息简洁明了，适合手机查看
5. 创意：可以使用图标、装饰元素等增强传播效果
6. 素材运用：{assetUsageInstructions}

请输出完整的HTML代码，包含CSS样式。可以自由设计布局和视觉效果。`,

  invitation: `作为专业邀请函设计师，请为"前排落座"女性社区设计正式活动邀请函。

邀请信息：
- 活动标题：{title}
- 副标题：{subtitle}
- 邀请人：{inviter}
- 邀请内容：{invitationText}
- 时间：{time}
- 地点：{location}

{guestDetails}

{brandAssets}

设计要求：
1. 尺寸：800×1200px（竖版邀请函格式）
2. 风格：正式典雅，体现尊重感和仪式感
3. 配色：优先使用提供的品牌色彩，如果没有则使用优雅庄重的色调
4. 布局："邀请函"标题突出，内容层次清晰
5. 创意：可以添加边框、装饰图案、logo等元素
6. 素材运用：{assetUsageInstructions}

请输出完整的HTML代码，包含CSS样式。可以自由发挥创意设计。`,

  activity: `作为专业活动海报设计师，请为"前排落座"女性社区设计活动行平台专用海报。

活动信息：
- 标题：{title}
- 副标题：{subtitle}
- 时间：{time}
- 地点：{location}
- 描述：{description}
- 嘉宾：{guests}

{guestDetails}

{brandAssets}

设计要求：
1. 尺寸：1080×640px（横版格式，适合活动行平台展示）
2. 风格：现代专业，吸引眼球，适合在线平台展示
3. 配色：优先使用提供的品牌色彩，如果没有则使用活力色彩，突出活动吸引力
4. 布局：横版布局，左右分区或上下分区，信息层次清晰，适合网页展示
5. 创意：可以添加活动元素、装饰图案、背景等增强视觉冲击力
6. 素材运用：{assetUsageInstructions}

请输出完整的HTML代码，包含CSS样式。注意横版布局的特点，合理安排文字和图形元素。`
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
  posterType: 'general' | 'wechat' | 'invitation' | 'activity',
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
  customRequirements?: string,
  // 新增参数：设计素材
  designAssets?: {
    brandColors?: string[];
    logos?: Array<{ id: string; url: string; name: string }>;
    qrCodes?: Array<{ id: string; url: string; name: string }>;
    brandFonts?: Array<{ id: string; name: string; url: string }>;
  },
  // 新增参数：详细嘉宾信息
  guestDetails?: Array<{
    name: string;
    title: string;
    bio?: string;
    avatar?: string;
  }>,
  // 新增参数：选择的字段
  selectedFields?: string[],
  // 新增参数：abort signal支持取消
  signal?: AbortSignal
): Promise<DeepSeekResponse> {
  try {
    console.log('🔍 DeepSeek API调用开始');
    console.log('API密钥状态:', DEEPSEEK_API_KEY ? `配置正确 (${DEEPSEEK_API_KEY.substring(0, 10)}...)` : '未配置');
    
    // 检查是否已被取消
    if (signal?.aborted) {
      console.log('🚫 signal已经被abort了，直接返回');
      throw new Error('请求已被取消');
    }
    
    console.log('🔍 signal状态:', {
      hasSignal: !!signal,
      isAborted: signal?.aborted,
      signalType: typeof signal
    });

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.startsWith('sk-xxxxxxxxx')) {
      console.error('❌ API密钥未配置');
      return {
        success: false,
        error: 'API密钥未配置，请先在设置中配置您的DeepSeek API密钥'
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
    console.log('🎨 设计素材:', designAssets);
    console.log('👥 嘉宾详情:', guestDetails);
    
    // 构建嘉宾详细信息
    let guestDetailsText = '';
    if (guestDetails && guestDetails.length > 0) {
      guestDetailsText = `嘉宾详细信息：\n`;
      guestDetails.forEach((guest, index) => {
        guestDetailsText += `${index + 1}. ${guest.name} - ${guest.title}\n`;
        if (guest.bio) {
          guestDetailsText += `   简介：${guest.bio}\n`;
        }
        if (guest.avatar) {
          guestDetailsText += `   头像：${guest.avatar}\n`;
        }
      });
      guestDetailsText += '\n请在海报中突出展示嘉宾信息，包括姓名、职位头衔等。如果有头像图片，请适当展示。';
    }
    
    // 构建品牌素材信息
    let brandAssetsText = '';
    let assetUsageInstructions = '';
    
    if (designAssets) {
      brandAssetsText = '设计素材资源：\n';
      
      // 品牌色彩
      if (designAssets.brandColors && designAssets.brandColors.length > 0) {
        brandAssetsText += `品牌色彩：${designAssets.brandColors.join(', ')}\n`;
        assetUsageInstructions += `请使用这些品牌色彩：${designAssets.brandColors.join(', ')} 作为主色调，特别是标题、按钮、装饰元素等关键位置；`;
      }
      
      // Logo
      if (designAssets.logos && designAssets.logos.length > 0) {
        brandAssetsText += `Logo资源：${designAssets.logos.length}个logo可用\n`;
        assetUsageInstructions += `在海报顶部显著位置预留logo位置，使用以下占位符：<div class="logo-placeholder" style="width: 200px; height: 80px; background: #f0f0f0; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #999;">LOGO位置</div>。Logo应该足够大，位置显眼，便于品牌识别；`;
      }
      
      // 二维码
      if (designAssets.qrCodes && designAssets.qrCodes.length > 0) {
        brandAssetsText += `二维码：${designAssets.qrCodes.length}个二维码可用\n`;
        assetUsageInstructions += `在海报右下角显著位置预留二维码位置，使用以下占位符：<div class="qrcode-placeholder" style="width: 140px; height: 140px; background: #f8f8f8; border: 2px dashed #ddd; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #999; flex-direction: column; margin: 16px;"><div style="font-weight: bold;">扫码</div><div>参与活动</div></div>。二维码应该足够大（至少140x140px），位置显眼，便于扫描；`;
      }
      
      // 品牌字体
      if (designAssets.brandFonts && designAssets.brandFonts.length > 0) {
        brandAssetsText += `品牌字体：${designAssets.brandFonts.map(f => f.name).join(', ')}\n`;
        assetUsageInstructions += `标题区域添加class="brand-title"，正文区域添加class="brand-text"，便于后续应用品牌字体；`;
      }
    }
    
    if (!assetUsageInstructions) {
      assetUsageInstructions = '使用合适的颜色、字体和装饰元素来增强视觉效果';
    }
    
    // 构建字段选择说明
    let fieldsInstruction = '';
    if (selectedFields && selectedFields.length > 0) {
      const fieldLabels = selectedFields.map(field => {
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
      }).join('、');
      
      fieldsInstruction = `\n\n⚠️ 字段显示要求：\n请仅在海报中显示以下用户选择的字段：${fieldLabels}\n不要显示其他未选中的字段信息。确保布局紧凑合理。`;
    }
    
    // 替换占位符
    Object.entries(eventData).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value || '');
    });
    
    // 替换素材占位符
    prompt = prompt.replace(/{guestDetails}/g, guestDetailsText);
    prompt = prompt.replace(/{brandAssets}/g, brandAssetsText);
    prompt = prompt.replace(/{assetUsageInstructions}/g, assetUsageInstructions);

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

    // 添加字段选择说明
    if (fieldsInstruction) {
      prompt += fieldsInstruction;
    }

    console.log('📤 发送的完整prompt长度:', prompt.length);
    console.log('📤 发送的prompt前500字符:', prompt.substring(0, 500) + '...');
    
    // 验证prompt是否包含对应的尺寸信息
    const sizeVerification = {
      general: prompt.includes('870') && prompt.includes('870'),
      wechat: prompt.includes('1280') && prompt.includes('640'),
      invitation: prompt.includes('870') && prompt.includes('1000'),
      activity: prompt.includes('1080') && prompt.includes('640')
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
    
    console.log('🌐 准备发送fetch请求，signal状态:', {
      hasSignal: !!signal,
      isAborted: signal?.aborted
    });

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal // 添加signal支持取消
    });
    
    console.log('📡 API响应状态:', response.status, response.statusText);
    console.log('🔍 fetch完成后signal状态:', {
      hasSignal: !!signal,
      isAborted: signal?.aborted
    });

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
    
    // 检查是否是取消错误
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('取消'))) {
      return {
        success: false,
        error: '请求已被用户取消'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

function cleanHtmlResponse(response: string, _posterType?: 'general' | 'wechat' | 'invitation' | 'activity'): string {
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
function validateHtmlForPosterType(htmlContent: string, posterType: 'general' | 'wechat' | 'invitation' | 'activity') {
  const issues: string[] = [];
  
  // 检查尺寸信息
  const expectedDimensions = {
    general: { width: 800, height: 1200 },
    wechat: { width: 900, height: 383 },
    invitation: { width: 800, height: 1200 },
    activity: { width: 1080, height: 640 }
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
  type: 'general' | 'wechat' | 'invitation' | 'activity';
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

// HTML后处理函数：应用用户配置的素材和样式
export function applyDesignAssetsToHtml(
  htmlContent: string,
  designAssets: {
    brandColors?: string[];
    logos?: Array<{ id: string; url: string; name: string }>;
    qrCodes?: Array<{ id: string; url: string; name: string }>;
    brandFonts?: Array<{ id: string; name: string; url: string }>;
  }
): string {
  let processedHtml = htmlContent;
  
  try {
    // 1. 替换Logo占位符
    if (designAssets.logos && designAssets.logos.length > 0) {
      const logoHtml = `<img src="${designAssets.logos[0].url}" alt="${designAssets.logos[0].name}" style="width: 200px; height: 80px; object-fit: contain;">`;
      processedHtml = processedHtml.replace(
        /<div class="logo-placeholder"[^>]*>.*?<\/div>/gi,
        logoHtml
      );
    }
    
    // 2. 替换二维码占位符
    if (designAssets.qrCodes && designAssets.qrCodes.length > 0) {
      const qrCodeHtml = `
        <div style="text-align: center; margin: 16px;">
          <img src="${designAssets.qrCodes[0].url}" alt="二维码" style="width: 140px; height: 140px; object-fit: contain; border-radius: 8px;">
          <div style="font-size: 14px; color: #666; margin-top: 8px; font-weight: bold;">扫码参与活动</div>
        </div>
      `;
      processedHtml = processedHtml.replace(
        /<div class="qrcode-placeholder"[^>]*>.*?<\/div>/gi,
        qrCodeHtml
      );
    }
    
    // 3. 应用品牌色彩
    if (designAssets.brandColors && designAssets.brandColors.length > 0) {
      const primaryColor = designAssets.brandColors[0];
      const secondaryColor = designAssets.brandColors[1] || primaryColor;
      
      // 替换常用的颜色值
      processedHtml = processedHtml.replace(/#1890ff/gi, primaryColor);
      processedHtml = processedHtml.replace(/#52c41a/gi, secondaryColor);
      processedHtml = processedHtml.replace(/#b01c02/gi, primaryColor);
      
      // 为有brand-title类的元素应用主色
      processedHtml = processedHtml.replace(
        /class="brand-title"/gi,
        `class="brand-title" style="color: ${primaryColor};"`
      );
    }
    
    // 4. 应用品牌字体
    if (designAssets.brandFonts && designAssets.brandFonts.length > 0) {
      const fontName = designAssets.brandFonts[0].name;
      const fontUrl = designAssets.brandFonts[0].url;
      
      // 添加字体定义到style标签中
      const fontFaceRule = `
        @font-face {
          font-family: '${fontName}';
          src: url('${fontUrl}') format('truetype');
        }
      `;
      
      // 如果有style标签，添加字体定义
      if (processedHtml.includes('<style>')) {
        processedHtml = processedHtml.replace(
          '<style>',
          `<style>${fontFaceRule}`
        );
      } else {
        // 如果没有style标签，添加一个
        processedHtml = processedHtml.replace(
          '<head>',
          `<head><style>${fontFaceRule}</style>`
        );
      }
      
      // 为有brand-title和brand-text类的元素应用字体
      processedHtml = processedHtml.replace(
        /class="brand-title"/gi,
        `class="brand-title" style="font-family: '${fontName}', sans-serif;"`
      );
      processedHtml = processedHtml.replace(
        /class="brand-text"/gi,
        `class="brand-text" style="font-family: '${fontName}', sans-serif;"`
      );
    }
    
    console.log('✅ HTML后处理完成');
    return processedHtml;
    
  } catch (error) {
    console.error('❌ HTML后处理失败:', error);
    return htmlContent; // 如果处理失败，返回原始HTML
  }
}

// API密钥管理函数
export function setApiKey(apiKey: string): boolean {
  if (!validateApiKey(apiKey)) {
    return false;
  }
  localStorage.setItem('deepseek_api_key', apiKey);
  return true;
}

export function getApiKey(): string {
  return localStorage.getItem('deepseek_api_key') || '';
}

export function hasValidApiKey(): boolean {
  const apiKey = getApiKey();
  return validateApiKey(apiKey);
}

export function removeApiKey(): void {
  localStorage.removeItem('deepseek_api_key');
} 