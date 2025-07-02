import type { PosterElement } from '../types';

export interface ParsedHtmlResult {
  elements: PosterElement[];
  canvasStyle: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
  };
  metadata: {
    totalElements: number;
    hasImages: boolean;
    hasText: boolean;
    estimatedComplexity: 'simple' | 'medium' | 'complex';
  };
}

// HTML解析器主函数
export function parseHtmlToPosterElements(htmlCode: string, posterType?: 'general' | 'wechat' | 'invitation'): ParsedHtmlResult {
  console.log('🔧 开始解析HTML，海报类型:', posterType);
  console.log('📝 HTML内容长度:', htmlCode.length);
  
  // 创建临时DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlCode, 'text/html');
  
  const elements: PosterElement[] = [];
  
  // 根据海报类型设置默认尺寸
  let defaultDimensions = { width: 800, height: 1200 };
  if (posterType === 'wechat') {
    defaultDimensions = { width: 900, height: 383 };
  } else if (posterType === 'invitation') {
    defaultDimensions = { width: 800, height: 1200 };
  }
  
  let canvasWidth = defaultDimensions.width;
  let canvasHeight = defaultDimensions.height;
  let backgroundColor = '#ffffff';
  let backgroundImage = '';

  console.log('📐 默认画布尺寸:', `${canvasWidth}×${canvasHeight}`);

  // 检查是否为DeepSeek生成的HTML结构
  const posterContainer = doc.querySelector('.poster');
  if (posterContainer) {
    console.log('🎯 检测到DeepSeek HTML结构，使用专门解析器');
    return parseDeepSeekHtml(doc, posterType);
  }

  // 检测画布尺寸和背景
  const canvasInfo = extractCanvasInfo(doc, posterType);
  if (canvasInfo) {
    canvasWidth = canvasInfo.width;
    canvasHeight = canvasInfo.height;
    backgroundColor = canvasInfo.backgroundColor;
    backgroundImage = canvasInfo.backgroundImage;
    console.log('✅ 从HTML中提取到画布信息:', `${canvasWidth}×${canvasHeight}`, backgroundColor);
  } else {
    console.log('⚠️ 未能从HTML中提取画布信息，使用默认尺寸');
  }

  // 解析所有可见元素
  const bodyElement = doc.body || doc.documentElement;
  if (bodyElement) {
    console.log('🔍 开始遍历DOM元素...');
    traverseAndExtractElements(bodyElement, elements, canvasWidth, canvasHeight);
    console.log(`📦 解析完成，共提取到 ${elements.length} 个元素`);
  }

  // 计算元数据
  const metadata = calculateMetadata(elements);

  // 验证尺寸是否符合预期
  if (posterType) {
    const expectedDimensions = {
      general: { width: 800, height: 1200 },
      wechat: { width: 900, height: 383 },
      invitation: { width: 800, height: 1200 }
    };
    const expected = expectedDimensions[posterType];
    if (Math.abs(canvasWidth - expected.width) > 50 || Math.abs(canvasHeight - expected.height) > 50) {
      console.warn(`⚠️ 画布尺寸可能不符合预期: 实际 ${canvasWidth}×${canvasHeight}, 预期 ${expected.width}×${expected.height}`);
    }
  }

  return {
    elements,
    canvasStyle: {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor,
      backgroundImage
    },
    metadata
  };
}

