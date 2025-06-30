import { useState, useEffect } from 'react';
import { eventStore } from '../utils/eventStore';
import type { Event } from '../types';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始加载数据
    setEvents(eventStore.getAllEvents());
    setLoading(false);

    // 订阅数据变化
    const unsubscribe = eventStore.subscribe(() => {
      setEvents(eventStore.getAllEvents());
    });

    return unsubscribe;
  }, []);

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>) => {
    try {
      const newEvent = eventStore.createEvent(eventData);
      return { success: true, data: newEvent };
    } catch (error) {
      console.error('创建活动失败:', error);
      return { success: false, error: '创建活动失败' };
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Omit<Event, 'id' | 'createdAt'>>) => {
    try {
      const updatedEvent = eventStore.updateEvent(id, eventData);
      if (updatedEvent) {
        return { success: true, data: updatedEvent };
      } else {
        return { success: false, error: '活动不存在' };
      }
    } catch (error) {
      console.error('更新活动失败:', error);
      return { success: false, error: '更新活动失败' };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const success = eventStore.deleteEvent(id);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: '活动不存在' };
      }
    } catch (error) {
      console.error('删除活动失败:', error);
      return { success: false, error: '删除活动失败' };
    }
  };

  const updateEventStatus = async (id: string, status: Event['status']) => {
    try {
      const success = eventStore.updateEventStatus(id, status);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: '活动不存在' };
      }
    } catch (error) {
      console.error('更新活动状态失败:', error);
      return { success: false, error: '更新活动状态失败' };
    }
  };

  const getEventById = (id: string): Event | undefined => {
    return eventStore.getEventById(id);
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    getEventById,
  };
}; 