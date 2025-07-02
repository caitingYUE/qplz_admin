// API 抽象层 - 支持本地存储和远程API两种模式

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
    console.log(`🔄 API模式切换为: ${mode}`);
  }

  // 获取当前模式
  getMode(): ApiMode {
    return this.config.mode;
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
    const resource = endpoint.split('/')[1]; // 如 '/api/events' -> 'events'

    switch (method.toUpperCase()) {
      case 'GET':
        return this.getFromLocalStorage<T>(resource, endpoint);
      case 'POST':
        return this.saveToLocalStorage<T>(resource, options.body);
      case 'PUT':
        return this.updateLocalStorage<T>(resource, endpoint, options.body);
      case 'DELETE':
        return this.deleteFromLocalStorage<T>(resource, endpoint);
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
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // 本地存储CRUD操作
  private getFromLocalStorage<T>(resource: string, endpoint: string): T {
    if (endpoint.includes('/')) {
      const id = endpoint.split('/').pop();
      const items = JSON.parse(localStorage.getItem(resource) || '[]');
      const item = items.find((item: any) => item.id === id);
      if (!item) throw new Error('资源未找到');
      return { success: true, data: item } as T;
    } else {
      const items = JSON.parse(localStorage.getItem(resource) || '[]');
      return { success: true, data: items } as T;
    }
  }

  private saveToLocalStorage<T>(resource: string, body: any): T {
    const data = JSON.parse(body);
    const items = JSON.parse(localStorage.getItem(resource) || '[]');
    const newItem = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    items.push(newItem);
    localStorage.setItem(resource, JSON.stringify(items));
    return { success: true, data: newItem } as T;
  }

  private updateLocalStorage<T>(resource: string, endpoint: string, body: any): T {
    const id = endpoint.split('/').pop();
    const data = JSON.parse(body);
    const items = JSON.parse(localStorage.getItem(resource) || '[]');
    const index = items.findIndex((item: any) => item.id === id);
    if (index === -1) throw new Error('资源未找到');
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(resource, JSON.stringify(items));
    return { success: true, data: items[index] } as T;
  }

  private deleteFromLocalStorage<T>(resource: string, endpoint: string): T {
    const id = endpoint.split('/').pop();
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

  // 报名相关API
  async getRegistrations() {
    return this.request('/api/registrations');
  }

  async createRegistration(data: any) {
    return this.request('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 海报相关API
  async savePoster(eventId: string, posterData: any) {
    return this.request('/api/posters', {
      method: 'POST',
      body: JSON.stringify({ eventId, ...posterData })
    });
  }

  async getPoster(eventId: string) {
    return this.request(`/api/posters/${eventId}`);
  }

  // 小程序同步API
  async syncToMiniProgram(eventId: string) {
    if (this.config.mode === 'local') {
      console.warn('本地模式不支持小程序同步');
      return { success: false, message: '需要连接服务器才能同步到小程序' };
    }
    
    return this.request('/api/miniprogram/sync', {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
  }

  // 获取小程序二维码
  async getMiniProgramQR(eventId: string, page: string = 'pages/event/detail') {
    if (this.config.mode === 'local') {
      console.warn('本地模式不支持小程序二维码生成');
      return { success: false, message: '需要连接服务器才能生成小程序二维码' };
    }

    return this.request('/api/miniprogram/qrcode', {
      method: 'POST',
      body: JSON.stringify({ eventId, page })
    });
  }

  // 数据迁移API
  async migrateLocalDataToServer() {
    if (this.config.mode === 'remote') {
      console.warn('已经是远程模式，无需迁移');
      return { success: true, message: '无需迁移' };
    }

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const posters = JSON.parse(localStorage.getItem('chatHistory') || '{}');

    return this.request('/api/migrate', {
      method: 'POST',
      body: JSON.stringify({ events, registrations, posters }),
      useLocal: false // 强制使用远程API
    });
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient();

// 导出便捷方法
export const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrations,
  createRegistration,
  savePoster,
  getPoster,
  syncToMiniProgram,
  getMiniProgramQR,
  migrateLocalDataToServer
} = apiClient; 