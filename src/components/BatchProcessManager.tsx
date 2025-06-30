import React, { useState, useCallback, useRef } from 'react';
import { Modal, Progress, Alert, Button, Typography, Space, Divider, List, Tag } from 'antd';
import { 
  PauseOutlined, 
  PlayCircleOutlined, 
  StopOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;

export interface BatchTask {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  result?: {
    canvas?: HTMLCanvasElement;
    blob?: Blob;
    url?: string;
  };
}

interface BatchProcessManagerProps {
  visible: boolean;
  onClose: () => void;
  tasks: Array<{
    id: string;
    name: string;
    htmlContent: string;
  }>;
  posterDimensions: {
    width: number;
    height: number;
  };
  eventName: string;
}

const BatchProcessManager: React.FC<BatchProcessManagerProps> = ({
  visible,
  onClose,
  tasks: initialTasks,
  posterDimensions,
  eventName
}) => {
  const [tasks, setTasks] = useState<BatchTask[]>(
    initialTasks.map(task => ({
      ...task,
      status: 'pending' as const,
      progress: 0
    }))
  );
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);

  // 更新任务状态
  const updateTask = useCallback((taskId: string, updates: Partial<BatchTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  // 处理单个任务
  const processTask = useCallback(async (
    task: BatchTask, 
    htmlContent: string,
    signal: AbortSignal
  ): Promise<void> => {
    if (signal.aborted || pausedRef.current) {
      throw new Error('任务被取消或暂停');
    }

    updateTask(task.id, { status: 'processing', progress: 0 });

    try {
      // 创建临时DOM元素
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = `${posterDimensions.width}px`;
      tempDiv.style.height = `${posterDimensions.height}px`;
      tempDiv.style.backgroundColor = '#ffffff';
      
      document.body.appendChild(tempDiv);

      // 检查是否被取消
      if (signal.aborted || pausedRef.current) {
        document.body.removeChild(tempDiv);
        throw new Error('任务被取消或暂停');
      }

      updateTask(task.id, { progress: 25 });

      // 等待DOM渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      if (signal.aborted || pausedRef.current) {
        document.body.removeChild(tempDiv);
        throw new Error('任务被取消或暂停');
      }

      updateTask(task.id, { progress: 50 });

      // 使用html2canvas生成图片
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: posterDimensions.width,
        height: posterDimensions.height,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // 清理DOM
      document.body.removeChild(tempDiv);

      if (signal.aborted || pausedRef.current) {
        throw new Error('任务被取消或暂停');
      }

      updateTask(task.id, { progress: 75 });

      // 转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('转换为Blob失败'));
          }
        }, 'image/png', 1.0);
      });

      const url = URL.createObjectURL(blob);

      updateTask(task.id, {
        status: 'completed',
        progress: 100,
        result: { canvas, blob, url }
      });

    } catch (error) {
      console.error(`处理任务 ${task.name} 失败:`, error);
      updateTask(task.id, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : '未知错误'
      });
      throw error;
    }
  }, [posterDimensions, updateTask]);

  // 开始批量处理
  const startBatchProcess = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setIsPaused(false);
    pausedRef.current = false;
    abortControllerRef.current = new AbortController();

    let completedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < initialTasks.length; i++) {
      if (abortControllerRef.current?.signal.aborted || pausedRef.current) {
        break;
      }

      setCurrentTaskIndex(i);
      const task = tasks[i];
      const htmlContent = initialTasks[i].htmlContent;

      try {
        await processTask(task, htmlContent, abortControllerRef.current.signal);
        completedCount++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('取消')) {
          break;
        }
        failedCount++;
      }

      // 更新总体进度
      const progress = ((i + 1) / initialTasks.length) * 100;
      setOverallProgress(progress);

      // 添加延迟以避免浏览器阻塞
      if (i < initialTasks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsProcessing(false);
    setCurrentTaskIndex(-1);
  }, [isProcessing, tasks, initialTasks, processTask]);

  // 暂停处理
  const pauseProcess = useCallback(() => {
    setIsPaused(true);
    pausedRef.current = true;
  }, []);

  // 恢复处理
  const resumeProcess = useCallback(() => {
    setIsPaused(false);
    pausedRef.current = false;
  }, []);

  // 停止处理
  const stopProcess = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setIsPaused(false);
    pausedRef.current = false;
    setCurrentTaskIndex(-1);
  }, []);

  // 下载所有完成的任务
  const downloadAllCompleted = useCallback(() => {
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.result?.url);
    
    completedTasks.forEach((task, index) => {
      if (task.result?.url) {
        const link = document.createElement('a');
        link.href = task.result.url;
        link.download = `${eventName}_${task.name}_邀请函.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // 添加延迟以避免浏览器阻塞下载
        setTimeout(() => {
          link.click();
          document.body.removeChild(link);
        }, index * 200);
      }
    });
  }, [tasks, eventName]);

  // 重试失败的任务
  const retryFailedTasks = useCallback(() => {
    setTasks(prev => prev.map(task => 
      task.status === 'failed' 
        ? { ...task, status: 'pending', progress: 0, error: undefined }
        : task
    ));
  }, []);

  // 计算统计信息
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const failedTasks = tasks.filter(task => task.status === 'failed');
  const pendingTasks = tasks.filter(task => task.status === 'pending');

  const getStatusIcon = (status: BatchTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'processing':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: BatchTask['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'processing';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Modal
      title="📋 批量处理管理器"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text type="secondary">
              已完成: {completedTasks.length} | 失败: {failedTasks.length} | 待处理: {pendingTasks.length}
            </Text>
          </div>
          <Space>
            {failedTasks.length > 0 && (
              <Button onClick={retryFailedTasks} disabled={isProcessing}>
                重试失败任务
              </Button>
            )}
            {completedTasks.length > 0 && (
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={downloadAllCompleted}
                disabled={isProcessing}
              >
                下载全部 ({completedTasks.length})
              </Button>
            )}
            <Button onClick={onClose}>关闭</Button>
          </Space>
        </div>
      }
    >
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {/* 总体进度 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Title level={5}>总体进度</Title>
            <Text>{Math.round(overallProgress)}%</Text>
          </div>
          <Progress
            percent={overallProgress}
            status={failedTasks.length > 0 ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>

        {/* 控制按钮 */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Space size="large">
            {!isProcessing ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={startBatchProcess}
                disabled={tasks.length === 0}
              >
                开始处理
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button
                    icon={<PauseOutlined />}
                    onClick={pauseProcess}
                  >
                    暂停
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={resumeProcess}
                  >
                    继续
                  </Button>
                )}
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={stopProcess}
                >
                  停止
                </Button>
              </>
            )}
          </Space>
        </div>

        {/* 性能提示 */}
        {tasks.length > 10 && (
          <Alert
            message="性能提示"
            description="您正在批量处理大量任务，建议关闭其他不必要的浏览器标签页以获得最佳性能。"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Divider />

        {/* 任务列表 */}
        <List
          header={<div><strong>任务列表</strong></div>}
          dataSource={tasks}
          renderItem={(task, index) => (
            <List.Item
              style={{
                background: currentTaskIndex === index ? '#f0f9ff' : undefined,
                border: currentTaskIndex === index ? '1px solid #1890ff' : undefined,
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px'
              }}
            >
              <List.Item.Meta
                avatar={getStatusIcon(task.status)}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{task.name}</span>
                    <Tag color={getStatusColor(task.status)}>
                      {task.status === 'pending' ? '待处理' :
                       task.status === 'processing' ? '处理中' :
                       task.status === 'completed' ? '已完成' :
                       task.status === 'failed' ? '失败' : '暂停'}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    {task.status === 'processing' && (
                      <Progress
                        percent={task.progress}
                        size="small"
                        style={{ marginBottom: '4px' }}
                      />
                    )}
                    {task.error && (
                      <Text type="danger" style={{ fontSize: '12px' }}>
                        错误: {task.error}
                      </Text>
                    )}
                  </div>
                }
              />
              {task.status === 'completed' && task.result?.url && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = task.result!.url!;
                    link.download = `${eventName}_${task.name}_邀请函.png`;
                    link.click();
                  }}
                >
                  下载
                </Button>
              )}
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};

export default BatchProcessManager; 