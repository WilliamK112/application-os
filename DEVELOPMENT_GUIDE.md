# Application OS — Development Guide

## 项目概述

一个完整的求职申请追踪系统（Job Application Tracking System），用于管理职位申请、面试、公司追踪和求职准备。

**在线地址**: https://application-os.vercel.app  
**GitHub**: https://github.com/WilliamK112/application-os

---

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js v5 (Auth.js)
- **UI**: Tailwind CSS + Headless UI
- **邮件**: Resend API (可选)
- **文件存储**: S3/R2 兼容
- **测试**: Vitest + React Testing Library
- **类型**: TypeScript (严格模式)
- **部署**: Vercel

---

## 项目结构

```
src/
├── app/                      # Next.js App Router 页面
│   ├── (auth)/             # 认证页面 (login, register, reset-password)
│   ├── api/                # API 路由
│   │   ├── auth/          # NextAuth.js 端点
│   │   ├── ai/            # AI 答案建议端点
│   │   ├── export/        # PDF 导出端点
│   │   └── reminders/      # 提醒 Cron 端点
│   ├── applications/       # 申请列表 + 详情页
│   ├── companies/          # 公司追踪页面
│   ├── dashboard/          # 主仪表盘
│   ├── documents/          # 文档管理
│   ├── followups/         # 跟进提醒
│   ├── interviews/         # 面试记录 + 题库
│   ├── jobs/              # 职位管理
│   ├── questions/         # 面试题库
│   └── settings/           # 用户设置
├── components/            # React 组件
│   ├── app-shell.tsx     # 主布局 (侧边栏 + 导航)
│   ├── applications/       # 申请相关组件
│   ├── interviews/         # 面试相关组件
│   └── ...
├── lib/
│   ├── auth/             # 认证逻辑
│   ├── jobs/             # 职位导入/解析
│   ├── repositories/     # 数据访问层 (Mock + Prisma 双实现)
│   └── services/         # 业务逻辑层
├── types/
│   └── domain.ts         # 领域模型类型定义
└── prisma/
    ├── schema.prisma     # 数据库 Schema
    └── seed.ts           # 开发环境种子数据
```

---

## 架构设计

### Repository Pattern (双实现)

数据层使用 Repository Pattern，同时实现了 Mock 和 Prisma 两套实现：

- **Mock Repository**: 用于开发、测试、CI（不依赖真实数据库）
- **Prisma Repository**: 生产环境使用（连接 PostgreSQL）

选择机制通过环境变量 `DATABASE_URL` 判断：
```typescript
// src/lib/repositories/index.ts
export function createRepository(): ApplicationOsRepository {
  if (process.env.DATABASE_URL) {
    return new PrismaRepository();
  }
  return new MockRepository();
}
```

### 数据模型

```
User
├── Job (FK: companyId → Company)
├── Application (FK: jobId → Job)
├── FollowUp (FK: applicationId → Application)
├── Interview (FK: applicationId → Application)
│   └── InterviewQuestionUsage (FK: questionId → InterviewQuestion)
├── InterviewQuestion
│   └── InterviewQuestionUsage (FK: interviewId → Interview)
├── Document
├── Company
├── AutoApplyRunLog
└── PasswordResetToken
```

### 服务器操作 (Server Actions)

所有数据修改使用 Next.js Server Actions，位于各模块的 `actions.ts` 文件中。

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 设置环境变量

```bash
cp .env.example .env.local
```

**必需环境变量**:
```env
DATABASE_URL="postgresql://..."      # PostgreSQL 连接字符串
NEXTAUTH_SECRET="your-secret"        # NextAuth 加密密钥
NEXTAUTH_URL="http://localhost:3000"  # NextAuth 回调地址
```

**可选环境变量**:
```env
# AI 功能 (OpenAI)
OPENAI_API_KEY="sk-..."

# 邮件发送 (Resend)
APP_OS_RESEND_API_KEY="re_..."
APP_OS_EMAIL_FROM="noreply@example.com"
APP_OS_NOTIFY_EMAIL="your@email.com"

# 文件存储 (S3/R2)
S3_BUCKET="..."
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."

# 提醒系统
REMINDERS_SECRET="your-random-secret"

# 公开 URL
APP_OS_PUBLIC_URL="https://..."
```

