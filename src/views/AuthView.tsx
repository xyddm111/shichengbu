import { useState } from 'react'
import { X } from 'lucide-react'
import { cloudCurrentUser, cloudLogin, isCloudConfigured } from '../lib/cloud'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

interface Props {
  open: boolean
  onClose: () => void
  onLoggedIn: (u: { uid: string; username: string }) => void
}

export function AuthView({ open, onClose, onLoggedIn }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!open) return null

  const doLogin = async () => {
    if (!username.trim() || !password) {
      setErr('请输入用户名和密码')
      return
    }
    setBusy(true)
    setErr('')
    try {
      await cloudLogin(username.trim(), password)
      const u = await cloudCurrentUser()
      onLoggedIn({ uid: u?.uid || '', username: u?.username || username.trim() })
    } catch (e: any) {
      setErr(e?.message || '登录失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="addpage">
      <div className="addpage__head">
        <button className="addpage__close" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
        <div className="addpage__title">登录</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="addpage__body">
        {!isCloudConfigured() ? (
          <div className="hint">尚未配置云端环境 ID，登录功能暂不可用。</div>
        ) : (
          <div className="addpage__form">
            <Input label="用户名" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="你的用户名" />
            <Input label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" />
            {err && (
              <div className="hint" style={{ color: 'var(--c-deadline)' }}>
                {err}
              </div>
            )}
            <div className="form-actions">
              <Button onClick={doLogin} disabled={busy}>
                {busy ? '登录中…' : '登录'}
              </Button>
            </div>
            <div className="hint">账号由创建者在 CloudBase 控制台创建，如有疑问请联系创建者。</div>
          </div>
        )}
      </div>
    </div>
  )
}
