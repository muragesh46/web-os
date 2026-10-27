import { useState, useRef, useEffect } from "react";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import { techStack, socials } from "@constants/data.js";
import { Check, Flag, Terminal as TerminalIcon } from "lucide-react";
import WindowControls from "@components/common/WindowControl.jsx";
import usewindowstore from "@store/window.js";
import useSettingsStore from "@store/settings.js";
import useAuthStore from "@store/auth.js";

function Terminal() {
    const { openwindow, closewindow } = usewindowstore();
    const { theme, toggleTheme, setTheme } = useSettingsStore();
    const { user } = useAuthStore();

    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [commandHistory, setCommandHistory] = useState([]);
    const [output, setOutput] = useState([
        {
            type: "initial",
            command: "show skill i have",
        }
    ]);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [output]);

    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const executeCommand = (cmdText) => {
        const trimmed = cmdText.trim();
        if (!trimmed) return;

        setCommandHistory(prev => [...prev, trimmed]);
        setHistoryIndex(-1);

        const parts = trimmed.split(" ");
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        let result = null;

        switch (cmd) {
            case "help":
                result = (
                    <div className="space-y-1 text-xs text-gray-300">
                        <p className="text-emerald-400 font-semibold mb-1">Available Commands:</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">skills</span> List full tech stack & skills</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">projects</span> Display featured projects</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">about</span> Developer background and bio</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">contact</span> Social links & contact info</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">open &lt;app&gt;</span> Open an app (finder, code, resume, maps, music, calculator)</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">theme</span> Switch theme (theme dark | theme light | theme toggle)</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">whoami</span> Display current user</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">date</span> Show current date & time</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">ls</span> List virtual directory files</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">clear</span> Clear terminal screen</p>
                        <p><span className="text-yellow-300 font-bold w-24 inline-block">exit</span> Close terminal</p>
                    </div>
                );
                break;

            case "skills":
            case "show":
                result = (
                    <div className="space-y-2 mt-2">
                        <ul className="content py-2 my-2 border-y border-dashed border-white/20 space-y-1">
                            {techStack.map(({ category, items }) => (
                                <li key={category} className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 w-36 text-emerald-400">
                                        <Check className="check text-emerald-400" size={16} />
                                        <span className="font-semibold">{category}</span>
                                    </div>
                                    <span className="text-gray-300 text-xs">{items.join(", ")}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
                break;

            case "projects":
                result = (
                    <div className="space-y-2 text-xs text-gray-300">
                        <p className="text-blue-400 font-bold">1. Muragesh WebOS</p>
                        <p className="text-gray-400 pl-4">Interactive macOS desktop experience built with React, GSAP, and Tailwind.</p>
                        <p className="text-blue-400 font-bold">2. Marnani - Airbnb Clone</p>
                        <p className="text-gray-400 pl-4">Full-stack vacation rental platform with auth, booking, maps, and reviews.</p>
                        <p className="text-blue-400 font-bold">3. Crop Recommendation System</p>
                        <p className="text-gray-400 pl-4">Machine learning powered agricultural advisory model.</p>
                        <p className="text-emerald-400 mt-2">Tip: Type <span className="text-yellow-300 font-bold">open finder</span> to explore project folders.</p>
                    </div>
                );
                break;

            case "about":
                result = (
                    <div className="text-xs text-gray-300 space-y-1">
                        <p><span className="text-emerald-400 font-bold">Muragesh Mirje</span> — Full-Stack Developer & Software Engineer</p>
                        <p className="text-gray-400">Passionate about building highly interactive, polished web experiences, scalable distributed architectures, and AI-driven products.</p>
                    </div>
                );
                break;

            case "contact":
                result = (
                    <div className="text-xs text-gray-300 space-y-1">
                        {socials.map((s) => (
                            <p key={s.id}>
                                <span className="text-yellow-300 font-semibold w-24 inline-block">{s.text}:</span>
                                <a href={s.link} target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">
                                    {s.link}
                                </a>
                            </p>
                        ))}
                    </div>
                );
                break;

            case "whoami":
                result = <p className="text-xs text-emerald-400">{user?.displayName || "guest"}@muragesh-mac</p>;
                break;

            case "date":
                result = <p className="text-xs text-gray-300">{new Date().toString()}</p>;
                break;

            case "ls":
                result = (
                    <div className="flex gap-4 text-xs font-semibold">
                        <span className="text-blue-400">Projects/</span>
                        <span className="text-blue-400">About/</span>
                        <span className="text-emerald-400">Resume.pdf</span>
                        <span className="text-yellow-300">README.md</span>
                    </div>
                );
                break;

            case "clear":
                setOutput([]);
                return;

            case "exit":
                closewindow("terminal");
                return;

            case "theme":
                if (args[0] === "light") {
                    setTheme("light");
                    result = <p className="text-xs text-gray-300">Switched to light theme.</p>;
                } else if (args[0] === "dark") {
                    setTheme("dark");
                    result = <p className="text-xs text-gray-300">Switched to dark theme.</p>;
                } else {
                    toggleTheme();
                    result = <p className="text-xs text-gray-300">Theme toggled.</p>;
                }
                break;

            case "open":
                if (!args[0]) {
                    result = <p className="text-xs text-red-400">Usage: open &lt;app-name&gt; (e.g. open finder, open code, open resume)</p>;
                } else {
                    const target = args[0].toLowerCase();
                    const appMap = {
                        finder: "finder",
                        code: "code",
                        resume: "resume",
                        about: "about",
                        maps: "maps",
                        music: "music",
                        calculator: "calculator",
                        settings: "settings",
                        camera: "camera",
                        contact: "contact",
                        photos: "photos",
                        chat: "chat",
                    };
                    if (appMap[target]) {
                        openwindow(appMap[target]);
                        result = <p className="text-xs text-emerald-400">Opening {target}...</p>;
                    } else {
                        result = <p className="text-xs text-red-400">App "{target}" not found. Try: finder, code, resume, maps, music, calculator, settings.</p>;
                    }
                }
                break;

            case "sudo":
                result = <p className="text-xs text-red-400">Permission denied: user does not have superuser privileges.</p>;
                break;

            default:
                if (trimmed.startsWith("echo ")) {
                    result = <p className="text-xs text-gray-300">{trimmed.slice(5)}</p>;
                } else {
                    result = (
                        <p className="text-xs text-red-400">
                            command not found: {cmd}. Type <span className="text-yellow-300 font-bold">help</span> for a list of commands.
                        </p>
                    );
                }
                break;
        }

        setOutput(prev => [...prev, { command: trimmed, result }]);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            executeCommand(input);
            setInput("");
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const nextIndex = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
                setHistoryIndex(nextIndex);
                setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex > 0) {
                const nextIndex = historyIndex - 1;
                setHistoryIndex(nextIndex);
                setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput("");
            }
        }
    };

    return (
        <div className="w-[680px] max-w-[90vw] bg-[#1e1e1e] text-gray-100 rounded-xl shadow-2xl overflow-hidden border border-white/10 font-roboto" onClick={handleContainerClick}>
            <div id="window-header" className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-black/40 select-none">
                <div id="window-controls">
                    <WindowControls target="terminal" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <TerminalIcon size={14} className="text-emerald-400" />
                    <span>terminal — zsh — 80×24</span>
                </div>
                <div className="w-12"></div>
            </div>

            <div className="techstack p-4 max-h-[60vh] overflow-y-auto text-sm space-y-4 font-roboto bg-black/95 text-gray-200">
                {output.map((entry, idx) => (
                    <div key={idx} className="space-y-2">
                        {entry.type === "initial" ? (
                            <>
                                <p>
                                    <span className="font-bold text-emerald-400">@Muragesh % </span>
                                    <span className="text-gray-100">show skill i have</span>
                                </p>

                                <div className="label flex items-center ms-6 mt-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    <p className="w-36">Category</p>
                                    <p>Technologies</p>
                                </div>

                                <ul className="content py-3 my-2 border-y border-dashed border-white/20 space-y-1.5">
                                    {techStack.map(({ category, items }) => (
                                        <li key={category} className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 w-36 text-emerald-400">
                                                <Check className="check text-emerald-400" size={16} />
                                                <span className="font-medium text-xs">{category}</span>
                                            </div>
                                            <span className="text-gray-300 text-xs">
                                                {items.join(", ")}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="footnote text-xs text-emerald-400 flex items-center justify-between pt-1">
                                    <p className="flex items-center gap-2">
                                        <Check size={14} /> All tech stack loaded successfully (100%)
                                    </p>
                                    <p className="text-gray-500 flex items-center gap-1">
                                        <Flag size={12} /> ready
                                    </p>
                                </div>
                                <p className="text-xs text-gray-400 pt-2 italic">
                                    💡 Type <span className="text-yellow-300 font-semibold">help</span> to view all commands or launch apps.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    <span className="font-bold text-emerald-400">@Muragesh % </span>
                                    <span className="text-gray-100">{entry.command}</span>
                                </p>
                                {entry.result && <div className="mt-1 pl-2">{entry.result}</div>}
                            </>
                        )}
                    </div>
                ))}

                {/* Active Prompt Line */}
                <div className="flex items-center gap-2 pt-1">
                    <span className="font-bold text-emerald-400 whitespace-nowrap">@Muragesh %</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        spellCheck="false"
                        autoCapitalize="off"
                        autoComplete="off"
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 font-roboto text-sm caret-emerald-400 p-0 m-0"
                    />
                </div>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

const Terminalwindow = WindowWrapper(Terminal, "terminal");
export default Terminalwindow;
