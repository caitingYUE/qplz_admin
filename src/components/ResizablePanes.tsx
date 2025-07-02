import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanesProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  defaultLeftWidth?: number; // 默认左侧宽度百分比 (0-100)
  minLeftWidth?: number; // 最小左侧宽度百分比
  maxLeftWidth?: number; // 最大左侧宽度百分比
}

const ResizablePanes: React.FC<ResizablePanesProps> = ({
  leftPane,
  rightPane,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringDivider, setIsHoveringDivider] = useState(false);
  const [showScrollbars, setShowScrollbars] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // 计算新的左侧宽度百分比
    const newLeftWidth = (mouseX / containerWidth) * 100;
    
    // 限制在最小和最大值之间
    const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
    
    setLeftWidth(clampedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理滚动事件以显示/隐藏滚动条
  const handleScroll = useCallback(() => {
    setShowScrollbars(true);
    
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // 3秒后隐藏滚动条
    scrollTimeoutRef.current = window.setTimeout(() => {
      setShowScrollbars(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 当分栏比例改变时，触发resize事件让子组件重新适配
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // 分发resize事件给所有子组件
      window.dispatchEvent(new Event('resize'));
    }, 100); // 延迟确保DOM更新完成

    return () => window.clearTimeout(timer);
  }, [leftWidth]);

  // 监听容器内的滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleContainerScroll = (e: Event) => {
        e.stopPropagation();
        handleScroll();
      };
      
      container.addEventListener('scroll', handleContainerScroll, { capture: true });
      container.addEventListener('wheel', handleScroll, { passive: true });
      
      return () => {
        container.removeEventListener('scroll', handleContainerScroll, { capture: true });
        container.removeEventListener('wheel', handleScroll);
      };
    }
  }, [handleScroll]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 自定义滚动条样式CSS
  const scrollbarStyles = `
    .resizable-panes-container ::-webkit-scrollbar {
      width: ${showScrollbars ? '8px' : '0px'};
      height: ${showScrollbars ? '8px' : '0px'};
      transition: width 0.3s ease, height 0.3s ease;
    }
    
    .resizable-panes-container ::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .resizable-panes-container ::-webkit-scrollbar-thumb {
      background: ${showScrollbars ? 'rgba(0, 0, 0, 0.3)' : 'transparent'};
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    
    .resizable-panes-container ::-webkit-scrollbar-thumb:hover {
      background: ${showScrollbars ? 'rgba(0, 0, 0, 0.5)' : 'transparent'};
    }
    
    .resizable-panes-container {
      scrollbar-width: ${showScrollbars ? 'thin' : 'none'};
      scrollbar-color: ${showScrollbars ? 'rgba(0, 0, 0, 0.3) transparent' : 'transparent transparent'};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div 
        ref={containerRef}
        className="resizable-panes-container"
        style={{ 
          display: 'flex', 
          height: '100%', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* 左侧面板 */}
        <div style={{ 
          width: `${leftWidth}%`,
          minWidth: `${minLeftWidth}%`,
          maxWidth: `${maxLeftWidth}%`,
          overflow: 'auto',
          transition: isDragging ? 'none' : 'width 0.1s ease'
        }}>
          {leftPane}
        </div>

        {/* 可拖拽的分割线 */}
        <div
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHoveringDivider(true)}
          onMouseLeave={() => setIsHoveringDivider(false)}
          style={{
            width: isHoveringDivider || isDragging ? '3px' : '1px',
            background: isHoveringDivider || isDragging 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'rgba(0, 0, 0, 0.1)',
            cursor: 'col-resize',
            position: 'relative',
            flexShrink: 0,
            transition: isDragging ? 'none' : 'all 0.2s ease',
            zIndex: 10
          }}
        >
          {/* 悬浮时的拖拽指示器 */}
          {(isHoveringDivider || isDragging) && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '48px',
              background: 'rgba(102, 126, 234, 0.9)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                gap: '2px'
              }}>
                <div style={{
                  width: '2px',
                  height: '20px',
                  background: '#fff',
                  borderRadius: '1px'
                }} />
                <div style={{
                  width: '2px',
                  height: '20px',
                  background: '#fff',
                  borderRadius: '1px'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* 右侧面板 */}
        <div style={{ 
          width: `${100 - leftWidth}%`,
          overflow: 'auto',
          transition: isDragging ? 'none' : 'width 0.1s ease'
        }}>
          {rightPane}
        </div>

        {/* 拖拽时的辅助信息 */}
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            {Math.round(leftWidth)}% : {Math.round(100 - leftWidth)}%
          </div>
        )}
      </div>
    </>
  );
};

export default ResizablePanes; 