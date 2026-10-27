import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { INITIAL_Z_INDEX, WINDOW_CONFIG } from "@constants/data.js";

const usewindowstore = create(
    immer(set => ({
        window: WINDOW_CONFIG,
        nextzindex: INITIAL_Z_INDEX + 1,

        openwindow: (windowKey, data = null) =>
            set(state => {
                const key = windowKey === 'ask' ? 'Ask' : windowKey;
                let win = state.window[key];
                if (!win) {
                    win = {
                        isOpen: false,
                        zIndex: INITIAL_Z_INDEX,
                        data: null,
                    };
                    state.window[key] = win;
                }
                win.isOpen = true;
                win.minimised = false;
                win.zIndex = state.nextzindex;
                win.data = data ?? win.data;
                state.nextzindex++;
            }),

        closewindow: windowKey =>
            set(state => {
                const key = windowKey === 'ask' ? 'Ask' : windowKey;
                const win = state.window[key];
                if (!win) return;
                win.isOpen = false;
                win.zIndex = INITIAL_Z_INDEX;
                win.data = null;
            }),

        clearWindowData: windowKey =>
            set(state => {
                const key = windowKey === 'ask' ? 'Ask' : windowKey;
                const win = state.window[key];
                if (win) {
                    win.data = null;
                }
            }),

        minimisewindow: windowKey =>
            set(state => {
                const key = windowKey === 'ask' ? 'Ask' : windowKey;
                const win = state.window[key];
                if (!win) return;

                win.minimised = true;
                win.isOpen = false;
            }),

        focuswindow: windowKey =>
            set(state => {
                const key = windowKey === 'ask' ? 'Ask' : windowKey;
                const win = state.window[key];
                if (!win) return;
                win.zIndex = state.nextzindex++;
            })
    }))
);

export default usewindowstore;