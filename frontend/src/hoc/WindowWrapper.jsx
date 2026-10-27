import usewindowstore from "@store/window.js";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

function WindowWrapper(Component, windowKey) {
    const Wrapped = (props) => {
        const { focuswindow, window: windowsState } = usewindowstore();
        const win = windowsState?.[windowKey];
        const isOpen = win?.isOpen;
        const minimised = win?.minimised;
        const zIndex = win?.zIndex ?? 0;
        const ref = useRef(null);
        const prevIsOpenRef = useRef(isOpen);
        const hasPositionedRef = useRef(false);

        useGSAP(() => {
            const el = ref.current;
            if (!el) return;

            gsap.killTweensOf(el);

            if (isOpen) {
                el.style.display = "block";
                gsap.fromTo(
                    el,
                    { scale: 0.95, opacity: 0, y: 10 },
                    {
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        duration: 0.35,
                        ease: "power2.out"
                    }
                );
            } else {
                if (prevIsOpenRef.current) {
                    const toVars = minimised
                        ? { scale: 0.95, opacity: 0, y: 20 }
                        : { scale: 0.95, opacity: 0, y: -10 };
                    gsap.to(el, {
                        ...toVars,
                        duration: 0.25,
                        ease: "power2.in",
                        onComplete: () => {
                            el.style.display = "none";
                            gsap.set(el, { clearProps: "transform,opacity" });
                        },
                    });
                } else {
                    el.style.display = "none";
                }
                if (!minimised) {
                    // Full close resets position for next launch
                    hasPositionedRef.current = false;
                }
            }

            prevIsOpenRef.current = isOpen;
        }, [isOpen, minimised]);
        useGSAP(() => {
            const el = ref.current;
            if (!el || !isOpen) return;

            const ctx = gsap.context(() => {
                const winWidth = el.offsetWidth || 500;
                const winHeight = el.offsetHeight || 400;
                const NAVBAR_HEIGHT = 32;

                // Center window nicely on initial open
                const x = Math.max(10, Math.round((window.innerWidth - winWidth) / 2));
                const y = Math.max(NAVBAR_HEIGHT + 8, Math.round((window.innerHeight - winHeight) / 3));

                if (!hasPositionedRef.current) {
                    gsap.set(el, { left: x, top: y, x: 0, y: 0, position: 'absolute' });
                    hasPositionedRef.current = true;
                }

                const headerEl = el.querySelector('[id="window-header"], [data-drag-handle="true"]');

                // Dynamic bounds calculated from actual element dimensions so minY <= maxY is always satisfied
                const calcBounds = () => {
                    const w = el.offsetWidth || winWidth;
                    const h = el.offsetHeight || winHeight;
                    return {
                        top: NAVBAR_HEIGHT,
                        left: -w + 80,
                        width: window.innerWidth + 2 * w - 160,
                        height: window.innerHeight + h - (NAVBAR_HEIGHT + 70),
                    };
                };

                const [draggable] = Draggable.create(el, {
                    type: "x,y",
                    bounds: calcBounds(),
                    edgeResistance: 0.65,
                    inertia: true,
                    trigger: headerEl || el,
                    dragClickables: false,
                    allowEventDefault: true,
                    onPress: function (e) {
                        focuswindow(windowKey);
                        // Prevent dragging when clicking buttons, inputs, controls, tabs, links
                        if (e?.target instanceof Element && e.target.closest('#window-controls, button, input, select, textarea, a, [data-no-drag="true"]')) {
                            this.endDrag(e);
                            return false;
                        }
                    },
                    onDragStart: function () {
                        this.applyBounds(calcBounds());
                    }
                });

                const handleResize = () => {
                    if (draggable) draggable.applyBounds(calcBounds());
                };
                window.addEventListener("resize", handleResize);

                return () => {
                    window.removeEventListener("resize", handleResize);
                };
            }, el);

            return () => ctx.revert();
        }, [isOpen]);

        return (
            <section
                id={windowKey}
                ref={ref}
                style={{ zIndex }}
                className="absolute"
                onMouseDown={(e) => {
                    if (e.target.closest('#window-controls')) {
                        return;
                    }
                    focuswindow(windowKey);
                }}
            >
                <Component {...props} />
            </section>
        );
    };

    Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;
    return Wrapped;
}

export default WindowWrapper;