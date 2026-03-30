# Application OS - Roadmap

## Now (MVP, 0~2 周)

- [x] 明确 PRD、MVP 边界与 NFR
- [x] 完成 Prisma schema（users/profiles/jobs/applications/documents/followups）
- [x] 搭建 5 个核心页面骨架
- [x] 建立 types + repository + service 接口
- [x] lint 通过

交付目标：形成“可演示、可扩展、可迭代”的基础版本。

---

## Next (Phase 2，已完成主体)

- [x] 接入 Prisma Client（默认数据源）
- [x] 保留 mock repository 回退能力（dev 可切换）
- [x] Jobs：create/list/update status
- [x] Applications：create/list/update status
- [x] 引入 zod + server actions 表单校验链路
- [x] Jobs / Applications 页面可直接操作

交付目标：可在真实数据库上进行基础求职记录管理。

---

## Later (1~2 月)

- [ ] 认证系统与多用户隔离
- [ ] 筛选/排序/分页与更完整的错误提示
- [ ] 文档上传（S3/R2）与版本管理
- [ ] Follow-up 的完整 CRUD 与提醒机制
- [ ] 面试复盘模板与看板视图
- [ ] 基础分析报表（渠道转化率、岗位类型命中率）

交付目标：从“记录工具”升级为“求职运营系统”。
