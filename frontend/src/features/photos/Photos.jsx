import { useEffect, useRef, useState, useMemo } from "react";
import { Plus, Trash2, Heart, Search, Mail } from "lucide-react";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import { photosLinks, gallery } from "@constants/data.js";
import usewindowstore from "@store/window.js";
import usePhotosStore from "@store/photos.js";
import useAuthStore from "@store/auth.js";

const Photos = () => {
    const { openwindow, window } = usewindowstore();
    const { photos, fetchPhotos, uploadPhoto, deletePhoto, updatePhoto } = usePhotosStore();
    const { user } = useAuthStore();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState("Library");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        if (window?.photos?.isOpen && user) {
            fetchPhotos();
        }
    }, [window?.photos?.isOpen, user, fetchPhotos]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const album = activeTab === "Favorites" ? "Library" : activeTab;
            uploadPhoto({ imageUrl: reader.result, title: file.name, album });
            e.target.value = "";
        };
        reader.readAsDataURL(file);
    };

    const triggerUpload = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Use a native DOM click on a detached input to bypass GSAP
        fileInputRef.current?.click();
    };

    const staticGallery = useMemo(() => {
        const albums = ["Memories", "People", "Places", "Memories"];
        return gallery.map((g, index) => ({
            _id: `static-${g.id}`,
            isStatic: true,
            imageUrl: g.img,
            title: "Gallery image",
            album: albums[index] || "Library",
            isFavorite: false,
        }));
    }, []);

    const displayedPhotos = useMemo(() => {
        const userPhotos = photos || [];
        const userImageUrls = new Set(userPhotos.map((p) => p.imageUrl));
        const filteredStatic = staticGallery.filter((p) => !userImageUrls.has(p.imageUrl));

        let result;
        switch (activeTab) {
            case "Library":
                result = [...filteredStatic, ...userPhotos];
                break;
            case "Favorites":
                result = userPhotos.filter((p) => p.isFavorite);
                break;
            default:
                result = [
                    ...filteredStatic.filter((p) => p.album === activeTab),
                    ...userPhotos.filter((p) => p.album === activeTab),
                ];
        }

        if (searchQuery.trim()) {
            result = result.filter((p) =>
                p.title?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return result;
    }, [activeTab, photos, staticGallery, searchQuery]);

    const handleHeartClick = (e, photo) => {
        e.preventDefault();
        e.stopPropagation();
        if (photo.isStatic) {
            // Save static photo to DB with isFavorite=true
            uploadPhoto({
                imageUrl: photo.imageUrl,
                title: photo.title,
                album: photo.album || "Library",
                isFavorite: true,
            });
        } else {
            updatePhoto(photo._id, { isFavorite: !photo.isFavorite });
        }
    };

    const handleDeleteClick = (e, photoId) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Delete this photo?")) {
            deletePhoto(photoId);
        }
    };

    const handlePhotoClick = (e, photo) => {
        e.stopPropagation();
        openwindow("imgfile", {
            name: photo.title,
            icon: "/images/image.png",
            kind: "file",
            fileType: "img",
            imageUrl: photo.imageUrl,
        });
    };

    return (
        <div className="w-full h-full flex flex-col select-none">
            {/* Hidden file input is OUTSIDE the draggable header */}
            <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileUpload}
                tabIndex={-1}
            />

            {/* Window header — used as GSAP drag trigger */}
            <div id="window-header" className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200/40 bg-gray-50/20 backdrop-blur-sm">
                <WindowControls target="photos" />

                {/* Toolbar — wrapped in #window-controls so GSAP ignores clicks */}
                <div
                    id="window-controls"
                    className="flex items-center gap-3 text-gray-500"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {showSearch && (
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search photos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); } }}
                            className="text-sm px-2 py-0.5 rounded-md border border-gray-300 bg-white/80 outline-none w-40 text-gray-700"
                        />
                    )}
                    <button
                        type="button"
                        title="Add Photo"
                        onClick={triggerUpload}
                        className="icon cursor-pointer hover:text-blue-500 bg-transparent border-none p-0 flex items-center justify-center"
                    >
                        <Plus size={18} />
                    </button>
                    <button
                        type="button"
                        title="Shared"
                        className="icon cursor-pointer hover:text-blue-500 bg-transparent border-none p-0"
                    >
                        <Mail size={18} />
                    </button>
                    <button
                        type="button"
                        title="Search"
                        onClick={(e) => { e.stopPropagation(); setShowSearch((v) => !v); if (showSearch) setSearchQuery(""); }}
                        className="icon cursor-pointer hover:text-blue-500 bg-transparent border-none p-0"
                    >
                        <Search size={18} />
                    </button>
                </div>
            </div>

            <div className="flex w-full flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-44 shrink-0 border-r border-gray-200/50 flex flex-col pt-3 bg-gray-50/30">
                    <h2 className="px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Photos</h2>
                    <ul className="flex flex-col gap-0.5 px-2">
                        {photosLinks.map(({ id, icon, title }) => (
                            <li
                                key={id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all text-sm font-medium ${activeTab === title
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-200/60"
                                    }`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setActiveTab(title)}
                            >
                                <img
                                    src={icon}
                                    alt={title}
                                    className={`w-4 h-4 ${activeTab === title ? "brightness-0 invert" : ""}`}
                                />
                                {title}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gallery */}
                <div className="flex-1 overflow-y-auto relative p-4">
                    {displayedPhotos.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <p className="text-lg font-medium mb-1">No Photos Found</p>
                            <p className="text-sm text-gray-500">
                                {activeTab === "Favorites"
                                    ? "Click ♡ on any photo to add it to Favorites."
                                    : "Photos will appear here."}
                            </p>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max">
                            {displayedPhotos.map((photo) => (
                                <li
                                    key={photo._id}
                                    className="relative group cursor-pointer aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                                >
                                    <img
                                        src={photo.imageUrl}
                                        alt={photo.title}
                                        className="w-full h-full object-cover"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => handlePhotoClick(e, photo)}
                                        draggable={false}
                                    />

                                    {/* Action buttons */}
                                    <div
                                        className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {/* Heart / Favorite */}
                                        <button
                                            type="button"
                                            title={photo.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                            className="p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors backdrop-blur-sm"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => handleHeartClick(e, photo)}
                                        >
                                            <Heart
                                                size={14}
                                                className={photo.isFavorite ? "fill-red-500 text-red-500" : "text-red-400"}
                                            />
                                        </button>

                                        {/* Delete (only for user-uploaded photos) */}
                                        {!photo.isStatic && (
                                            <button
                                                type="button"
                                                title="Delete photo"
                                                className="p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors backdrop-blur-sm"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => handleDeleteClick(e, photo._id)}
                                            >
                                                <Trash2 size={14} className="text-gray-500 hover:text-red-500 transition-colors" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Favorite badge */}
                                    {photo.isFavorite && (
                                        <div className="absolute bottom-2 left-2 bg-red-500/90 rounded-full p-1 shadow-sm">
                                            <Heart size={10} className="fill-white text-white" />
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const PhotosWindow = WindowWrapper(Photos, "photos");
export default PhotosWindow;
