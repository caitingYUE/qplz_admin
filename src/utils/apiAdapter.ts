// API适配器 - 支持本地存储和远程API两种模式的无缝切换
import type { Event } from '../types';
import { eventStore } from './eventStore';

export type ApiMode = 'local' | 'remote';

// API响应格式
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API配置
interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

// 默认配置
const defaultConfig: ApiConfig = {
  mode: (import.meta.env.VITE_API_MODE as ApiMode) || 'local',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://your-api-domain.com/api',
  apiKey: import.meta.env.VITE_API_KEY,
  timeout: 10000
};

class ApiAdapter {
  private config: ApiConfig;
  private modeChangeListeners: ((mode: ApiMode) => void)[] = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // 从localStorage恢复API模式设置
    const savedMode = localStorage.getItem('qplz-api-mode') as ApiMode;
    if (savedMode && ['local', 'remote'].includes(savedMode)) {
      this.config.mode = savedMode;
    }
  }

  // 设置API模式
  setMode(mode: ApiMode) {
    const oldMode = this.config.mode;
    this.config.mode = mode;
    localStorage.setItem('qplz-api-mode', mode);
    
    console.log(`🔄 API模式从 ${oldMode} 切换为 ${mode}`);
    
    // 通知监听器
    this.modeChangeListeners.forEach(listener => listener(mode));
  }

  // 获取当前模式
  getMode(): ApiMode {
    return this.config.mode;
  }

  // 监听模式变更
  onModeChange(listener: (mode: ApiMode) => void) {
    this.modeChangeListeners.push(listener);
    return () => {
      this.modeChangeListeners = this.modeChangeListeners.filter(l => l !== listener);
    };
  }

  // 设置服务器配置
  setServerConfig(baseUrl: string, apiKey?: string) {
    this.config.baseUrl = baseUrl;
    this.config.apiKey = apiKey;
    localStorage.setItem('qplz-api-baseurl', baseUrl);
    if (apiKey) {
      localStorage.setItem('qplz-api-key', apiKey);
    }
  }

  // 检查是否支持小程序功能
  supportsMiniProgram(): boolean {
    return this.config.mode === 'remote';
  }

  // 统一的请求方法
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (this.config.mode === 'local') {
      return this.handleLocalRequest<T>(endpoint, options);
    } else {
      return this.handleRemoteRequest<T>(endpoint, options);
    }
  }

  // 本地模式处理
  private async handleLocalRequest<T>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const method = options.method || 'GET';
    const [, resource, id] = endpoint.split('/');

    try {
      switch (resource) {
        case 'events':
          return this.handleEventsLocal<T>(method, id, options.body);
        case 'registrations':
          return this.handleRegistrationsLocal<T>(method, id, options.body);
        case 'posters':
          return this.handlePostersLocal<T>(method, id, options.body);
        case 'miniprogram':
          return this.handleMiniProgramLocal<T>(endpoint);
        default:
          throw new Error(`不支持的资源类型: ${resource}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 远程模式处理
  private async handleRemoteRequest<T>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          'X-Client-Type': 'qplz-admin',
          'X-Client-Version': '1.0.0',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API请求失败'
      };
    }
  }

  // 本地事件处理
  private handleEventsLocal<T>(method: string, id?: string, body?: any): ApiResponse<T> {
    switch (method.toUpperCase()) {
      case 'GET':
        if (id) {
          const event = eventStore.getEventById(id);
          return { success: true, data: event as T };
        } else {
          const events = eventStore.getAllEvents();
          return { success: true, data: events as T };
        }
      case 'POST':
        const eventData = JSON.parse(body || '{}');
        const newEvent = eventStore.createEvent(eventData);
        return { success: true, data: newEvent as T };
      case 'PUT':
        if (!id) throw new Error('缺少事件ID');
        const updateData = JSON.parse(body || '{}');
        const updatedEvent = eventStore.updateEvent(id, updateData);
        if (!updatedEvent) throw new Error('事件不存在');
        return { success: true, data: updatedEvent as T };
      case 'DELETE':
        if (!id) throw new Error('缺少事件ID');
        const deleted = eventStore.deleteEvent(id);
        if (!deleted) throw new Error('事件不存在');
        return { success: true, data: { id } as T };
      default:
        throw new Error(`不支持的方法: ${method}`);
    }
  }

  // 本地报名处理
  private handleRegistrationsLocal<T>(method: string, id?: string, body?: any): ApiResponse<T> {
    const registrations = JSON.parse(localStorage.getItem('qplz-registrations') || '[]');
    
    switch (method.toUpperCase()) {
      case 'GET':
        return { success: true, data: registrations as T };
      case 'POST':
        const regData = JSON.parse(body || '{}');
        const newReg = { ...regData, id: Date.now().toString(), createdAt: new Date().toISOString() };
        registrations.push(newReg);
        localStorage.setItem('qplz-registrations', JSON.stringify(registrations));
        return { success: true, data: newReg as T };
      default:
        throw new Error(`不支持的方法: ${method}`);
    }
  }

  // 本地海报处理
  private handlePostersLocal<T>(method: string, id?: string, body?: any): ApiResponse<T> {
    switch (method.toUpperCase()) {
      case 'GET':
        if (!id) throw new Error('缺少事件ID');
        const posterData = localStorage.getItem(`chatHistory_${id}`);
        return { success: true, data: posterData ? JSON.parse(posterData) : null as T };
      case 'POST':
        const { eventId, ...posterInfo } = JSON.parse(body || '{}');
        if (!eventId) throw new Error('缺少事件ID');
        const existingData = localStorage.getItem(`chatHistory_${eventId}`);
        const history = existingData ? JSON.parse(existingData) : [];
        history.push(posterInfo);
        localStorage.setItem(`chatHistory_${eventId}`, JSON.stringify(history));
        return { success: true, data: posterInfo as T };
      default:
        throw new Error(`不支持的方法: ${method}`);
    }
  }

  // 本地小程序功能处理（模拟）
  private handleMiniProgramLocal<T>(endpoint: string): ApiResponse<T> {
    console.warn('本地模式不支持小程序功能:', endpoint);
    return {
      success: false,
      error: '小程序功能需要连接服务器',
      message: '请切换到远程模式以使用小程序功能'
    };
  }

  // 公共API方法
  
  // 事件相关
  async getEvents(): Promise<ApiResponse<Event[]>> {
    return this.request<Event[]>('/api/events');
  }

  async getEvent(id: string): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/api/events/${id}`);
  }

  async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<ApiResponse<Event>> {
    return this.request<Event>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteEvent(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.request<{ id: string }>(`/api/events/${id}`, {
      method: 'DELETE'
    });
  }

  // 小程序集成
  async syncEventToMiniProgram(eventId: string): Promise<ApiResponse<{ syncId: string }>> {
    return this.request<{ syncId: string }>('/api/miniprogram/sync', {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
  }

  async generateMiniProgramQR(eventId: string, scene?: string): Promise<ApiResponse<{ qrCodeUrl: string }>> {
    return this.request<{ qrCodeUrl: string }>('/api/miniprogram/qrcode', {
      method: 'POST',
      body: JSON.stringify({ 
        eventId, 
        scene: scene || `eventId=${eventId}`,
        page: 'pages/event/detail',
        width: 430
      })
    });
  }

  // 数据迁移
  async migrateToServer(): Promise<ApiResponse<{ migratedCount: number }>> {
    if (this.config.mode === 'remote') {
      return { success: true, data: { migratedCount: 0 }, message: '已是远程模式' };
    }

    // 收集本地数据
    const events = eventStore.getAllEvents();
    const registrations = JSON.parse(localStorage.getItem('qplz-registrations') || '[]');
    
    // 收集海报数据
    const posterData: Record<string, any> = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chatHistory_')) {
        const eventId = key.replace('chatHistory_', '');
        posterData[eventId] = JSON.parse(localStorage.getItem(key) || '[]');
      }
    });

    // 发送到服务器
    return this.request<{ migratedCount: number }>('/api/migrate', {
      method: 'POST',
      body: JSON.stringify({
        events,
        registrations,
        posters: posterData,
        timestamp: new Date().toISOString()
      })
    });
  }

  // 服务器连接测试
  async testConnection(): Promise<ApiResponse<{ version: string; features: string[] }>> {
    return this.request<{ version: string; features: string[] }>('/api/health');
  }
}

// 创建全局实例
export const apiAdapter = new ApiAdapter();

// 便捷工具
export const ApiUtils = {
  // 检查是否支持小程序
  supportsMiniProgram: () => apiAdapter.supportsMiniProgram(),
  
  // 切换到远程模式
  switchToRemote: (baseUrl: string, apiKey?: string) => {
    apiAdapter.setServerConfig(baseUrl, apiKey);
    apiAdapter.setMode('remote');
  },
  
  // 切换到本地模式
  switchToLocal: () => {
    apiAdapter.setMode('local');
  },
  
  // 获取当前模式状态
  getStatus: () => ({
    mode: apiAdapter.getMode(),
    supportsMiniProgram: apiAdapter.supportsMiniProgram()
  })
}; 