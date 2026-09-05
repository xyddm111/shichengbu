# 时程簿 · 项目交接文档（HANDOFF）

> **用途**：新开一个对话时，把本文档（或前 3 节）内容发给 AI，即可让它无缝接手继续开发。
> 本文档由「时程簿」项目开发完成时生成，记录项目现状、架构、部署信息与所有踩坑。

---

## 一、项目现状（一句话）

「时程簿」是一个**移动端优先的 PWA 个人全天时程管理应用**，已上线运行。核心是：把课表（含单双周）、睡眠、自定义安排、计划都填进 24 小时时间轴，空闲时间自动算出，打开即见「今天/周/月」的每一刻。

**正式网址**：`https://shichengbu-d7gzg85do31c9f03b-1481936482.tcloudbaseapp.com`

### 已完成的功能
- 课表：每周 / 单周 / 双周 / 指定周 / 指定日期、一周多时段（**指定周次支持范围写法**，如 `2-15`、`2-4,8-16`）
- 睡眠作息（跨天）、自定义安排（全天/每天/每周/每月重复、每周多选星期几、重要程度、提醒）
- 计划（自动结合空闲时段推荐）
- 视图：今天（24h 时间轴 + 现在卡）、周（7 天网格）、月（日历 + 色点）
- 统计（时间分布）、待办倒计时、纪念日
- 主题色自定义、空闲色自定义、深色跟随系统
- 数据导出/导入
- 登录（用户名 + 密码）、数据上云、按账号隔离
- 天气（定位 或 手动城市）
- PWA：可「添加到主屏幕」、离线可用

### 账号体系现状（重要）
- **不能自助注册**。原因：免费体验版开不了短信/邮箱验证码，「用户名密码」又只支持登录不支持注册（注册接口返回 501）。
- 账号由管理员（开发者）创建：CloudBase 控制台「身份认证 → 用户管理 → 创建用户」，或命令行 `tcb user create`。
- 密码要求：**至少 3 类字符**（大小写字母、数字、特殊符号）。
- 已存在的测试账号：`testuser` / `Testuser123!@#`

---

## 二、技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | **Vite 5** + **React 18** + **TypeScript 5** |
| UI | **纯 CSS + CSS 变量（design tokens）**，无 UI 框架、无渐变；图标用 **Lucide（SVG）** |
| 本地数据 | **IndexedDB**（通过 **Dexie 4**） |
| 云端数据 | **腾讯云 CloudBase 文档型数据库**（`@cloudbase/js-sdk` v3.9.2） |
| 登录认证 | **CloudBase 认证**（用户名密码登录，`signInWithUsernameAndPassword`） |
| PWA | **vite-plugin-pwa**（manifest + service worker 自动生成） |
| 天气 | **Open-Meteo**（免费、无需 key；定位 `navigator.geolocation` + 地理编码 API） |
| 部署 | **CloudBase 静态网站托管**（CLI：`@cloudbase/cli`，`tcb` 命令） |

---

## 三、目录结构

```
时程簿/
├── index.html              入口
├── vite.config.ts          Vite + PWA 配置（base:'./'）
├── tsconfig.json           TS 配置（esModuleInterop:true）
├── .env                    环境变量（已 gitignore，含环境ID和accessKey）
├── .env.example            环境变量模板
├── package.json            依赖与脚本
├── DEPLOY.md               部署指南
├── HANDOFF.md              本文档
├── scripts/
│   ├── gen-icons.mjs       用 Node 生成 PWA 时钟图标（PNG）
│   ├── setup-db.cjs        创建云端集合（一次性）
│   └── cleanup-db.cjs      清理占位数据
├── public/icons/           PWA 图标（192/512/maskable/apple-touch）
└── src/
    ├── main.tsx            入口（加载主题色/空闲色，渲染 App）
    ├── App.tsx             根组件：五 Tab、本地/云端切换、提醒、登录
    ├── types.ts            所有数据模型类型
    ├── styles/
    │   ├── tokens.css      设计变量（主题色/功能色/圆角，含深色模式）
    │   └── app.css         全部样式
    ├── lib/
    │   ├── time.ts         日期/时间工具
    │   ├── week.ts         周次/单双周计算
    │   ├── schedule.ts     日程计算（blocksForDay/freeSlots/stats/推荐）
    │   ├── theme.ts        主题色/空闲色（localStorage + CSS 变量）
    │   ├── db.ts           Dexie 本地数据库
    │   ├── store.ts        本地数据 hook（useAppData）
    │   ├── cloud.ts        CloudBase 初始化 + 认证 + 云数据库 CRUD
    │   ├── cloudStore.ts   云端数据 hook（useCloudData，接口同本地）
    │   └── weather.ts      天气（定位/城市 + Open-Meteo）
    ├── components/         基础组件 + 时间轴/现在卡/底部导航/Toast
    ├── views/              今天/周/月/统计/计划/我的/登录
    └── editor/AddPage.tsx  全屏添加/编辑页
```

---

## 四、数据模型（src/types.ts）

