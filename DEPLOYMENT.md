# QPLZ管理后台 部署指南

## 🚀 推荐部署方案

### 方案一：Vercel部署（推荐）

1. **Fork项目到您的GitHub**
   ```bash
   # 克隆项目
   git clone https://github.com/your-username/qplz-admin.git
   cd qplz-admin
   ```

2. **访问Vercel并部署**
   - 访问 [vercel.com](https://vercel.com)
   - 登录并连接GitHub账号
   - 点击"New Project"，选择您fork的仓库
   - 配置环境变量（可选）：
     ```
     VITE_DEEPSEEK_API_KEY=sk-your-api-key-here
     ```
   - 点击"Deploy"

3. **配置自定义域名（可选）**
   - 在Vercel项目设置中添加域名
   - 配置DNS记录

### 方案二：Netlify部署

1. **访问Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 连接GitHub仓库

2. **构建设置**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **环境变量配置**
   ```
   VITE_DEEPSEEK_API_KEY=sk-your-api-key-here
   ```

### 方案三：GitHub Pages部署

1. **创建GitHub Actions工作流**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v2
         
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '18'
         
         - name: Install dependencies
           run: npm install
         
         - name: Build
           run: npm run build
         
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

## 🔑 API密钥配置

### 方式一：环境变量（推荐用于生产环境）
在部署平台配置环境变量：
```
VITE_DEEPSEEK_API_KEY=sk-your-api-key-here
```

### 方式二：用户输入（推荐用于公开部署）
- 不设置环境变量
- 用户在应用的"配置面板 > API设置"中输入自己的API密钥
- API密钥存储在用户浏览器本地

## 📦 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **构建生产版本**
   ```bash
   npm run build
   ```

## 🌟 功能特点

- ✅ 纯前端应用，无需后端服务器
- ✅ 支持多种海报类型（竖图、邀请函、微信、小红书、活动行）
- ✅ AI驱动的海报设计
- ✅ 素材管理（图片、Logo、二维码、字体、颜色）
- ✅ 本地数据存储，隐私安全
- ✅ 响应式设计，支持各种设备

## 🔒 安全说明

- API密钥仅存储在用户浏览器本地，不会上传到服务器
- 所有活动数据存储在localStorage中，完全私密
- 适合个人或小团队使用

## 📞 获取支持

如有问题，请在GitHub仓库提交Issue。 

## 🚀 Vercel 部署

### 前置要求
- GitHub 账号
- Vercel 账号（可以用 GitHub 登录）

### 部署步骤

#### 1. 代码推送到 GitHub
```bash
# 初始化 git（如果还没有）
git init
git add .
git commit -m "项目初始化 - AI海报设计系统"

# 关联远程仓库
git remote add origin https://github.com/你的用户名/qplz-admin.git
git push -u origin main
```

#### 2. Vercel 部署
1. 访问 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 配置项目：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### 3. 环境变量配置（可选）
在 Vercel 项目设置中添加：
```env
VITE_API_MODE=local
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_API_KEY=your-api-key
```

#### 4. 部署完成
- Vercel 会自动构建和部署
- 获得生产环境 URL：`https://your-project.vercel.app`

## 🔧 本地开发

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

### 预览生产构建
```bash
npm run preview
```

## 📁 项目结构

```
qplz-admin/
├── public/                 # 静态资源
│   ├── ai.png             # AI头像
│   ├── me.png             # 用户头像
│   └── vite.svg           # 默认图标
├── src/
│   ├── components/        # React组件
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型定义
│   ├── fonts/             # 字体文件
│   └── hooks/             # 自定义Hooks
├── image/                 # 项目资源
│   ├── logo.png          # 品牌Logo
│   └── qrcode.png        # 示例二维码
├── package.json          # 项目依赖
├── vite.config.ts        # Vite配置
├── vercel.json           # Vercel部署配置
└── README.md             # 项目说明
```

## 🌟 核心功能

1. **活动管理** - 创建、编辑、删除活动
2. **AI海报生成** - 基于DeepSeek AI的智能海报设计
3. **多种海报类型** - 竖图、邀请函、微信、小红书、活动行
4. **报名管理** - 报名信息收集和管理
5. **批量生成** - 邀请函批量制作
6. **配置管理** - 颜色、字体、图片资源配置
7. **小程序集成** - 支持远程API模式（扩展功能）

## 🔐 安全配置

- 本地存储加密
- API密钥安全管理
- 跨站请求防护
- 输入验证和过滤

## 📈 性能优化

- 组件懒加载
- 图片压缩和缓存
- 字体文件优化
- 构建包分析和优化

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **UI组件库**: Ant Design 5
- **构建工具**: Vite 7
- **样式方案**: CSS + Ant Design
- **状态管理**: React Hooks
- **图像处理**: html2canvas
- **AI集成**: DeepSeek API

## 📞 支持

如果在部署过程中遇到问题：
1. 检查构建日志
2. 确认依赖版本兼容性
3. 验证环境变量配置
4. 查看 Vercel 文档

---

**部署成功后，您将拥有一个完整的AI海报设计管理系统！** 🎉 