// 专门解析DeepSeek HTML结构的函数
function parseDeepSeekHtml(doc: Document, _posterType?: 'general' | 'wechat' | 'invitation'): ParsedHtmlResult {
  console.log('🤖 开始解析DeepSeek HTML结构');
  
  const elements: PosterElement[] = [];
  const posterContainer = doc.querySelector('.poster');
  
  if (!posterContainer) {
    console.error('❌ 未找到.poster容器');
    return {
      elements: [],
      canvasStyle: { width: 870, height: 870, backgroundColor: '#ffffff' },
      metadata: { totalElements: 0, hasImages: false, hasText: false, estimatedComplexity: 'simple' }
    };
  }

  // 提取CSS样式规则
  const cssRules = extractCssRules(doc);
  console.log('📋 提取到CSS规则数量:', Object.keys(cssRules).length);

  // 从.poster样式中提取画布信息
  const posterStyle = cssRules['.poster'] || {};
  const canvasWidth = extractPixelValue(posterStyle.width) || 800;
  const canvasHeight = extractPixelValue(posterStyle.height) || 1200;
  const backgroundColor = posterStyle.background || posterStyle.backgroundColor || '#ffffff';
  
  console.log('📐 画布尺寸:', `${canvasWidth}×${canvasHeight}`);
  console.log('🎨 背景样式:', backgroundColor);

  // 遍历.poster的直接子元素
  const childElements = posterContainer.children;
  console.log('🔍 找到子元素数量:', childElements.length);

  for (let i = 0; i < childElements.length; i++) {
    const element = childElements[i];
    const className = element.className;
    
    if (!className) continue;
    
    console.log(`📦 处理元素: .${className}`);
    
    // 获取对应的CSS样式
    const elementStyle = cssRules[`.${className}`] || {};
    const textContent = element.textContent?.trim() || '';
    
    if (!textContent) {
      console.log(`⚠️ 跳过空内容元素: .${className}`);
      continue;
    }

    // 创建PosterElement
    const posterElement: PosterElement = {
      id: `deepseek_${className}_${Date.now()}_${i}`,
      type: 'text', // DeepSeek主要生成文本元素
      content: textContent,
      x: extractPixelValue(elementStyle.left) || 0,
      y: extractPixelValue(elementStyle.top) || 0,
      width: extractPixelValue(elementStyle.width) || 200,
      height: calculateTextHeight(elementStyle.fontSize, textContent),
      fontSize: extractPixelValue(elementStyle.fontSize) || 16,
      fontFamily: elementStyle.fontFamily || 'Arial, sans-serif',
      color: elementStyle.color || '#000000',
      fontWeight: elementStyle.fontWeight === 'bold' || parseInt(elementStyle.fontWeight) > 500 ? 'bold' : 'normal',
      // 额外属性
      backgroundColor: elementStyle.background || elementStyle.backgroundColor || 'transparent',
      opacity: parseFloat(elementStyle.opacity) || 1,
      textShadow: elementStyle.textShadow || '',
      borderRadius: extractPixelValue(elementStyle.borderRadius) || 0,
      padding: extractPixelValue(elementStyle.padding) || 0,
    };

    elements.push(posterElement);
    console.log(`✅ 成功解析元素: ${className} (${textContent.substring(0, 20)}...)`);
  }

  console.log(`🎉 DeepSeek HTML解析完成，共生成 ${elements.length} 个元素`);

  return {
    elements,
    canvasStyle: {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor,
      backgroundImage: ''
    },
    metadata: calculateMetadata(elements)
  };
}

// 从文档中提取CSS规则
function extractCssRules(doc: Document): Record<string, Record<string, string>> {
  const cssRules: Record<string, Record<string, string>> = {};
  
  const styleElements = doc.querySelectorAll('style');
  
  for (const styleEl of styleElements) {
    const cssText = styleEl.textContent || '';
    
    // 简单的CSS解析，匹配 .class { property: value; } 格式
    const ruleMatches = cssText.match(/\.[\w-]+\s*\{[^}]*\}/g);
    
    if (ruleMatches) {
      for (const ruleText of ruleMatches) {
        const selectorMatch = ruleText.match(/\.([\w-]+)\s*\{/);
        const selector = selectorMatch ? `.${selectorMatch[1]}` : '';
        
        if (selector) {
          const propertiesText = ruleText.match(/\{([^}]*)\}/)?.[1] || '';
          const properties: Record<string, string> = {};
          
          // 解析属性
          const propertyMatches = propertiesText.match(/[\w-]+\s*:[^;]+/g);
          if (propertyMatches) {
            for (const propText of propertyMatches) {
              const [key, value] = propText.split(':').map(s => s.trim());
              if (key && value) {
                properties[key] = value;
              }
            }
          }
          
          cssRules[selector] = properties;
        }
      }
    }
  }
  
  return cssRules;
}

// 计算文本高度
function calculateTextHeight(fontSize: string | undefined, text: string): number {
  const size = extractPixelValue(fontSize || '16px') || 16;
  const lines = Math.ceil(text.length / 30); // 简单估算行数
  return size * 1.5 * lines;
}

