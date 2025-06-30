import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Result, Button, Alert, Collapse, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 发送错误报告到监控系统
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.log('Error Report:', errorReport);
    
    // 这里可以发送到错误监控服务
    // 例如：Sentry, LogRocket, 或自定义错误收集API
    try {
      localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorReport));
    } catch (e) {
      console.warn('无法保存错误报告到localStorage:', e);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '40px 24px',
          maxWidth: '800px',
          margin: '0 auto',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Result
            status="error"
            title="系统遇到了一个错误"
            subTitle={`错误ID: ${this.state.errorId}`}
            extra={[
              <Button 
                key="retry" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                重试
              </Button>,
              <Button 
                key="reload" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                刷新页面
              </Button>,
              <Button 
                key="home" 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                返回首页
              </Button>
            ]}
          >
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message="错误处理建议"
                description={
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>尝试刷新页面</li>
                    <li>检查网络连接</li>
                    <li>清空浏览器缓存</li>
                    <li>如果问题持续存在，请联系技术支持</li>
                  </ul>
                }
                type="info"
                showIcon
              />
            </div>

            {/* 开发环境显示详细错误信息 */}
            {import.meta.env.DEV && this.state.error && (
              <Collapse ghost>
                <Panel header="🔧 开发者信息" key="debug">
                  <div style={{ textAlign: 'left', fontSize: '12px' }}>
                    <Paragraph>
                      <Text strong>错误消息:</Text>
                      <Text code>{this.state.error.message}</Text>
                    </Paragraph>
                    
                    {this.state.error.stack && (
                      <Paragraph>
                        <Text strong>错误堆栈:</Text>
                        <pre style={{
                          background: '#f5f5f5',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {this.state.error.stack}
                        </pre>
                      </Paragraph>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <Paragraph>
                        <Text strong>组件堆栈:</Text>
                        <pre style={{
                          background: '#f5f5f5',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </Paragraph>
                    )}
                  </div>
                </Panel>
              </Collapse>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 