import React, { useState } from 'react';
import { Modal, Steps, Button, Card, Typography, Space, Divider } from 'antd';
import { 
  QuestionCircleOutlined, 
  PictureOutlined, 
  QrcodeOutlined, 
  BgColorsOutlined,
  FontSizeOutlined,
  RobotOutlined,
  DownloadOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

interface UserGuideProps {
  visible: boolean;
  onClose: () => void;
  currentStep?: number;
}

const UserGuide: React.FC<UserGuideProps> = ({
  visible,
  onClose,
  currentStep = 0
}) => {
  const [current, setCurrent] = useState(currentStep);

  const guideSteps = [
    {
      title: '欢迎使用',
      content: (
        <div>
          <Title level={4}>🎉 欢迎使用QPLZ管理后台！</Title>
          <Paragraph>
            这是一个专为前排落座女性社区设计的活动管理和AI海报生成平台。
            通过简单的操作，您就能轻松创建活动并生成精美的海报。
          </Paragraph>
          
          <Card style={{ margin: '16px 0', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>🚀</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#52c41a' }}>新用户快速开始</div>
                <div style={{ fontSize: '14px', color: '#389e0d' }}>
                  创建活动 → 生成海报 → 发布活动，三步搞定！
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      title: '基础操作流程',
      content: (
        <div>
          <Title level={4}>📋 完整操作流程</Title>
          <Paragraph>
            按照以下步骤，您可以快速上手整个系统：
          </Paragraph>
          
          <div style={{ background: '#f8f9ff', padding: '20px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ 
                background: '#1890ff', 
                color: '#fff', 
                borderRadius: '50%', 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>1</div>
              <strong>创建活动</strong>
            </div>
            <div style={{ marginLeft: '32px', color: '#666' }}>
              点击左侧"创建活动"菜单，填写活动基本信息（名称、时间、地点、嘉宾等）
            </div>
          </div>

          <div style={{ background: '#f8f9ff', padding: '20px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ 
                background: '#52c41a', 
                color: '#fff', 
                borderRadius: '50%', 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>2</div>
              <strong>设计海报</strong>
            </div>
            <div style={{ marginLeft: '32px', color: '#666' }}>
              • 在活动编辑页面点击"重新生成海报"按钮，或者<br/>
              • 在活动列表中点击更多操作 → "生成海报"
            </div>
          </div>

          <div style={{ background: '#f8f9ff', padding: '20px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ 
                background: '#faad14', 
                color: '#fff', 
                borderRadius: '50%', 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>3</div>
              <strong>管理活动</strong>
            </div>
            <div style={{ marginLeft: '32px', color: '#666' }}>
              在"活动管理"页面查看、编辑、发布或下线您的活动
            </div>
          </div>
        </div>
      )
    },
    {
      title: '海报设计配置',
      content: (
        <div>
          <Title level={4}>🎨 海报设计自定义配置</Title>
          <Paragraph>
            在海报设计页面，您可以上传自定义资源来打造独特的品牌形象：
          </Paragraph>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card size="small">
              <Space>
                <PictureOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <div>
                  <strong>参考图片</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    上传您喜欢的设计参考图，AI会学习其风格和布局
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small">
              <Space>
                <PictureOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <div>
                  <strong>品牌Logo</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    上传您的品牌Logo，确保海报体现专业品牌形象
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small">
              <Space>
                <QrcodeOutlined style={{ color: '#faad14', fontSize: '18px' }} />
                <div>
                  <strong>二维码</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    上传活动报名或推广二维码，方便用户扫码参与
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small">
              <Space>
                <BgColorsOutlined style={{ color: '#f759ab', fontSize: '18px' }} />
                <div>
                  <strong>品牌色彩</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    添加您的品牌主色调，让海报风格与品牌保持一致
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small">
              <Space>
                <FontSizeOutlined style={{ color: '#722ed1', fontSize: '18px' }} />
                <div>
                  <strong>品牌字体</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    上传.ttf/.otf字体文件，创建独特的字体效果
                  </div>
                </div>
              </Space>
            </Card>
          </Space>
        </div>
      )
    },
    {
      title: 'AI对话设计',
      content: (
        <div>
          <Title level={4}>🤖 智能对话式设计</Title>
          <Paragraph>
            通过自然语言与AI设计师对话，轻松实现专业海报设计：
          </Paragraph>
          
          <div style={{ background: '#f6f6f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#52c41a' }}>✅ 有效指令示例：</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>"请使用更温暖的色调，主色改为橙色系"</li>
              <li>"标题字体太小了，请加大并居中显示"</li>
              <li>"整体风格改成简约现代风，减少装饰元素"</li>
              <li>"二维码位置改到右下角，logo放在左上角"</li>
            </ul>
          </div>

          <div style={{ background: '#fff2e8', padding: '16px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#faad14' }}>❌ 避免模糊指令：</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>"好看一点" （过于模糊）</li>
              <li>"调整CSS的margin-top" （技术术语）</li>
              <li>"既要简约又要丰富" （相互矛盾）</li>
            </ul>
          </div>

          <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#1890ff' }}>💡 生成过程中的操作：</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>生成过程中可以点击"暂停"按钮中断生成</li>
              <li>如果生成失败，可以点击刷新按钮重新生成</li>
              <li>完成后可以继续对话进行修改调整</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleClose = () => {
    setCurrent(0);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QuestionCircleOutlined style={{ color: '#1890ff' }} />
          <span>AI海报设计使用指南</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={current === 0} onClick={prev}>
            上一步
          </Button>
          <div>
            <Button onClick={handleClose} style={{ marginRight: 8 }}>
              跳过引导
            </Button>
            {current < guideSteps.length - 1 ? (
              <Button type="primary" onClick={next}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleClose}>
                开始使用
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ padding: '16px 0' }}>
        <Steps current={current} size="small" style={{ marginBottom: '24px' }}>
          {guideSteps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        <div style={{ minHeight: '400px' }}>
          {guideSteps[current].content}
        </div>
      </div>
    </Modal>
  );
};

export default UserGuide; 