import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import WindowControls from "@components/common/WindowControl.jsx";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import "@style/music.css";

// ── Curated sample tracks (royalty-free audio from pixabay CDN) ──
const SAMPLE_TRACKS = [
    {
        id: 1,
        title: "Chill Vibes",
        artist: "SoulProdMusic",
        album: "Ambient Collection",
        duration: 121,
        genre: "Lo-fi",
        url: "https://cdn.pixabay.com/audio/2024/11/29/audio_853085eed4.mp3",
        color: "#ff2d55",
    },
    {
        id: 2,
        title: "Good Night",
        artist: "FASSounds",
        album: "Dreamy Beats",
        duration: 146,
        genre: "Ambient",
        url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
        color: "#af52de",
    },
    {
        id: 3,
        title: "Abstract Fashion",
        artist: "QubeSounds",
        album: "Modern Grooves",
        duration: 155,
        genre: "Electronic",
        url: "https://cdn.pixabay.com/audio/2023/10/18/audio_4db1330b03.mp3",
        color: "#5856d6",
    },
    {
        id: 4,
        title: "Lofi Study",
        artist: "FASSounds",
        album: "Study Sessions",
        duration: 138,
        genre: "Lo-fi",
        url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3",
        color: "#34c759",
    },
    {
        id: 5,
        title: "Inspire Cinematic",
        artist: "DSTechnician",
        album: "Epic Moods",
        duration: 140,
        genre: "Cinematic",
        url: "https://cdn.pixabay.com/audio/2023/08/28/audio_85e0fb7c0a.mp3",
        color: "#ff9500",
    },
    {
        id: 6,
        title: "Documentary",
        artist: "Lexin_Music",
        album: "Storytelling",
        duration: 129,
        genre: "Cinematic",
        url: "https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3",
        color: "#007aff",
    },
    {
        id: 7,
        title: "Beats Relaxing",
        artist: "Olexy",
        album: "Calm Waves",
        duration: 115,
        genre: "Lo-fi",
        url: "https://cdn.pixabay.com/audio/2024/09/10/audio_6e4e955308.mp3",
        color: "#5ac8fa",
    },
    {
        id: 8,
        title: "Jazzy Abstract",
        artist: "Coma-Media",
        album: "Smooth Jazz",
        duration: 132,
        genre: "Jazz",
        url: "https://cdn.pixabay.com/audio/2023/09/26/audio_2f13c0c83f.mp3",
        color: "#ff6b8a",
    },
    {
        id: 9,
        title: "Whip",
        artist: "Prazkhanal",
        album: "Energetic Beats",
        duration: 97,
        genre: "Hip Hop",
        url: "https://cdn.pixabay.com/audio/2024/02/08/audio_ae64b192b8.mp3",
        color: "#ff3b30",
    },
    {
        id: 10,
        title: "Tropical Summer",
        artist: "Lesfm",
        album: "Sun & Surf",
        duration: 161,
        genre: "Tropical",
        url: "https://cdn.pixabay.com/audio/2023/07/19/audio_e51e77a81f.mp3",
        color: "#ffcc00",
    },
];

const SIDEBAR_SECTIONS = [
    {
        label: "Library",
        items: [
            { id: "all", icon: "🎵", name: "All Songs" },
            { id: "favorites", icon: "❤️", name: "Favorites" },
            { id: "recent", icon: "🕐", name: "Recently Played" },
        ],
    },
    {
        label: "Genres",
        items: [
            { id: "lofi", icon: "🎧", name: "Lo-fi" },
            { id: "cinematic", icon: "🎬", name: "Cinematic" },
            { id: "electronic", icon: "⚡", name: "Electronic" },
            { id: "jazz", icon: "🎷", name: "Jazz" },
        ],
    },
];

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── SVG Icons (inline to avoid dependencies) ──
const PlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);
const PauseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);
const PrevIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
);
const NextIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
);
const ShuffleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
);
const RepeatIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
);
const VolumeIcon = ({ muted }) =>
    muted ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
        </svg>
    ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
    );
const HeartIcon = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);
const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

