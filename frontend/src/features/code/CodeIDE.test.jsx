import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { CodeIDE } from './CodeIDE';

// Mock dependencies
vi.mock('@components/common/WindowControl.jsx', () => ({
    default: () => <div data-testid="window-controls" />
}));

vi.mock('@hoc/WindowWrapper.jsx', () => ({
    default: (Component) => Component
}));

vi.mock('./CodeIDEAgent.jsx', () => ({
    default: () => <div data-testid="code-ide-agent" />,
}));

describe('CodeIDE Component', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // Clear localStorage
        localStorage.clear();
    });

    it('renders Code IDE with tabs, editor, and output panel', () => {
        render(<CodeIDE />);
        
        expect(screen.getByText('Code IDE')).toBeInTheDocument();
        expect(screen.getAllByText('main.js').length).toBeGreaterThan(0);
        expect(screen.getAllByText('main.js').length).toBeGreaterThan(0);
        expect(screen.getByText('main.py')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Write your JavaScript code here...')).toBeInTheDocument();
        expect(screen.getByText('Terminal')).toBeInTheDocument();
    });

    it('allows switching tabs and updates active language', () => {
        render(<CodeIDE />);
        
        const pythonTab = screen.getByText('main.py');
        fireEvent.click(pythonTab);

        expect(screen.getAllByText('main.py').length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText('Write your Python code here...')).toBeInTheDocument();
    });

    it('allows changing language of the current tab', () => {
        render(<CodeIDE />);
        
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'cpp' } });

        expect(screen.getAllByText('main.cpp').length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText('Write your C++ code here...')).toBeInTheDocument();
    });

    it('runs code and renders stdout on success', async () => {
        // Mock fetch response
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                run: {
                    stdout: 'Hello World Output',
                    stderr: '',
                    code: 0
                }
            })
        });
        vi.stubGlobal('fetch', mockFetch);
        
        // Mock token in localStorage
        localStorage.setItem('user', JSON.stringify({ token: 'mock-token' }));

        render(<CodeIDE />);
        
        const runBtn = screen.getByRole('button', { name: /run/i });
        fireEvent.click(runBtn);

        // Verify it sets loading state
        expect(screen.getByRole('button', { name: /running/i })).toBeInTheDocument();

        // Verify API is called with right parameters
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/code/execute'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-token'
                    })
                })
            );
        });

        // Verify output is rendered
        await waitFor(() => {
            expect(screen.getByText('Hello World Output')).toBeInTheDocument();
        });
    });

    it('renders stderr on code execution error', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                run: {
                    stdout: '',
                    stderr: 'Syntax Error on line 2',
                    code: 1
                }
            })
        });
        vi.stubGlobal('fetch', mockFetch);

        render(<CodeIDE />);
        
        const runBtn = screen.getByRole('button', { name: /run/i });
        fireEvent.click(runBtn);

        await waitFor(() => {
            expect(screen.getByText(/Syntax Error on line 2/)).toBeInTheDocument();
        });
    });
});
