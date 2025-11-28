import usewindowstore from "@store/window.js";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

function windowWrapper(Component, windowKey) {
    const Wrapped = (props) => {
        const { focuswindow, window: windowsState } = usewindowstore();
        const win = windowsState?.[windowKey];
        const isOpen = win?.isOpen;
        const minimised = win?.minimised;
        const zIndex = win?.zIndex ?? 0;
        const ref = useRef(null);
        const prevIsOpenRef = useRef(isOpen);

        useGSAP(() => {
            const el = ref.current;
            if (!el) return;

            gsap.killTweensOf(el);

            if (isOpen) {
                el.style.display = "block";
                gsap.fromTo(
                    el,
                    { scale: 0.9, opacity: 0, y: 24 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }
                );
            } else {
                if (prevIsOpenRef.current) {
                    const toVars = minimised
                        ? { scale: 0.92, opacity: 0, y: 30 }
                        : { scale: 0.92, opacity: 0, y: -20 };
                    gsap.to(el, {
                        ...toVars,
                        duration: 0.3,
                        ease: "power2.inOut",
                        onComplete: () => {
                            el.style.display = "none";
                            gsap.set(el, { clearProps: "transform,opacity" });
                        },
                    });
                } else {
                    el.style.display = "none";
                }
            }

            prevIsOpenRef.current = isOpen;
        }, [isOpen, minimised]);
        useGSAP(() => {
            const el = ref.current;
            if (!el || !isOpen) return;

            const ctx = gsap.context(() => {
                const winWidth = el.offsetWidth || 400;

                const NAVBAR_HEIGHT = 30;

                const x = (window.innerWidth - winWidth) / 2;
                let y = NAVBAR_HEIGHT + 10;

                gsap.set(el, { left: x, top: y, x: 0, y: 0, position: 'absolute' });

                const headerEl = el.querySelector('[id="window-header"]');
                const controlsEl = el.querySelector('[id="window-controls"]');

                Draggable.create(el, {
                    type: "x,y",
                    bounds: { top: NAVBAR_HEIGHT, left: 0, width: window.innerWidth, height: window.innerHeight - NAVBAR_HEIGHT },
                    edgeResistance: 0.65,
                    inertia: true,
                    trigger: headerEl || el,
                    dragClickables: true,
                    onPress: (e) => {
                        focuswindow(windowKey);
                        if (controlsEl && e?.target && e.target instanceof Element && e.target.closest('#window-controls')) {
                            return;
                        }
                    },
                });
            }, el);

            return () => ctx.revert();
        }, [isOpen]);

        return (
            <section
                id={windowKey}
                ref={ref}
                style={{ zIndex }}
                className="absolute"
                onMouseDown={() => focuswindow(windowKey)}
            >
                <Component {...props} />
            </section>
        );
    };

    Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;
    return Wrapped;
}

export default windowWrapper;