import React from 'react';
import { Form, Input, Select, DatePicker, Card, Button, Space, Typography } from 'antd';
import { BulbOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface EventPlanningData {
  theme: string;
  description: string;
  participantCount: string;
  userProfile?: string;
  requirements?: string;
  venueNeeds?: string;
  city: string;
  eventDate?: string;
  duration: string;
  organizerName?: string;
  organizerDescription?: string;
}

interface EventPlanningFormProps {
  onSubmit: (data: EventPlanningData) => void;
  isGenerating: boolean;
  initialData?: EventPlanningData;
}

const EventPlanningForm: React.FC<EventPlanningFormProps> = ({
  onSubmit,
  isGenerating,
  initialData
}) => {
  const [form] = Form.useForm();

  // 当有初始数据时，回显到表单
  React.useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        eventDate: initialData.eventDate ? dayjs(initialData.eventDate) : undefined
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: any) => {
    const formData: EventPlanningData = {
      theme: values.theme,
      description: values.description,
      participantCount: values.participantCount,
      userProfile: values.userProfile,
      requirements: values.requirements,
      venueNeeds: values.venueNeeds,
      city: values.city,
      eventDate: values.eventDate?.format('YYYY-MM-DD'),
      duration: values.duration,
      organizerName: values.organizerName,
      organizerDescription: values.organizerDescription
    };
    onSubmit(formData);
  };

  const participantOptions = [
    { value: '30以下', label: '小型活动（30人以下）' },
    { value: '30-80', label: '中型活动（30-80人）' },
    { value: '80-200', label: '大型活动（80-200人）' },
    { value: '200-500', label: '超大型活动（200-500人）' },
    { value: '500以上', label: '特大型活动（500人以上）' }
  ];

  const durationOptions = [
    { value: '半天以内', label: '半天以内（2-4小时）' },
    { value: '1天', label: '1天（全天活动）' },
    { value: '2天', label: '2天（周末活动）' },
    { value: '3天', label: '3天（小型会议）' },
    { value: '>3天', label: '3天以上（大型会议）' }
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BulbOutlined style={{ color: '#b01c02' }} />
          <span>活动信息收集</span>
        </div>
      }
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary">
          请详细填写您的活动需求，我们将基于这些信息为您生成专业的活动策划方案
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        style={{ maxWidth: '1000px', margin: '0 auto' }}
      >
        {/* 第一行：基本信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Form.Item
            name="theme"
            label={<><span style={{ color: 'red' }}>*</span> 活动主题</>}
            rules={[{ required: true, message: '请输入活动主题' }]}
          >
            <Input 
              placeholder="例如：女性科技创新论坛"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="participantCount"
            label={<><span style={{ color: 'red' }}>*</span> 预计参与人数</>}
            rules={[{ required: true, message: '请选择参与人数' }]}
          >
            <Select 
              placeholder="选择活动规模"
              size="large"
            >
              {participantOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="city"
            label={<><span style={{ color: 'red' }}>*</span> 举办城市</>}
            rules={[{ required: true, message: '请输入举办城市' }]}
          >
            <Input 
              placeholder="例如：北京、上海、深圳"
              size="large"
            />
          </Form.Item>
        </div>

        {/* 第二行：时间信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Form.Item
            name="duration"
            label={<><span style={{ color: 'red' }}>*</span> 活动持续时间</>}
            rules={[{ required: true, message: '请选择活动持续时间' }]}
          >
            <Select 
              placeholder="选择活动时长"
              size="large"
            >
              {durationOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="eventDate"
            label="期望举办日期"
          >
            <DatePicker 
              placeholder="选择日期（可选）"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        {/* 第三行：主办方信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Form.Item
            name="organizerName"
            label="主办方名称"
          >
            <Input 
              placeholder="例如：QPLZ女性社区、XX科技公司"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="organizerDescription"
            label="主办方介绍"
          >
            <TextArea 
              placeholder="简要介绍主办方的背景、理念和特色..."
              rows={2}
            />
          </Form.Item>
        </div>

        {/* 第四行：活动描述 */}
        <Form.Item
          name="description"
          label={<><span style={{ color: 'red' }}>*</span> 活动描述</>}
          rules={[{ required: true, message: '请输入活动描述' }]}
          style={{ marginBottom: '24px' }}
        >
          <TextArea 
            placeholder="详细描述您想要举办的活动内容、目的和期望效果..."
            rows={4}
            style={{ fontSize: '14px' }}
          />
        </Form.Item>

        {/* 第五行：可选信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Form.Item
            name="userProfile"
            label="目标参与者画像"
          >
            <TextArea 
              placeholder="例如：25-40岁职场女性，主要是IT行业从业者和创业者..."
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="特殊要求"
          >
            <TextArea 
              placeholder="对活动的特殊要求、期望亮点或必须包含的环节..."
              rows={3}
            />
          </Form.Item>
        </div>

        {/* 第六行：场地需求 */}
        <Form.Item
          name="venueNeeds"
          label="场地需求"
          style={{ marginBottom: '32px' }}
        >
          <TextArea 
            placeholder="对场地的具体要求，如：地理位置、设施配备、风格偏好等..."
            rows={2}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: '30px', textAlign: 'center' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large"
            loading={isGenerating}
            icon={isGenerating ? <LoadingOutlined /> : <BulbOutlined />}
            style={{ 
              backgroundColor: '#b01c02',
              borderColor: '#b01c02',
              minWidth: '200px',
              height: '48px',
              fontSize: '16px'
            }}
          >
            {isGenerating ? '正在生成方案...' : '生成活动方案'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EventPlanningForm; 