// 提取画布信息
function extractCanvasInfo(doc: Document, _posterType?: 'general' | 'wechat' | 'invitation') {
  // 查找主容器元素
  const possibleContainers = [
    doc.querySelector('[style*="width"]'),
    doc.querySelector('.poster-container'),
    doc.querySelector('.poster'),
    doc.querySelector('.container'),
    doc.body
  ].filter(Boolean);

  for (const container of possibleContainers) {
    if (container) {
      const styles = getComputedStyleFromString((container as Element).getAttribute('style') || '');
      
      const width = extractPixelValue(styles.width) || extractPixelValue(styles.maxWidth);
      const height = extractPixelValue(styles.height) || extractPixelValue(styles.maxHeight);
      
      if (width && height && width > 200 && height > 200) {
        return {
          width,
          height,
          backgroundColor: styles.backgroundColor || styles.background || '#ffffff',
          backgroundImage: extractBackgroundImage(styles.backgroundImage || styles.background || '')
        };
      }
    }
  }

  // 如果没找到，尝试从CSS中提取
  const styleElements = doc.querySelectorAll('style');
  for (const styleEl of styleElements) {
    const cssText = styleEl.textContent || '';
    const sizeMatch = cssText.match(/width:\s*(\d+)px.*height:\s*(\d+)px/);
    if (sizeMatch) {
      return {
        width: parseInt(sizeMatch[1]),
        height: parseInt(sizeMatch[2]),
        backgroundColor: extractBackgroundFromCSS(cssText),
        backgroundImage: ''
      };
    }
  }

  return null;
}

// 遍历并提取元素
function traverseAndExtractElements(
  element: Element, 
  elements: PosterElement[], 
  canvasWidth: number, 
  canvasHeight: number,
  parentOffset = { x: 0, y: 0 }
) {
  // 跳过不可见或脚本元素
  if (!element || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
    return;
  }

  const styles = getComputedStyleFromElement(element);
  const position = extractPositionInfo(element, styles, parentOffset);

  // 处理文本内容
  if (hasSignificantTextContent(element)) {
    const textElement = createTextElement(element, styles, position, canvasWidth, canvasHeight);
    if (textElement) {
      elements.push(textElement);
    }
  }

  // 处理图片
  if (element.tagName === 'IMG') {
    const imageElement = createImageElement(element as HTMLImageElement, styles, position);
    if (imageElement) {
      elements.push(imageElement);
    }
  }

  // 处理背景图片
  if (styles.backgroundImage && styles.backgroundImage !== 'none') {
    const bgImageElement = createBackgroundImageElement(element, styles, position);
    if (bgImageElement) {
      elements.push(bgImageElement);
    }
  }

  // 递归处理子元素
  const newParentOffset = {
    x: parentOffset.x + (position.x || 0),
    y: parentOffset.y + (position.y || 0)
  };

  Array.from(element.children).forEach(child => {
    traverseAndExtractElements(child, elements, canvasWidth, canvasHeight, newParentOffset);
  });
}

// 创建文本元素
function createTextElement(
  element: Element, 
  styles: CSSStyleDeclaration | any, 
  position: any, 
  canvasWidth: number, 
  canvasHeight: number
): PosterElement | null {
  const textContent = getCleanTextContent(element);
  if (!textContent || textContent.length < 2) return null;

  const fontSize = extractPixelValue(styles.fontSize) || 16;
  const fontFamily = styles.fontFamily || 'Arial, sans-serif';
  const color = styles.color || '#000000';
  const fontWeight = styles.fontWeight === 'bold' || parseInt(styles.fontWeight) > 500 ? 'bold' : 'normal';

  // 估算文本尺寸
  const estimatedWidth = Math.min(textContent.length * fontSize * 0.6, canvasWidth * 0.8);
  const estimatedHeight = fontSize * 1.5;

  return {
    id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    content: textContent,
    x: Math.max(0, Math.min(position.x || 0, canvasWidth - estimatedWidth)),
    y: Math.max(0, Math.min(position.y || 0, canvasHeight - estimatedHeight)),
    width: estimatedWidth,
    height: estimatedHeight,
    fontSize,
    fontFamily,
    color,
    fontWeight
  };
}

