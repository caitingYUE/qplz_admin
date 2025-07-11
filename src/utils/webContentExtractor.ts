// 网页内容提取工具
export class WebContentExtractor {
  
  // 支持的平台域名配置
  private static supportedDomains = {
    xiaohongshu: ['xiaohongshu.com', 'xhslink.com'],
    wechat: ['mp.weixin.qq.com'],
    zhihu: ['zhuanlan.zhihu.com', 'zhihu.com'],
    weibo: ['weibo.com', 'm.weibo.cn'],
    douyin: ['douyin.com'],
    bilibili: ['bilibili.com']
  };

  // 检查URL是否为支持的平台
  static isSupportedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return Object.values(this.supportedDomains).some(domains =>
        domains.some(domain => hostname.includes(domain))
      );
    } catch {
      return false;
    }
  }

  // 识别平台类型
  static identifyPlatform(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      for (const [platform, domains] of Object.entries(this.supportedDomains)) {
        if (domains.some(domain => hostname.includes(domain))) {
          return platform;
        }
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // 使用代理服务抓取网页内容
  static async extractContentFromUrl(url: string): Promise<{
    title: string;
    content: string;
    platform: string;
    success: boolean;
    error?: string;
  }> {
    try {
      // 验证URL格式
      if (!this.isSupportedUrl(url)) {
        return {
          title: '',
          content: '',
          platform: 'unknown',
          success: false,
          error: '不支持的网站链接。目前支持小红书、微信公众号、知乎、微博等平台'
        };
      }

      const platform = this.identifyPlatform(url);
      
      // 使用CORS代理服务获取内容
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // 解析HTML内容
      const { title, content } = this.parseHtmlContent(html, platform);
      
      return {
        title,
        content,
        platform,
        success: true
      };

    } catch (error) {
      console.error('网页内容抓取失败:', error);
      
      // 提供降级方案
      return {
        title: '',
        content: '',
        platform: this.identifyPlatform(url),
        success: false,
        error: '网页内容抓取失败。请尝试手动复制文章内容，或检查链接是否可访问'
      };
    }
  }

  // 解析HTML内容
  private static parseHtmlContent(html: string, platform: string): {
    title: string;
    content: string;
  } {
    // 创建临时DOM解析器
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    let title = '';
    let content = '';

    try {
      // 根据平台特性提取内容
      switch (platform) {
        case 'xiaohongshu':
          title = this.extractXiaohongshuTitle(doc);
          content = this.extractXiaohongshuContent(doc);
          break;
        case 'wechat':
          title = this.extractWechatTitle(doc);
          content = this.extractWechatContent(doc);
          break;
        case 'zhihu':
          title = this.extractZhihuTitle(doc);
          content = this.extractZhihuContent(doc);
          break;
        default:
          title = this.extractGenericTitle(doc);
          content = this.extractGenericContent(doc);
      }

      // 清理内容
      content = this.cleanContent(content);
      
    } catch (error) {
      console.error('HTML解析失败:', error);
      // 降级到通用解析
      title = this.extractGenericTitle(doc);
      content = this.extractGenericContent(doc);
    }

    return { title, content };
  }

  // 小红书内容提取
  private static extractXiaohongshuTitle(doc: Document): string {
    const selectors = [
      'h1.title',
      '.note-title',
      '[data-testid="note-title"]',
      'title'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  private static extractXiaohongshuContent(doc: Document): string {
    const selectors = [
      '.note-content',
      '.note-text',
      '[data-testid="note-content"]',
      '.content',
      'article'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  // 微信公众号内容提取
  private static extractWechatTitle(doc: Document): string {
    const selectors = [
      '#activity-name',
      '.rich_media_title',
      'h1',
      'title'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  private static extractWechatContent(doc: Document): string {
    const selectors = [
      '#js_content',
      '.rich_media_content',
      '.content',
      'article'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  // 知乎内容提取
  private static extractZhihuTitle(doc: Document): string {
    const selectors = [
      '.Post-Title',
      '.QuestionHeader-title',
      'h1',
      'title'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  private static extractZhihuContent(doc: Document): string {
    const selectors = [
      '.Post-RichText',
      '.QuestionAnswer-content',
      '.RichText',
      'article'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  // 通用内容提取
  private static extractGenericTitle(doc: Document): string {
    const title = doc.querySelector('title')?.textContent?.trim() || 
                 doc.querySelector('h1')?.textContent?.trim() || '';
    return title;
  }

  private static extractGenericContent(doc: Document): string {
    // 尝试多种常见的内容选择器
    const selectors = [
      'article',
      '.content',
      '.post-content',
      '.article-content',
      'main',
      '.main-content'
    ];
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    // 如果都没找到，提取body中的文本
    const body = doc.querySelector('body');
    return body?.textContent?.trim() || '';
  }

  // 清理内容文本
  private static cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // 压缩空白字符
      .replace(/[\r\n]+/g, '\n') // 规范换行
      .replace(/\n\s*\n/g, '\n\n') // 清理多余换行
      .trim();
  }

  // 获取平台名称
  static getPlatformName(platform: string): string {
    const platformNames: Record<string, string> = {
      xiaohongshu: '小红书',
      wechat: '微信公众号',
      zhihu: '知乎',
      weibo: '微博',
      douyin: '抖音',
      bilibili: '哔哩哔哩'
    };
    
    return platformNames[platform] || '未知平台';
  }

  // 验证URL格式
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
} 