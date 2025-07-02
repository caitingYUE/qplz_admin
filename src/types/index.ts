export interface Event {
  id: string;
  name: string;
  subtitle?: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  description: string;
  fee?: string;
  guests: Guest[];
  poster?: string;
  status: 'draft' | 'published' | 'offline';
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
  referenceImages: Array<{ id: string; url: string; name: string; size?: number }>;
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

 