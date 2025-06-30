import { forwardRef, useEffect, useState } from 'react';
import { Spin, Alert } from 'antd';

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
    const [scale, setScale] = useState(1);

    // 计算合适的缩放比例
    useEffect(() => {
      const containerWidth = 600; // 预览容器最大宽度
      const containerHeight = 700; // 预览容器最大高度
      
      const scaleX = containerWidth / dimensions.width;
      const scaleY = containerHeight / dimensions.height;
      const optimalScale = Math.min(scaleX, scaleY, 1); // 不超过原尺寸
      
      setScale(optimalScale);
    }, [dimensions]);

    // 处理HTML内容加载
    useEffect(() => {
      if (htmlContent) {
        setIsLoading(false);
        setHasError(false);
      }
    }, [htmlContent]);

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

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '20px'
      }}>
        {/* 海报信息 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: '#f0f0f0',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>{dimensions.name}</span>
          <span>•</span>
          <span>{dimensions.size}</span>
          <span>•</span>
          <span>缩放比例: {Math.round(scale * 100)}%</span>
        </div>

        {/* 海报预览容器 */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e8e8e8',
          overflow: 'hidden'
        }}>
          <div
            ref={ref}
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden',
              background: '#ffffff'
            }}
            onError={handleError}
          >
            {/* 使用 dangerouslySetInnerHTML 渲染HTML内容 */}
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>

        {/* 尺寸信息 */}
        <div style={{
          fontSize: '12px',
          color: '#999',
          textAlign: 'center'
        }}>
          实际尺寸: {dimensions.width} × {dimensions.height} 像素
          <br />
          预览尺寸: {Math.round(dimensions.width * scale)} × {Math.round(dimensions.height * scale)} 像素
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = 'PosterPreview';

export default PosterPreview; 