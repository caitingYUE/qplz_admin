// 活动相关类型
export interface Event {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  maxParticipants: number;
  registrations: number;
  currentParticipants: number;
  fee?: string;
  guests?: any[];
  poster?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'offline';
  createdAt: string;
  updatedAt: string;
}

// 客户资源类型
export interface CustomerResource {
  id: string;
  name: string; // 必须
  title: string; // 必须
  photo?: string; // 可选
  contact?: string; // 可选
  wechat?: string; // 可选
  source: string; // 必须：客户来源
  description?: string; // 可选：简要说明
  rating?: 1 | 2 | 3 | 4 | 5; // 可选：1-5星级
  hasCooperated?: boolean; // 可选：是否合作过
  createdAt: string;
  updatedAt: string;
}

// 场地资源类型
export interface VenueResource {
  id: string;
  name: string; // 必须：场地名称
  location: string; // 必须：场地地点
  capacity?: number; // 可选：可容纳人数
  photo?: string; // 可选：场地照片
  contactPerson: string; // 必须：场地对接人
  contactPhone: string; // 必须：场地对接联系方式
  hasCooperated?: boolean; // 可选：是否合作过
  rating?: 1 | 2 | 3 | 4 | 5; // 可选：1-5星级
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  bio?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  userName: string;
  phone: string;
  wechat: string;
  note?: string;
  registeredAt: string;
  status: 'confirmed' | 'cancelled';
}

export interface PosterElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'circle' | 'bubble' | 'star' | 'heart' | 'arrow' | 'line';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  rotation?: number;
  zIndex?: number; // 元素层级
  // 新增装饰元素属性
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  // 形状元素专用属性
  fillColor?: string;    // 填充颜色（支持透明）
  strokeColor?: string;  // 边框颜色
  strokeWidth?: number;  // 边框粗细
  // 线条元素专用属性
  lineStyle?: 'solid' | 'dashed' | 'dotted' | 'brush'; // 线条样式，brush为笔刷效果
  lineWidth?: number;    // 线条粗细
  lineColor?: string;    // 线条颜色
  lineCap?: 'butt' | 'round' | 'square'; // 线条端点样式
  // DeepSeek HTML解析需要的额外属性
  textShadow?: string;
  borderRadius?: number;
  padding?: number;
  // 多选和编组相关属性
  isGroup?: boolean;     // 是否为编组
  groupId?: string;      // 所属编组ID
  groupElements?: string[]; // 编组包含的元素ID列表（仅编组元素有效）
  // 文本对齐属性
  textAlign?: 'left' | 'center' | 'right';
}



// AI生成海报上传文件接口
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: 'reference' | 'logo';
  uploadTime: string;
}

// AI生成海报增强数据接口
export interface EnhancedAIData {
  referenceImages: UploadedFile[];
  logos: UploadedFile[];
  guestInfo: {
    name: string;
    title: string;
    bio: string;
    avatar?: string;
  }[];
}

// API模式类型
export type ApiMode = 'local' | 'remote';

// 设计资源管理接口
export interface DesignAssets {
  // 原有的统一参考图片存储（保持向后兼容）
  referenceImages: Array<{ id: string; url: string; name: string; size?: number }>;
  // 新增：按海报类型分类的参考图片
  referenceImagesByType: {
    vertical: Array<{ id: string; url: string; name: string; size?: number; posterType: string }>;
    invitation: Array<{ id: string; url: string; name: string; size?: number; posterType: string }>;
    wechat: Array<{ id: string; url: string; name: string; size?: number; posterType: string }>;
    xiaohongshu: Array<{ id: string; url: string; name: string; size?: number; posterType: string }>;
    activity: Array<{ id: string; url: string; name: string; size?: number; posterType: string }>;
  };
  logos: Array<{ id: string; url: string; name: string; size?: number }>;
  qrCodes: Array<{ id: string; url: string; name: string; size?: number }>;
  brandColors: string[];
  brandFonts: Array<{ id: string; name: string; url: string; size?: number }>;
  // 服务器配置相关
  apiMode: ApiMode;
  serverAddress: string;
  serverPort: string;
  isServerConnected: boolean;
  isMiniProgramIntegrated: boolean;
}

 