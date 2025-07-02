import { forwardRef, useEffect, useState, useRef, useCallback } from 'react';
import { Spin, Alert, Button } from 'antd';
import { PlusOutlined, MinusOutlined, ExpandOutlined } from '@ant-design/icons';

interface PosterPreviewProps {
  htmlContent: string;
  posterType: string;
  dimensions: {
    width: number;
    height: number;
    name: string;
    size: string;
  };
}

const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ htmlContent, dimensions }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [autoScale, setAutoScale] = useState(1);
    const [manualScale, setManualScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // 最终缩放比例 = 自动缩放 × 手动缩放
    const finalScale = autoScale * manualScale;

    // 智能缩放算法 - 针对不同海报类型优化显示
    const calculateAutoScale = useCallback(() => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      setContainerSize({ width: rect.width, height: rect.height });
      
      if (rect.width < 100 || rect.height < 100) {
        setAutoScale(0.1);
        return;
      }
      
      // 减少边距，充分利用空间
      const bottomControlsHeight = 40; // 底部控制栏
      const padding = 12; // 容器padding
      const cardPadding = 8; // 白色卡片padding
      const scrollbarSpace = 10; // 滚动条预留空间
      
      // 计算可用空间
      const availableWidth = rect.width - (padding + cardPadding + scrollbarSpace) * 2;
      const availableHeight = rect.height - bottomControlsHeight - (padding + cardPadding) * 2;
      
      // 确保最小可用空间
      const usableWidth = Math.max(availableWidth, 200);
      const usableHeight = Math.max(availableHeight, 150);
      
      // 计算两个方向的缩放比例
      const scaleX = usableWidth / dimensions.width;
      const scaleY = usableHeight / dimensions.height;
      
      // 判断海报类型和宽高比
      const aspectRatio = dimensions.height / dimensions.width;
      const isVerticalPoster = aspectRatio > 1.2; // 高度比宽度大20%以上认为是竖版海报
      const isXiaohongshuPoster = dimensions.width === 1242 && dimensions.height === 1660; // 小红书海报
      
      let idealScale;
      
      if (isXiaohongshuPoster || (isVerticalPoster && aspectRatio > 1.5)) {
        // 对于小红书海报或超长竖版海报，优先保证宽度适配，允许垂直滚动
        const maxVerticalScale = scaleY * 1.5; // 允许超出容器50%的高度
        idealScale = Math.min(scaleX, maxVerticalScale);
        
        // 确保海报宽度不会太小
        const minWidthScale = 200 / dimensions.width; // 最小显示宽度200px
        idealScale = Math.max(idealScale, minWidthScale);
        
        console.log('小红书/长竖版海报优化:', {
          scaleX, scaleY, maxVerticalScale, minWidthScale, chosen: idealScale
        });
      } else {
        // 其他海报类型，使用标准的适应策略
        idealScale = Math.min(scaleX, scaleY);
      }
      
      // 缩放范围限制
      const minScale = 0.1;
      const maxScale = 3.0;
      const finalAutoScale = Math.max(minScale, Math.min(idealScale, maxScale));
      
      console.log('缩放计算:', {
        posterType: isXiaohongshuPoster ? '小红书' : isVerticalPoster ? '竖版' : '标准',
        dimensions: `${dimensions.width}×${dimensions.height}`,
        aspectRatio: aspectRatio.toFixed(2),
        availableSpace: { width: usableWidth, height: usableHeight },
        scaleOptions: { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) },
        finalScale: finalAutoScale.toFixed(3)
      });
      
      setAutoScale(finalAutoScale);
    }, [dimensions]);

    // 手动缩放控制
    const handleZoomIn = () => {
      setManualScale(prev => Math.min(prev * 1.2, 5.0));
    };

    const handleZoomOut = () => {
      setManualScale(prev => Math.max(prev / 1.2, 0.1));
    };

    const handleFitToScreen = () => {
      setManualScale(1);
    };

    // 监听容器大小变化
    useEffect(() => {
      const timer = setTimeout(calculateAutoScale, 100);
      
      const resizeObserver = new ResizeObserver(() => {
        clearTimeout(timer);
        setTimeout(calculateAutoScale, 50);
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      
      const handleWindowResize = () => {
        setTimeout(calculateAutoScale, 100);
      };
      
      window.addEventListener('resize', handleWindowResize);
      
      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleWindowResize);
      };
    }, [calculateAutoScale]);

    // 处理HTML内容加载
    useEffect(() => {
      if (htmlContent) {
        setIsLoading(false);
        setHasError(false);
        setTimeout(calculateAutoScale, 150);
      }
    }, [htmlContent, calculateAutoScale]);

    // 错误处理
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spin size="large" />
          <div style={{ color: '#666' }}>正在加载海报预览...</div>
        </div>
      );
    }

    if (hasError) {
      return (
        <Alert
          message="预览加载失败"
          description="海报内容加载出现问题，请重新生成或刷新页面"
          type="error"
          showIcon
          style={{ margin: '20px' }}
        />
      );
    }

    const scaledWidth = dimensions.width * finalScale;
    const scaledHeight = dimensions.height * finalScale;

    // 根据海报类型和尺寸判断是否需要透明背景
    const shouldUseTransparentBackground = () => {
      const aspectRatio = dimensions.height / dimensions.width;
      const isLongVertical = aspectRatio > 1.5; // 长竖版海报
      const isXiaohongshu = dimensions.width === 1242 && dimensions.height === 1660;
      const isActivity = dimensions.width === 1080 && dimensions.height === 640;
      
      return isLongVertical || isXiaohongshu || isActivity;
    };

    const useTransparentBg = shouldUseTransparentBackground();

    return (
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: useTransparentBg ? '#f0f2f5' : '#fafafa',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* 海报显示区域 - 允许滚动确保完整显示 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: useTransparentBg ? '6px' : '10px',
          overflow: 'auto', // 关键：允许滚动而不是隐藏
          background: useTransparentBg ? 'transparent' : '#f8f9fa',
          position: 'relative',
          minHeight: 0
        }}>
          {/* 海报画布容器 - 直接包围缩放后的海报 */}
          <div style={{
            background: useTransparentBg ? 'transparent' : '#ffffff',
            padding: useTransparentBg ? '0' : '16px',
            borderRadius: useTransparentBg ? '0' : '6px',
            boxShadow: useTransparentBg ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: useTransparentBg ? 'none' : '1px solid #e8e8e8',
            display: 'inline-block', // 改为inline-block让容器自适应内容
            flexShrink: 0,
            margin: '0 auto'
          }}>
            {/* 海报内容 - 直接缩放显示 */}
            <div
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                transform: `scale(${finalScale})`,
                transformOrigin: 'center center',
                border: useTransparentBg ? 'none' : '1px solid #ddd',
                borderRadius: useTransparentBg ? '4px' : '2px',
                background: '#ffffff',
                overflow: 'visible',
                boxShadow: useTransparentBg ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
              }}
            >
              {/* HTML内容渲染 */}
              <div
                ref={ref}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible'
                }}
              />
            </div>
          </div>
        </div>

        {/* 简洁的底部控制区 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.95)',
          fontSize: '12px',
          color: '#666',
          flexShrink: 0,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#333', fontWeight: '500' }}>{dimensions.width} × {dimensions.height}px</span>
            <span>·</span>
            <span>{Math.round(finalScale * 100)}% 缩放</span>
            <span>·</span>
            <span>显示 {scaledWidth.toFixed(0)} × {scaledHeight.toFixed(0)}px</span>
          </div>
          
          {/* 简洁的缩放控制 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              type="text"
              size="small"
              icon={<MinusOutlined />}
              onClick={handleZoomOut}
              disabled={manualScale <= 0.1}
              style={{ 
                color: '#666', 
                fontSize: '10px',
                width: '24px',
                height: '24px',
                minWidth: '24px'
              }}
              title="缩小"
            />
            <Button
              type="text"
              size="small"
              icon={<ExpandOutlined />}
              onClick={handleFitToScreen}
              style={{ 
                color: '#666', 
                fontSize: '10px',
                width: '24px',
                height: '24px',
                minWidth: '24px'
              }}
              title="适应窗口"
            />
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleZoomIn}
              disabled={manualScale >= 5.0}
              style={{ 
                color: '#666', 
                fontSize: '10px',
                width: '24px',
                height: '24px',
                minWidth: '24px'
              }}
              title="放大"
            />
          </div>
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = 'PosterPreview';

export default PosterPreview; 