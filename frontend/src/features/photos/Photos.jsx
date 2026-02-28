import { Mail, Search } from "lucide-react";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import { gallery, photosLinks } from "@constants/data.js";
import usewindowstore from "@store/window.js";

const Photos = () => {
    const { openwindow } = usewindowstore();

    return (
        <div className="w-full h-full flex flex-col">
            <div id="window-header">
                <WindowControls target="photos" />

                <div className="w-full flex justify-end items-center gap-3 text-gray-500">
                    <Mail className="icon" />
                    <Search className="icon" />
                </div>
            </div>

            <div className="flex w-full flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="sidebar">
                    <h2>Photos</h2>
                    <ul>
                        {photosLinks.map(({ id, icon, title }) => (
                            <li key={id}>
                                <img src={icon} alt={title} />
                                <p>{title}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gallery */}
                <div className="gallery flex-1 overflow-y-auto">
                    <ul>
                        {gallery.map(({ id, img }) => (
                            <li
                                key={id}
                                onClick={() =>
                                    openwindow("imgfile", {
                                        name: "Gallery image",
                                        icon: "/images/image.png",
                                        kind: "file",
                                        fileType: "img",
                                        imageUrl: img
                                    })
                                }
                            >
                                <img src={img} alt="Gallery image" />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const PhotosWindow = WindowWrapper(Photos, "photos");
export default PhotosWindow;