function Music() {
    // ── State ──
    const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false); // false | 'all' | 'one'
    const [favorites, setFavorites] = useState(new Set());
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [activeSection, setActiveSection] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const audioRef = useRef(null);
    const progressBarRef = useRef(null);

    const currentTrack = currentTrackIndex !== null ? SAMPLE_TRACKS[currentTrackIndex] : null;

    // ── Filtered tracks ──
    const displayedTracks = useMemo(() => {
        let tracks = SAMPLE_TRACKS;

        switch (activeSection) {
            case "favorites":
                tracks = tracks.filter((t) => favorites.has(t.id));
                break;
            case "recent":
                tracks = recentlyPlayed
                    .map((id) => SAMPLE_TRACKS.find((t) => t.id === id))
                    .filter(Boolean);
                break;
            case "lofi":
                tracks = tracks.filter((t) => t.genre === "Lo-fi");
                break;
            case "cinematic":
                tracks = tracks.filter((t) => t.genre === "Cinematic");
                break;
            case "electronic":
                tracks = tracks.filter((t) => t.genre === "Electronic");
                break;
            case "jazz":
                tracks = tracks.filter((t) => t.genre === "Jazz");
                break;
            default:
                break;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            tracks = tracks.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.artist.toLowerCase().includes(q) ||
                    t.album.toLowerCase().includes(q)
            );
        }

        return tracks;
    }, [activeSection, favorites, recentlyPlayed, searchQuery]);

    // ── Audio event handlers ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration || 0);
            setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        };

        const handleEnded = () => {
            if (repeat === "one") {
                audio.currentTime = 0;
                audio.play();
            } else {
                handleNext();
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        };
    }, [currentTrackIndex, repeat, shuffle]);

    // ── Volume sync ──
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // ── Playback controls ──
    const playTrack = useCallback(
        (index) => {
            const audio = audioRef.current;
            if (!audio) return;

            setCurrentTrackIndex(index);
            // Add to recently played
            setRecentlyPlayed((prev) => {
                const filtered = prev.filter((id) => id !== SAMPLE_TRACKS[index].id);
                return [SAMPLE_TRACKS[index].id, ...filtered].slice(0, 20);
            });

            // Need timeout to let src update
            setTimeout(() => {
                audio.play().catch(() => {});
                setIsPlaying(true);
            }, 50);
        },
        []
    );

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || currentTrackIndex === null) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().catch(() => {});
            setIsPlaying(true);
        }
    }, [isPlaying, currentTrackIndex]);

    const handleNext = useCallback(() => {
        if (SAMPLE_TRACKS.length === 0) return;

        if (shuffle) {
            let next;
            do {
                next = Math.floor(Math.random() * SAMPLE_TRACKS.length);
            } while (next === currentTrackIndex && SAMPLE_TRACKS.length > 1);
            playTrack(next);
        } else {
            const next = currentTrackIndex !== null
                ? (currentTrackIndex + 1) % SAMPLE_TRACKS.length
                : 0;
            if (!repeat && next === 0 && currentTrackIndex === SAMPLE_TRACKS.length - 1) {
                // Stop at end if no repeat
                setIsPlaying(false);
                return;
            }
            playTrack(next);
        }
    }, [currentTrackIndex, shuffle, repeat, playTrack]);

    const handlePrev = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // If more than 3 seconds in, restart current track
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        if (currentTrackIndex !== null && currentTrackIndex > 0) {
            playTrack(currentTrackIndex - 1);
        } else {
            playTrack(SAMPLE_TRACKS.length - 1);
        }
    }, [currentTrackIndex, playTrack]);

    const handleProgressClick = useCallback(
        (e) => {
            const audio = audioRef.current;
            const bar = progressBarRef.current;
            if (!audio || !bar || !audio.duration) return;

            const rect = bar.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audio.currentTime = ratio * audio.duration;
        },
        []
    );

    const toggleFavorite = useCallback((trackId, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(trackId)) {
                next.delete(trackId);
            } else {
                next.add(trackId);
            }
            return next;
        });
    }, []);

    const toggleRepeat = useCallback(() => {
        setRepeat((prev) => {
            if (prev === false) return "all";
            if (prev === "all") return "one";
            return false;
        });
    }, []);

    // ── Get section title ──
    const sectionTitle = useMemo(() => {
        for (const section of SIDEBAR_SECTIONS) {
            const item = section.items.find((i) => i.id === activeSection);
            if (item) return item.name;
        }
        return "All Songs";
    }, [activeSection]);

    const sectionIcon = useMemo(() => {
        for (const section of SIDEBAR_SECTIONS) {
            const item = section.items.find((i) => i.id === activeSection);
            if (item) return item.icon;
        }
        return "🎵";
    }, [activeSection]);

    return (
        <div className="music-container">
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={currentTrack?.url || ""}
                preload="metadata"
            />

            {/* Header */}
            <div id="window-header" className="music-header">
                <div id="window-controls">
                    <WindowControls target="music" />
                </div>
                <span className="music-title">Music</span>
                <div style={{ width: 52 }} />
            </div>

            {/* Body */}
            <div className="music-body">
                {/* Sidebar */}
                <div
                    className="music-sidebar"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {SIDEBAR_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <p className="music-sidebar-label">{section.label}</p>
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    className={`music-sidebar-item ${activeSection === item.id ? "music-sidebar-active" : ""}`}
                                    onClick={() => {
                                        setActiveSection(item.id);
                                        setSearchQuery("");
                                    }}
                                >
                                    <span className="music-sidebar-icon">{item.icon}</span>
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Main content */}
                <div className="music-main">
                    {/* Search */}
                    <div
                        className="music-search-bar"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="music-search-wrapper">
                            <SearchIcon />
                            <input
                                type="text"
                                className="music-search-input"
                                placeholder="Search songs, artists, albums…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Playlist header */}
                    <div className="music-playlist-header">
                        <div
                            className="music-playlist-art"
                            style={{
                                background: currentTrack
                                    ? `linear-gradient(135deg, ${currentTrack.color}, ${currentTrack.color}88)`
                                    : undefined,
                            }}
                        >
                            {sectionIcon}
                        </div>
                        <div className="music-playlist-meta">
                            <h2 className="music-playlist-name">{sectionTitle}</h2>
                            <p className="music-playlist-count">
                                {displayedTracks.length} song{displayedTracks.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* Track list */}
                    {displayedTracks.length === 0 ? (
                        <div className="music-empty">
                            <span className="music-empty-icon">🎵</span>
                            <span>
                                {activeSection === "favorites"
                                    ? "No favorites yet. Click ❤️ to add songs."
                                    : activeSection === "recent"
                                    ? "No recently played tracks."
                                    : "No songs found."}
                            </span>
                        </div>
                    ) : (
                        <div
                            className="music-tracklist"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="music-track-header">
                                <span>#</span>
                                <span>Title</span>
                                <span>Artist</span>
                                <span style={{ textAlign: "right" }}>Time</span>
                            </div>
                            {displayedTracks.map((track, idx) => {
                                const globalIndex = SAMPLE_TRACKS.findIndex((t) => t.id === track.id);
                                const isActive = currentTrackIndex === globalIndex;
                                return (
                                    <button
                                        key={track.id}
                                        className={`music-track-row ${isActive ? "music-track-active" : ""}`}
                                        onClick={() => playTrack(globalIndex)}
                                        id={`music-track-${track.id}`}
                                    >
                                        <span className="music-track-num">
                                            {isActive && isPlaying ? (
                                                <span className="music-eq">
                                                    <span className="music-eq-bar" />
                                                    <span className="music-eq-bar" />
                                                    <span className="music-eq-bar" />
                                                </span>
                                            ) : (
                                                idx + 1
                                            )}
                                        </span>
                                        <div className="music-track-info">
                                            <span className="music-track-name">{track.title}</span>
                                        </div>
                                        <span className="music-track-artist-cell">
                                            {track.artist}
                                        </span>
                                        <span className="music-track-duration">
                                            {formatTime(track.duration)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Now Playing Bar */}
            <div
                className="music-nowplaying"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Album art */}
                <div
                    className="music-art"
                    style={
                        currentTrack
                            ? { background: `linear-gradient(135deg, ${currentTrack.color}, ${currentTrack.color}88)` }
                            : undefined
                    }
                >
                    <span className="music-art-placeholder">🎵</span>
                </div>

                {/* Track info */}
                <div className="music-np-info">
                    <span className="music-np-title">
                        {currentTrack?.title || "Not Playing"}
                    </span>
                    <span className="music-np-artist">
                        {currentTrack?.artist || "Select a track"}
                    </span>
                </div>

                {/* Favorite */}
                {currentTrack && (
                    <button
                        className={`music-fav-btn ${favorites.has(currentTrack.id) ? "music-fav-active" : ""}`}
                        onClick={(e) => toggleFavorite(currentTrack.id, e)}
                        title={favorites.has(currentTrack.id) ? "Remove from Favorites" : "Add to Favorites"}
                    >
                        <HeartIcon filled={favorites.has(currentTrack.id)} />
                    </button>
                )}

                {/* Controls */}
                <div className="music-controls">
                    <div className="music-controls-buttons">
                        <button
                            className={`music-ctrl-btn ${shuffle ? "music-ctrl-btn-active" : ""}`}
                            onClick={() => setShuffle((s) => !s)}
                            title="Shuffle"
                        >
                            <ShuffleIcon />
                        </button>
                        <button className="music-ctrl-btn" onClick={handlePrev} title="Previous">
                            <PrevIcon />
                        </button>
                        <button
                            className="music-play-btn"
                            onClick={currentTrackIndex !== null ? togglePlay : () => playTrack(0)}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button className="music-ctrl-btn" onClick={handleNext} title="Next">
                            <NextIcon />
                        </button>
                        <button
                            className={`music-ctrl-btn ${repeat ? "music-ctrl-btn-active" : ""}`}
                            onClick={toggleRepeat}
                            title={
                                repeat === "one"
                                    ? "Repeat One"
                                    : repeat === "all"
                                    ? "Repeat All"
                                    : "Repeat Off"
                            }
                            style={{ position: "relative" }}
                        >
                            <RepeatIcon />
                            {repeat === "one" && (
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        fontSize: 8,
                                        fontWeight: 800,
                                        color: "#ff2d55",
                                    }}
                                >
                                    1
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="music-progress-row">
                        <span className="music-time">{formatTime(currentTime)}</span>
                        <div
                            className="music-progress-bar"
                            ref={progressBarRef}
                            onClick={handleProgressClick}
                        >
                            <div
                                className="music-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="music-time">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Volume */}
                <div className="music-volume">
                    <button
                        className="music-volume-btn"
                        onClick={() => setIsMuted((m) => !m)}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        <VolumeIcon muted={isMuted} />
                    </button>
                    <input
                        type="range"
                        className="music-volume-slider"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            setVolume(parseFloat(e.target.value));
                            if (isMuted) setIsMuted(false);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

const MusicWindow = WindowWrapper(Music, "music");
export default MusicWindow;
