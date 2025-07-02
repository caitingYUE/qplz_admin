// localStorage存储管理器

export interface StorageQuota {
  used: number;
  total: number;
  available: number;
  percentage: number;
}

export interface StorageItem {
  key: string;
  size: number;
  type: 'chatHistory' | 'designAssets' | 'events' | 'errors' | 'other';
  lastAccess: number;
  created: number;
}

class StorageManager {
  private readonly WARNING_THRESHOLD = 0.8; // 80%使用率警告
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%使用率严重警告
  private readonly MAX_CHAT_HISTORY_DAYS = 30; // 聊天记录保留天数
  private readonly MAX_ERROR_LOGS_DAYS = 7; // 错误日志保留天数

  // 获取存储配额信息
  async getStorageQuota(): Promise<StorageQuota> {
    try {
      // 尝试使用现代API
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 0;
        
        return {
          used,
          total,
          available: total - used,
          percentage: total > 0 ? used / total : 0
        };
      }
    } catch (error) {
      console.warn('无法获取精确的存储配额信息:', error);
    }

    // 降级到localStorage大小估算
    return this.estimateLocalStorageUsage();
  }

  // 估算localStorage使用情况
  private estimateLocalStorageUsage(): StorageQuota {
    let used = 0;
    const total = 5 * 1024 * 1024; // 假设5MB限制
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        used += key.length + value.length; // 每个字符约2字节
      }
    }
    
    used *= 2; // 字符编码估算
    
    return {
      used,
      total,
      available: total - used,
      percentage: used / total
    };
  }

  // 获取所有存储项的详细信息
  getStorageItems(): StorageItem[] {
    const items: StorageItem[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key) || '';
      const size = (key.length + value.length) * 2; // 估算字节数
      
      // 分类存储项
      let type: StorageItem['type'] = 'other';
      if (key.startsWith('chatHistory_')) type = 'chatHistory';
      else if (key === 'designAssets') type = 'designAssets';
      else if (key === 'qplz-events') type = 'events';
      else if (key.startsWith('error_')) type = 'errors';
      
      // 尝试解析创建时间
      let created = Date.now();
      let lastAccess = Date.now();
      
      try {
        if (type === 'chatHistory') {
          const messages = JSON.parse(value);
          if (Array.isArray(messages) && messages.length > 0) {
            created = messages[0].timestamp || Date.now();
            lastAccess = messages[messages.length - 1].timestamp || Date.now();
          }
        } else if (type === 'errors') {
          const errorData = JSON.parse(value);
          created = new Date(errorData.timestamp).getTime();
          lastAccess = created;
        }
      } catch (error) {
        // 忽略解析错误，使用默认时间
      }
      
      items.push({
        key,
        size,
        type,
        lastAccess,
        created
      });
    }
    
    return items.sort((a, b) => b.size - a.size); // 按大小排序
  }

  // 检查是否需要清理
  async checkStorageHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    quota: StorageQuota;
    suggestions: string[];
  }> {
    const quota = await this.getStorageQuota();
    const suggestions: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (quota.percentage >= this.CRITICAL_THRESHOLD) {
      status = 'critical';
      suggestions.push('存储空间严重不足，建议立即清理');
      suggestions.push('自动清理过期数据');
      suggestions.push('删除不必要的聊天记录');
    } else if (quota.percentage >= this.WARNING_THRESHOLD) {
      status = 'warning';
      suggestions.push('存储空间使用率较高');
      suggestions.push('建议清理过期聊天记录');
    }
    
    return { status, quota, suggestions };
  }

  // 自动清理过期数据
  autoCleanup(): {
    cleaned: StorageItem[];
    freedBytes: number;
  } {
    const items = this.getStorageItems();
    const now = Date.now();
    const cleaned: StorageItem[] = [];
    let freedBytes = 0;
    
    items.forEach(item => {
      let shouldDelete = false;
      const ageInDays = (now - item.created) / (1000 * 60 * 60 * 24);
      
      // 清理策略
      if (item.type === 'chatHistory' && ageInDays > this.MAX_CHAT_HISTORY_DAYS) {
        shouldDelete = true;
      } else if (item.type === 'errors' && ageInDays > this.MAX_ERROR_LOGS_DAYS) {
        shouldDelete = true;
      }
      
      if (shouldDelete) {
        try {
          localStorage.removeItem(item.key);
          cleaned.push(item);
          freedBytes += item.size;
        } catch (error) {
          console.warn(`清理存储项失败: ${item.key}`, error);
        }
      }
    });
    
    return { cleaned, freedBytes };
  }

  // 手动清理指定类型的数据
  cleanupByType(type: StorageItem['type']): {
    cleaned: StorageItem[];
    freedBytes: number;
  } {
    const items = this.getStorageItems().filter(item => item.type === type);
    let freedBytes = 0;
    
    items.forEach(item => {
      try {
        localStorage.removeItem(item.key);
        freedBytes += item.size;
      } catch (error) {
        console.warn(`清理存储项失败: ${item.key}`, error);
      }
    });
    
    return { cleaned: items, freedBytes };
  }

  // 安全存储数据（检查容量）
  safeSetItem(key: string, value: string): boolean {
    try {
      // 估算需要的空间
      const requiredSpace = (key.length + value.length) * 2;
      
      // 检查当前使用情况
      this.getStorageQuota().then(quota => {
        if (quota.available < requiredSpace) {
          console.warn('存储空间不足，尝试自动清理');
          this.autoCleanup();
        }
      });
      
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      
      // 如果失败，尝试清理后重试
      const cleanup = this.autoCleanup();
      if (cleanup.freedBytes > 0) {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('清理后重试仍然失败:', retryError);
        }
      }
      
      return false;
    }
  }

  // 格式化字节数
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<{
    quota: StorageQuota;
    items: StorageItem[];
    byType: Record<StorageItem['type'], { count: number; size: number }>;
  }> {
    const quota = await this.getStorageQuota();
    const items = this.getStorageItems();
    
    const byType: Record<StorageItem['type'], { count: number; size: number }> = {
      chatHistory: { count: 0, size: 0 },
      designAssets: { count: 0, size: 0 },
      events: { count: 0, size: 0 },
      errors: { count: 0, size: 0 },
      other: { count: 0, size: 0 }
    };
    
    items.forEach(item => {
      byType[item.type].count++;
      byType[item.type].size += item.size;
    });
    
    return { quota, items, byType };
  }
}

