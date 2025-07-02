import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Typography,
  Space,
  message,
  Row,
  Col,
  Divider,
  Upload
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Event } from '../types';
import { useEvents } from '../hooks/useEvents';
import AIDesignDialog from './AIDesignDialog';
import PosterUpdateNotification from './PosterUpdateNotification';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EventForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [aiDialogVisible, setAiDialogVisible] = useState(false);
  const [posterUpdateVisible, setPosterUpdateVisible] = useState(false);
  const [originalEventData, setOriginalEventData] = useState<any>(null);
  const [changedFields, setChangedFields] = useState<string[]>([]);
  const [autoGenerateOnOpen, setAutoGenerateOnOpen] = useState(false);
  const { getEventById, createEvent, updateEvent } = useEvents();
  
  const isEditing = Boolean(id);

  // 处理嘉宾头像上传
  const handleAvatarUpload = (file: File, fieldPath: (string | number)[], setFieldValue: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFieldValue(fieldPath, result);
      message.success('头像上传成功');
    };
    reader.readAsDataURL(file);
    return false; // 阻止默认上传行为
  };

  // 删除嘉宾头像
  const removeAvatar = (fieldPath: (string | number)[], setFieldValue: any) => {
    setFieldValue(fieldPath, '');
    message.success('头像已删除');
  };

  useEffect(() => {
    if (isEditing && id) {
      // 从数据管理器获取真实数据
      const event = getEventById(id);
      if (event) {
        const formData = {
          name: event.name,
          subtitle: event.subtitle,
          timeRange: [
            dayjs(event.startTime),
            dayjs(event.endTime)
          ],
          location: event.location,
          maxParticipants: event.maxParticipants,
          description: event.description,
          fee: event.fee,
          guests: event.guests || [],
        };
        
        form.setFieldsValue(formData);
        
        // 保存原始数据用于变更检测
        setOriginalEventData({
          name: event.name,
          subtitle: event.subtitle,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          maxParticipants: event.maxParticipants,
          description: event.description,
          fee: event.fee,
          guests: event.guests || [],
        });

        // 检查是否从活动列表的"生成海报"按钮进入
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('openPoster') === 'true') {
          // 延迟一下让表单数据加载完成
          setTimeout(() => {
            setAiDialogVisible(true);
          }, 100);
        }
      } else {
        message.error('活动不存在');
        navigate('/events');
      }
    }
  }, [isEditing, form, id, getEventById, navigate, location.search]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const eventData = {
        ...values,
        startTime: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
        status: 'draft' as Event['status'], // 默认为草稿状态
      };
      delete eventData.timeRange;

      let result;
      if (isEditing && id) {
        // 更新活动 - 直接更新，不检测变更
        result = await updateEvent(id, eventData);
      } else {
        // 创建活动
        result = await createEvent(eventData);
      }

      if (result.success) {
        message.success(isEditing ? '活动更新成功！' : '活动创建成功！');
        // 直接返回列表页面，不检测海报变更
        navigate('/events');
      } else {
        message.error(result.error || '操作失败，请重试');
      }
    } catch (error) {
      console.error('保存活动失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePoster = () => {
    const values = form.getFieldsValue();
    if (!values.name) {
      message.warning('请先填写活动名称');
      return;
    }
    
    // 如果是编辑模式，检测活动信息是否有变更
    if (isEditing && id) {
      const changes = detectEventChanges(values);
      if (changes.length > 0 && hasExistingPoster()) {
        setChangedFields(changes);
        setPosterUpdateVisible(true);
        return; // 等待用户选择更新方式
      }
    }
    
    // 如果没有变更或不是编辑模式，直接打开AI设计对话框
    setAiDialogVisible(true);
  };
  
  // 获取当前表单数据用于AI对话框
  const getCurrentEventData = () => {
    const values = form.getFieldsValue();
    return {
      name: values.name || '',
      subtitle: values.subtitle || '',
      startTime: values.timeRange ? values.timeRange[0].format('YYYY-MM-DD HH:mm:ss') : '',
      endTime: values.timeRange ? values.timeRange[1].format('YYYY-MM-DD HH:mm:ss') : '',
      location: values.location || '',
      maxParticipants: values.maxParticipants ? values.maxParticipants.toString() : '',
      description: values.description || '',
      fee: values.fee || '',
      guests: values.guests?.map((guest: any) => `${guest.name} - ${guest.title}`).join(', ') || ''
    };
  };

  // 检测活动信息变更
  const detectEventChanges = (newValues: any) => {
    if (!originalEventData || !isEditing) {
      return [];
    }

    const changes: string[] = [];
    const fieldLabels: { [key: string]: string } = {
      name: '活动名称',
      subtitle: '活动副标题',
      startTime: '开始时间',
      endTime: '结束时间',
      location: '活动地点',
      maxParticipants: '人员数量上限',
      description: '活动详细内容介绍',
      fee: '活动费用',
      guests: '活动嘉宾'
    };

    const newData = {
      name: newValues.name,
      subtitle: newValues.subtitle || '',
      startTime: newValues.timeRange ? newValues.timeRange[0].format('YYYY-MM-DD HH:mm:ss') : '',
      endTime: newValues.timeRange ? newValues.timeRange[1].format('YYYY-MM-DD HH:mm:ss') : '',
      location: newValues.location || '',
      maxParticipants: newValues.maxParticipants || '',
      description: newValues.description || '',
      fee: newValues.fee || '',
      guests: JSON.stringify(newValues.guests || [])
    };

    const originalData = {
      ...originalEventData,
      guests: JSON.stringify(originalEventData.guests || [])
    };

    Object.keys(newData).forEach(key => {
      if ((newData as any)[key] !== (originalData as any)[key]) {
        changes.push(fieldLabels[key] || key);
    }
    });

    return changes;
  };

  // 检查是否存在已生成的海报
  const hasExistingPoster = () => {
    const chatHistory = localStorage.getItem(`chatHistory_${id}`);
    return chatHistory && JSON.parse(chatHistory).some((msg: any) => msg.posterHtml);
  };

  // 处理海报更新选择
  const handlePosterUpdateChoice = (choice: 'modify' | 'regenerate') => {
    setPosterUpdateVisible(false);
    
    if (choice === 'modify') {
      // 在原海报上修改 - 直接更新HTML代码中的对应元素
      message.info('正在更新现有海报...');
      // 这里可以实现简单的HTML文本替换逻辑
      // 或者调用专门的海报修改API
    } else if (choice === 'regenerate') {
      // 重新生成海报 - 打开AI对话框并自动开始生成
      setAiDialogVisible(true);
      // 设置自动生成标识，让AI对话框知道要自动开始生成
      setTimeout(() => {
        setAutoGenerateOnOpen(true);
      }, 100);
    }
  };

  // 处理AI对话框关闭
  const handleAiDialogClose = () => {
    setAiDialogVisible(false);
    // 重置自动生成标识
    setAutoGenerateOnOpen(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <Title level={2} style={{ margin: 0 }}>{isEditing ? '编辑活动' : '创建活动'}</Title>
        <Space>
          <Button onClick={() => navigate('/events')}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<PictureOutlined />}
            onClick={handleGeneratePoster}
            style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
          >
            生成海报
          </Button>
        </Space>
      </div>

      <Card style={{ flex: 1, overflow: 'auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="活动名称"
                name="name"
                rules={[{ required: true, message: '请输入活动名称' }]}
              >
                <Input placeholder="请输入活动名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="活动副标题"
                name="subtitle"
              >
                <Input placeholder="请输入活动副标题" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="活动时间"
                name="timeRange"
                rules={[{ required: true, message: '请选择活动时间' }]}
              >
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder={['开始时间', '结束时间']}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="活动地点"
                name="location"
                rules={[{ required: true, message: '请输入活动地点' }]}
              >
                <Input placeholder="请输入活动地点" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="人员数量上限"
                name="maxParticipants"
                rules={[{ required: true, message: '请输入人员数量上限' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="请输入人员数量上限"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="活动费用"
                name="fee"
              >
                <InputNumber
                  placeholder="请输入活动费用"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="活动详细内容介绍"
            name="description"
            rules={[{ required: true, message: '请输入活动详细内容介绍' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述活动内容、流程、注意事项等"
            />
          </Form.Item>

          <Divider>活动嘉宾信息</Divider>

          <Form.List name="guests">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`嘉宾 ${name + 1}`}
                    extra={
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        删除
                      </Button>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="姓名"
                          rules={[{ required: true, message: '请输入嘉宾姓名' }]}
                        >
                          <Input placeholder="请输入嘉宾姓名" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'title']}
                          label="职位/头衔"
                          rules={[{ required: true, message: '请输入职位或头衔' }]}
                        >
                          <Input placeholder="请输入职位或头衔" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'avatar']}
                          label="头像"
                        >
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => {
                              const prevAvatar = prevValues.guests?.[name]?.avatar;
                              const currentAvatar = currentValues.guests?.[name]?.avatar;
                              return prevAvatar !== currentAvatar;
                            }}
                          >
                            {({ getFieldValue, setFieldValue }) => {
                              const avatarValue = getFieldValue(['guests', name, 'avatar']);
                              
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {avatarValue ? (
                                    // 显示已上传的头像
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      padding: '8px',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      background: '#fafafa'
                                    }}>
                                      <img 
                                        src={avatarValue} 
                                        alt="嘉宾头像" 
                                        style={{ 
                                          width: '40px', 
                                          height: '40px', 
                                          objectFit: 'cover',
                                          borderRadius: '50%',
                                          border: '1px solid #d9d9d9'
                                        }} 
                                      />
                                      <span style={{ flex: 1, fontSize: '12px', color: '#666' }}>
                                        头像已上传
                                      </span>
                                      <Button 
                                        type="link" 
                                        size="small"
                                        danger
                                        onClick={() => removeAvatar(['guests', name, 'avatar'], setFieldValue)}
                                      >
                                        删除
                                      </Button>
                                    </div>
                                  ) : (
                                    // 显示上传按钮
                                    <Upload
                                      name="avatar"
                                      maxCount={1}
                                      accept="image/*"
                                      showUploadList={false}
                                      beforeUpload={(file) => {
                                        handleAvatarUpload(file, ['guests', name, 'avatar'], setFieldValue);
                                        return false;
                                      }}
                                    >
                                      <Button 
                                        icon={<UploadOutlined />} 
                                        size="small"
                                        style={{ width: '100%' }}
                                      >
                                        上传头像
                                      </Button>
                                    </Upload>
                                  )}
                                  <div style={{ fontSize: '11px', color: '#999' }}>
                                    支持 JPG、PNG 格式
                                  </div>
                                </div>
                              );
                            }}
                          </Form.Item>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      {...restField}
                      name={[name, 'bio']}
                      label="个人简介"
                    >
                      <TextArea
                        rows={2}
                        placeholder="请输入嘉宾个人简介（可选）"
                      />
                    </Form.Item>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    style={{ width: '100%' }}
                  >
                    添加嘉宾
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 32 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ backgroundColor: '#b01c02', borderColor: '#b01c02' }}
              >
                {isEditing ? '更新活动' : '创建活动'}
              </Button>
              <Button onClick={() => navigate('/events')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      
      {/* AI海报设计对话框 */}
      <AIDesignDialog
        visible={aiDialogVisible}
        onClose={handleAiDialogClose}
        eventData={getCurrentEventData()}
        eventId={id}
        autoGenerateOnOpen={autoGenerateOnOpen}
      />

      {/* 海报更新提示 */}
      <PosterUpdateNotification
        visible={posterUpdateVisible}
        onClose={() => setPosterUpdateVisible(false)}
        onModifyExisting={() => handlePosterUpdateChoice('modify')}
        onRegenerateNew={() => handlePosterUpdateChoice('regenerate')}
        eventName={getCurrentEventData().name}
        changedFields={changedFields}
      />
    </div>
  );
};

export default EventForm; 