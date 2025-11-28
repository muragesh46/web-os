import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { INITIAL_Z_INDEX, WINDOW_CONFIG } from "@constants/data.js";

const usewindowstore = create(
    immer(set => ({
        window: WINDOW_CONFIG,
        nextzindex: INITIAL_Z_INDEX + 1,

        openwindow: (windowKey, data = null) =>
            set(state => {
                let win = state.window[windowKey];
                if (!win) {
                    win = {
                        isOpen: false,
                        zIndex: INITIAL_Z_INDEX,
                        data: null,
                    };
                    state.window[windowKey] = win;
                }
                win.isOpen = true;
                win.minimised = false;
                win.zIndex = state.nextzindex;
                win.data = data ?? win.data;
                state.nextzindex++;
            }),

        closewindow: windowKey =>
            set(state => {
                const win = state.window[windowKey];
                if (!win) return;
                win.isOpen = false;
                win.zIndex = INITIAL_Z_INDEX;
                win.data = null;
            }),

        minimisewindow: windowKey =>
            set(state => {
                const win = state.window[windowKey];
                if (!win) return;

                win.minimised = true;
                win.isOpen = false;
            }),

        focuswindow: windowKey =>
            set(state => {
                const win = state.window[windowKey];
                if (!win) return;
                win.zIndex = state.nextzindex++;
            })
    }))
);

export default usewindowstore;