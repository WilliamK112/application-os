# Phase 3 实施计划：认证系统与多用户隔离

## 目标

在不破坏现有 Phase 2 功能（Jobs/Applications 可用 CRUD）的前提下，引入：

1. 可登录认证（Session-based）
2. 严格按当前登录用户隔离数据
3. 平滑替换当前 `getCurrentUser()` 的本地默认用户 bootstrap 逻辑

---

## 范围（Scope）

### In Scope（本阶段必须完成）

- 接入 NextAuth（Auth.js）基础 Email 登录（开发阶段可先 Credentials/Email Magic Link 二选一）
- 增加 `auth()`/`getSessionUser()` 统一入口
- 所有页面与 Server Actions 改为使用 session user id
- Repository/Service 保持 `userId` 作为强制输入（继续显式隔离）
- 未登录访问 `/dashboard` `/jobs` `/applications` `/documents` `/settings` 自动跳转登录页

### Out of Scope（后续再做）

- OAuth providers（Google/GitHub）
- RBAC/团队协作权限
- 组织级多租户（org/workspace）
- 审计日志 UI

---

## Session 策略

采用 **服务端 session 校验优先**：

- 在 Server Components / Server Actions 内调用 `auth()` 获取 session
- 如无 session：
  - 页面层：`redirect("/login")`
  - Action 层：返回友好错误（例如 `Please sign in first.`）
- 严禁从客户端传 `userId`，统一从服务端 session 注入

---

## 最小数据与 Schema 变更

当前 Prisma 已有 `User`，本阶段尽量少改核心业务表。

### 方案 A（推荐，最小改动）

新增 NextAuth 所需表（按官方 Prisma adapter）：

- `Account`
- `Session`
- `VerificationToken`

保留现有 `User` 表并复用 `id/email/name` 字段。

### 业务表约束核查（不一定立即改）

- `Application` 建议保留/确认唯一约束：`@@unique([userId, jobId])`
- 所有核心查询必须包含 `where: { userId: sessionUserId }`

---

## 服务层与仓储层改造

### 1) 新增认证门面

建议新增：`src/lib/auth/session.ts`

- `requireSessionUser()`：返回 `{ id, email, name }`；无 session 则抛可识别错误/重定向

### 2) Service 调整（最小）

- 保持现有方法签名传入 `userId`
- 页面与 Action 从 `requireSessionUser()` 获取 userId 再调用 service

### 3) Repository 调整

- 移除“默认 upsert 一个用户”的 bootstrap 行为
- `getCurrentUser()` 改为按 session user id 查询（或逐步废弃该方法）

---

## 页面与路由改造

### 受保护页面

- `/dashboard`
- `/jobs`
- `/applications`
- `/documents`
- `/settings`

每个页面在加载数据前执行 `requireSessionUser()`。

### 新增页面

- `/login`（最小登录入口）

---

## Action 改造清单

- `src/app/jobs/actions.ts`
- `src/app/applications/actions.ts`

改造原则：

- 不再调用 `getCurrentUser()`
- 用 `requireSessionUser()` 获取 `user.id`
- 所有写操作绑定该 user id

---

## 实施顺序（建议 4 步）

1. **接入 Auth.js + Prisma Adapter**，跑通登录/登出与 session 读取
2. **新增 `requireSessionUser()`**，并在页面层启用受保护路由
3. **改造 Server Actions** 使用 session user id
4. **移除默认用户 bootstrap**，补充测试与回归

---

## 验收标准（Definition of Done）

1. 未登录访问受保护页面会被拦截并跳转登录
2. 登录后可正常执行 Jobs/Applications 的创建与状态更新
3. 不同账号看不到彼此数据（数据库查询含 `userId` 约束）
4. 现有测试与 lint/build 均通过

---

## 风险与缓解

- 风险：改动认证后导致现有本地 demo 流程中断
  - 缓解：保留 `APP_OS_REPOSITORY_PROVIDER=mock` + 测试账号 seed
- 风险：Action 出现未登录异常导致用户体验差
  - 缓解：统一错误文案与登录引导链接

---

## Phase 3 后的直接下一步

- 加筛选/排序/分页（Jobs/Applications）
- 增加 Follow-up 完整 CRUD 与提醒触发
