import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import WindowControls from "@components/common/WindowControl.jsx";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import "@style/code-ide.css";
import {
    Play,
    Terminal,
    Trash2,
    Save,
    Download,
    Copy,
    FileCode,
    Settings,
    Plus,
    RotateCcw,
    Search,
    Type,
    ListOrdered,
    WrapText,
    FilePlus2,
    CopyCheck,
    PanelBottom,
    Sparkles,
    ChevronDown,
    ChevronRight,
    Command,
    Folder,
    File,
    Bug,
    Wand2,
    TestTube2,
    Code2,
} from "lucide-react";
import CodeIDEAgent from "./CodeIDEAgent.jsx";
import usewindowstore from "@store/window.js";
import useFinderStore from "@store/finder.js";
import useNotificationStore from "@store/notifications.js";
import useAuthStore from "@store/auth.js";
import finderService from "@services/finder.service.js";

// ---- Language configs ----
const LANGUAGES = [
    { id: "javascript", label: "JavaScript", icon: "📜", version: "18.15.0", ext: ".js", template: '// Welcome to Code IDE ✨\nconsole.log("Hello, World!");\n\n// Try writing some JavaScript!\nconst greet = (name) => {\n    return `Hello, ${name}! 👋`;\n};\n\nconsole.log(greet("Muragesh"));\n' },
    { id: "python", label: "Python", icon: "🐍", version: "3.10.0", ext: ".py", template: '# Welcome to Code IDE ✨\nprint("Hello, World!")\n\n# Try writing some Python!\ndef greet(name):\n    return f"Hello, {name}! 👋"\n\nprint(greet("Muragesh"))\n' },
    { id: "typescript", label: "TypeScript", icon: "🔷", version: "5.0.3", ext: ".ts", template: '// Welcome to Code IDE ✨\nconsole.log("Hello, World!");\n\n// Try writing some TypeScript!\nconst greet = (name: string): string => {\n    return `Hello, ${name}! 👋`;\n};\n\nconsole.log(greet("Muragesh"));\n' },
    { id: "c", label: "C", icon: "⚙️", version: "10.2.0", ext: ".c", template: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n' },
    { id: "cpp", label: "C++", icon: "⚡", version: "10.2.0", ext: ".cpp", template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n' },
    { id: "java", label: "Java", icon: "☕", version: "15.0.2", ext: ".java", template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n' },
    { id: "html", label: "HTML", icon: "🌐", version: "5", ext: ".html", template: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n' },
    { id: "css", label: "CSS", icon: "🎨", version: "3", ext: ".css", template: 'body {\n    background-color: #f0f0f0;\n    font-family: sans-serif;\n}\nh1 {\n    color: #333;\n}\n' },
    { id: "php", label: "PHP", icon: "🐘", version: "8.2", ext: ".php", template: '<?php\n\necho "Hello, World!";\n' },
    { id: "ruby", label: "Ruby", icon: "💎", version: "3.2", ext: ".rb", template: 'puts "Hello, World!"\n' },
    { id: "go", label: "Go", icon: "🐹", version: "1.20", ext: ".go", template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n' },
    { id: "rust", label: "Rust", icon: "🦀", version: "1.68", ext: ".rs", template: 'fn main() {\n    println!("Hello, World!");\n}\n' },
];

const getLanguageFromFilename = (filename) => {
    if (!filename) return "javascript";
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex === -1) return "javascript";
    const ext = filename.substring(dotIndex).toLowerCase();
    const lang = LANGUAGES.find(l => l.ext === ext);
    return lang ? lang.id : "javascript";
};

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : "http://localhost:3001/api");
const CODE_EXECUTE_API = `${API_BASE_URL}/code/execute`;
const MIN_FONT_SIZE = 11;
const MAX_FONT_SIZE = 22;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tidyCode = (code, langId) => {
    if (!code.trim()) return code;
    if (langId === "python" || langId === "ruby") {
        return code.split("\n").map(line => line.replace(/\s+$/g, "")).join("\n");
    }
    if (langId === "html") {
        return code.split("\n").map(line => line.trim()).filter(Boolean).join("\n");
    }
    let depth = 0;
    return code.split("\n").map(rawLine => {
        const line = rawLine.trim();
        if (!line) return "";
        if (/^[}\])]/.test(line)) depth = Math.max(depth - 1, 0);
        const nextLine = `${"    ".repeat(depth)}${line}`;
        if (/[{[(]\s*$/.test(line) && !/^[}\])]/.test(line)) depth += 1;
        return nextLine;
    }).join("\n");
};

const authHeader = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.token) return { Authorization: `Bearer ${user.token}` };
    } catch (e) {
        console.error("Failed to parse user for auth header", e);
    }
    return {};
};

