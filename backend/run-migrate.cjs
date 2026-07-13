const { spawn } = require('child_process');

const child = spawn('npx.cmd', ['prisma', 'migrate', 'dev', '--name', 'auth_cliente'], {
    cwd: 'c:\\Users\\Estudiante\\Desktop\\vital_fitness\\backend',
    shell: true
});

child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    if (data.toString().includes('Are you sure you want create and apply this migration?')) {
        child.stdin.write('y\n');
    }
});

child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