// 单例模式
export const storageManager = new StorageManager();

// 定期健康检查
let healthCheckInterval: number | null = null;

export function startStorageMonitoring() {
  if (healthCheckInterval) return;
  
  // 每5分钟检查一次存储健康状况
  healthCheckInterval = setInterval(async () => {
    const health = await storageManager.checkStorageHealth();
    
    if (health.status === 'critical') {
      console.warn('🚨 存储空间严重不足！', health);
      storageManager.autoCleanup();
    } else if (health.status === 'warning') {
      console.warn('⚠️ 存储空间使用率较高', health);
    }
  }, 5 * 60 * 1000);
}

export function stopStorageMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

// 字体文件压缩工具
export const compressFontFile = (base64Data: string): string => {
  try {
    // 这里可以实现实际的字体文件压缩逻辑
    // 目前返回原始数据，未来可以集成字体子集化工具
    return base64Data;
  } catch (error) {
    console.warn('字体压缩失败，使用原始数据:', error);
    return base64Data;
  }
};

// 存储空间分析工具
export const analyzeStorageUsage = () => {
  const storageInfo: { [key: string]: number } = {};
  let totalSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage[key];
      const size = new Blob([value]).size;
      storageInfo[key] = size;
      totalSize += size;
    }
  }
  
  const maxStorageMB = 10; // 保守估计
  const usagePercentage = (totalSize / (maxStorageMB * 1024 * 1024)) * 100;
  
  return {
    storageInfo,
    totalSize,
    totalSizeMB: totalSize / (1024 * 1024),
    usagePercentage,
    maxStorageMB
  };
};

// 清理存储工具
export const cleanupStorage = (options: {
  keepDesignAssets?: boolean;
  keepBrandColors?: boolean;
  keepChatHistory?: boolean;
} = {}) => {
  const { keepDesignAssets = true, keepBrandColors = true, keepChatHistory = false } = options;
  
  const keysToDelete = [];
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      let shouldDelete = false;
      
      // 临时文件
      if (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('error_')) {
        shouldDelete = true;
      }
      
      // 聊天历史
      if (!keepChatHistory && key.startsWith('chatHistory_')) {
        shouldDelete = true;
      }
      
      // 设计资源（谨慎删除）
      if (!keepDesignAssets && key === 'designAssets') {
        shouldDelete = true;
      }
      
      // 品牌颜色
      if (!keepBrandColors && key === 'brandColors') {
        shouldDelete = true;
      }
      
      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }
  }
  
  keysToDelete.forEach(key => localStorage.removeItem(key));
  
  return {
    deletedKeys: keysToDelete,
    freedSpace: keysToDelete.length * 1024 // 粗略估算
  };
};

// 字体文件大小优化建议
export const getFontOptimizationSuggestions = (fontName: string, fontSizeMB: number) => {
  const suggestions = [];
  
  if (fontSizeMB > 5) {
    suggestions.push('🚨 文件过大，建议使用WOFF2格式');
  }
  
  if (fontSizeMB > 2) {
    suggestions.push('💡 考虑使用字体子集化');
  }
  
  if (fontName.includes('ttf') || fontName.includes('otf')) {
    suggestions.push('📦 转换为WOFF/WOFF2格式可减少50%大小');
  }
  
  suggestions.push('🌐 考虑使用Google Fonts等在线字体服务');
  
  return suggestions;
}; 