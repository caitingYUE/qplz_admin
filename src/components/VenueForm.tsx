import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Upload, Rate, Switch, Button, message } from 'antd';
import { PlusOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import type { VenueResource } from '../types';

const { TextArea } = Input;

interface VenueFormProps {
  visible: boolean;
  venue?: VenueResource;
  onCancel: () => void;
  onSubmit: (venue: Omit<VenueResource, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const VenueForm: React.FC<VenueFormProps> = ({
  visible,
  venue,
  onCancel,
  onSubmit
}) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // 场地照片上传处理
  const handleUpload = (file: File) => {
    setUploading(true);
    // 这里可以添加真实的上传逻辑
    // 暂时使用本地URL
    const reader = new FileReader();
    reader.onload = (e) => {
      form.setFieldsValue({ photo: e.target?.result });
      setUploading(false);
      message.success('场地照片上传成功');
    };
    reader.readAsDataURL(file);
    return false; // 阻止默认上传行为
  };

  return (
    <Modal
      title={venue ? '编辑场地资源' : '添加场地资源'}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={venue}
      >
        <Form.Item
          name="name"
          label="场地名称"
          rules={[{ required: true, message: '请输入场地名称' }]}
        >
          <Input placeholder="请输入场地名称" prefix={<EnvironmentOutlined />} />
        </Form.Item>

        <Form.Item
          name="location"
          label="场地地点"
          rules={[{ required: true, message: '请输入场地地点' }]}
        >
          <TextArea 
            rows={2} 
            placeholder="详细地址，如：北京市朝阳区xxx大厦xx层" 
          />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="可容纳人数"
        >
          <InputNumber 
            placeholder="请输入可容纳人数" 
            min={1} 
            max={10000}
            style={{ width: '100%' }}
            addonAfter="人"
          />
        </Form.Item>

        <Form.Item
          name="photo"
          label="场地照片"
        >
          <Upload
            listType="picture-card"
            className="venue-photo-uploader"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            {form.getFieldValue('photo') ? (
              <img 
                src={form.getFieldValue('photo')} 
                alt="场地照片" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div>
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>
                  {uploading ? '上传中...' : '上传照片'}
                </div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="contactPerson"
          label="场地对接人"
          rules={[{ required: true, message: '请输入场地对接人姓名' }]}
        >
          <Input placeholder="对接人姓名" prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item
          name="contactPhone"
          label="对接人联系方式"
          rules={[
            { required: true, message: '请输入对接人联系方式' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
          ]}
        >
          <Input placeholder="对接人手机号码" prefix={<PhoneOutlined />} />
        </Form.Item>

        <Form.Item
          name="rating"
          label="场地星级"
        >
          <Rate />
        </Form.Item>

        <Form.Item
          name="hasCooperated"
          label="是否合作过"
          valuePropName="checked"
        >
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VenueForm; 