# QPLZ 管理后台

前排落座女性社区管理后台，基于 React + TypeScript + Ant Design 构建。

## 🚀 快速部署

您可以将这个AI海报设计系统部署到以下平台，让更多人使用：

### Vercel部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/qplz-admin)

1. 点击上方按钮或访问 [vercel.com](https://vercel.com)
2. 连接您的GitHub账号并导入此仓库
3. 配置环境变量（可选）：
   ```
   VITE_DEEPSEEK_API_KEY=sk-your-api-key-here
   ```
4. 点击Deploy，几分钟后即可完成部署

### Netlify部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/qplz-admin)

1. 点击上方按钮或访问 [netlify.com](https://netlify.com)
2. 连接GitHub仓库
3. 构建设置：`npm run build`，发布目录：`dist`
4. 配置环境变量（可选）：`VITE_DEEPSEEK_API_KEY`

### GitHub Pages部署

1. Fork这个仓库到您的GitHub账号
2. 在仓库设置中启用GitHub Pages
3. 创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🔑 API密钥配置

### 获取DeepSeek API密钥

1. 访问 [DeepSeek开放平台](https://platform.deepseek.com)
2. 注册账号并登录
3. 在控制台创建API密钥
4. 复制形如 `sk-xxx` 的API密钥

### 配置方式

#### 方式一：环境变量（推荐用于私人部署）
在部署平台配置环境变量：
```
VITE_DEEPSEEK_API_KEY=sk-your-api-key-here
```

#### 方式二：用户自定义（推荐用于公开部署）
- 不设置环境变量
- 用户在应用中点击"配置"→"API设置"
- 输入自己的API密钥，仅存储在浏览器本地

## 🌟 功能特性

### AI海报设计系统
- **智能生成**: 基于DeepSeek AI的海报自动设计
- **多种类型**: 支持竖图海报、邀请函、微信海报、小红书海报、活动行海报
- **素材管理**: 上传Logo、二维码、参考图片，配置品牌色彩和字体
- **实时预览**: 所见即所得的海报预览效果
- **一键导出**: 高清PNG格式海报下载

### 活动管理功能

### 1. 仪表板 (Dashboard)
- 活动统计数据展示
- 报名人数统计
- 最近活动和报名记录

### 2. 活动管理 (Event Management)
- **创建活动**: 支持填写活动名称、时间、地点、人员数量上限、详细介绍等
- **编辑活动**: 修改已创建的活动信息
- **活动嘉宾**: 支持添加多个活动嘉宾信息（姓名、职位、头像、简介）
- **活动状态**: 草稿/已发布/已下线状态管理
- **活动列表**: 查看所有活动，支持发布、预览、下线、删除操作

### 3. 海报编辑器 (Poster Editor)
- **可视化编辑**: 拖拽式海报设计界面
- **文本元素**: 添加和编辑文本，支持字体、颜色、大小调整
- **图片元素**: 上传和编辑图片
- **画布设置**: 自定义画布尺寸和背景
- **一键生成**: 根据活动信息自动生成海报
- **导出功能**: 导出高清PNG格式海报

### 4. 报名管理 (Registration Management)
- **报名列表**: 查看所有报名记录
- **筛选搜索**: 按活动、姓名、状态、时间范围筛选
- **报名详情**: 查看报名者详细信息
- **数据导出**: 导出CSV格式的报名数据
- **统计分析**: 报名数据统计图表

## 技术栈

- **前端框架**: React 19 + TypeScript
- **UI 组件库**: Ant Design 5.x
- **路由管理**: React Router DOM
- **构建工具**: Vite
- **样式处理**: CSS + Ant Design
- **图标库**: @ant-design/icons
- **海报生成**: html2canvas
- **日期处理**: dayjs

## 安装运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 项目结构

```
QPLZ-Admin/
├── src/
│   ├── components/          # 组件目录
│   │   ├── Dashboard.tsx    # 仪表板组件
│   │   ├── EventList.tsx    # 活动列表组件
│   │   ├── EventForm.tsx    # 活动表单组件
│   │   ├── PosterEditor.tsx # 海报编辑器组件
│   │   └── RegistrationList.tsx # 报名管理组件
│   ├── types/               # 类型定义
│   │   └── index.ts         # 主要类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── package.json             # 项目配置
└── README.md               # 项目说明
```

## 使用说明

### 1. 创建活动
1. 点击左侧菜单"创建活动"
2. 填写活动基本信息（名称、时间、地点、人数上限）
3. 填写活动详细描述
4. 添加活动嘉宾信息（可选）
5. 点击"创建活动"保存

### 2. 生成海报
1. 在活动表单页面点击"生成海报"按钮
2. 或在活动列表中点击"编辑海报"
3. 使用海报编辑器添加文本和图片元素
4. 调整元素位置、大小、样式
5. 点击"导出海报"下载

### 3. 管理报名
1. 点击左侧菜单"报名管理"
2. 查看所有报名记录
3. 使用筛选功能查找特定报名
4. 点击"查看"按钮查看报名详情
5. 点击"导出数据"下载CSV文件

## 注意事项

1. **数据存储**: 当前版本使用本地模拟数据，实际使用时需要连接后端API
2. **海报模板**: 海报模板保存在浏览器本地存储中
3. **文件上传**: 图片上传功能需要配置文件存储服务
4. **权限管理**: 建议在生产环境中添加用户认证和权限控制

## 开发计划

- [ ] 后端API集成
- [ ] 用户认证系统
- [ ] 权限管理
- [ ] 数据可视化图表
- [ ] 消息通知系统
- [ ] 移动端适配

## 联系方式

如有问题或建议，请联系开发团队。 