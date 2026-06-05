import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Car, Clock, Compass, Copy, Crosshair, ExternalLink,
    Footprints, Layers, LocateFixed, MapPin, Navigation, Navigation2,
    Route, Search, Share2, Star, TrainFront, X, ZoomIn, ZoomOut,
} from "lucide-react";
import WindowControls from "@components/common/WindowControl.jsx";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "@style/maps.css";

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color, isLive = false) => {
    const size = isLive ? 20 : 14;
    const border = isLive ? 3 : 2;
    const glow = isLive ? `box-shadow: 0 0 0 6px ${color}33, 0 0 12px ${color}55;` : `box-shadow: 0 0 4px rgba(0,0,0,0.5);`;
    const pulse = isLive ? 'animation: maps-pulse-dot 2s ease-in-out infinite;' : '';
    return L.divIcon({
        className: "custom-leaflet-icon",
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}px solid white; ${glow} ${pulse}"></div>`,
        iconSize: [size + border * 2, size + border * 2],
        iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
    });
};

const createDestinationIcon = () => {
    return L.divIcon({
        className: "custom-leaflet-icon",
        html: `<div class="maps-dest-pin"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
    });
};

const createOriginIcon = () => {
    return L.divIcon({
        className: "custom-leaflet-icon",
        html: `<div class="maps-origin-pin"><div class="maps-origin-inner"></div></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
    });
};

const STORAGE_KEY = "webos-maps-favorites";

const INITIAL_PLACES = [
    {
        id: "mg-road",
        name: "MG Road",
        category: "City",
        address: "Central Bengaluru",
        lat: 12.9757,
        lng: 77.6056,
        rating: "4.7",
        status: "Busy",
        accent: "#3b82f6",
        tags: ["Shopping", "Metro", "Food"],
    },
    {
        id: "cubbon-park",
        name: "Cubbon Park",
        category: "Parks",
        address: "Kasturba Road",
        lat: 12.9763,
        lng: 77.5929,
        rating: "4.8",
        status: "Open",
        accent: "#22c55e",
        tags: ["Walks", "Nature", "Photos"],
    },
    {
        id: "lalbagh",
        name: "Lalbagh Botanical Garden",
        category: "Parks",
        address: "Mavalli, Bengaluru",
        lat: 12.9507,
        lng: 77.5848,
        rating: "4.6",
        status: "Open",
        accent: "#16a34a",
        tags: ["Garden", "Lake", "Morning"],
    },
    {
        id: "kempegowda-airport",
        name: "Kempegowda Airport",
        category: "Transit",
        address: "Devanahalli",
        lat: 13.1986,
        lng: 77.7066,
        rating: "4.4",
        status: "Open",
        accent: "#6366f1",
        tags: ["Flights", "Taxi", "Transit"],
    },
];

const CATEGORIES = [
    { id: "all", label: "All", icon: MapPin },
    { id: "favorites", label: "Saved", icon: Star },
    { id: "Food", label: "Food", icon: Search },
    { id: "Parks", label: "Parks", icon: Compass },
    { id: "Transit", label: "Transit", icon: TrainFront },
    { id: "Work", label: "Work", icon: Navigation },
];

const MAP_MODES = [
    { id: "standard", label: "Map" },
    { id: "transit", label: "Transit" },
    { id: "satellite", label: "Satellite" },
];

const TRAVEL_MODES = {
    drive: { label: "Drive", icon: Car, profile: "car" },
    walk: { label: "Walk", icon: Footprints, profile: "foot" },
    transit: { label: "Transit", icon: TrainFront, profile: "car" },
};

