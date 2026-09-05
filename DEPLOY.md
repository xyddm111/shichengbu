# 时程簿 部署指南（腾讯云 CloudBase）

## 一、控制台准备（一次性，在 cloud.tencent.com → 云开发 CloudBase）

1. 开通 CloudBase，创建环境，记下「**环境 ID**」（形如 `shichengbu-xxxxxxxx`）。
2. 左侧「**登录授权**」→ 身份源列表 → 开启「**用户名密码登录**」。
3. 左侧「**数据库**」→ 创建 6 个集合：
   `semester`、`courses`、`sleep`、`events`、`plans`、`config`
4. 在 `config` 集合里手动**新增一条记录**（用于邀请码）：
   ```json
   { "key": "inviteCode", "value": "你自定义的邀请码" }
   ```
5. **权限设置**（数据安全规则）：
   - `config` 集合 → 设为「**所有用户可读**」（否则未注册的人读不到邀请码）。
   - 其余 5 个集合 → 设为「**仅创建者可读写**」（实现用户数据隔离，每人只能看自己的数据）。

## 二、本地配置

1. 复制 `.env.example` 为 `.env`
2. 填入：`VITE_CLOUDBASE_ENV=你的环境ID`

## 三、构建

```bash
npm run build
```

## 四、部署（二选一）

### 方式 A：控制台上传（最简单，推荐新手）
CloudBase 控制台 →「静态网站托管」→ 开启 → 上传 `dist/` 文件夹 → 记下访问域名。

### 方式 B：命令行
```bash
npm i -g @cloudbase/cli
tcb login
tcb hosting deploy dist -e 你的环境ID
```

## 五、使用

拿到 https 域名后：
1. 手机浏览器打开 → 分享菜单 →「添加到主屏幕」。
2. 首次注册用「邀请码 + 昵称 + 密码」，之后用「昵称 + 密码」登录。
3. 登录后数据存云端，换设备/朋友各自登录互不干扰。