- `Semester`：{ name, startDate(学期第一周的周一), endDate }
- `Course`：{ name, teacher, location, weekday, startTime, endTime, weekRule(every/odd/even/custom), customWeeks[], specialDates[], skipDates[], color, extraPeriods[] }
- `Sleep`：{ bedTime, wakeTime, overrides{} }
- `EventItem`：{ title, kind(arrange/plan/deadline/memorial), date, startTime, endTime, allDay, repeat(none/daily/weekly/monthly), repeatEnd, weekdays[], priority(0/1/2), remind, location, color, note, planId }
- `Plan`：{ title, freq, duration, color, note }

---

## 五、数据层架构（核心，双模式）

- **本地模式（未登录）**：`lib/db.ts`（Dexie/IndexedDB）+ `lib/store.ts`（`useAppData`）。
- **云端模式（已登录）**：`lib/cloud.ts`（CloudBase 初始化+CRUD）+ `lib/cloudStore.ts`（`useCloudData`，接口与本地完全一致）。
- **切换**：`App.tsx` 里 `const store = authUser ? cloudStore : localStore`。
- 云数据库集合：`semester / courses / sleep / events / plans`（已创建，**按 `uid` 字段隔离**——每条数据写入时带当前用户 uid，查询时 `where({ uid })` 过滤）。

---

## 六、登录 / 认证（现状）

- SDK 初始化：`cloudbase.init({ env, region:'ap-shanghai', accessKey })`，accessKey 在 `.env` 的 `VITE_CLOUDBASE_ACCESS_KEY`。
- 登录：`auth().signInWithUsernameAndPassword(username, password)`（这是 v1 兼容方法；v2 的 `signUp` 需要 email/phone，且 email provider 未开启）。
- 当前用户：`auth().getCurrentUser()`。

---

## 七、部署信息（重要，下次继续必看）

- **环境 ID**：`shichengbu-d7gzg85do31c9f03b`
- **地域**：`ap-shanghai`
- **accessKey**（公开的 publishable key，在 `.env` 里 `VITE_CLOUDBASE_ACCESS_KEY`，完整值见 `.env`）
- **静态托管域名**：`https://shichengbu-d7gzg85do31c9f03b-1481936482.tcloudbaseapp.com`

### 部署命令（已装 `@cloudbase/cli`，`node_modules/.bin/tcb`）
```bash
# 登录（设备授权，会生成网址+验证码）
node node_modules/@cloudbase/cli/dist/standalone/cli.js login --flow device

# 部署 dist 到静态托管
node node_modules/@cloudbase/cli/dist/standalone/cli.js hosting deploy dist -e shichengbu-d7gzg85do31c9f03b

# 创建用户（密码至少3类字符）
node node_modules/@cloudbase/cli/dist/standalone/cli.js user create 用户名 -e shichengbu-d7gzg85do31c9f03b --password '密码' --nickname 昵称
```

### 本地开发/构建
```bash
npm run dev          # 开发服务器
npm run typecheck    # 类型检查
npm run build        # 生产构建（产物在 dist/）
npm run preview      # 预览
```

---

## 八、踩过的坑（避免重蹈）

1. **npm 沙箱**：全局缓存目录在可写范围外，需 `--cache .npm-cache`；postinstall 脚本会 spawn 子进程被拦，需 `--ignore-scripts`。
2. **构建 esbuild 子进程 EPERM**：需在更高权限下运行（当前环境已是 danger-full-access）。
3. **CloudBase 已改版**：现在是套餐制（免费体验版/个人版），数据库分「PostgreSQL(默认)」和「云数据库(文档型)」，本项目用**云数据库**。
4. **免费体验版限制**：短信/邮箱验证码开不了（灰色）；用户名密码只支持登录不支持自助注册（signup 接口 501）。
5. **SDK v1/v2 混乱**：`signUp`（v2）需要 email/phone；用户名密码登录要用 v1 兼容方法 `signInWithUsernameAndPassword`。
6. **文档数据库集合要存在**：集合不会自动创建，需用 `db nosql execute` 的 INSERT 触发创建（已用 `scripts/setup-db.cjs` 建好 5 个集合）。
7. **CLI 传 JSON 的转义问题**：PowerShell 传嵌套 JSON 会损坏，改用 Node 脚本 `JSON.stringify` 传参（见 scripts/*.cjs）。
8. **PWA 缓存**：部署后 CDN 有缓存，改版后要「强刷」或等几分钟。

---

## 九、待办 / 可选优化方向

- 自助注册（需升级套餐开邮箱，见 `docs/03-注册优化方向.html`）
- 提醒推送完善、桌面小部件、绑定自定义域名（需备案）
- 本地数据一键迁移到云端
- 包体积优化（CloudBase SDK 懒加载，当前 gzip 约 296KB）

## 十、文档索引

- `docs/01-项目介绍-技术详解.html` —— 技术架构详解（面试向）
- `docs/02-开发流程与经验总结.html` —— 开发流程与踩坑记录
- `docs/03-注册优化方向.html` —— 注册功能优化方向
- `HANDOFF.md` —— 本文档（现状/架构/部署/坑）

---

*本文档结尾。新对话时，把「一、现状」「二、技术栈」「三、目录结构」「四、数据模型」「五、数据层」「七、部署信息」「八、坑」几节发给 AI 即可高效继续。*