const FileTreeItem = ({ item, level = 0, onOpenFile }) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);

    const isFolder = item.type === 'folder';

    const toggleExpand = async () => {
        if (!expanded && isFolder && children.length === 0) {
            setLoading(true);
            try {
                const data = await finderService.getFiles(item._id, false);
                setChildren(data);
            } catch (err) {
                console.error("Failed to load folder contents", err);
            }
            setLoading(false);
        }
        setExpanded(!expanded);
    };

    const getIcon = () => {
        if (isFolder) return <Folder size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />;
        const langId = getLanguageFromFilename(item.name);
        const lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
        return <span style={{ flexShrink: 0 }}>{lang.icon || "📄"}</span>;
    };

    return (
        <div style={{ paddingLeft: level > 0 ? 10 : 0 }}>
            <div
                className={`ide-explorer-item ${isFolder ? 'folder' : 'file'}`}
                onClick={() => isFolder ? toggleExpand() : onOpenFile(item)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    {isFolder ? (
                        <ChevronRight 
                            size={12} 
                            style={{ 
                                flexShrink: 0,
                                transform: expanded ? 'rotate(90deg)' : 'none', 
                                transition: 'transform 0.15s ease' 
                            }} 
                        />
                    ) : (
                        <span style={{ width: 12, flexShrink: 0 }} /> // Spacer
                    )}
                    {getIcon()}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                    </span>
                </div>
                {loading && <span className="ide-spinner" style={{ width: 10, height: 10, flexShrink: 0, marginLeft: 6 }} />}
            </div>
            {expanded && isFolder && (
                <div className="ide-explorer-children">
                    {children.map(child => (
                        <FileTreeItem key={child._id} item={child} level={level + 1} onOpenFile={onOpenFile} />
                    ))}
                </div>
            )}
        </div>
    );
};

