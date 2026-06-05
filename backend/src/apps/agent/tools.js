const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = util.promisify(exec);

/**
 * Execute an AppleScript command safely
 */
async function runAppleScript(script) {
    try {
        const { stdout, stderr } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
        if (stderr) console.error('AppleScript Stderr:', stderr);
        return stdout.trim() || 'Success';
    } catch (error) {
        console.error('AppleScript Error:', error.message);
        return `Error: ${error.message}`;
    }
}

/**
 * Execute a Shell command safely
 */
async function runShellCommand(command) {
    try {
        const { stdout, stderr } = await execPromise(command, { timeout: 10000 });
        if (stderr && !stdout) return `Stderr: ${stderr}`;
        return stdout.trim() || 'Success';
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// ─── Host OS Tools ───────────────────────────────────────────────────────────

const tools = {

    // ── App Control ───────────────────────────────────────────────────────────

    openApp: async ({ name }) => {
        console.log(`[Host Agent] Opening app: ${name}`);
        return await runAppleScript(`tell application "${name}" to activate`);
    },

    closeApp: async ({ name }) => {
        console.log(`[Host Agent] Closing app: ${name}`);
        return await runAppleScript(`tell application "${name}" to quit`);
    },

    getActiveWindow: async () => {
        console.log(`[Host Agent] Getting active window name`);
        return await runAppleScript('tell application "System Events" to get name of first process whose frontmost is true');
    },

    listRunningApps: async () => {
        console.log(`[Host Agent] Listing running apps`);
        return await runAppleScript('tell application "System Events" to get name of every process whose background only is false');
    },

    // ── Audio ─────────────────────────────────────────────────────────────────

    setVolume: async ({ level }) => {
        console.log(`[Host Agent] Setting volume to: ${level}`);
        const clamped = Math.min(100, Math.max(0, parseInt(level)));
        return await runAppleScript(`set volume output volume ${clamped}`);
    },

    getVolume: async () => {
        console.log(`[Host Agent] Getting volume`);
        return await runAppleScript('output volume of (get volume settings)');
    },

    muteVolume: async () => {
        console.log(`[Host Agent] Muting volume`);
        return await runAppleScript('set volume with output muted');
    },

    unmuteVolume: async () => {
        console.log(`[Host Agent] Unmuting volume`);
        return await runAppleScript('set volume without output muted');
    },

    say: async ({ text, voice = '' }) => {
        console.log(`[Host Agent] Saying: ${text}`);
        const voiceFlag = voice ? `-v "${voice}"` : '';
        return await runShellCommand(`say ${voiceFlag} "${text.replace(/"/g, '\\"')}"`);
    },

    // ── Keyboard & Clipboard ──────────────────────────────────────────────────

    typeText: async ({ text }) => {
        console.log(`[Host Agent] Typing text`);
        return await runAppleScript(`tell application "System Events" to keystroke "${text.replace(/"/g, '\\"')}"`);
    },

    pressKey: async ({ key, modifiers = '' }) => {
        console.log(`[Host Agent] Pressing key: ${key}, modifiers: ${modifiers}`);
        if (modifiers) {
            const modList = modifiers.split(',').map(m => `${m.trim()} down`).join(', ');
            return await runAppleScript(`tell application "System Events" to keystroke "${key}" using {${modList}}`);
        }
        return await runAppleScript(`tell application "System Events" to keystroke "${key}"`);
    },

    getClipboard: async () => {
        console.log(`[Host Agent] Getting clipboard`);
        return await runAppleScript('the clipboard as text');
    },

    setClipboard: async ({ text }) => {
        console.log(`[Host Agent] Setting clipboard`);
        return await runAppleScript(`set the clipboard to "${text.replace(/"/g, '\\"')}"`);
    },

    // ── Browser & Web ─────────────────────────────────────────────────────────

    openUrl: async ({ url }) => {
        console.log(`[Host Agent] Opening URL: ${url}`);
        const safeUrl = url.startsWith('http') ? url : `https://${url}`;
        return await runShellCommand(`open "${safeUrl}"`);
    },

    searchWeb: async ({ query }) => {
        console.log(`[Host Agent] Searching web for: ${query}`);
        const encoded = encodeURIComponent(query);
        return await runShellCommand(`open "https://www.google.com/search?q=${encoded}"`);
    },

    // ── System Info ───────────────────────────────────────────────────────────

    getBatteryLevel: async () => {
        console.log(`[Host Agent] Getting battery level`);
        return await runShellCommand(`pmset -g batt | grep -o '[0-9]*%' | head -1`);
    },

    getSystemInfo: async () => {
        console.log(`[Host Agent] Getting system info`);
        const [cpuModel, memFree, disk] = await Promise.all([
            runShellCommand(`sysctl -n machdep.cpu.brand_string`),
            runShellCommand(`vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.'`),
            runShellCommand(`df -h / | tail -1 | awk '{print "Disk: used " $3 " / " $2 ", " $5 " used"}'`)
        ]);
        const memFreeGB = (parseInt(memFree) * 4096 / 1024 / 1024 / 1024).toFixed(2);
        return `CPU: ${cpuModel} | Free RAM: ~${memFreeGB} GB | ${disk}`;
    },

    getWifiName: async () => {
        console.log(`[Host Agent] Getting WiFi name`);
        return await runShellCommand(`/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print $2}'`);
    },

    getDateTime: async () => {
        console.log(`[Host Agent] Getting date/time`);
        return new Date().toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    },

    // ── Notifications ─────────────────────────────────────────────────────────

    sendNotification: async ({ title, message }) => {
        console.log(`[Host Agent] Sending notification: ${title}`);
        return await runAppleScript(`display notification "${(message || '').replace(/"/g, '\\"')}" with title "${(title || '').replace(/"/g, '\\"')}"`);
    },

    // ── File System ───────────────────────────────────────────────────────────

    listDirectory: async ({ dirPath = '~' }) => {
        console.log(`[Host Agent] Listing directory: ${dirPath}`);
        const expanded = dirPath.replace('~', process.env.HOME);
        return await runShellCommand(`ls -la "${expanded}" 2>&1 | head -30`);
    },

    readFile: async ({ filePath }) => {
        console.log(`[Host Agent] Reading file: ${filePath}`);
        try {
            const expanded = filePath.replace('~', process.env.HOME);
            const content = fs.readFileSync(expanded, 'utf8');
            return content.substring(0, 2000); // Limit output
        } catch (err) {
            return `Error reading file: ${err.message}`;
        }
    },

    createFile: async ({ filePath, content = '' }) => {
        console.log(`[Host Agent] Creating file: ${filePath}`);
        try {
            const expanded = filePath.replace('~', process.env.HOME);
            fs.mkdirSync(path.dirname(expanded), { recursive: true });
            fs.writeFileSync(expanded, content, 'utf8');
            return `File created at ${filePath}`;
        } catch (err) {
            return `Error creating file: ${err.message}`;
        }
    },

    deleteFile: async ({ filePath }) => {
        console.log(`[Host Agent] Deleting file: ${filePath}`);
        try {
            const expanded = filePath.replace('~', process.env.HOME);
            fs.unlinkSync(expanded);
            return `File deleted: ${filePath}`;
        } catch (err) {
            return `Error deleting file: ${err.message}`;
        }
    },

    // ── Screenshot ────────────────────────────────────────────────────────────

    takeScreenshot: async ({ filename = '/tmp/agent_screen.png' } = {}) => {
        console.log(`[Host Agent] Taking screenshot: ${filename}`);
        const result = await runShellCommand(`screencapture -x "${filename}"`);
        if (result.startsWith('Error')) return { error: result };
        try {
            const data = fs.readFileSync(filename);
            const base64 = data.toString('base64');
            fs.unlinkSync(filename); // cleanup
            return { base64, mimeType: 'image/png', message: 'Screenshot captured.' };
        } catch (err) {
            return { error: `Could not read screenshot: ${err.message}` };
        }
    },

    // ── Display ───────────────────────────────────────────────────────────────

    setBrightness: async ({ level }) => {
        console.log(`[Host Agent] Setting brightness to: ${level}`);
        const normalized = Math.min(1, Math.max(0, parseFloat(level) / 100));
        return await runShellCommand(`osascript -e 'tell application "System Events" to set brightness of display 1 to ${normalized}'`).catch(() =>
            runShellCommand(`brightness ${normalized}`)
        );
    },

    // ── Shell (restricted) ────────────────────────────────────────────────────

    runShell: async ({ command }) => {
        // Block destructive commands
        const blocked = ['rm -rf', 'sudo', 'mkfs', 'dd if=', 'chmod 777', ':(){:|:&};:'];
        for (const b of blocked) {
            if (command.includes(b)) return `Blocked: command contains "${b}" which is not allowed for safety.`;
        }
        console.log(`[Host Agent] Running shell: ${command}`);
        return await runShellCommand(command);
    },
};

module.exports = tools;
