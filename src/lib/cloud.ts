import cloudbase from '@cloudbase/js-sdk'

// 环境 ID：在腾讯云 CloudBase 控制台获取，部署前填入 .env 的 VITE_CLOUDBASE_ENV
export const CLOUD_ENV = ((import.meta.env.VITE_CLOUDBASE_ENV as string) || '').trim()
export const CLOUD_ACCESS_KEY = ((import.meta.env.VITE_CLOUDBASE_ACCESS_KEY as string) || '').trim()
export const CLOUD_REGION = 'ap-shanghai'

let _app: any = null

export function isCloudConfigured(): boolean {
  return !!CLOUD_ENV
}

function app(): any {
  if (!_app) {
    _app = cloudbase.init({ env: CLOUD_ENV, region: CLOUD_REGION, accessKey: CLOUD_ACCESS_KEY })
  }
  return _app
}

function auth(): any {
  return app().auth()
}

export async function cloudLogin(username: string, password: string): Promise<void> {
  const res = await auth().signInWithUsernameAndPassword(username, password)
  if (res && res.error) throw new Error(res.error.message || '登录失败')
}

export async function cloudLogout(): Promise<void> {
  await auth().signOut()
}

export async function cloudCurrentUser(): Promise<{ uid: string; username: string } | null> {
  const a = auth()
  const u = (await a.getCurrentUser()) || a.currentUser || null
  if (!u) return null
  return { uid: String(u.uid || u.sub || ''), username: String(u.username || u.name || u.email || '') }
}

// 邀请码：在此修改，改完重新构建即可（用于控制谁能注册）
export const INVITE_CODE = 'shichengbu'

export async function cloudVerifyInviteCode(code: string): Promise<boolean> {
  return code === INVITE_CODE
}

// ===== 云数据库（文档型）基础操作 =====
async function currentUid(): Promise<string> {
  const u = await cloudCurrentUser()
  return u?.uid || ''
}

export async function cloudGetAll<T>(coll: string): Promise<T[]> {
  const db = app().database()
  const uid = await currentUid()
  const res = await db.collection(coll).where({ uid }).limit(1000).get()
  return (res && res.data) || []
}

export async function cloudWhere<T>(coll: string, query: Record<string, any>): Promise<T[]> {
  const db = app().database()
  const uid = await currentUid()
  const res = await db.collection(coll).where({ ...query, uid }).limit(1000).get()
  return (res && res.data) || []
}

export async function cloudAdd(coll: string, data: any): Promise<string> {
  const db = app().database()
  const uid = await currentUid()
  const res = await db.collection(coll).add({ ...data, uid })
  return String(res.id || res._id || '')
}

export async function cloudUpdate(coll: string, id: string, data: any): Promise<void> {
  const db = app().database()
  await db.collection(coll).doc(id).update(data)
}

export async function cloudRemove(coll: string, id: string): Promise<void> {
  const db = app().database()
  await db.collection(coll).doc(id).remove()
}
