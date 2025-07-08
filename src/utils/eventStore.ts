import type { Event } from '../types';

// 模拟的初始数据
const initialEvents: Event[] = [
  {
    id: '1',
    name: '女性创业分享会',
    subtitle: '成功女性的创业之路',
    description: '邀请成功女性创业者分享创业经验，探讨女性在创业过程中的机遇与挑战',
    date: '2024-01-15',
    time: '14:00',
    startTime: '2024-01-15 14:00:00',
    endTime: '2024-01-15 17:00:00',
    location: '上海市浦东新区张江高科技园区',
    capacity: 50,
    maxParticipants: 50,
    registrations: 45,
    currentParticipants: 45,
    fee: '免费',
    guests: [
      { id: '1', name: '张女士', title: 'CEO', bio: '某科技公司创始人' }
    ],
    poster: '',
    status: 'published',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-01-01 10:00:00'
  },
  {
    id: '2',
    name: '职场沟通技巧工作坊',
    subtitle: '提升职场沟通能力',
    description: '提升职场沟通能力的实战训练，学习有效的沟通技巧和表达方法',
    date: '2024-01-20',
    time: '09:00',
    startTime: '2024-01-20 09:00:00',
    endTime: '2024-01-20 12:00:00',
    location: '北京市朝阳区CBD商务区',
    capacity: 30,
    maxParticipants: 30,
    registrations: 32,
    currentParticipants: 32,
    fee: '199元',
    guests: [],
    poster: '',
    status: 'published',
    createdAt: '2024-01-02 09:00:00',
    updatedAt: '2024-01-02 09:00:00'
  }
];

// 简单的事件管理器
class EventStore {
  private events: Event[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // 从localStorage加载数据，如果没有则使用初始数据
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('qplz-events');
      if (stored) {
        this.events = JSON.parse(stored);
      } else {
        this.events = [...initialEvents];
        this.saveToStorage();
      }
    } catch (error) {
      console.error('加载事件数据失败:', error);
      this.events = [...initialEvents];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('qplz-events', JSON.stringify(this.events));
    } catch (error) {
      console.error('保存事件数据失败:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // 订阅数据变化
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 获取所有事件
  getAllEvents(): Event[] {
    return [...this.events];
  }

  // 根据ID获取事件
  getEventById(id: string): Event | undefined {
    return this.events.find(event => event.id === id);
  }

  // 创建新事件
  createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Event {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      currentParticipants: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.events.push(newEvent);
    this.saveToStorage();
    this.notifyListeners();
    return newEvent;
  }

  // 更新事件
  updateEvent(id: string, eventData: Partial<Omit<Event, 'id' | 'createdAt'>>): Event | null {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    this.events[index] = {
      ...this.events[index],
      ...eventData,
      updatedAt: now,
    };

    this.saveToStorage();
    this.notifyListeners();
    return this.events[index];
  }

  // 删除事件
  deleteEvent(id: string): boolean {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return false;

    this.events.splice(index, 1);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // 更新事件状态
  updateEventStatus(id: string, status: Event['status']): boolean {
    const event = this.events.find(e => e.id === id);
    if (!event) return false;

    event.status = status;
    event.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }
}

// 导出单例
export const eventStore = new EventStore(); 