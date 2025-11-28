import { useRef } from "react";
import { dockApps as rawDockApps } from "@constants/data.js";
import { Tooltip } from "react-tooltip";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import usewindowstore from "@store/window.js";

function Dock() {
  const { openwindow, closewindow, window: windowState } = usewindowstore()
  let dockref = useRef(null);
  useGSAP(() => {
    const dock = dockref.current;
    if (!dock) return;

    const icons = dock.querySelectorAll(".dock-icon");

    const animateIcons = (mouseX) => {
      const { left } = dock.getBoundingClientRect();
      icons.forEach((icon) => {
        const { left: iconLeft, width } = icon.getBoundingClientRect();
        const center = iconLeft - left + width / 2;
        const distance = Math.abs(mouseX - center);
        const intensity = Math.exp(-(distance ** 2.5) / 20000);

        gsap.to(icon, {
          scale: 1 + 0.35 * intensity,
          y: -15 * intensity,
          duration: 0.2,
          ease: "power1.out",
        });
      });
    };

    const handleMouseMove = (e) => {
      let { left } = dock.getBoundingClientRect();
      animateIcons(e.clientX - left);
    }

    const resetIcons = () => {
      icons.forEach((icon) =>
        gsap.to(icon, {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "power1.out",
        })
      );
    };

    dock.addEventListener("mousemove", handleMouseMove);
    dock.addEventListener("mouseleave", resetIcons);

    return () => {
      dock.removeEventListener("mousemove", handleMouseMove);
      dock.removeEventListener("mouseleave", resetIcons);
    };
  }, []);
  const toggleApp = (app) => {
    if (!app.canOpen) return;
    const win = windowState?.[app.id];
    if (!win) {

      console.warn("No window found for app id:", app.id, { app });
      openwindow(app.id);
      return;
    }
    if (win.isOpen) {
      closewindow(app.id);
    } else {
      openwindow(app.id);
    }
  };


  const dockApps = Array.isArray(rawDockApps)
    ? rawDockApps.filter(item => item && typeof item === 'object' && item.id && item.name)
    : [];

  console.log("Dock Apps Data:", { rawDockApps, dockApps });

  if (import.meta.env.DEV && (!rawDockApps || !Array.isArray(rawDockApps))) {
    console.warn("dockApps is missing or not an array. Dock will render empty state.");
  }

  return (
    <section id="dock">
      <div ref={dockref} className="dock-container">
        {dockApps.map(({ id, name, icon, canOpen }) => (
          <div key={id ?? name} className="relative flex justify-center">
            <button
              type="button"
              className="dock-icon"
              aria-label={name}
              data-tooltip-id="dock-tooltip"
              data-tooltip-content={name}
              data-tooltip-delayed-show={150}
              disabled={!canOpen}
              onClick={() => toggleApp({ id, canOpen })}
            >
              <img
                src={icon ? `/images/${icon}` : "/icons/app.svg"}
                className={canOpen ? "" : "opacity-60"}
                alt={name}
                loading="lazy"
              />
            </button>
          </div>
        ))}
        <Tooltip id="dock-tooltip" place={"top"} className="tooltip" />

      </div>

    </section>
  )
}
export default Dock;