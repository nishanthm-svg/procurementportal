const { spawn } = require('child_process')
const path = require('path')

const appDir = path.join(__dirname, 'incentive-portal')
const npmCmd = 'C:\\Users\\nishanth.m\\tools\\node-v20.19.1-win-x64\\npm.cmd'

const proc = spawn(npmCmd, ['run', 'dev'], {
  cwd: appDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: 'C:\\Users\\nishanth.m\\tools\\node-v20.19.1-win-x64;' + process.env.PATH,
  },
  shell: true
})

proc.on('error', e => console.error('Failed to start:', e))