const getStoredFavorites = () => {
    if (typeof window === "undefined") return [];
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (start, end) => {
    if (!start || !end) return 0;
    const earthRadiusKm = 6371;
    const dLat = toRadians(end.lat - start.lat);
    const dLng = toRadians(end.lng - start.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(start.lat)) *
            Math.cos(toRadians(end.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distance) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(distance > 20 ? 0 : 1)} km`;
};

const formatEta = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};

function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

function ZoomControls({ zoomLevel }) {
    const map = useMap();
    useEffect(() => {
        if (zoomLevel) {
            map.setZoom(zoomLevel);
        }
    }, [zoomLevel, map]);
    return null;
}

// Fit the map to show the route polyline
function RouteFitter({ routeCoords }) {
    const map = useMap();
    useEffect(() => {
        if (routeCoords && routeCoords.length > 1) {
            const bounds = L.latLngBounds(routeCoords);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
    }, [routeCoords, map]);
    return null;
}

function Maps() {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [selectedPlaceId, setSelectedPlaceId] = useState("mg-road");
    const [originId, setOriginId] = useState("mg-road");
    const [destinationId, setDestinationId] = useState("kempegowda-airport");
    const [travelMode, setTravelMode] = useState("drive");
    const [mapMode, setMapMode] = useState("standard");
    const [trafficEnabled, setTrafficEnabled] = useState(true);
    const [zoom, setZoom] = useState(13);
    const [mapCenter, setMapCenter] = useState([12.9757, 77.6056]);
    const [userPlace, setUserPlace] = useState(null);
    const [searchedPlaces, setSearchedPlaces] = useState([]);
    const [favorites, setFavorites] = useState(getStoredFavorites);
    const [status, setStatus] = useState("");

    // Live location tracking
    const [liveLocation, setLiveLocation] = useState(null);
    const [liveAccuracy, setLiveAccuracy] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);

    // Search autocomplete
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);

    // Route polyline
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeDistance, setRouteDistance] = useState(null);
    const [routeDuration, setRouteDuration] = useState(null);
    const [showRoute, setShowRoute] = useState(false);
    const [routeSteps, setRouteSteps] = useState([]);

    // Directions input mode
    const [directionsMode, setDirectionsMode] = useState(false);
    const [fromQuery, setFromQuery] = useState("");
    const [toQuery, setToQuery] = useState("");
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromSuggestions, setShowFromSuggestions] = useState(false);
    const [showToSuggestions, setShowToSuggestions] = useState(false);
    const fromTimeoutRef = useRef(null);
    const toTimeoutRef = useRef(null);

    const places = useMemo(
        () => {
            const list = [...INITIAL_PLACES];
            if (userPlace) list.unshift(userPlace);
            return [...searchedPlaces, ...list];
        },
        [userPlace, searchedPlaces]
    );

    const selectedPlace = useMemo(
        () => places.find((place) => place.id === selectedPlaceId) || places[0],
        [places, selectedPlaceId]
    );

    const originPlace = useMemo(
        () => places.find((place) => place.id === originId) || places[0],
        [places, originId]
    );

    const destinationPlace = useMemo(
        () => places.find((place) => place.id === destinationId) || places[1],
        [places, destinationId]
    );

    const filteredPlaces = useMemo(() => {
        const cleanQuery = query.trim().toLowerCase();
        return places.filter((place) => {
            const matchesCategory =
                category === "all" ||
                (category === "favorites" && favorites.includes(place.id)) ||
                place.category === category;
            const matchesQuery =
                !cleanQuery ||
                [place.name, place.address, place.category, ...(place.tags || [])]
                    .join(" ")
                    .toLowerCase()
                    .includes(cleanQuery);
            return matchesCategory && matchesQuery;
        });
    }, [category, favorites, places, query]);

    const route = useMemo(() => {
        if (routeDistance !== null && routeDuration !== null) {
            return { distance: routeDistance, eta: Math.round(routeDuration / 60) };
        }
        const distance = getDistanceKm(originPlace, destinationPlace);
        const speed = travelMode === "drive" ? 32 : travelMode === "walk" ? 5 : 24;
        const trafficMultiplier = trafficEnabled && travelMode === "drive" ? 1.22 : 1;
        const eta = Math.max(2, Math.round((distance / speed) * 60 * trafficMultiplier));
        return { distance, eta };
    }, [destinationPlace, originPlace, trafficEnabled, travelMode, routeDistance, routeDuration]);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch {
            // optional
        }
    }, [favorites]);

    useEffect(() => {
        if (!status) return undefined;
        const timeout = window.setTimeout(() => setStatus(""), 2600);
        return () => window.clearTimeout(timeout);
    }, [status]);

    useEffect(() => {
        if (!places.some((place) => place.id === originId)) setOriginId(places[0]?.id);
        if (!places.some((place) => place.id === destinationId)) setDestinationId(places[1]?.id || places[0]?.id);
    }, [destinationId, originId, places]);

    // Fetch route from OSRM when origin/destination/travelMode changes and directions mode is on
    const fetchRoute = useCallback(async (origin, destination, mode) => {
        if (!origin || !destination) return;
        try {
            const profile = TRAVEL_MODES[mode]?.profile || "car";
            const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                const routeData = data.routes[0];
                const coords = routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                setRouteCoords(coords);
                setRouteDistance(routeData.distance / 1000); // convert meters to km
                setRouteDuration(routeData.duration); // seconds
                setShowRoute(true);
                // Extract turn-by-turn steps
                if (routeData.legs && routeData.legs[0] && routeData.legs[0].steps) {
                    const steps = routeData.legs[0].steps.map(step => ({
                        instruction: step.maneuver?.type || "",
                        name: step.name || "Unknown road",
                        distance: step.distance,
                        duration: step.duration,
                        modifier: step.maneuver?.modifier || "",
                    }));
                    setRouteSteps(steps);
                }
            }
        } catch {
            // Fallback: no route drawn
            setRouteCoords([]);
            setRouteDistance(null);
            setRouteDuration(null);
            setShowRoute(false);
            setRouteSteps([]);
        }
    }, []);

    useEffect(() => {
        if (directionsMode && originPlace && destinationPlace) {
            fetchRoute(originPlace, destinationPlace, travelMode);
        }
    }, [directionsMode, originPlace, destinationPlace, travelMode, fetchRoute]);

    // Live location tracking
    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus("Location unavailable");
            return;
        }
        setIsTracking(true);
        setStatus("Tracking location...");

        watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords }) => {
                const loc = { lat: coords.latitude, lng: coords.longitude };
                setLiveLocation(loc);
                setLiveAccuracy(coords.accuracy);

                const current = {
                    id: "current-location",
                    name: "My Location",
                    category: "Location",
                    address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
                    lat: coords.latitude,
                    lng: coords.longitude,
                    rating: "Live",
                    status: "GPS",
                    accent: "#0ea5e9",
                    tags: ["Current", "GPS", "Live"],
                };
                setUserPlace(current);
                setMapCenter([coords.latitude, coords.longitude]);
                setZoom(16);
                setSelectedPlaceId("current-location");
                setStatus("Live location active");
            },
            (err) => {
                setStatus(err.code === 1 ? "Location permission denied" : "Location unavailable");
                setIsTracking(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
        );
    }, []);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        setStatus("Tracking stopped");
    }, []);

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const handleLocate = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };

    // Search autocomplete
    const fetchSuggestions = useCallback(async (searchQuery, setSuggestionsFn, setShowFn) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSuggestionsFn([]);
            setShowFn(false);
            return;
        }
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=6&addressdetails=1`
            );
            const data = await res.json();
            if (data && data.length > 0) {
                setSuggestionsFn(data.map(item => ({
                    id: `search-${item.place_id}`,
                    name: item.name || item.display_name.split(",")[0],
                    address: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    type: item.type,
                    category: item.class || "Search",
                })));
                setShowFn(true);
            } else {
                setSuggestionsFn([]);
                setShowFn(false);
            }
        } catch {
            setSuggestionsFn([]);
            setShowFn(false);
        }
    }, []);

    const handleSearchInput = (value) => {
        setQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(value, setSuggestions, setShowSuggestions);
        }, 350);
    };

    const handleFromInput = (value) => {
        setFromQuery(value);
        if (fromTimeoutRef.current) clearTimeout(fromTimeoutRef.current);
        fromTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(value, setFromSuggestions, setShowFromSuggestions);
        }, 350);
    };

    const handleToInput = (value) => {
        setToQuery(value);
        if (toTimeoutRef.current) clearTimeout(toTimeoutRef.current);
        toTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(value, setToSuggestions, setShowToSuggestions);
        }, 350);
    };

    const selectSuggestion = (suggestion) => {
        const newPlace = {
            id: suggestion.id,
            name: suggestion.name,
            category: "Search",
            address: suggestion.address,
            lat: suggestion.lat,
            lng: suggestion.lng,
            rating: "-",
            status: "Found",
            accent: "#f43f5e",
            tags: [suggestion.type || "Search"],
        };
        setSearchedPlaces(prev => {
            // Avoid duplicates
            if (prev.some(p => p.id === newPlace.id)) return prev;
            return [newPlace, ...prev];
        });
        setSelectedPlaceId(newPlace.id);
        setMapCenter([newPlace.lat, newPlace.lng]);
        setZoom(15);
        setQuery(suggestion.name);
        setSuggestions([]);
        setShowSuggestions(false);
        setStatus(`Found: ${suggestion.name}`);
    };

    const selectFromSuggestion = (suggestion) => {
        const newPlace = {
            id: suggestion.id,
            name: suggestion.name,
            category: "Search",
            address: suggestion.address,
            lat: suggestion.lat,
            lng: suggestion.lng,
            rating: "-",
            status: "Found",
            accent: "#22c55e",
            tags: [suggestion.type || "Origin"],
        };
        setSearchedPlaces(prev => {
            if (prev.some(p => p.id === newPlace.id)) return prev;
            return [newPlace, ...prev];
        });
        setOriginId(newPlace.id);
        setFromQuery(suggestion.name);
        setFromSuggestions([]);
        setShowFromSuggestions(false);
    };

    const selectToSuggestion = (suggestion) => {
        const newPlace = {
            id: suggestion.id,
            name: suggestion.name,
            category: "Search",
            address: suggestion.address,
            lat: suggestion.lat,
            lng: suggestion.lng,
            rating: "-",
            status: "Found",
            accent: "#ef4444",
            tags: [suggestion.type || "Destination"],
        };
        setSearchedPlaces(prev => {
            if (prev.some(p => p.id === newPlace.id)) return prev;
            return [newPlace, ...prev];
        });
        setDestinationId(newPlace.id);
        setToQuery(suggestion.name);
        setToSuggestions([]);
        setShowToSuggestions(false);
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setShowSuggestions(false);
        setStatus("Searching...");
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const result = data[0];
                const newPlace = {
                    id: `search-${Date.now()}`,
                    name: result.name || query,
                    category: "Search",
                    address: result.display_name,
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    rating: "-",
                    status: "Found",
                    accent: "#f43f5e",
                    tags: [result.type || "Search Result"],
                };
                setSearchedPlaces(prev => [newPlace, ...prev]);
                setSelectedPlaceId(newPlace.id);
                setMapCenter([newPlace.lat, newPlace.lng]);
                setZoom(15);
                setStatus("Location found");
            } else {
                setStatus("No results found");
            }
        } catch {
            setStatus("Search failed");
        }
    };

    const toggleFavorite = (placeId) => {
        setFavorites((current) =>
            current.includes(placeId)
                ? current.filter((id) => id !== placeId)
                : [...current, placeId]
        );
    };

    const handleCopy = async (place) => {
        const text = `${place.name} - ${place.address} (${place.lat.toFixed(5)}, ${place.lng.toFixed(5)})`;
        try {
            await navigator.clipboard.writeText(text);
            setStatus("Copied location");
        } catch {
            setStatus("Copy failed");
        }
    };

    const handleShare = async (place) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: place.name, text: place.address, url });
                setStatus("Shared location");
            } catch {
                setStatus("Share cancelled");
            }
            return;
        }
        await handleCopy(place);
    };

    const handleOpenExternal = (place) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleGetDirections = (place) => {
        setDirectionsMode(true);
        setDestinationId(place.id);
        setToQuery(place.name);
        if (userPlace) {
            setOriginId(userPlace.id);
            setFromQuery("My Location");
        }
        setStatus("Getting directions...");
    };

    const selectPlaceFromList = (placeId) => {
        setSelectedPlaceId(placeId);
        const place = places.find(p => p.id === placeId);
        if (place) {
            setMapCenter([place.lat, place.lng]);
        }
    };

    const zoomIn = () => setZoom(z => Math.min(z + 1, 18));
    const zoomOut = () => setZoom(z => Math.max(z - 1, 3));

    const closeDirections = () => {
        setDirectionsMode(false);
        setRouteCoords([]);
        setRouteDistance(null);
        setRouteDuration(null);
        setShowRoute(false);
        setRouteSteps([]);
    };

    // Map Tiles Mapping based on Map Mode
    const tileUrl = mapMode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = mapMode === "satellite"
        ? "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        : "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";

    return (
        <div className="maps-app">
            <div id="window-header" className="maps-titlebar">
                <div id="window-controls">
                    <WindowControls target="maps" />
                </div>
                <div className="maps-window-title">
                    <MapPin size={15} />
                    <span>Maps</span>
                    {isTracking && <span className="maps-live-badge">LIVE</span>}
                </div>
                <div className="maps-title-spacer" />
            </div>

            <div className="maps-shell">
                <aside className="maps-sidebar">
                    {!directionsMode ? (
                        <>
                            {/* Search bar with autocomplete */}
                            <div className="maps-search-wrapper">
                                <form className="maps-search" onSubmit={handleSearchSubmit}>
                                    <Search size={17} />
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        placeholder="Search any location..."
                                        value={query}
                                        onChange={(e) => handleSearchInput(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    />
                                    {query && (
                                        <button type="button" className="maps-search-clear" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); }}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </form>
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="maps-suggestions">
                                        {suggestions.map((s, i) => (
                                            <li key={`${s.id}-${i}`}>
                                                <button type="button" onClick={() => selectSuggestion(s)}>
                                                    <MapPin size={14} />
                                                    <span className="maps-suggestion-text">
                                                        <strong>{s.name}</strong>
                                                        <small>{s.address}</small>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="maps-category-strip">
                                {CATEGORIES.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        className={category === id ? "maps-category active" : "maps-category"}
                                        onClick={() => setCategory(id)}
                                        title={label}
                                    >
                                        <Icon size={14} />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Quick actions */}
                            <div className="maps-quick-actions">
                                <button
                                    type="button"
                                    className={`maps-quick-btn ${isTracking ? 'active' : ''}`}
                                    onClick={handleLocate}
                                >
                                    <LocateFixed size={16} />
                                    <span>{isTracking ? "Stop Tracking" : "Live Location"}</span>
                                </button>
                                <button
                                    type="button"
                                    className="maps-quick-btn directions"
                                    onClick={() => setDirectionsMode(true)}
                                >
                                    <Navigation2 size={16} />
                                    <span>Directions</span>
                                </button>
                            </div>

                            <div className="maps-list-heading">
                                <span>Places</span>
                                <strong>{filteredPlaces.length}</strong>
                            </div>

                            <ul className="maps-place-list">
                                {filteredPlaces.map((place) => (
                                    <li
                                        key={place.id}
                                        className={selectedPlace?.id === place.id ? "selected" : ""}
                                    >
                                        <button
                                            type="button"
                                            className="maps-place-row"
                                            onClick={() => selectPlaceFromList(place.id)}
                                        >
                                            <span className="maps-place-dot" style={{ backgroundColor: place.accent }} />
                                            <span className="maps-place-copy">
                                                <strong>{place.name}</strong>
                                                <small>{place.category} · {place.address}</small>
                                            </span>
                                            <span className="maps-place-rating">{place.rating}</span>
                                        </button>
                                        <div className="maps-place-actions">
                                            <button
                                                type="button"
                                                className="maps-directions-btn"
                                                onClick={() => handleGetDirections(place)}
                                                title="Get directions"
                                            >
                                                <Navigation2 size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                className={favorites.includes(place.id) ? "maps-favorite active" : "maps-favorite"}
                                                onClick={() => toggleFavorite(place.id)}
                                                title={favorites.includes(place.id) ? "Remove favorite" : "Save place"}
                                            >
                                                <Star size={13} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        /* Directions Panel */
                        <>
                            <div className="maps-directions-header">
                                <Route size={18} />
                                <span>Directions</span>
                                <button type="button" className="maps-directions-close" onClick={closeDirections}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* From input */}
                            <div className="maps-directions-input-group">
                                <div className="maps-directions-dot origin" />
                                <div className="maps-directions-input-wrap">
                                    <input
                                        type="text"
                                        placeholder="Starting point"
                                        value={fromQuery}
                                        onChange={(e) => handleFromInput(e.target.value)}
                                        onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                                    />
                                    {fromQuery && (
                                        <button type="button" className="maps-search-clear" onClick={() => { setFromQuery(""); setFromSuggestions([]); }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                    {showFromSuggestions && fromSuggestions.length > 0 && (
                                        <ul className="maps-suggestions direction-suggestions">
                                            {fromSuggestions.map((s, i) => (
                                                <li key={`from-${s.id}-${i}`}>
                                                    <button type="button" onClick={() => selectFromSuggestion(s)}>
                                                        <MapPin size={12} />
                                                        <span className="maps-suggestion-text">
                                                            <strong>{s.name}</strong>
                                                            <small>{s.address}</small>
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="maps-directions-connector" />

                            {/* To input */}
                            <div className="maps-directions-input-group">
                                <div className="maps-directions-dot destination" />
                                <div className="maps-directions-input-wrap">
                                    <input
                                        type="text"
                                        placeholder="Destination"
                                        value={toQuery}
                                        onChange={(e) => handleToInput(e.target.value)}
                                        onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                                    />
                                    {toQuery && (
                                        <button type="button" className="maps-search-clear" onClick={() => { setToQuery(""); setToSuggestions([]); }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                    {showToSuggestions && toSuggestions.length > 0 && (
                                        <ul className="maps-suggestions direction-suggestions">
                                            {toSuggestions.map((s, i) => (
                                                <li key={`to-${s.id}-${i}`}>
                                                    <button type="button" onClick={() => selectToSuggestion(s)}>
                                                        <MapPin size={12} />
                                                        <span className="maps-suggestion-text">
                                                            <strong>{s.name}</strong>
                                                            <small>{s.address}</small>
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Use my location button */}
                            <button
                                type="button"
                                className="maps-use-location-btn"
                                onClick={() => {
                                    if (userPlace) {
                                        setOriginId(userPlace.id);
                                        setFromQuery("My Location");
                                    } else {
                                        startTracking();
                                        setFromQuery("My Location");
                                    }
                                }}
                            >
                                <LocateFixed size={14} />
                                <span>Use my location as start</span>
                            </button>

                            {/* Travel mode selector */}
                            <div className="maps-travel-modes">
                                {Object.entries(TRAVEL_MODES).map(([id, mode]) => {
                                    const Icon = mode.icon;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className={travelMode === id ? "active" : ""}
                                            onClick={() => setTravelMode(id)}
                                            title={mode.label}
                                        >
                                            <Icon size={16} />
                                            <span>{mode.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Route summary */}
                            {showRoute && (
                                <div className="maps-route-summary">
                                    <div className="maps-route-summary-card">
                                        <div className="maps-route-stat">
                                            <Clock size={16} />
                                            <div>
                                                <strong>{formatEta(route.eta)}</strong>
                                                <span>{TRAVEL_MODES[travelMode].label}</span>
                                            </div>
                                        </div>
                                        <div className="maps-route-stat">
                                            <Route size={16} />
                                            <div>
                                                <strong>{formatDistance(route.distance)}</strong>
                                                <span>{trafficEnabled && travelMode === "drive" ? "Live traffic" : "Clear route"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Route steps */}
                            {routeSteps.length > 0 && (
                                <div className="maps-route-steps">
                                    <div className="maps-route-steps-title">Turn-by-turn</div>
                                    <ul className="maps-steps-list">
                                        {routeSteps.filter(s => s.name && s.distance > 0).slice(0, 10).map((step, i) => (
                                            <li key={i} className="maps-step-item">
                                                <div className="maps-step-icon">
                                                    <Navigation2 size={12} style={{ transform: step.modifier === "left" ? "rotate(-90deg)" : step.modifier === "right" ? "rotate(90deg)" : "none" }} />
                                                </div>
                                                <div className="maps-step-info">
                                                    <span className="maps-step-name">{step.instruction.replace(/-/g, ' ')} onto {step.name}</span>
                                                    <small>{formatDistance(step.distance / 1000)}</small>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Quick place selection with selects */}
                            <div className="maps-directions-selects">
                                <label className="maps-select-row">
                                    <span>From</span>
                                    <select value={originId} onChange={(event) => { setOriginId(event.target.value); const p = places.find(pl => pl.id === event.target.value); if (p) setFromQuery(p.name); }}>
                                        {places.map((place) => (
                                            <option key={place.id} value={place.id}>
                                                {place.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="maps-select-row">
                                    <span>To</span>
                                    <select
                                        value={destinationId}
                                        onChange={(event) => {
                                            setDestinationId(event.target.value);
                                            const p = places.find(pl => pl.id === event.target.value);
                                            if (p) setToQuery(p.name);
                                            selectPlaceFromList(event.target.value);
                                        }}
                                    >
                                        {places.map((place) => (
                                            <option key={place.id} value={place.id}>
                                                {place.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </>
                    )}
                </aside>

                <main className={`maps-canvas maps-mode-${mapMode}`}>
                    <div className="maps-topbar">
                        <div className="maps-mode-tabs">
                            {MAP_MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    className={mapMode === mode.id ? "active" : ""}
                                    onClick={() => setMapMode(mode.id)}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className={trafficEnabled ? "maps-traffic-toggle active" : "maps-traffic-toggle"}
                            onClick={() => setTrafficEnabled((value) => !value)}
                        >
                            <Layers size={15} />
                            <span>Traffic</span>
                        </button>
                    </div>

                    <div className="maps-zoom-controls" aria-label="Map controls" style={{ position: "absolute", right: 16, top: 70, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
                        <button type="button" onClick={handleLocate} title={isTracking ? "Stop tracking" : "My location"} className={isTracking ? "maps-locate-active" : ""}>
                            <LocateFixed size={17} />
                        </button>
                        <button type="button" onClick={zoomIn} title="Zoom in">
                            <ZoomIn size={17} />
                        </button>
                        <button type="button" onClick={zoomOut} title="Zoom out">
                            <ZoomOut size={17} />
                        </button>
                        <button type="button" onClick={() => setZoom(13)} title="Reset zoom">
                            <Crosshair size={17} />
                        </button>
                    </div>

                    <div className="maps-map-viewport" style={{ zIndex: 0 }}>
                        <MapContainer
                            center={mapCenter}
                            zoom={zoom}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                        >
                            <MapUpdater center={mapCenter} zoom={zoom} />
                            <ZoomControls zoomLevel={zoom} />
                            <TileLayer
                                attribution={attribution}
                                url={tileUrl}
                            />

                            {/* Route polyline */}
                            {showRoute && routeCoords.length > 1 && (
                                <>
                                    <RouteFitter routeCoords={routeCoords} />
                                    {/* Glow effect */}
                                    <Polyline
                                        positions={routeCoords}
                                        pathOptions={{
                                            color: "#2563eb",
                                            weight: 8,
                                            opacity: 0.25,
                                            lineCap: "round",
                                            lineJoin: "round",
                                        }}
                                    />
                                    {/* Main route line */}
                                    <Polyline
                                        positions={routeCoords}
                                        pathOptions={{
                                            color: "#3b82f6",
                                            weight: 5,
                                            opacity: 0.9,
                                            lineCap: "round",
                                            lineJoin: "round",
                                            dashArray: "12 6",
                                        }}
                                    />
                                    {/* Origin marker */}
                                    {originPlace && (
                                        <Marker
                                            position={[originPlace.lat, originPlace.lng]}
                                            icon={createOriginIcon()}
                                        >
                                            <Popup><strong>Start:</strong> {originPlace.name}</Popup>
                                        </Marker>
                                    )}
                                    {/* Destination marker */}
                                    {destinationPlace && (
                                        <Marker
                                            position={[destinationPlace.lat, destinationPlace.lng]}
                                            icon={createDestinationIcon()}
                                        >
                                            <Popup><strong>End:</strong> {destinationPlace.name}</Popup>
                                        </Marker>
                                    )}
                                </>
                            )}

                            {/* Live location with accuracy circle */}
                            {liveLocation && (
                                <>
                                    <Circle
                                        center={[liveLocation.lat, liveLocation.lng]}
                                        radius={liveAccuracy || 50}
                                        pathOptions={{
                                            color: "#3b82f6",
                                            fillColor: "#3b82f6",
                                            fillOpacity: 0.1,
                                            weight: 1,
                                            opacity: 0.3,
                                        }}
                                    />
                                    <CircleMarker
                                        center={[liveLocation.lat, liveLocation.lng]}
                                        radius={8}
                                        pathOptions={{
                                            color: "white",
                                            fillColor: "#3b82f6",
                                            fillOpacity: 1,
                                            weight: 3,
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ padding: "4px" }}>
                                                <strong>📍 My Location</strong><br />
                                                <small>Accuracy: ~{Math.round(liveAccuracy || 0)}m</small>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                </>
                            )}

                            {/* Place markers */}
                            {places.map((place) => {
                                // Skip current-location if we have live circle
                                if (place.id === "current-location" && liveLocation) return null;
                                return (
                                    <Marker
                                        key={place.id}
                                        position={[place.lat, place.lng]}
                                        icon={createCustomIcon(place.accent)}
                                        eventHandlers={{
                                            click: () => {
                                                selectPlaceFromList(place.id);
                                            },
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ padding: "4px" }}>
                                                <strong>{place.name}</strong><br />
                                                <small>{place.category}</small>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    </div>

                    {/* Selected place panel */}
                    {selectedPlace && !directionsMode && (
                        <section className="maps-place-panel" style={{ zIndex: 10 }}>
                            <div className="maps-place-panel-main">
                                <span className="maps-place-panel-icon" style={{ backgroundColor: selectedPlace.accent }}>
                                    <MapPin size={18} />
                                </span>
                                <div>
                                    <h3>{selectedPlace.name}</h3>
                                    <p>{selectedPlace.address}</p>
                                    <div className="maps-tags">
                                        <span>{selectedPlace.status}</span>
                                        <span>{selectedPlace.rating}</span>
                                        {selectedPlace.tags && selectedPlace.tags.slice(0, 2).map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="maps-panel-actions">
                                <button type="button" onClick={() => handleGetDirections(selectedPlace)} title="Directions" className="maps-panel-directions">
                                    <Navigation2 size={16} />
                                </button>
                                <button
                                    type="button"
                                    className={favorites.includes(selectedPlace.id) ? "active" : ""}
                                    onClick={() => toggleFavorite(selectedPlace.id)}
                                    title="Save place"
                                >
                                    <Star size={16} />
                                </button>
                                <button type="button" onClick={() => handleCopy(selectedPlace)} title="Copy">
                                    <Copy size={16} />
                                </button>
                                <button type="button" onClick={() => handleShare(selectedPlace)} title="Share">
                                    <Share2 size={16} />
                                </button>
                                <button type="button" onClick={() => handleOpenExternal(selectedPlace)} title="Open in Maps">
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Route info chip */}
                    {showRoute && directionsMode && (
                        <div className="maps-route-chip" style={{ zIndex: 10 }}>
                            <Clock size={15} />
                            <span>{originPlace?.name}</span>
                            <Navigation size={14} />
                            <span>{destinationPlace?.name}</span>
                            <strong>{formatEta(route.eta)} · {formatDistance(route.distance)}</strong>
                        </div>
                    )}

                    {status && <div className="maps-status" style={{ zIndex: 1001 }}>{status}</div>}
                </main>
            </div>
        </div>
    );
}

const MapsWindow = WindowWrapper(Maps, "maps");
export default MapsWindow;
