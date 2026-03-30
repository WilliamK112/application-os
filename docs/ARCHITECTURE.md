# Application OS - Architecture (MVP)

## 1. 架构目标

当前采用“轻分层 + 可替换数据源 + Server Actions”的方式：

- 页面层只消费服务层接口
- 服务层依赖 Repository 抽象
- Repository 默认走 Prisma（可通过环境变量回退 mock）
- 表单写操作统一走 Next.js Server Actions + zod 校验

---

## 2. 技术栈

- Frontend: Next.js App Router + React + TypeScript
- Styling: Tailwind CSS v4（基础样式）
- Validation: zod
- ORM: Prisma Client v6
- Database: PostgreSQL
- Lint: ESLint（next/core-web-vitals + typescript）

---

## 3. 分层设计

```text
src/app/*                      -> 页面层（Server Components + Server Actions）
src/lib/services/*             -> 业务服务层（聚合数据、指标计算、命令转发）
src/lib/repositories/*         -> 数据访问抽象与实现（prisma/mock）
src/lib/db/prisma.ts           -> Prisma Client 单例
src/lib/constants/*            -> 共享枚举配置（状态选项等）
src/types/*                    -> 领域类型、枚举、DTO
prisma/schema.prisma           -> 数据库结构定义
```

### 3.1 页面层

- 负责展示与布局
- 使用 `<form action={serverAction}>` 提交写操作
- 不直接调用 ORM

### 3.2 服务层

- 提供稳定 API 给 UI
- 聚合 dashboard 指标
- 对 repository 做统一封装（读写）

### 3.3 Repository 层

- 统一接口：`ApplicationOsRepository`
- 默认实现：`PrismaApplicationOsRepository`
- 回退实现：`MockApplicationOsRepository`（`APP_OS_REPOSITORY_PROVIDER=mock`）

---

## 4. 数据模型关系

- User 1:1 Profile
- User 1:N Jobs
- Job 1:N Applications
- User 1:N Documents
- Application N:M Documents（通过 ApplicationDocument）
- Application 1:N FollowUps

---

## 5. 当前已落地能力（Phase 2）

1. Prisma Client 已接入并可 `prisma generate`
2. Repository 默认切换为 Prisma，保留 mock 回退能力
3. Jobs 最小可用 CRUD（create/list/update status）
4. Applications 最小可用 CRUD（create/list/update status）
5. 页面支持直接新增与状态更新（Server Actions + zod）

---

## 6. 后续演进路线

- Phase 3: 接入认证（NextAuth/Clerk）与真实用户隔离
- Phase 4: 增加筛选、排序、分页、错误边界
- Phase 5: 引入审计日志（状态变更历史）与通知流
