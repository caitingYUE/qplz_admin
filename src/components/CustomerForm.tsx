import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, Rate, Switch, Button, message } from 'antd';
import { PlusOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import type { CustomerResource } from '../types';

const { TextArea } = Input;
const { Option } = Select;

interface CustomerFormProps {
  visible: boolean;
  customer?: CustomerResource;
  onCancel: () => void;
  onSubmit: (customer: Omit<CustomerResource, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  visible,
  customer,
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

  // 头像上传处理
  const handleUpload = (file: File) => {
    setUploading(true);
    // 这里可以添加真实的上传逻辑
    // 暂时使用本地URL
    const reader = new FileReader();
    reader.onload = (e) => {
      form.setFieldsValue({ photo: e.target?.result });
      setUploading(false);
      message.success('头像上传成功');
    };
    reader.readAsDataURL(file);
    return false; // 阻止默认上传行为
  };

  return (
    <Modal
      title={customer ? '编辑客户资源' : '添加客户资源'}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={customer}
      >
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入客户姓名' }]}
        >
          <Input placeholder="请输入客户姓名" prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item
          name="title"
          label="职位/头衔"
          rules={[{ required: true, message: '请输入客户职位或头衔' }]}
        >
          <Input placeholder="如：CEO、创始人、总监等" />
        </Form.Item>

        <Form.Item
          name="photo"
          label="头像照片"
        >
          <Upload
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            {form.getFieldValue('photo') ? (
              <img 
                src={form.getFieldValue('photo')} 
                alt="头像" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div>
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>
                  {uploading ? '上传中...' : '上传头像'}
                </div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="contact"
          label="联系方式"
        >
          <Input placeholder="手机号码或邮箱" />
        </Form.Item>

        <Form.Item
          name="wechat"
          label="微信号"
        >
          <Input placeholder="微信号" />
        </Form.Item>

        <Form.Item
          name="source"
          label="客户来源"
          rules={[{ required: true, message: '请选择客户来源' }]}
        >
          <Select placeholder="请选择客户来源">
            <Option value="朋友介绍">朋友介绍</Option>
            <Option value="活动认识">活动认识</Option>
            <Option value="社交媒体">社交媒体</Option>
            <Option value="商务合作">商务合作</Option>
            <Option value="行业会议">行业会议</Option>
            <Option value="其他">其他</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="简要说明"
        >
          <TextArea 
            rows={3} 
            placeholder="客户背景、合作意向、备注等信息..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="rating"
          label="客户星级"
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

export default CustomerForm; 