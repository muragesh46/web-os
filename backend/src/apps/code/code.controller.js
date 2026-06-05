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

    const filepath = path.join(TEMP_DIR, filename);
    cleanupFiles.push(filename);

    try {
        // Write the code to the temp file
        fs.writeFileSync(filepath, code);

        const env = { ...process.env };
        const nodeBinDir = path.dirname(process.execPath);
        env.PATH = nodeBinDir + (process.platform === 'win32' ? ';' : ':') + (env.PATH || '');

        // Execute command inside TEMP_DIR with a 5-second timeout
        exec(runCommand, { cwd: TEMP_DIR, timeout: 5000, env }, (error, stdout, stderr) => {
            // Clean up files in the callback
            cleanupFiles.forEach(file => {
                const fullPath = path.join(TEMP_DIR, file);
                if (fs.existsSync(fullPath)) {
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (e) {
                        console.error(`Failed to delete temp file ${fullPath}:`, e);
                    }
                }
            });

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
        // Clean up if compile/write stage failed synchronously
        cleanupFiles.forEach(file => {
            const fullPath = path.join(TEMP_DIR, file);
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (e) {}
            }
        });
        return res.status(500).json({ error: `Failed to execute code: ${err.message}` });
    }
};

module.exports = { executeCode };
