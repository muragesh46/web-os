import { locations } from "@constants/data.js";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import usewindowstore from "@store/window.js";
import Location from "@store/location.js";

gsap.registerPlugin(Draggable);

const projects = (locations.work?.children ?? []).filter((project) => project.id === 7);

const Home = () => {
    const { setActiveLocation } = Location();
    const { openwindow } = usewindowstore();

    const openProjectFinder = (project) => {
        setActiveLocation(project);
        openwindow("finder");
    }

    useGSAP(() => {
        Draggable.create(".folder", {
            bounds: window,
            inertia: true,
        });
    });

    return (
        <section id="home">
            <ul>
                {projects.map((project) => (
                    <li
                        key={project.id}
                        className={clsx("group folder", project.windowPosition)}
                        onClick={() => openProjectFinder(project)}
                    >
                        <img src="/images/folder.png" alt={project.name} />
                        <p>{project.name}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Home;