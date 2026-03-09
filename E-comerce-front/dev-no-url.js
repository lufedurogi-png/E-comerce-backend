/**
 * Ejecuta "next dev" y filtra la salida para ocultar la URL localhost:3000.
 * Así el IDE no detecta el enlace y no abre el navegador integrado.
 */
const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  env: { ...process.env, BROWSER: 'none' },
  stdio: ['inherit', 'pipe', 'pipe'],
});

child.stdout.on('data', (data) => {
  const line = data.toString().replace(/http:\/\/localhost:3000/g, '(servidor en puerto 3000)');
  process.stdout.write(line);
});

child.stderr.on('data', (data) => {
  const line = data.toString().replace(/http:\/\/localhost:3000/g, '(servidor en puerto 3000)');
  process.stderr.write(line);
});

child.on('close', (code) => process.exit(code ?? 0));
