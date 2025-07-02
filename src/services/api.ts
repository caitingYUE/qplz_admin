// API 服务层 - 支持本地存储和远程API两种模式

export type ApiMode = 'local' | 'remote';

// API配置
interface ApiConfig {
  mode: ApiMode;
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

// 默认配置
const defaultConfig: ApiConfig = {
  mode: (import.meta.env.VITE_API_MODE as ApiMode) || 'local',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.yourdomain.com',
  timeout: 10000
};

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
  }

  // 配置API模式
  setMode(mode: ApiMode) {
    this.config.mode = mode;
    localStorage.setItem('apiMode', mode);
    console.log(`🔄 API模式切换为: ${mode}`);
  }

  // 获取当前模式
  getMode(): ApiMode {
    return this.config.mode;
  }

  // 检查是否为远程模式
  isRemoteMode(): boolean {
    return this.config.mode === 'remote';
  }

  // 统一的请求方法
  private async request<T>(
    endpoint: string, 
    options: RequestInit & { useLocal?: boolean } = {}
  ): Promise<T> {
    const { useLocal = this.config.mode === 'local', ...fetchOptions } = options;

    if (useLocal) {
      // 本地存储模式 - 保持当前逻辑
      return this.handleLocalRequest<T>(endpoint, fetchOptions);
    } else {
      // 远程API模式
      return this.handleRemoteRequest<T>(endpoint, fetchOptions);
    }
  }

  // 本地存储处理
  private async handleLocalRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    const method = options.method || 'GET';
    const parts = endpoint.split('/').filter(p => p);
    const resource = parts[1]; // 如 '/api/events' -> 'events'
    const id = parts[2]; // 如 '/api/events/123' -> '123'

    switch (method.toUpperCase()) {
      case 'GET':
        return this.getFromLocalStorage<T>(resource, id);
      case 'POST':
        return this.saveToLocalStorage<T>(resource, options.body);
      case 'PUT':
        return this.updateLocalStorage<T>(resource, id, options.body);
      case 'DELETE':
        return this.deleteFromLocalStorage<T>(resource, id);
      default:
        throw new Error(`不支持的方法: ${method}`);
    }
  }

  // 远程API处理
  private async handleRemoteRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // 本地存储CRUD操作
  private getFromLocalStorage<T>(resource: string, id?: string): T {
    const items = JSON.parse(localStorage.getItem(resource) || '[]');
    
    if (id) {
      const item = items.find((item: any) => item.id === id);
      if (!item) throw new Error('资源未找到');
      return { success: true, data: item } as T;
    } else {
      return { success: true, data: items } as T;
    }
  }

  private saveToLocalStorage<T>(resource: string, body: any): T {
    const data = JSON.parse(body || '{}');
    const items = JSON.parse(localStorage.getItem(resource) || '[]');
    const newItem = { 
      ...data, 
      id: data.id || Date.now().toString(), 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(resource, JSON.stringify(items));
    return { success: true, data: newItem } as T;
  }

  private updateLocalStorage<T>(resource: string, id: string, body: any): T {
    const data = JSON.parse(body || '{}');
    const items = JSON.parse(localStorage.getItem(resource) || '[]');
    const index = items.findIndex((item: any) => item.id === id);
    if (index === -1) throw new Error('资源未找到');
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(resource, JSON.stringify(items));
    return { success: true, data: items[index] } as T;
  }

  private deleteFromLocalStorage<T>(resource: string, id: string): T {
    const items = JSON.parse(localStorage.getItem(resource) || '[]');
    const filteredItems = items.filter((item: any) => item.id !== id);
    localStorage.setItem(resource, JSON.stringify(filteredItems));
    return { success: true, data: { id } } as T;
  }

  // 事件相关API
  async getEvents() {
    return this.request('/api/events');
  }

  async getEvent(id: string) {
    return this.request(`/api/events/${id}`);
  }

  async createEvent(data: any) {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateEvent(id: string, data: any) {
    return this.request(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/api/events/${id}`, {
      method: 'DELETE'
    });
  }

  // 小程序集成相关API
  async syncToMiniProgram(eventId: string) {
    if (!this.isRemoteMode()) {
      return { success: false, message: '需要连接服务器才能同步到小程序' };
    }
    
    return this.request('/api/miniprogram/sync', {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
  }

  // 获取小程序二维码
  async getMiniProgramQR(eventId: string, scene?: string) {
    if (!this.isRemoteMode()) {
      return { success: false, message: '需要连接服务器才能生成小程序二维码' };
    }

    return this.request('/api/miniprogram/qrcode', {
      method: 'POST',
      body: JSON.stringify({ 
        eventId, 
        scene: scene || `eventId=${eventId}`,
        page: 'pages/event/detail'
      })
    });
  }

  // 数据迁移API
  async migrateLocalDataToServer() {
    if (this.isRemoteMode()) {
      return { success: true, message: '已经是远程模式，无需迁移' };
    }

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    
    // 收集聊天历史中的海报数据
    const posterData: any = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chatHistory_')) {
        const eventId = key.replace('chatHistory_', '');
        const chatHistory = JSON.parse(localStorage.getItem(key) || '[]');
        const postersInChat = chatHistory.filter((msg: any) => msg.posterHtml);
        if (postersInChat.length > 0) {
          posterData[eventId] = postersInChat;
        }
      }
    });

    return this.request('/api/migrate', {
      method: 'POST',
      body: JSON.stringify({ events, registrations, posters: posterData }),
      useLocal: false // 强制使用远程API
    });
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient();

// 模式切换工具
export const ApiModeManager = {
  // 切换到远程模式
  switchToRemote(baseUrl: string, apiKey?: string) {
    apiClient.setMode('remote');
    // 这里可以更新配置
    console.log('已切换到远程API模式');
  },

  // 切换到本地模式  
  switchToLocal() {
    apiClient.setMode('local');
    console.log('已切换到本地存储模式');
  },

  // 获取当前模式
  getCurrentMode() {
    return apiClient.getMode();
  },

  // 检查是否支持小程序功能
  supportsMiniProgram() {
    return apiClient.isRemoteMode();
  }
};

// 导出便捷方法
export const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  syncToMiniProgram,
  getMiniProgramQR,
  migrateLocalDataToServer
} = apiClient; 