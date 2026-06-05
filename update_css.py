import re

with open("frontend/src/style/code-ide.css", "r") as f:
    content = f.read()

# 1. Update the root variables
root_replacement = """/* ── Root tokens ──────────────────────────────────────────── */
.ide-container {
    /* Palette (Light Mode Default) */
    --ide-bg:             #f8fafc;
    --ide-surface:        #ffffff;
    --ide-surface-2:      #f1f5f9;
    --ide-surface-3:      #e2e8f0;
    --ide-border:         rgba(0,0,0,0.08);
    --ide-border-bright:  rgba(0,0,0,0.15);

    /* Text */
    --ide-text:           #0f172a;
    --ide-text-muted:     #64748b;
    --ide-text-dim:       #94a3b8;

    /* Accent – electric violet/indigo */
    --ide-accent:         #6d28d9;
    --ide-accent-light:   #8b5cf6;
    --ide-accent-glow:    rgba(139, 92, 246, 0.25);

    /* Semantic */
    --ide-run:            #10b981;
    --ide-run-glow:       rgba(16,185,129,0.3);
    --ide-save:           #f59e0b;
    --ide-error:          #ef4444;
    --ide-success:        #10b981;
    --ide-warn:           #f59e0b;

    /* Editor */
    --ide-editor-bg:      #ffffff;
    --ide-gutter-bg:      #f8fafc;
    --ide-gutter-text:    #94a3b8;
    --ide-selection:      rgba(139, 92, 246, 0.2);

    /* Terminal (Light) */
    --ide-term-bg:        #f1f5f9;
    --ide-term-text:      #1e293b;
    --ide-term-prompt:    #64748b;
    --ide-term-green:     #16a34a;
    --ide-term-yellow:    #ca8a04;
    --ide-term-red:       #dc2626;
    --ide-term-blue:      #2563eb;
    --ide-term-magenta:   #c026d3;
    --ide-term-cyan:      #0891b2;

    /* Activity bar */
    --ide-activity-bg:    #f8fafc;
    --ide-activity-w:     44px;

    /* Sidebar */
    --ide-sidebar-w:      220px;

    /* Agent panel */
    --ide-agent-w:        300px;
    --ide-agent-bg:       linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);

    /* Overlay variables for dynamic hover/active states */
    --ide-overlay-1:      rgba(0,0,0,0.04);
    --ide-overlay-2:      rgba(0,0,0,0.06);
    --ide-overlay-3:      rgba(0,0,0,0.08);
    --ide-overlay-4:      rgba(0,0,0,0.12);
    --ide-overlay-border: rgba(0,0,0,0.1);

    /* Radii / spacing */
    --ide-radius:         12px;
    --ide-radius-sm:      6px;

    /* Shadows */
    --ide-shadow:         0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);

    /* Layout */
    width:  100%;
    height: 100%;
    display: flex;
    background: var(--ide-bg);
    border-radius: var(--ide-radius);
    overflow: hidden;
    box-shadow: var(--ide-shadow);
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    color: var(--ide-text);
    user-select: none;
    position: relative;
}

.dark .ide-container {
    /* Palette (Dark Mode) */
    --ide-bg:             #0d1117;
    --ide-surface:        #161b22;
    --ide-surface-2:      #1c2128;
    --ide-surface-3:      #21262d;
    --ide-border:         rgba(255,255,255,0.08);
    --ide-border-bright:  rgba(255,255,255,0.14);

    /* Text */
    --ide-text:           #e6edf3;
    --ide-text-muted:     #8b949e;
    --ide-text-dim:       #484f58;

    /* Accent – electric violet/indigo */
    --ide-accent:         #7c3aed;
    --ide-accent-light:   #a78bfa;
    --ide-accent-glow:    rgba(124, 58, 237, 0.35);

    /* Editor */
    --ide-editor-bg:      #0d1117;
    --ide-gutter-bg:      #0d1117;
    --ide-gutter-text:    #3d444d;
    --ide-selection:      rgba(124,58,237,0.25);

    /* Terminal (Dark) */
    --ide-term-bg:        #0a0f16;
    --ide-term-text:      #cdd9e5;
    --ide-term-prompt:    #4f5961;
    --ide-term-green:     #3fb950;
    --ide-term-yellow:    #d29922;
    --ide-term-red:       #f85149;
    --ide-term-blue:      #79c0ff;
    --ide-term-magenta:   #d2a8ff;
    --ide-term-cyan:      #76e4f7;

    /* Activity bar */
    --ide-activity-bg:    #010409;
    
    /* Agent */
    --ide-agent-bg:       linear-gradient(180deg, #0f0f1a 0%, #0d111a 100%);

    /* Overlay variables for dynamic hover/active states */
    --ide-overlay-1:      rgba(255,255,255,0.04);
    --ide-overlay-2:      rgba(255,255,255,0.06);
    --ide-overlay-3:      rgba(255,255,255,0.08);
    --ide-overlay-4:      rgba(255,255,255,0.12);
    --ide-overlay-border: rgba(255,255,255,0.1);

    /* Shadows */
    --ide-shadow:         0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
}"""

content = re.sub(r'/\* ── Root tokens ──.+?position: relative;\n}', root_replacement, content, flags=re.DOTALL)

# Replace specific white rgba with the new variables
content = content.replace("rgba(255,255,255,0.02)", "var(--ide-overlay-1)")
content = content.replace("rgba(255,255,255,0.04)", "var(--ide-overlay-1)")
content = content.replace("rgba(255,255,255,0.05)", "var(--ide-overlay-2)")
content = content.replace("rgba(255,255,255,0.06)", "var(--ide-overlay-2)")
content = content.replace("rgba(255,255,255,0.07)", "var(--ide-overlay-3)")
content = content.replace("rgba(255,255,255,0.08)", "var(--ide-overlay-3)")
content = content.replace("rgba(255,255,255,0.09)", "var(--ide-overlay-border)")
content = content.replace("rgba(255,255,255,0.1)", "var(--ide-overlay-border)")
content = content.replace("rgba(255,255,255,0.12)", "var(--ide-overlay-4)")
content = content.replace("rgba(255,255,255,0.14)", "var(--ide-overlay-4)")
content = content.replace("rgba(255,255,255,0.15)", "var(--ide-overlay-4)")
content = content.replace("rgba(255,255,255,0.18)", "var(--ide-overlay-4)")

# Agent panel bg
content = content.replace("linear-gradient(180deg, #0f0f1a 0%, #0d111a 100%)", "var(--ide-agent-bg)")

# Add missing AI Agent classes
agent_classes = """

/* ── Specific AI Agent Element Classes ────────────────────── */
.ide-agent-bot-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

.ide-agent-sparkle-bg {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--ide-accent), var(--ide-accent-light));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
}

.ide-agent-sparkle-sm {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    background: linear-gradient(135deg, var(--ide-accent), var(--ide-accent-light));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
}
"""
content += agent_classes

with open("frontend/src/style/code-ide.css", "w") as f:
    f.write(content)

