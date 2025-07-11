import { useState, useEffect } from 'react';
import type { OutlineOption } from '../services/eventPlanningService';

// 收藏项类型
export interface FavoriteOutline extends OutlineOption {
  favoriteId: string;
  createdAt: string;
  planningDataHash?: string; // 用于关联原始策划数据
}

export interface FavoritePlan {
  id: string;
  title: string;
  content: string;
  outline: OutlineOption;
  createdAt: string;
  planningDataHash?: string;
}

const FAVORITE_OUTLINES_KEY = 'qplz_favorite_outlines';
const FAVORITE_PLANS_KEY = 'qplz_favorite_plans';

// 生成数据哈希（用于缓存键）
export const generatePlanningDataHash = (planningData: any): string => {
  try {
    // 使用安全的编码方式处理中文字符
    const jsonString = JSON.stringify(planningData);
    // 使用encodeURIComponent和unescape的组合来安全地转换为base64
    const utf8Bytes = unescape(encodeURIComponent(jsonString));
    return btoa(utf8Bytes).slice(0, 16);
  } catch (error) {
    // 如果编码失败，使用简单的哈希算法
    console.warn('Base64编码失败，使用备用哈希方法:', error);
    let hash = 0;
    const str = JSON.stringify(planningData);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36).slice(0, 16);
  }
};

export const useFavorites = () => {
  const [favoriteOutlines, setFavoriteOutlines] = useState<FavoriteOutline[]>([]);
  const [favoritePlans, setFavoritePlans] = useState<FavoritePlan[]>([]);

  // 加载收藏数据
  useEffect(() => {
    try {
      const savedOutlines = localStorage.getItem(FAVORITE_OUTLINES_KEY);
      const savedPlans = localStorage.getItem(FAVORITE_PLANS_KEY);
      
      if (savedOutlines) {
        setFavoriteOutlines(JSON.parse(savedOutlines));
      }
      
      if (savedPlans) {
        setFavoritePlans(JSON.parse(savedPlans));
      }
    } catch (error) {
      console.error('加载收藏数据失败:', error);
    }
  }, []);

  // 保存大纲到收藏
  const saveOutlineToFavorites = (
    outline: OutlineOption, 
    planningDataHash: string
  ): string => {
    const favoriteId = `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const favoriteOutline: FavoriteOutline = {
      ...outline,
      favoriteId,
      planningDataHash,
      createdAt: new Date().toISOString()
    };

    const newFavorites = [favoriteOutline, ...favoriteOutlines].slice(0, 50); // 最多保存50个
    setFavoriteOutlines(newFavorites);
    localStorage.setItem(FAVORITE_OUTLINES_KEY, JSON.stringify(newFavorites));
    
    return favoriteId;
  };

  // 删除收藏的大纲
  const removeOutlineFromFavorites = (favoriteId: string) => {
    const newFavorites = favoriteOutlines.filter(fav => fav.favoriteId !== favoriteId);
    setFavoriteOutlines(newFavorites);
    localStorage.setItem(FAVORITE_OUTLINES_KEY, JSON.stringify(newFavorites));
  };

  // 保存完整方案到收藏
  const savePlanToFavorites = (
    title: string,
    content: string,
    outline: OutlineOption,
    planningDataHash: string
  ): string => {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const favoritePlan: FavoritePlan = {
      id: planId,
      title,
      content,
      outline,
      planningDataHash,
      createdAt: new Date().toISOString()
    };

    const newFavorites = [favoritePlan, ...favoritePlans].slice(0, 30); // 最多保存30个
    setFavoritePlans(newFavorites);
    localStorage.setItem(FAVORITE_PLANS_KEY, JSON.stringify(newFavorites));
    
    return planId;
  };

  // 删除收藏的方案
  const removePlanFromFavorites = (planId: string) => {
    const newFavorites = favoritePlans.filter(fav => fav.id !== planId);
    setFavoritePlans(newFavorites);
    localStorage.setItem(FAVORITE_PLANS_KEY, JSON.stringify(newFavorites));
  };

  // 检查大纲是否已收藏
  const isOutlineFavorited = (outlineId: string) => {
    return favoriteOutlines.some(fav => fav.id === outlineId);
  };

  // 检查方案是否已收藏
  const isPlanFavorited = (outline: OutlineOption) => {
    return favoritePlans.some(fav => fav.outline.id === outline.id);
  };

  // 获取相关的收藏大纲
  const getRelatedFavoriteOutlines = (planningDataHash: string): FavoriteOutline[] => {
    return favoriteOutlines.filter(fav => fav.planningDataHash === planningDataHash);
  };

  // 获取相关的收藏方案
  const getRelatedFavoritePlans = (planningDataHash: string): FavoritePlan[] => {
    return favoritePlans.filter(fav => fav.planningDataHash === planningDataHash);
  };

  // 生成数据哈希（用于缓存键）
  const generatePlanningDataHashInternal = (planningData: any): string => {
    return generatePlanningDataHash(planningData);
  };

  return {
    // 大纲收藏
    favoriteOutlines,
    saveOutlineToFavorites,
    removeOutlineFromFavorites,
    isOutlineFavorited,
    
    // 方案收藏
    favoritePlans,
    savePlanToFavorites,
    removePlanFromFavorites,
    isPlanFavorited,
    
    // 工具函数
    generatePlanningDataHash: generatePlanningDataHashInternal,
    getRelatedFavoriteOutlines,
    getRelatedFavoritePlans
  };
}; 