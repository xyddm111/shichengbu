const { execFileSync } = require('child_process')

const ENV = 'shichengbu-d7gzg85do31c9f03b'
const CLI = 'node_modules/@cloudbase/cli/dist/standalone/cli.js'

function run(payload) {
  const cmd = JSON.stringify(payload)
  console.log('RUN:', cmd)
  try {
    execFileSync('node', [CLI, 'db', 'nosql', 'execute', '-e', ENV, '--command', cmd, '--json'], { stdio: 'inherit' })
  } catch (e) {
    console.log('EXEC-ERROR:', e && e.message ? e.message : e)
  }
}

// 1. 查询 config（验证文档库是否可用）
console.log('\n### 查询 config ###')
run([{ TableName: 'config', CommandType: 'QUERY', Command: JSON.stringify({ find: 'config', limit: 1 }) }])

// 2. 为 5 个集合各插入一条占位数据（触发创建集合）
for (const coll of ['semester', 'courses', 'sleep', 'events', 'plans']) {
  console.log('\n### 创建集合 ' + coll + ' ###')
  run([{ TableName: coll, CommandType: 'INSERT', Command: JSON.stringify({ insert: coll, documents: [{ __init__: true }] }) }])
}