### 3. 数据库设置

```bash
# 开发环境使用 SQLite
DATABASE_URL="file:./dev.db" npx prisma generate
DATABASE_URL="file:./dev.db" npx prisma db push

# 生产环境使用 PostgreSQL
npx prisma migrate deploy
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 运行测试

```bash
npm test          # 运行所有测试 (116 tests)
npm run lint      # ESLint 检查
```

---

## 代码规范

### 文件组织

- **页面组件**: `src/app/[module]/page.tsx` (Server Component)
- **客户端组件**: `src/app/[module]/*.tsx` 标记 `"use client"`
- **Server Actions**: `src/app/[module]/actions.ts`
- **数据层**: `src/lib/repositories/` 和 `src/lib/services/`
- **领域类型**: `src/types/domain.ts`

### 组件命名

- **Page**: `page.tsx` (导出一个 default async Server Component)
- **Client Wrapper**: `[module]-client.tsx` (导出一个 `"use client"` 组件)
- **UI 组件**: 放在 `src/components/[module]/` 目录
- **通用组件**: 放在 `src/components/` 根目录

### 命名规范

- **类型/接口**: PascalCase (`ApplicationWithJob`)
- **函数/变量**: camelCase (`createJobAction`)
- **CSS 类**: Tailwind 工具类
- **文件**: kebab-case (`application-list.tsx`)

### 测试规范

- 每个 action/function 都应该有对应的测试
- Mock Repository 用于单元测试（不依赖真实 DB）
- 至少验证：happy path、错误处理、边界条件

---

## 已有功能

### ✅ 已完成

| 功能 | 路径 | 说明 |
|------|------|------|
| 用户认证 | `/login`, `/register` | NextAuth.js v5, 支持邮件/密码 |
| 职位管理 | `/jobs` | CRUD, 筛选/排序/分页, Table/By Company 视图 |
| 申请管理 | `/applications` | CRUD, 批量选择, 批量更新状态 |
| 跟进提醒 | `/followups` | 创建/标记完成, 邮件提醒 |
| 面试记录 | `/interviews` | CRUD, 内联编辑, 关联题库 |
| 面试题库 | `/questions` | CRUD, 分类/搜索, PDF导出, AI答案建议 |
| 公司追踪 | `/companies` | CRUD, 详情页, 关联 Jobs |
| 仪表盘 | `/dashboard` | 统计数据, upcoming interviews |
| 数据分析 | `/analytics` | 申请漏斗图, Interview 统计 |
| 文档管理 | `/documents` | S3/R2 上传 |
| 邮件提醒 | `/api/reminders` | GitHub Actions Cron 触发 |
| 移动端 | 全站 | 响应式设计, hamburger 菜单 |

---

## 待开发功能

### 高优先级

1. **Interview → Application 自动关联完善**
   - Interview 详情页显示关联的 Application
   - Application 详情页显示关联的 Interviews
   - 面试记录自动关联到对应 Company

2. **通知系统增强**
   - 站内通知 (in-app notifications)
   - 浏览器推送通知 (Web Push)
   - 自定义提醒时间

3. **数据导入/导出**
   - CSV 批量导入 Applications
   - JSON 格式数据备份/恢复
   - Notion/LinkedIn 等平台数据导入

### 中优先级

4. **Analytics 增强**
   - 时间趋势图 (申请数/面试数随时间变化)
   - 公司对比视图
   - 薪资统计 (手动录入 offer)

5. **协作功能**
   - 多用户共享公司/职位信息
   - 团队面试反馈分享

6. **求职 Pipeline 视图**
   - 看板式视图 (Kanban) 查看申请进度
   - 泳道图 (Swimlanes) 按公司/状态分组

### 低优先级

7. **AI 功能增强**
   - 自动生成 cover letter
   - 简历优化建议
   - 模拟面试 (语音交互)

8. **集成扩展**
   - LinkedIn 自动申请
   - Greenhouse/Lever API 集成
   - Slack/Discord 通知

---

## 常见任务

### 添加新数据模型

1. **Prisma Schema** (`prisma/schema.prisma`):
   ```prisma
   model NewModel {
     id        String   @id @default(cuid())
     userId    String
     name      String
     user      User     @relation(fields: [userId], references: [id])
     createdAt DateTime @default(now())
   }
   ```

2. **Domain Types** (`src/types/domain.ts`):
   ```typescript
   export interface NewModel {
     id: string;
     userId: string;
     name: string;
     createdAt: ISODateString;
   }
   ```

3. **Repository** (`src/lib/repositories/application-os-repository.ts`):
   - 在 `IApplicationOsRepository` 接口添加方法声明
   - 在 `MockRepository` 实现 (内存数组)
   - 在 `PrismaRepository` 实现 (Prisma 查询)

4. **Service** (`src/lib/services/application-os-service.ts`):
   - 添加接口声明
   - 添加实现方法 (调用 repository)

5. **Server Actions** (`src/app/[module]/actions.ts`):
   - 添加 `useState` + `useActionState` 表单
   - Zod schema 验证输入

6. **页面** (`src/app/[module]/page.tsx`):
   - Server Component 获取数据
   - 传递数据给 Client Component

### 添加新的 Server Action

```typescript
// src/app/[module]/actions.ts
"use server";

import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

const schema = z.object({
  name: z.string().min(1),
});

export async function myAction(_prevState: any, formData: FormData) {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = schema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  try {
    await applicationOsService.myMethod(user.id, parsed.data);
    revalidatePath("/[module]");
    return { error: "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error" };
  }
}
```

### 运行 CI 本地检查

```bash
npm run lint && npm test
```

### 数据库操作

```bash
# 查看 Schema
npx prisma format

# 创建迁移
npx prisma migrate dev --name add_new_field

# 重置开发数据库
npx prisma db push --force-reset

# 查看数据库
npx prisma studio
```

---

## 环境变量参考

完整环境变量列表见 `.env.example`。

**生产环境必需**:
- `DATABASE_URL` — PostgreSQL
- `NEXTAUTH_SECRET` — 随机字符串
- `NEXTAUTH_URL` — Vercel 部署 URL

**推荐配置**:
- `OPENAI_API_KEY` — AI 答案建议
- `APP_OS_RESEND_API_KEY` — 邮件通知
- `REMINDERS_SECRET` — Cron API 保护

---

## 部署

### Vercel (推荐)

1. Fork 或导入 GitHub 仓库
2. 配置环境变量 (Vercel Dashboard → Settings → Environment Variables)
3. Deploy

```bash
# Vercel 会自动:
# - 运行 `prisma generate`
# - 运行 `next build`
```

### 数据库迁移 (生产环境)

```bash
# 首次部署
npx prisma migrate deploy

# 后续更新
git push → Vercel 自动构建时运行 migrate
```

### GitHub Actions (可选提醒 Cron)

需要配置:
- `REMINDERS_ENABLED=true` (仓库变量)
- `APP_OS_URL=https://your-app.vercel.app` (仓库变量)
- `REMINDERS_SECRET` (仓库 Secrets)

---

## 故障排查

### 登录失败
- 检查 `NEXTAUTH_SECRET` 是否设置
- 检查 `NEXTAUTH_URL` 是否匹配实际 URL
- 浏览器开发者工具 → Network 查看具体错误

### 数据库连接问题
- 确认 `DATABASE_URL` 格式正确
- 确认数据库服务器可访问 (Vercel 需要 Vercel Postgres 或外网可访问的 DB)
- 运行 `npx prisma db push` 同步 schema

### 测试失败
- Mock 数据与 Prisma Schema 不同步 → 更新 Mock 数据
- 时区问题 → 使用固定时间戳而非 `new Date()`

### 邮件发送失败
- 确认 `APP_OS_RESEND_API_KEY` 有效
- 确认发件人域名已验证 (Resend Dashboard)
- 检查垃圾邮件文件夹