export function CodeIDE() {
    // ---- Store selectors & Actions ----
    const windowData = usewindowstore(state => state.window?.code?.data);
    const clearWindowData = usewindowstore(state => state.clearWindowData);
    const { createItem, updateFileContent } = useFinderStore();
    const { addNotification } = useNotificationStore();

    // ---- State ----
    const [tabs, setTabs] = useState(() => [
        { id: 1, name: "main.js", langId: "javascript", code: LANGUAGES[0].template, dirty: false },
        { id: 2, name: "main.py", langId: "python", code: LANGUAGES[1].template, dirty: false },
    ]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [output, setOutput] = useState("");
    const [outputStatus, setOutputStatus] = useState("idle");
    const [isRunning, setIsRunning] = useState(false);
    const [wordWrap, setWordWrap] = useState(true);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [showOutputPanel, setShowOutputPanel] = useState(false);
    const [showFindPanel, setShowFindPanel] = useState(false);
    const [showAgentPanel, setShowAgentPanel] = useState(true);
    const [sidebarTab, setSidebarTab] = useState("explorer");
    const [findQuery, setFindQuery] = useState("");
    const [replaceValue, setReplaceValue] = useState("");
    const [fontSize, setFontSize] = useState(13);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [outputCopied, setOutputCopied] = useState(false);
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const outputRef = useRef(null);
    const findInputRef = useRef(null);
    const nextTabId = useRef(3);

    // Save Modal State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveFileName, setSaveFileName] = useState("");
    const [saveFolderId, setSaveFolderId] = useState("root");
    const [saveLangId, setSaveLangId] = useState("javascript");
    const [folders, setFolders] = useState([]);

    // Command Palette State
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [commandQuery, setCommandQuery] = useState("");
    const [commandIndex, setCommandIndex] = useState(0);
    const commandInputRef = useRef(null);

    // Workspace Tree State
    const [workspaceItems, setWorkspaceItems] = useState([]);
    const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const activeLang = LANGUAGES.find(l => l.id === activeTab?.langId) || LANGUAGES[0];
    const activeCode = activeTab?.code || "";
    const isExecutable = activeLang.id !== "html" && activeLang.id !== "css";

    const codeStats = useMemo(() => {
        const trimmed = activeCode.trim();
        return {
            lines: activeCode.split("\n").length,
            words: trimmed ? trimmed.split(/\s+/).length : 0,
            chars: activeCode.length,
        };
    }, [activeCode]);

    const findMatchCount = useMemo(() => {
        if (!findQuery) return 0;
        return [...activeCode.matchAll(new RegExp(escapeRegExp(findQuery), "gi"))].length;
    }, [activeCode, findQuery]);

    const [isAutoSave, setIsAutoSave] = useState(false);
    useEffect(() => {
        if (!isAutoSave || !activeTab.fileId || !activeTab.dirty) return;
        const timer = setTimeout(() => {
            updateFileContent(activeTab.fileId, activeTab.code);
            setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, dirty: false } : t));
        }, 3000);
        return () => clearTimeout(timer);
    }, [activeTab.code, isAutoSave, activeTab.fileId, activeTab.dirty, updateFileContent, activeTabId]);

    // ---- Load file from window payload ----
    useEffect(() => {
        if (windowData?.file) {
            const file = windowData.file;
            setTabs(prevTabs => {
                const existingTab = prevTabs.find(t => t.fileId === file._id);
                if (existingTab) {
                    setActiveTabId(existingTab.id);
                    return prevTabs;
                } else {
                    const id = nextTabId.current++;
                    const langId = getLanguageFromFilename(file.name);
                    const newTab = {
                        id,
                        name: file.name,
                        langId,
                        code: file.content || "",
                        dirty: false,
                        fileId: file._id,
                        parentId: file.parentId
                    };
                    setActiveTabId(id);
                    return [...prevTabs, newTab];
                }
            });
            clearWindowData('code');
        }
    }, [windowData, clearWindowData]);

    // ---- Sync line-number scroll with textarea ----
    const handleEditorScroll = useCallback(() => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, []);

    const updateCursorPosition = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const beforeCursor = textarea.value.slice(0, textarea.selectionStart);
        const lines = beforeCursor.split("\n");
        setCursorPosition({
            line: lines.length,
            column: (lines[lines.length - 1]?.length || 0) + 1,
        });
    }, []);

    useEffect(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [output]);

    useEffect(() => {
        requestAnimationFrame(updateCursorPosition);
    }, [activeTabId, activeCode, updateCursorPosition]);

    const updateCode = useCallback((newCode) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code: newCode, dirty: true } : t));
    }, [activeTabId]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newCode = activeTab.code.substring(0, start) + "    " + activeTab.code.substring(end);
            updateCode(newCode);
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
                updateCursorPosition();
            });
            return;
        }
        const pairs = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
        if (pairs[e.key] && textareaRef.current) {
            e.preventDefault();
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = activeTab.code.substring(start, end);
            const nextCode = `${activeTab.code.substring(0, start)}${e.key}${selected}${pairs[e.key]}${activeTab.code.substring(end)}`;
            updateCode(nextCode);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.selectionStart = start + 1;
                textarea.selectionEnd = start + 1 + selected.length;
                updateCursorPosition();
            });
        }
    }, [activeTab?.code, updateCode, updateCursorPosition]);

    const changeLang = useCallback((newLangId) => {
        const lang = LANGUAGES.find(l => l.id === newLangId);
        if (!lang) return;
        setTabs(prev => prev.map(t => {
            if (t.id === activeTabId) return { ...t, langId: newLangId, name: `main${lang.ext}`, code: lang.template, dirty: true };
            return t;
        }));
    }, [activeTabId]);

    const addTab = useCallback(() => {
        const id = nextTabId.current++;
        const lang = LANGUAGES[0];
        setTabs(prev => [...prev, { id, name: `untitled${lang.ext}`, langId: lang.id, code: lang.template, dirty: false }]);
        setActiveTabId(id);
    }, []);

    const closeTab = useCallback((tabId, e) => {
        e.stopPropagation();
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.dirty && !window.confirm(`Close ${tab.name} with unsaved changes?`)) return;
        const remaining = tabs.filter(t => t.id !== tabId);
        if (remaining.length === 0) {
            const lang = LANGUAGES[0];
            const id = nextTabId.current++;
            setTabs([{ id, name: `main${lang.ext}`, langId: lang.id, code: lang.template, dirty: false }]);
            setActiveTabId(id);
            return;
        }
        setTabs(remaining);
        if (activeTabId === tabId) setActiveTabId(remaining[0].id);
    }, [activeTabId, tabs]);

    const copyToClipboard = useCallback(() => {
        if (!activeTab?.code) return;
        navigator.clipboard.writeText(activeTab.code);
        addNotification("Code IDE", "Copied to clipboard!", "success");
    }, [activeTab?.code, addNotification]);

    const downloadFile = useCallback(() => {
        if (!activeTab) return;
        const blob = new Blob([activeTab.code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = activeTab.name || "code.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addNotification("Code IDE", `Downloading ${activeTab.name}`, "success");
    }, [activeTab, addNotification]);

    const formatActiveCode = useCallback(() => {
        const formatted = tidyCode(activeCode, activeLang.id);
        updateCode(formatted);
        addNotification("Code IDE", `Formatted ${activeTab.name}`, "success");
    }, [activeCode, activeLang.id, activeTab?.name, addNotification, updateCode]);

    const resetTemplate = useCallback(() => {
        if (!window.confirm(`Reset ${activeTab.name} to the ${activeLang.label} starter template?`)) return;
        updateCode(activeLang.template);
        setOutput("");
        setOutputStatus("idle");
    }, [activeLang, activeTab?.name, updateCode]);

    const selectSearchRange = useCallback((start, end) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start, end);
            updateCursorPosition();
        });
    }, [updateCursorPosition]);

    const findNext = useCallback(() => {
        if (!findQuery || !textareaRef.current) return;
        const code = activeCode;
        const source = code.toLowerCase();
        const query = findQuery.toLowerCase();
        const startFrom = textareaRef.current.selectionEnd || 0;
        let matchIndex = source.indexOf(query, startFrom);
        if (matchIndex === -1 && startFrom > 0) matchIndex = source.indexOf(query, 0);
        if (matchIndex >= 0) selectSearchRange(matchIndex, matchIndex + findQuery.length);
    }, [activeCode, findQuery, selectSearchRange]);

    const replaceCurrent = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea || !findQuery) return;
        const { selectionStart, selectionEnd } = textarea;
        const selected = activeCode.substring(selectionStart, selectionEnd);
        if (selected.toLowerCase() !== findQuery.toLowerCase()) { findNext(); return; }
        const nextCode = `${activeCode.substring(0, selectionStart)}${replaceValue}${activeCode.substring(selectionEnd)}`;
        updateCode(nextCode);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(selectionStart, selectionStart + replaceValue.length);
            updateCursorPosition();
        });
    }, [activeCode, findNext, findQuery, replaceValue, updateCode, updateCursorPosition]);

    const replaceAll = useCallback(() => {
        if (!findQuery) return;
        updateCode(activeCode.replace(new RegExp(escapeRegExp(findQuery), "gi"), replaceValue));
    }, [activeCode, findQuery, replaceValue, updateCode]);

    const copyOutput = useCallback(async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setOutputCopied(true);
        window.setTimeout(() => setOutputCopied(false), 1400);
    }, [output]);

    const runCode = useCallback(async () => {
        if (!isExecutable) {
            setShowOutputPanel(true);
            setOutput(`ℹ️ HTML/CSS cannot be executed directly. Save & open in browser.`);
            setOutputStatus("success");
            return;
        }
        if (isRunning) return;
        setIsRunning(true);
        setShowOutputPanel(true);
        setOutputStatus("running");
        setOutput("⏳ Running...\n");
        try {
            const response = await fetch(CODE_EXECUTE_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeader() },
                body: JSON.stringify({ language: activeLang.id, code: activeTab.code }),
            });
            if (!response.ok) {
                if (response.status === 401) {
                    useAuthStore.getState().logout();
                    throw new Error("Your session has expired. Please log in again.");
                }
                let message = `API error: ${response.status}`;
                try { const errorData = await response.json(); message = errorData.error || errorData.message || message; } catch {}
                throw new Error(message);
            }
            const data = await response.json();
            const stdout = data.run?.stdout || "";
            const stderr = data.run?.stderr || "";
            const exitCode = data.run?.code ?? 0;
            let result = "";
            if (stdout) result += stdout;
            if (stderr) result += (result ? "\n" : "") + "⚠️ " + stderr;
            if (!stdout && !stderr) result = "✅ Program finished with no output.";
            if (exitCode !== 0 && !stderr) result += `\n❌ Exit code: ${exitCode}`;
            setOutput(result);
            setOutputStatus(stderr || exitCode !== 0 ? "error" : "success");
        } catch (err) {
            setOutput(`❌ Error: ${err.message}`);
            setOutputStatus("error");
        } finally {
            setIsRunning(false);
        }
    }, [activeTab?.code, activeLang.id, isExecutable, isRunning]);

    const handleSaveClick = useCallback(async () => {
        if (activeTab.fileId) {
            try {
                await updateFileContent(activeTab.fileId, activeTab.code);
                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, dirty: false } : t));
                addNotification("Code IDE", `Saved ${activeTab.name}`, "success");
            } catch (err) {
                addNotification("Code IDE", `Failed to save: ${err.message}`, "error");
            }
        } else {
            try {
                const foldersData = await finderService.getFiles(null, false, '', 'folder');
                setFolders(foldersData);
            } catch (err) {
                console.error("Failed to load folders", err);
            }
            setSaveFileName(activeTab.name || "");
            setSaveFolderId(activeTab.parentId || "root");
            setSaveLangId(activeTab.langId || "javascript");
            setIsSaveModalOpen(true);
        }
    }, [activeTab, activeTabId, addNotification, updateFileContent]);

    const insertCodeFromAgent = useCallback((snippet) => {
        updateCode(snippet);
        addNotification("Code IDE", "MAI inserted code into the editor", "success");
    }, [addNotification, updateCode]);

    // Command Palette actions
    const IDE_COMMANDS = useMemo(() => [
        { id: 'run', label: 'Run Code', icon: <Play size={14} />, shortcut: 'Cmd+Enter', action: runCode, disabled: !isExecutable },
        { id: 'save', label: 'Save File', icon: <Save size={14} />, shortcut: 'Cmd+S', action: handleSaveClick },
        { id: 'format', label: 'Format Code', icon: <WrapText size={14} />, action: formatActiveCode },
        { id: 'find', label: 'Find & Replace', icon: <Search size={14} />, shortcut: 'Cmd+F', action: () => { setShowFindPanel(true); requestAnimationFrame(() => findInputRef.current?.focus()); } },
        { id: 'agent', label: 'Toggle MAI Agent', icon: <Sparkles size={14} />, action: () => { setSidebarTab("mai"); setShowAgentPanel(true); } },
        { id: 'terminal', label: 'Toggle Terminal', icon: <Terminal size={14} />, action: () => setShowOutputPanel(p => !p) },
        { id: 'wordWrap', label: 'Toggle Word Wrap', icon: <FileCode size={14} />, action: () => setWordWrap(w => !w) },
        { id: 'lineNumbers', label: 'Toggle Line Numbers', icon: <ListOrdered size={14} />, action: () => setShowLineNumbers(l => !l) },
        { id: 'explorer', label: 'Show Explorer', icon: <Folder size={14} />, action: () => setSidebarTab("explorer") },
        { id: 'closeTab', label: 'Close Active Tab', icon: <Trash2 size={14} />, action: () => closeTab(activeTabId, { stopPropagation: () => {} }) },
    ], [runCode, isExecutable, handleSaveClick, formatActiveCode, activeTabId, closeTab]);

    const filteredCommands = useMemo(() => {
        if (!commandQuery) return IDE_COMMANDS;
        const q = commandQuery.toLowerCase();
        return IDE_COMMANDS.filter(c => c.label.toLowerCase().includes(q));
    }, [commandQuery, IDE_COMMANDS]);

    const openFileInEditor = useCallback((fileItem) => {
        setTabs(prev => {
            const existing = prev.find(t => t.fileId === fileItem._id);
            if (existing) {
                setActiveTabId(existing.id);
                return prev;
            }
            const id = nextTabId.current++;
            const langId = getLanguageFromFilename(fileItem.name);
            const newTab = {
                id,
                name: fileItem.name,
                langId,
                code: fileItem.content || "",
                dirty: false,
                fileId: fileItem._id,
                parentId: fileItem.parentId
            };
            setActiveTabId(id);
            return [...prev, newTab];
        });
    }, []);

    useEffect(() => {
        if (sidebarTab === 'explorer' && !workspaceLoaded) {
            setWorkspaceLoaded(true);
            finderService.getFiles(null, false).then(data => {
                setWorkspaceItems(data);
            }).catch(err => console.error("Failed to load workspace", err));
        }
    }, [sidebarTab, workspaceLoaded]);

    useEffect(() => {
        const handleShortcut = (event) => {
            const isModifier = event.metaKey || event.ctrlKey;
            
            // Command Palette Navigation
            if (isCommandPaletteOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setIsCommandPaletteOpen(false);
                } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setCommandIndex(i => (i + 1) % filteredCommands.length);
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setCommandIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    const cmd = filteredCommands[commandIndex];
                    if (cmd && !cmd.disabled) {
                        cmd.action();
                        setIsCommandPaletteOpen(false);
                    }
                }
                return; // Stop other shortcuts while palette is open
            }

            if (!isModifier) return;
            if (!document.activeElement?.closest?.(".ide-container")) return;
            
            if (event.key.toLowerCase() === "p" && event.shiftKey) {
                event.preventDefault();
                setIsCommandPaletteOpen(true);
                setCommandQuery("");
                setCommandIndex(0);
                requestAnimationFrame(() => commandInputRef.current?.focus());
            } else if (event.key.toLowerCase() === "p") {
                // allow regular cmd+p as well if not conflicting
                event.preventDefault();
                setIsCommandPaletteOpen(true);
                setCommandQuery("");
                setCommandIndex(0);
                requestAnimationFrame(() => commandInputRef.current?.focus());
            } else if (event.key === "Enter" && isExecutable) { 
                event.preventDefault(); runCode(); 
            } else if (event.key.toLowerCase() === "s") { 
                event.preventDefault(); handleSaveClick(); 
            } else if (event.key.toLowerCase() === "f") {
                event.preventDefault();
                setShowFindPanel(true);
                requestAnimationFrame(() => findInputRef.current?.focus());
            }
        };
        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [handleSaveClick, isExecutable, runCode, isCommandPaletteOpen, filteredCommands, commandIndex]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setSaveFileName(val);
        const dotIndex = val.lastIndexOf(".");
        if (dotIndex !== -1) {
            const ext = val.substring(dotIndex).toLowerCase();
            const matchedLang = LANGUAGES.find(l => l.ext === ext);
            if (matchedLang) setSaveLangId(matchedLang.id);
        }
    };

    const handleSaveSubmit = async (e) => {
        e.preventDefault();
        if (!saveFileName.trim()) return;
        try {
            const selectedLang = LANGUAGES.find(l => l.id === saveLangId) || LANGUAGES[0];
            let filename = saveFileName.trim();
            if (!filename.endsWith(selectedLang.ext)) {
                const dotIndex = filename.lastIndexOf(".");
                if (dotIndex !== -1) filename = filename.substring(0, dotIndex) + selectedLang.ext;
                else filename = filename + selectedLang.ext;
            }
            const newItem = await createItem({
                name: filename,
                type: 'file',
                parentId: saveFolderId === 'root' ? null : saveFolderId,
                fileType: selectedLang.ext.substring(1),
                content: activeTab.code,
                icon: '/images/code.png'
            });
            setTabs(prev => prev.map(t => t.id === activeTabId ? {
                ...t, name: newItem.name, fileId: newItem._id,
                parentId: newItem.parentId, langId: saveLangId, dirty: false
            } : t));
            setIsSaveModalOpen(false);
            addNotification("Code IDE", `Successfully created ${newItem.name}`, "success");
        } catch (err) {
            addNotification("Code IDE", `Failed to create file: ${err.message}`, "error");
        }
    };

    const lineCount = codeStats.lines;

    return (
        <div className="ide-container">

            {/* ── Activity Bar ── */}
            <aside className="ide-activity-bar">
                <div className="ide-activity-top">
                    <button
                        className={`ide-activity-item ${sidebarTab === "explorer" ? "active" : ""}`}
                        onClick={() => setSidebarTab(sidebarTab === "explorer" ? null : "explorer")}
                        title="Explorer"
                    >
                        <FileCode size={19} />
                    </button>
                    <button
                        className={`ide-activity-item ${sidebarTab === "search" ? "active" : ""}`}
                        onClick={() => setSidebarTab(sidebarTab === "search" ? null : "search")}
                        title="Search"
                    >
                        <Search size={19} />
                    </button>
                    <button
                        className={`ide-activity-item ${sidebarTab === "mai" ? "active" : ""}`}
                        onClick={() => {
                            setSidebarTab("mai");
                            setShowAgentPanel(true);
                        }}
                        title="MAI AI Agent"
                    >
                        <Sparkles size={19} />
                    </button>
                </div>
                <div className="ide-activity-bottom">
                    <button
                        className={`ide-activity-item ${showOutputPanel ? "active" : ""}`}
                        onClick={() => setShowOutputPanel(!showOutputPanel)}
                        title="Toggle Terminal"
                    >
                        <Terminal size={19} />
                    </button>
                    <button
                        className={`ide-activity-item ${sidebarTab === "settings" ? "active" : ""}`}
                        onClick={() => setSidebarTab(sidebarTab === "settings" ? null : "settings")}
                        title="Settings"
                    >
                        <Settings size={19} />
                    </button>
                </div>
            </aside>

            {/* ── Main Layout ── */}
            <div className="ide-main-layout">

                {/* ── Header / Tab Bar ── */}
                <header id="window-header" className="ide-header">
                    <div id="window-controls" style={{ flexShrink: 0 }}>
                        <WindowControls target="code" />
                    </div>

                    <div className="ide-header-center">
                        <div className="ide-tabs-container">
                            <div className="ide-tabs">
                                {tabs.map(tab => {
                                    const lang = LANGUAGES.find(l => l.id === tab.langId);
                                    return (
                                        <button
                                            key={tab.id}
                                            className={`ide-tab ${tab.id === activeTabId ? "ide-tab-active" : ""}`}
                                            onClick={() => setActiveTabId(tab.id)}
                                        >
                                            <span className="ide-tab-icon">{lang?.icon || "📄"}</span>
                                            <span className="ide-tab-name">{tab.name}</span>
                                            {tab.dirty && <span className="ide-tab-dirty" />}
                                            <span className="ide-tab-close" onClick={(e) => closeTab(tab.id, e)}>×</span>
                                        </button>
                                    );
                                })}
                                <button className="ide-tab-new" onClick={addTab} title="New tab">
                                    <Plus size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="ide-header-actions">
                        {isExecutable && (
                            <button className="ide-run-pill" onClick={runCode} disabled={isRunning}>
                                {isRunning ? <span className="ide-spinner" /> : <Play size={11} fill="currentColor" />}
                                <span>{isRunning ? "Running…" : "Run"}</span>
                            </button>
                        )}
                        <button className="ide-save-pill" onClick={handleSaveClick}>
                            <Save size={11} />
                            <span>Save</span>
                        </button>
                    </div>
                </header>

                {/* ── Content Area ── */}
                <div className="ide-content-area">

                    {/* ── Secondary Sidebar ── */}
                    {sidebarTab && sidebarTab !== "mai" && (
                        <aside className="ide-secondary-sidebar">
                            <div className="ide-sidebar-header">
                                {sidebarTab === "explorer" && "Explorer"}
                                {sidebarTab === "search" && "Search & Replace"}
                                {sidebarTab === "settings" && "IDE Settings"}
                            </div>
                            <div className="ide-sidebar-content">

                                {/* Explorer */}
                                {sidebarTab === "explorer" && (
                                    <div className="ide-explorer-view">
                                        <div className="ide-explorer-section">
                                            <div className="ide-explorer-label">Open Editors</div>
                                            <div className="ide-explorer-list">
                                                {tabs.map(t => (
                                                    <div
                                                        key={t.id}
                                                        className={`ide-explorer-item ${t.id === activeTabId ? "active" : ""}`}
                                                        onClick={() => setActiveTabId(t.id)}
                                                    >
                                                        {LANGUAGES.find(l => l.id === t.langId)?.icon || "📄"} {t.name}
                                                        {t.dirty && <span className="ide-tab-dirty" style={{ marginLeft: 'auto' }} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {workspaceItems.length > 0 && (
                                            <div className="ide-explorer-section">
                                                <div className="ide-explorer-label">Workspace</div>
                                                <div className="ide-explorer-list">
                                                    {workspaceItems.map(item => (
                                                        <FileTreeItem key={item._id} item={item} onOpenFile={openFileInEditor} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Search */}
                                {sidebarTab === "search" && (
                                    <div className="ide-search-view">
                                        <div className="ide-search-group">
                                            <input
                                                ref={findInputRef}
                                                className="ide-sidebar-input"
                                                placeholder="Find…"
                                                value={findQuery}
                                                onChange={(e) => setFindQuery(e.target.value)}
                                            />
                                            <input
                                                className="ide-sidebar-input"
                                                placeholder="Replace…"
                                                value={replaceValue}
                                                onChange={(e) => setReplaceValue(e.target.value)}
                                            />
                                        </div>
                                        {findQuery && (
                                            <div style={{ fontSize: '11px', color: 'var(--ide-text-muted)', padding: '0 2px' }}>
                                                {findMatchCount} match{findMatchCount !== 1 ? 'es' : ''}
                                            </div>
                                        )}
                                        <div className="ide-search-actions">
                                            <button onClick={findNext}>Find Next</button>
                                            <button onClick={replaceAll}>Replace All</button>
                                        </div>
                                    </div>
                                )}

                                {/* Settings */}
                                {sidebarTab === "settings" && (
                                    <div className="ide-settings-view">
                                        <div className="ide-setting-item">
                                            <label>Language</label>
                                            <select value={activeTab?.langId} onChange={(e) => changeLang(e.target.value)}>
                                                {LANGUAGES.map(lang => (
                                                    <option key={lang.id} value={lang.id}>{lang.icon} {lang.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="ide-setting-item">
                                            <label>Font Size: {fontSize}px</label>
                                            <div className="ide-font-btns">
                                                <button onClick={() => setFontSize(s => Math.max(MIN_FONT_SIZE, s - 1))}>−</button>
                                                <button onClick={() => setFontSize(s => Math.min(MAX_FONT_SIZE, s + 1))}>+</button>
                                            </div>
                                        </div>
                                        <div className="ide-setting-item">
                                            <label className="ide-checkbox-label">
                                                <input type="checkbox" checked={wordWrap} onChange={() => setWordWrap(!wordWrap)} />
                                                Word Wrap
                                            </label>
                                        </div>
                                        <div className="ide-setting-item">
                                            <label className="ide-checkbox-label">
                                                <input type="checkbox" checked={showLineNumbers} onChange={() => setShowLineNumbers(!showLineNumbers)} />
                                                Line Numbers
                                            </label>
                                        </div>
                                        <div className="ide-setting-item">
                                            <label className="ide-checkbox-label">
                                                <input type="checkbox" checked={isAutoSave} onChange={() => setIsAutoSave(!isAutoSave)} />
                                                Auto Save
                                            </label>
                                        </div>
                                        <div className="ide-setting-item" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <button className="ide-sidebar-action" onClick={formatActiveCode}>
                                                <WrapText size={12} /> Format Code
                                            </button>
                                            <button className="ide-sidebar-action" onClick={copyToClipboard}>
                                                <Copy size={12} /> Copy All
                                            </button>
                                            <button className="ide-sidebar-action" onClick={downloadFile}>
                                                <Download size={12} /> Download File
                                            </button>
                                            <button className="ide-sidebar-action danger" onClick={resetTemplate}>
                                                <RotateCcw size={12} /> Reset Template
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}

                    {/* ── Workbench ── */}
                    <div className="ide-workbench">
                        <div className="ide-editor-column">

                            {/* Find Panel */}
                            {showFindPanel && (
                                <div className="ide-find-panel">
                                    <Search size={13} style={{ color: 'var(--ide-text-muted)', flexShrink: 0 }} />
                                    <input
                                        ref={findInputRef}
                                        className="ide-find-input"
                                        placeholder="Find…"
                                        value={findQuery}
                                        onChange={(e) => setFindQuery(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') findNext(); if (e.key === 'Escape') setShowFindPanel(false); }}
                                    />
                                    <input
                                        className="ide-find-input"
                                        placeholder="Replace…"
                                        value={replaceValue}
                                        onChange={(e) => setReplaceValue(e.target.value)}
                                    />
                                    {findQuery && (
                                        <span className="ide-find-count">{findMatchCount} match{findMatchCount !== 1 ? 'es' : ''}</span>
                                    )}
                                    <button className="ide-output-actions" style={{ display: 'flex', gap: 2 }}>
                                        <button onClick={findNext} title="Find Next" style={{ background: 'none', border: 'none', color: 'var(--ide-text-muted)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>Next</button>
                                        <button onClick={replaceAll} title="Replace All" style={{ background: 'none', border: 'none', color: 'var(--ide-text-muted)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>Replace All</button>
                                    </button>
                                    <button
                                        onClick={() => setShowFindPanel(false)}
                                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ide-text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
                                        title="Close"
                                    >×</button>
                                </div>
                            )}

                            <div className="ide-editor-wrapper">
                                {showLineNumbers && (
                                    <div
                                        className="ide-line-numbers"
                                        ref={lineNumbersRef}
                                        style={{ fontSize: `${fontSize}px` }}
                                        aria-hidden="true"
                                    >
                                        {Array.from({ length: lineCount }, (_, i) => (
                                            <span key={i + 1} className="ide-line-number">{i + 1}</span>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    className="ide-textarea"
                                    value={activeTab?.code || ""}
                                    onChange={(e) => {
                                        updateCode(e.target.value);
                                        requestAnimationFrame(updateCursorPosition);
                                    }}
                                    onScroll={handleEditorScroll}
                                    onKeyDown={handleKeyDown}
                                    onKeyUp={updateCursorPosition}
                                    onClick={updateCursorPosition}
                                    onSelect={updateCursorPosition}
                                    spellCheck={false}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    style={{
                                        whiteSpace: wordWrap ? "pre-wrap" : "pre",
                                        fontSize: `${fontSize}px`,
                                    }}
                                    placeholder={`Write your ${activeLang.label} code here…`}
                                />
                            </div>

                            {/* Output / Terminal Panel */}
                            {showOutputPanel && (
                                <div className="ide-output-panel">
                                    <div className="ide-output-header">
                                        <div className="ide-output-title">
                                            <Terminal size={11} />
                                            <span>TERMINAL</span>
                                            {outputStatus === "running" && (
                                                <span className="ide-spinner" style={{ marginLeft: 6 }} />
                                            )}
                                            {outputStatus === "success" && (
                                                <span style={{ color: 'var(--ide-term-green)', fontSize: 10 }}>● OK</span>
                                            )}
                                            {outputStatus === "error" && (
                                                <span style={{ color: 'var(--ide-term-red)', fontSize: 10 }}>● ERR</span>
                                            )}
                                        </div>
                                        <div className="ide-output-actions">
                                            <button onClick={() => { setOutput(""); setOutputStatus("idle"); }} title="Clear">
                                                <Trash2 size={12} />
                                            </button>
                                            <button onClick={copyOutput} title="Copy output">
                                                {outputCopied ? <CopyCheck size={12} /> : <Copy size={12} />}
                                            </button>
                                            <button onClick={() => setShowOutputPanel(false)} title="Close">
                                                <ChevronDown size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ide-output-content" ref={outputRef}>
                                        {output ? (
                                            <span className={
                                                outputStatus === "error" ? "ide-output-error"
                                                : outputStatus === "success" ? "ide-output-success"
                                                : ""
                                            }>
                                                {output}
                                            </span>
                                        ) : (
                                            <span className="ide-output-placeholder">
                                                Terminal ready — press Run or Ctrl+Enter to execute your code.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── AI Agent Panel (right side) ── */}
                        {(sidebarTab === "mai" && showAgentPanel) && (
                            <CodeIDEAgent
                                fileName={activeTab?.name || "untitled"}
                                language={activeLang.id}
                                code={activeCode}
                                onInsertCode={insertCodeFromAgent}
                                onClose={() => { setShowAgentPanel(false); setSidebarTab("explorer"); }}
                            />
                        )}
                    </div>
                </div>

                {/* ── Status Bar ── */}
                <div className="ide-statusbar">
                    <div className="ide-statusbar-left">
                        <span className="ide-status-item">{activeLang.icon} {activeLang.label}</span>
                        <span className="ide-status-item">v{activeLang.version}</span>
                        <span className="ide-status-item">{codeStats.lines} lines</span>
                        {activeTab?.dirty && (
                            <span className="ide-status-item" style={{ color: '#fbbf24' }}>● Unsaved</span>
                        )}
                    </div>
                    <div className="ide-statusbar-right">
                        <span className="ide-status-item">Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                        <span className="ide-status-item">{wordWrap ? "Wrap" : "No Wrap"}</span>
                        {sidebarTab === "mai" && (
                            <span className="ide-status-item mai-pulse">
                                <Sparkles size={10} /> MAI Active
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Save Modal ── */}
            {isSaveModalOpen && (
                <div className="ide-modal-overlay" onClick={() => setIsSaveModalOpen(false)}>
                    <div className="ide-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ide-modal-header">Save File to Workspace</div>
                        <form onSubmit={handleSaveSubmit}>
                            <div className="ide-modal-body">
                                <div className="ide-modal-field">
                                    <label>File Name</label>
                                    <input
                                        type="text"
                                        className="ide-modal-input"
                                        value={saveFileName}
                                        onChange={handleNameChange}
                                        placeholder="filename.js"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="ide-modal-field">
                                    <label>Location</label>
                                    <select
                                        className="ide-modal-select"
                                        value={saveFolderId}
                                        onChange={(e) => setSaveFolderId(e.target.value)}
                                    >
                                        <option value="root">📁 / (Root)</option>
                                        {folders.map(folder => (
                                            <option key={folder._id} value={folder._id}>📁 {folder.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ide-modal-field">
                                    <label>Language</label>
                                    <select
                                        className="ide-modal-select"
                                        value={saveLangId}
                                        onChange={(e) => setSaveLangId(e.target.value)}
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.id} value={lang.id}>{lang.icon} {lang.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="ide-modal-footer">
                                <button type="button" className="ide-modal-btn cancel" onClick={() => setIsSaveModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="ide-modal-btn save">
                                    Save File
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Command Palette ── */}
            {isCommandPaletteOpen && (
                <div className="ide-command-palette-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
                    <div className="ide-command-palette" onClick={(e) => e.stopPropagation()}>
                        <div className="ide-command-header">
                            <Command size={14} style={{ color: 'var(--ide-text-muted)' }} />
                            <input
                                ref={commandInputRef}
                                className="ide-command-input"
                                value={commandQuery}
                                onChange={(e) => {
                                    setCommandQuery(e.target.value);
                                    setCommandIndex(0);
                                }}
                                placeholder="Search IDE commands..."
                            />
                        </div>
                        <div className="ide-command-list">
                            {filteredCommands.length > 0 ? filteredCommands.map((cmd, i) => (
                                <div 
                                    key={cmd.id}
                                    className={`ide-command-item ${i === commandIndex ? 'active' : ''} ${cmd.disabled ? 'disabled' : ''}`}
                                    onClick={() => {
                                        if (!cmd.disabled) {
                                            cmd.action();
                                            setIsCommandPaletteOpen(false);
                                        }
                                    }}
                                    onMouseEnter={() => setCommandIndex(i)}
                                >
                                    <span className="ide-command-icon">{cmd.icon}</span>
                                    <span className="ide-command-label">{cmd.label}</span>
                                    {cmd.shortcut && <span className="ide-command-shortcut">{cmd.shortcut}</span>}
                                </div>
                            )) : (
                                <div className="ide-command-empty">No matching commands found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const CodeIDEWindow = WindowWrapper(CodeIDE, "code");
export default CodeIDEWindow;