// 创建图片元素
function createImageElement(
  img: HTMLImageElement, 
  styles: CSSStyleDeclaration | any, 
  position: any
): PosterElement | null {
  const src = img.src || img.getAttribute('src');
  if (!src) return null;

  const width = extractPixelValue(styles.width) || img.width || 100;
  const height = extractPixelValue(styles.height) || img.height || 100;

  return {
    id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'image',
    content: src,
    x: position.x || 0,
    y: position.y || 0,
    width,
    height,
    fontSize: 0,
    fontFamily: 'Arial',
    color: '#000000',
    fontWeight: 'normal'
  };
}

// 创建背景图片元素
function createBackgroundImageElement(
  _element: Element, 
  styles: CSSStyleDeclaration | any, 
  position: any
): PosterElement | null {
  const bgImage = extractBackgroundImage(styles.backgroundImage);
  if (!bgImage) return null;

  const width = extractPixelValue(styles.width) || 100;
  const height = extractPixelValue(styles.height) || 100;

  return {
    id: `bg_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'image',
    content: bgImage,
    x: position.x || 0,
    y: position.y || 0,
    width,
    height,
    fontSize: 0,
    fontFamily: 'Arial',
    color: '#000000',
    fontWeight: 'normal'
  };
}

// 辅助函数：从字符串解析样式
function getComputedStyleFromString(styleString: string): any {
  const styles: any = {};
  styleString.split(';').forEach(rule => {
    const [property, value] = rule.split(':').map(s => s.trim());
    if (property && value) {
      styles[property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    }
  });
  return styles;
}

// 辅助函数：从元素获取样式
function getComputedStyleFromElement(element: Element): any {
  const styleAttr = element.getAttribute('style') || '';
  return getComputedStyleFromString(styleAttr);
}

// 提取位置信息
function extractPositionInfo(_element: Element, styles: any, parentOffset: { x: number, y: number }) {
  const left = extractPixelValue(styles.left) || 0;
  const top = extractPixelValue(styles.top) || 0;
  const marginLeft = extractPixelValue(styles.marginLeft) || 0;
  const marginTop = extractPixelValue(styles.marginTop) || 0;

  return {
    x: parentOffset.x + left + marginLeft,
    y: parentOffset.y + top + marginTop
  };
}

// 提取像素值
function extractPixelValue(value: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)px/);
  return match ? parseFloat(match[1]) : null;
}

// 检查是否有重要文本内容
function hasSignificantTextContent(element: Element): boolean {
  const text = getCleanTextContent(element);
  return text.length > 1 && !/^\s*$/.test(text);
}

// 获取清理后的文本内容
function getCleanTextContent(element: Element): string {
  // 获取直接文本内容，不包括子元素
  let text = '';
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    }
  }
  return text.trim().replace(/\s+/g, ' ');
}

// 提取背景图片URL
function extractBackgroundImage(bgValue: string): string {
  if (!bgValue || bgValue === 'none') return '';
  const match = bgValue.match(/url\(['"]?([^'"]+)['"]?\)/);
  return match ? match[1] : '';
}

// 从CSS中提取背景色
function extractBackgroundFromCSS(cssText: string): string {
  const match = cssText.match(/background(?:-color)?:\s*([^;]+)/);
  return match ? match[1].trim() : '#ffffff';
}

// 计算元数据
function calculateMetadata(elements: PosterElement[]) {
  const hasImages = elements.some(el => el.type === 'image');
  const hasText = elements.some(el => el.type === 'text');
  const totalElements = elements.length;

  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  if (totalElements > 10) complexity = 'complex';
  else if (totalElements > 5) complexity = 'medium';

  return {
    totalElements,
    hasImages,
    hasText,
    estimatedComplexity: complexity
  };
}

// 验证解析结果
export function validateParsedElements(elements: PosterElement[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  elements.forEach((element, index) => {
    // 检查必需字段
    if (!element.id) errors.push(`元素 ${index + 1} 缺少ID`);
    if (!element.type) errors.push(`元素 ${index + 1} 缺少类型`);
    if (element.x < 0 || element.y < 0) warnings.push(`元素 ${index + 1} 位置可能超出画布`);
    if (element.width <= 0 || element.height <= 0) errors.push(`元素 ${index + 1} 尺寸无效`);

    // 检查文本元素
    if (element.type === 'text' && !element.content) {
      errors.push(`文本元素 ${index + 1} 内容为空`);
    }

    // 检查图片元素
    if (element.type === 'image' && !element.content) {
      errors.push(`图片元素 ${index + 1} 缺少源地址`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
} 