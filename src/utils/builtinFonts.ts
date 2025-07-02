// 内置字体配置
export interface BuiltinFont {
  id: string;
  name: string;
  displayName: string;
  family: string;
  category: 'brand' | 'system' | 'web' | 'decorative';
  description?: string;
  cssUrl?: string; // 用于网络字体
  localPath?: string; // 用于本地字体文件
}

// 我们的品牌字体
export const brandFonts: BuiltinFont[] = [
  {
    id: 'zaozi-langsong',
    name: '造字工房朗宋常规体',
    displayName: '造字工房朗宋',
    family: 'ZaoziLangsong',
    category: 'brand',
    description: '优雅的宋体，适合标题和正文',
    localPath: '/src/fonts/造字工房朗宋常规体.ttf'
  },
  {
    id: 'huiwen-mingchao',
    name: '汇文明朝体',
    displayName: '汇文明朝',
    family: 'HuiwenMingchao',
    category: 'brand',
    description: '传统明朝体，适合正式场合',
    localPath: '/src/fonts/汇文明朝体.otf'
  }
];

// 系统默认字体
export const systemFonts: BuiltinFont[] = [
  {
    id: 'system-ui',
    name: '系统默认',
    displayName: '系统默认',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    category: 'system',
    description: '使用系统默认字体，兼容性最佳'
  },
  {
    id: 'pingfang-sc',
    name: 'PingFang SC',
    displayName: '苹方-简',
    family: 'PingFang SC, Microsoft YaHei, sans-serif',
    category: 'system',
    description: '苹果系统中文字体'
  },
  {
    id: 'microsoft-yahei',
    name: 'Microsoft YaHei',
    displayName: '微软雅黑',
    family: 'Microsoft YaHei, PingFang SC, sans-serif',
    category: 'system',
    description: 'Windows系统中文字体'
  },
  {
    id: 'songti-sc',
    name: 'Songti SC',
    displayName: '宋体-简',
    family: 'Songti SC, SimSun, serif',
    category: 'system',
    description: '系统宋体，适合正文阅读'
  }
];

// 网络字体 (Google Fonts 等)
export const webFonts: BuiltinFont[] = [
  {
    id: 'noto-sans-sc',
    name: 'Noto Sans SC',
    displayName: 'Noto Sans 简体中文',
    family: 'Noto Sans SC, sans-serif',
    category: 'web',
    description: 'Google开源中文字体，现代简洁',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap'
  },
  {
    id: 'noto-serif-sc',
    name: 'Noto Serif SC',
    displayName: 'Noto Serif 简体中文',
    family: 'Noto Serif SC, serif',
    category: 'web',
    description: 'Google开源中文衬线字体，优雅传统',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;700&display=swap'
  },
  {
    id: 'source-han-sans',
    name: 'Source Han Sans',
    displayName: '思源黑体',
    family: 'Source Han Sans SC, sans-serif',
    category: 'web',
    description: 'Adobe开源中文字体，专业设计',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Source+Han+Sans:wght@300;400;500;700&display=swap'
  }
];

// 装饰性字体
export const decorativeFonts: BuiltinFont[] = [
  {
    id: 'cursive',
    name: '手写体',
    displayName: '手写风格',
    family: 'cursive',
    category: 'decorative',
    description: '手写风格字体，适合个性化设计'
  },
  {
    id: 'fantasy',
    name: '装饰体',
    displayName: '装饰风格',
    family: 'fantasy',
    category: 'decorative',
    description: '装饰性字体，适合标题和特殊效果'
  }
];

// 所有内置字体
export const allBuiltinFonts: BuiltinFont[] = [
  ...brandFonts,
  ...systemFonts,
  ...webFonts,
  ...decorativeFonts
];

// 按分类获取字体
export const getFontsByCategory = (category: BuiltinFont['category']) => {
  return allBuiltinFonts.filter(font => font.category === category);
};

// 根据ID获取字体
export const getFontById = (id: string) => {
  return allBuiltinFonts.find(font => font.id === id);
};

// 加载网络字体
export const loadWebFont = (font: BuiltinFont) => {
  if (!font.cssUrl) return;
  
  // 检查是否已经加载
  const existingLink = document.querySelector(`link[href="${font.cssUrl}"]`);
  if (existingLink) return;
  
  // 创建link标签加载字体
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = font.cssUrl;
  document.head.appendChild(link);
};

// 加载本地字体
export const loadLocalFont = (font: BuiltinFont) => {
  if (!font.localPath) return;
  
  // 检查是否已经定义
  const existingStyle = document.querySelector(`style[data-font-id="${font.id}"]`);
  if (existingStyle) return;
  
  // 创建@font-face样式
  const style = document.createElement('style');
  style.setAttribute('data-font-id', font.id);
  style.textContent = `
    @font-face {
      font-family: '${font.family}';
      src: url('${font.localPath}') format('truetype');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
};

// 加载字体（自动判断类型）
export const loadFont = (font: BuiltinFont) => {
  if (font.cssUrl) {
    loadWebFont(font);
  } else if (font.localPath) {
    loadLocalFont(font);
  }
};

// 获取推荐字体组合
export const getRecommendedFontCombinations = () => [
  {
    name: '经典商务',
    title: brandFonts[0],
    body: systemFonts[1],
    description: '专业大气，适合商务活动'
  },
  {
    name: '现代简约',
    title: webFonts[0],
    body: systemFonts[0],
    description: '现代简洁，适合科技类活动'
  },
  {
    name: '传统文化',
    title: brandFonts[1],
    body: systemFonts[3],
    description: '传统优雅，适合文化类活动'
  }
]; 