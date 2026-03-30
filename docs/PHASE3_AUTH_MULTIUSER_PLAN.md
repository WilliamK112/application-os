# Phase 3 实施计划：认证系统与多用户隔离

## 目标
在不破坏现有 MVP 能力（Jobs / Applications 可用）的前提下，引入最小可行认证与用户数据隔离，确保所有读写都绑定当前登录用户。

---

## 1) 范围（Scope）

### In Scope
1. 认证接入（推荐 NextAuth/Auth.js）
   - Email + Password（Credentials）
   - 会话管理（JWT Session）
2. 路由访问控制
   - 未登录访问业务页自动重定向到登录页
3. 服务层用户隔离
   - 服务层接口统一接收 `currentUserId`
   - 所有 repository 查询/写入强制追加 `userId` 条件
4. 最小用户初始化
   - 首次登录后创建 Profile（若不存在）
5. 测试补齐
   - 增加 userId 隔离集成测试（A 用户不能读/改 B 用户数据）

### Out of Scope（留到后续）
- OAuth 社交登录（Google/GitHub）
- 细粒度 RBAC（管理员/协作者）
- 团队空间与组织多租户模型
- 复杂风控（设备管理、二次验证）

---

## 2) Session 策略（最小可行）

选择：**Auth.js + JWT Session**

原因：
- 与 Next.js App Router 兼容好
- 初期无需引入额外 session 存储表
- 在服务端（Server Actions / RSC）读取会话简单

会话设计：
- JWT 内包含：`sub`（userId）、`email`、`name`
- 服务端统一通过 `auth()`（或封装 `getCurrentUser()`）获取当前用户
- 无会话时直接 `throw` 业务错误或重定向登录页

安全要点：
- `AUTH_SECRET` 必填
- Password 仅存 hash（bcrypt/argon2）
- 认证失败错误信息统一（避免账号枚举）

---

## 3) 数据与 Schema 最小改动

当前 schema 已有 `User` 与 `userId` 关联，Phase 3 仅补最小认证字段：

1. `User` 增加：
   - `passwordHash String?`（若走 Credentials）
   - `lastLoginAt DateTime?`
2. 索引与唯一约束核对：
   - `User.email` 保持 unique
   - `Job.userId`、`Application.userId`、`Document.userId`、`FollowUp.userId` 建议补常用索引（若尚未添加）
3. 迁移与生成：
   - `prisma migrate dev`
   - `npx prisma generate`

> 若后续切换数据库 session，再追加 Auth.js 官方 Account/Session/VerificationToken 表。

---

## 4) 服务层与 Repository 改造点

### 4.1 服务层
- 所有 read/write API 增加 `currentUserId` 入参
- 移除默认硬编码 userId（如 `demo-user`）
- Dashboard 聚合查询按 `currentUserId` 过滤

### 4.2 Repository 层
- 查询接口统一要求 userId：
  - `listJobs(userId, ...)`
  - `listApplications(userId, ...)`
  - `createJob(userId, input)` 等
- 更新/删除操作 where 条件必须包含：`id + userId`

### 4.3 Server Actions
- 在 action 开头读取当前用户
- 未登录直接返回统一错误或跳转
- 写入时将 `currentUserId` 传给 service（不信任客户端传入 userId）

---

## 5) 页面与路由策略

1. 新增认证页面：
   - `/login`
   - `/register`（可选，或初期仅 seed + login）
2. 业务页保护：
   - `/dashboard` `/jobs` `/applications` `/documents` `/settings` 需要登录
3. 中间件：
   - `middleware.ts` 对受保护路由做会话检查

---

## 6) 实施顺序（建议 2~3 天）

### Day 1
1. 接入 Auth.js 基础配置
2. 实现 Credentials 登录
3. 新增 `getCurrentUserOrThrow()` 工具

### Day 2
1. 改造 service/repository 读写接口注入 userId
2. 改造 Server Actions 去掉硬编码 userId
3. 页面路由保护 + 登录跳转

### Day 3
1. 补 userId 隔离测试（正向/越权）
2. 回归：jobs/applications 新增、列表、状态更新
3. 文档更新（Architecture/Roadmap）

---

## 7) 验收标准（Definition of Done）

1. 未登录无法访问业务页
2. 登录后可正常使用 Jobs/Applications 基础流程
3. A 用户不可看到或修改 B 用户任何记录
4. 所有数据库写操作不接受客户端自带 userId
5. CI 通过（test/lint/build）

---

## 8) 风险与回滚

风险：
- 改造面涉及 service/repository/action 三层，可能引入参数不匹配
- 历史测试大量依赖默认 userId

缓解：
- 分批改造接口并逐步修复测试
- 先保留 mock provider 通路用于页面可用性回归

回滚：
- 认证分支独立提交；若出现阻塞，可回退到无认证版本继续功能开发
