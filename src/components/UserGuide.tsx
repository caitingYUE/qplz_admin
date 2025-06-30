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
      title: '设计工具栏',
      content: (
        <div>
          <Title level={4}>🛠️ 丰富的设计资源</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Space>
                <PictureOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <div>
                  <strong>参考图片</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    上传1-5张参考图，AI会学习其风格和布局进行设计
                  </div>
                </div>
              </Space>
            </Card>
            
            <Card size="small">
              <Space>
                <QrcodeOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <div>
                  <strong>二维码生成</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    输入文本自动生成二维码，支持活动链接、联系方式等
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small">
              <Space>
                <BgColorsOutlined style={{ color: '#faad14', fontSize: '18px' }} />
                <div>
                  <strong>品牌主题色</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    设置品牌色彩，保持视觉一致性，全局复用
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small">
              <Space>
                <FontSizeOutlined style={{ color: '#722ed1', fontSize: '18px' }} />
                <div>
                  <strong>自定义字体</strong>
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
        </div>
      )
    },
    {
      title: '海报类型选择',
      content: (
        <div>
          <Title level={4}>📐 四种专业海报类型</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>📄</div>
                <div>
                  <strong>竖图海报 (800×1200px)</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    适用于一般活动宣传，包含完整活动信息 + 二维码 + Logo
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>💌</div>
                <div>
                  <strong>竖图邀请函 (800×1200px)</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    正式邀请场景，突出邀请感和仪式感，支持批量生成
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>💬</div>
                <div>
                  <strong>微信公众号横图 (900×383px)</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    适合微信分享，信息简洁，视觉效果突出
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>📱</div>
                <div>
                  <strong>小红书海报 (1242×1660px)</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    适合小红书传播，视觉效果优先，无二维码
                  </div>
                </div>
              </div>
            </Card>
          </Space>
        </div>
      )
    },
    {
      title: '导出和分享',
      content: (
        <div>
          <Title level={4}>📥 多格式导出功能</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <Space>
                <DownloadOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <div>
                  <strong>PNG图片导出</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    高质量图片文件，适合打印和社交媒体分享
                  </div>
                </div>
              </Space>
            </Card>

            <Card>
              <Space>
                <EditOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <div>
                  <strong>HTML源码导出</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    完整代码文件，可嵌入网站或进一步编辑
                  </div>
                </div>
              </Space>
            </Card>

            <Card>
              <Space>
                <RobotOutlined style={{ color: '#722ed1', fontSize: '18px' }} />
                <div>
                  <strong>邀请函批量生成</strong>
                  <div style={{ color: '#666', fontSize: '13px' }}>
                    添加多个邀请人姓名，自动生成个性化邀请函
                  </div>
                </div>
              </Space>
            </Card>
          </Space>

          <Divider />
          
          <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '8px' }}>
            <Title level={5} style={{ margin: 0, marginBottom: '8px' }}>
              💡 使用小贴士
            </Title>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>建议先设置好设计资源（Logo、主题色等）再开始生成</li>
              <li>可以多轮对话逐步完善设计，每次调整一个方面</li>
              <li>设计资源会全局保存，切换活动时自动复用</li>
              <li>邀请函生成后记得检查邀请人姓名是否正确</li>
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