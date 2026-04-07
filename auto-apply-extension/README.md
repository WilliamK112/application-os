# Auto-Apply Helper - Chrome Extension

自动填充求职申请表，一键投递，追踪申请状态。

## 功能

### v1.0.0
- ✅ 自动检测 ATS 平台（Workday, Greenhouse, Ashby, SmartRecruiters, Taleo, iCIMS）
- ✅ 一键填充用户 profile（姓名、邮箱、电话、学校等）
- ✅ 现代化 UI 设计

### 后续版本
- 📄 自动上传 Resume
- ✅ 自动提交申请
- 📊 申请状态追踪
- 🔗 同步到 application-os 后端

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `auto-apply-extension` 文件夹

## 使用

1. 打开招聘网站（支持的 ATS 平台）
2. 点击扩展图标打开 popup
3. 点击「Auto-Fill Form」自动填充表单
4. 手动检查后提交

## 项目结构

```
auto-apply-extension/
├── manifest.json      # 扩展配置
├── content.js         # 内容脚本（页面注入）
├── background.js      # 后台服务
├── popup.html         # 弹出窗口
├── popup.js           # popup 逻辑
├── icons/             # 图标
└── README.md
```

## 用户 Profile

默认使用 `JOB_APPLICATION_WORKFLOW_HANDBOOK.docx` 中的配置：
- Name: Ching-Wei Kang
- Email: ckang53@wisc.edu
- Phone: (347) 866-8326
- School: UW-Madison
- Major: CS/Data Science
- Graduation: May 2027