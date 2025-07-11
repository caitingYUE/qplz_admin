import { useState, useEffect } from 'react';
import type { EventPlanningData, OutlineOption } from '../services/eventPlanningService';
import type { TrafficGenerationRequest, TrafficGenerationResult } from '../services/trafficGenerationService';

// 活动策划历史记录类型
export interface EventPlanningHistory {
  id: string;
  title: string;
  planningData: EventPlanningData;
  selectedOutline: OutlineOption;
  finalPlan: string;
  createdAt: string;
  updatedAt?: string;
}

// 引流内容历史记录类型
export interface TrafficGenerationHistory {
  id: string;
  title: string;
  request: TrafficGenerationRequest;
  result: TrafficGenerationResult;
  createdAt: string;
}

const EVENT_PLANNING_HISTORY_KEY = 'qplz_event_planning_history';
const TRAFFIC_GENERATION_HISTORY_KEY = 'qplz_traffic_generation_history';

export const useHistory = () => {
  const [eventPlanningHistory, setEventPlanningHistory] = useState<EventPlanningHistory[]>([]);
  const [trafficGenerationHistory, setTrafficGenerationHistory] = useState<TrafficGenerationHistory[]>([]);

  // 加载历史记录
  useEffect(() => {
    try {
      const savedEventHistory = localStorage.getItem(EVENT_PLANNING_HISTORY_KEY);
      const savedTrafficHistory = localStorage.getItem(TRAFFIC_GENERATION_HISTORY_KEY);
      
      if (savedEventHistory) {
        setEventPlanningHistory(JSON.parse(savedEventHistory));
      }
      
      if (savedTrafficHistory) {
        setTrafficGenerationHistory(JSON.parse(savedTrafficHistory));
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }, []);

  // 保存活动策划历史记录
  const saveEventPlanningHistory = (
    planningData: EventPlanningData,
    selectedOutline: OutlineOption,
    finalPlan: string
  ): string => {
    const historyItem: EventPlanningHistory = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: planningData.theme,
      planningData,
      selectedOutline,
      finalPlan,
      createdAt: new Date().toISOString()
    };

    const newHistory = [historyItem, ...eventPlanningHistory].slice(0, 50); // 最多保存50条记录
    setEventPlanningHistory(newHistory);
    localStorage.setItem(EVENT_PLANNING_HISTORY_KEY, JSON.stringify(newHistory));
    
    return historyItem.id;
  };

  // 更新活动策划历史记录（当用户编辑方案时）
  const updateEventPlanningHistory = (id: string, updatedPlan: string) => {
    const newHistory = eventPlanningHistory.map(item => 
      item.id === id 
        ? { ...item, finalPlan: updatedPlan, updatedAt: new Date().toISOString() }
        : item
    );
    setEventPlanningHistory(newHistory);
    localStorage.setItem(EVENT_PLANNING_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 删除活动策划历史记录
  const deleteEventPlanningHistory = (id: string) => {
    const newHistory = eventPlanningHistory.filter(item => item.id !== id);
    setEventPlanningHistory(newHistory);
    localStorage.setItem(EVENT_PLANNING_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 保存引流内容历史记录
  const saveTrafficGenerationHistory = (
    request: TrafficGenerationRequest,
    result: TrafficGenerationResult
  ): string => {
    const historyItem: TrafficGenerationHistory = {
      id: `traffic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: request.eventTitle,
      request,
      result,
      createdAt: new Date().toISOString()
    };

    const newHistory = [historyItem, ...trafficGenerationHistory].slice(0, 30); // 最多保存30条记录
    setTrafficGenerationHistory(newHistory);
    localStorage.setItem(TRAFFIC_GENERATION_HISTORY_KEY, JSON.stringify(newHistory));
    
    return historyItem.id;
  };

  // 删除引流内容历史记录
  const deleteTrafficGenerationHistory = (id: string) => {
    const newHistory = trafficGenerationHistory.filter(item => item.id !== id);
    setTrafficGenerationHistory(newHistory);
    localStorage.setItem(TRAFFIC_GENERATION_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 清空所有历史记录
  const clearAllEventPlanningHistory = () => {
    setEventPlanningHistory([]);
    localStorage.removeItem(EVENT_PLANNING_HISTORY_KEY);
  };

  const clearAllTrafficGenerationHistory = () => {
    setTrafficGenerationHistory([]);
    localStorage.removeItem(TRAFFIC_GENERATION_HISTORY_KEY);
  };

  // 搜索历史记录
  const searchEventPlanningHistory = (keyword: string): EventPlanningHistory[] => {
    if (!keyword.trim()) return eventPlanningHistory;
    
    return eventPlanningHistory.filter(item =>
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.planningData.description.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const searchTrafficGenerationHistory = (keyword: string): TrafficGenerationHistory[] => {
    if (!keyword.trim()) return trafficGenerationHistory;
    
    return trafficGenerationHistory.filter(item =>
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.request.eventDescription.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  return {
    // 活动策划历史记录
    eventPlanningHistory,
    saveEventPlanningHistory,
    updateEventPlanningHistory,
    deleteEventPlanningHistory,
    clearAllEventPlanningHistory,
    searchEventPlanningHistory,
    
    // 引流内容历史记录
    trafficGenerationHistory,
    saveTrafficGenerationHistory,
    deleteTrafficGenerationHistory,
    clearAllTrafficGenerationHistory,
    searchTrafficGenerationHistory
  };
}; 