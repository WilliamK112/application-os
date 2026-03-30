# Application OS - Product Requirements Document (MVP)

## 1. 产品目标

Application OS 是一个面向求职者的“申请流程操作系统”，用于集中管理职位、申请进度、简历/作品集文档与后续跟进任务。

### 1.1 核心问题

当前求职流程常见痛点：

- 职位信息分散在多个平台，难以统一管理
- 申请状态靠手工记忆，容易漏跟进
- 针对不同岗位使用的简历版本混乱
- 缺少可视化总览，无法快速判断下一步行动

### 1.2 MVP 成功标准

- 用户能在 5 分钟内完成首批职位录入与申请追踪
- 用户可在 Dashboard 一眼看到关键指标（待投递、进行中、待跟进）
- 用户可按职位查看申请历史与文档关联关系
- 用户不会因信息分散导致错过 follow-up 时间点

---

## 2. 目标用户

### 2.1 主要用户画像

- 目标：在 1~3 个月内高效完成多岗位投递
- 特征：会同时投递 10~100 个职位，重视节奏和反馈闭环
- 诉求：希望形成“职位-申请-文档-跟进”一体化工作流

---

## 3. 用户旅程（MVP）

### Journey A：首次使用

1. 注册/登录
2. 完善 Profile（目标岗位、地点偏好、薪资范围）
3. 创建 3~5 条 Job 记录（公司、岗位、来源）
4. 为其中岗位创建 Application（状态：Applied）
5. 上传/关联 Document（Resume v1、Portfolio）
6. 添加 Follow-up 提醒（例如投递后第 5 天）

### Journey B：日常运营

1. 打开 Dashboard 查看本周指标
2. 进入 Applications 查看“待跟进”列表
3. 更新申请状态（Interview / Offer / Rejected）
4. 添加面试纪要与下一步任务
5. 在 Documents 中维护不同岗位使用版本

### Journey C：复盘

1. 按公司/岗位类型筛选申请结果
2. 查看文档版本与成功率关联
3. 总结下轮投递策略

---

## 4. MVP 范围

### 4.1 In Scope

- Dashboard 页面：关键指标与近期待办
- Jobs 页面：职位列表、基础字段展示
- Applications 页面：申请进度管理
- Documents 页面：文档记录与关联
- Settings 页面：个人资料与偏好配置
- 数据模型：users / profiles / jobs / applications / documents / followups
- 服务层：基于 mock repository 的读写接口（为后续数据库落地做准备）

### 4.2 Out of Scope（后续）

- 自动抓取岗位（浏览器插件/爬虫）
- 邮箱自动解析投递回执
- AI 自动改写简历与求职信
- 团队协作、看板评论
- 多租户企业版权限体系

---

## 5. 功能需求（MVP）

### 5.1 Dashboard

- 展示总职位数、总申请数、进行中申请数、待跟进数
- 展示最近 7 天活动摘要
- 快速入口：新增职位、登记申请、添加跟进

### 5.2 Jobs

- 展示职位列表（公司、岗位、地点、来源、薪资区间、状态）
- 支持关联 application 数量预览
- 支持按更新时间排序

### 5.3 Applications

- 展示申请列表（关联职位、状态、投递时间、最后更新时间）
- 可显示最近 follow-up 信息
- 支持状态枚举：Draft / Applied / Screening / Interview / Offer / Rejected / Withdrawn

### 5.4 Documents

- 记录文档元信息（名称、类型、版本、链接、标签）
- 可关联到 Job 或 Application
- 支持标记默认文档

### 5.5 Settings

- 基础个人资料
- 求职偏好（岗位关键词、地点、薪资预期、远程偏好）
- 通知偏好（邮件/站内）

---

## 6. 非功能要求（NFR）

### 6.1 性能

- 首屏可交互时间（TTI）目标 < 2.5s（本地与普通网络）
- 列表页面在 500 条记录以内响应流畅

### 6.2 可维护性

- TypeScript strict 模式
- 领域类型与服务接口分层，避免页面直接耦合数据源
- 统一 repository interface，便于切换 mock -> Prisma 实现

### 6.3 可靠性

- 所有状态字段采用枚举，减少脏数据
- 时间字段统一使用 ISO / UTC 存储

### 6.4 安全与隐私

- 用户数据隔离（按 userId 访问）
- 敏感字段（如 token）不落日志
- 仅保存最小必要求职信息

### 6.5 体验

- 页面信息密度高但层次清晰
- 关键操作可在 1~2 次点击内完成
- 空状态与示例数据友好，便于新用户快速上手

---

## 7. 验收标准

- [ ] 完成 Dashboard / Jobs / Applications / Documents / Settings 五个页面骨架
- [ ] 有可运行的 mock service 与类型定义
- [ ] Prisma schema 完整覆盖 6 张核心实体
- [ ] lint 通过
- [ ] 文档（PRD / Architecture / Roadmap）可用于团队协作与后续迭代规划
