const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, '../../../temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Executes user code locally on the server in a timed sandbox
 * Supports: javascript, typescript, python, c, cpp, java
 */
const executeCode = async (req, res) => {
    const { language, code } = req.body;

    if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required.' });
    }

    const id = crypto.randomBytes(8).toString('hex');
    let filename = '';
    let runCommand = '';
    let cleanupFiles = [];

    switch (language.toLowerCase()) {
        case 'javascript':
            filename = `temp_${id}.js`;
            runCommand = `node ${filename}`;
            break;
        case 'typescript':
            filename = `temp_${id}.ts`;
            runCommand = `npx tsx ${filename}`;
            break;
        case 'python':
            filename = `temp_${id}.py`;
            runCommand = `python3 ${filename}`;
            break;
        case 'c':
            filename = `temp_${id}.c`;
            const cBinary = `temp_${id}_c.out`;
            runCommand = `gcc ${filename} -o ${cBinary} && ./${cBinary}`;
            cleanupFiles.push(cBinary);
            break;
        case 'cpp':
            filename = `temp_${id}.cpp`;
            const cppBinary = `temp_${id}_cpp.out`;
            runCommand = `g++ ${filename} -o ${cppBinary} && ./${cppBinary}`;
            cleanupFiles.push(cppBinary);
            break;
        case 'java':
            filename = `temp_${id}.java`;
            runCommand = `java ${filename}`;
            break;
        case 'php':
            filename = `temp_${id}.php`;
            runCommand = `php ${filename}`;
            break;
        case 'ruby':
            filename = `temp_${id}.rb`;
            runCommand = `ruby ${filename}`;
            break;
        case 'go':
            filename = `temp_${id}.go`;
            runCommand = `go run ${filename}`;
            break;
        case 'rust':
            filename = `temp_${id}.rs`;
            const rustBinary = `temp_${id}_rs.out`;
            runCommand = `rustc ${filename} -o ${rustBinary} && ./${rustBinary}`;
            cleanupFiles.push(rustBinary);
            break;
        default:
            return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // Safety checks: block dangerous system access and secret inspection
    const DANGEROUS_PATTERNS = [
        /process\.env/i,
        /child_process/i,
        /\b(?:execSync|spawnSync|fork)\b/i,
        /\b(?:import\s+os|from\s+os\s+import|import\s+subprocess|import\s+shutil)\b/i,
        /\bos\.(?:system|popen|spawn|exec|remove|rmdir)\b/i,
        /\b(?:rm\s+-rf|mkfs|dd\s+if=)\b/i,
        /:\s*\(\s*\)\s*\{/i, // fork bomb
        /\b(?:system\s*\(|popen\s*\(|fork\s*\()/i,
    ];

    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            return res.json({
                run: {
                    stdout: '',
                    stderr: '❌ Security policy violation: System-level calls, process spawning, and environment variable access are restricted.',
                    code: 1,
                    signal: null
                }
            });
        }
    }

    const filepath = path.join(TEMP_DIR, filename);
    cleanupFiles.push(filename);

    const cleanup = () => {
        cleanupFiles.forEach(file => {
            const fullPath = path.join(TEMP_DIR, file);
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (e) {
                    // ignore
                }
            }
        });
    };

    try {
        // Write the code to the temp file
        fs.writeFileSync(filepath, code);

        // Strictly isolated safe environment: do NOT leak process.env (MONGO_URI, JWT_SECRET, etc.)
        const safeEnv = {
            PATH: process.env.PATH || '',
            NODE_PATH: process.env.NODE_PATH || '',
            LANG: 'en_US.UTF-8',
            HOME: TEMP_DIR,
            TMPDIR: TEMP_DIR,
        };
        const nodeBinDir = path.dirname(process.execPath);
        safeEnv.PATH = nodeBinDir + (process.platform === 'win32' ? ';' : ':') + safeEnv.PATH;

        // Execute command inside TEMP_DIR with a 5-second timeout
        exec(runCommand, { cwd: TEMP_DIR, timeout: 5000, env: safeEnv }, (error, stdout, stderr) => {
            cleanup();

            if (error) {
                if (error.killed) {
                    return res.json({
                        run: {
                            stdout: stdout,
                            stderr: (stderr || '') + '\n❌ Code execution timed out after 5 seconds.',
                            code: 124,
                            signal: 'SIGTERM'
                        }
                    });
                }
                return res.json({
                    run: {
                        stdout: stdout,
                        stderr: stderr || error.message,
                        code: error.code || 1,
                        signal: error.signal || null
                    }
                });
            }

            return res.json({
                run: {
                    stdout,
                    stderr,
                    code: 0,
                    signal: null
                }
            });
        });
    } catch (err) {
        cleanup();
        return res.status(500).json({ error: `Failed to execute code: ${err.message}` });
    }
};

module.exports = { executeCode };
