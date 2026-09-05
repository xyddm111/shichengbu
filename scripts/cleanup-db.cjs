const { execFileSync } = require('child_process')
const ENV = 'shichengbu-d7gzg85do31c9f03b'
const CLI = 'node_modules/@cloudbase/cli/dist/standalone/cli.js'

for (const coll of ['semester', 'courses', 'sleep', 'events', 'plans']) {
  const payload = [{ TableName: coll, CommandType: 'DELETE', Command: JSON.stringify({ delete: coll, deletes: [{ q: { __init__: true }, limit: 1 }] }) }]
  const cmd = JSON.stringify(payload)
  console.log('CLEAN ' + coll)
  try {
    execFileSync('node', [CLI, 'db', 'nosql', 'execute', '-e', ENV, '--command', cmd, '--json'], { stdio: 'inherit' })
  } catch (e) {
    console.log('EXEC-ERROR:', e && e.message ? e.message : e)
  }
}
console.log('DONE')
