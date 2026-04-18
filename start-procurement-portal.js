const { spawn } = require('child_process')
const path = require('path')

const frontendDir = path.join(__dirname, 'frontend')
const npmCmd = 'C:\\Users\\nishanth.m\\tools\\node-v20.19.1-win-x64\\npm.cmd'

const proc = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: 'C:\\Users\\nishanth.m\\tools\\node-v20.19.1-win-x64;' + process.env.PATH,
  },
  shell: true
})

proc.on('error', e => console.error('Failed to start:', e))
