// Sobe backend e frontend juntos em qualquer sistema: o "&" dos scripts do npm, no Windows,
// roda um comando depois do outro, e o backend nunca termina. Ctrl+C encerra os dois.
const { spawn } = require('child_process');

for (const script of ['dev:backend', 'dev:frontend']) {
  spawn('npm', ['run', script], { stdio: 'inherit', shell: true });
}
