const navLinks = [
    {
        id: 1,
        name: "Projects",
        type: "finder",
    },
    {
        id: 2,
        name: "About me",
        type: "about",
    },
    {
        id: 3,
        name: "Contact",
        type: "contact",
    },
    {
        id: 4,
        name: "Resume",
        type: "resume",
    },
];

const navIcons = [
    {
        id: 1,
        img: "/icons/wifi.svg",
    },
    {
        id: 2,
        img: "/icons/search.svg",
    },
    {
        id: 3,
        img: "/icons/user.svg",
    },
    {
        id: 4,
        img: "/icons/mode.svg",
    },
];

const dockApps = [
    {
        id: "finder",
        name: "finder",
        icon: "finder.png",
        canOpen: true,
    },
    {
        id: "Ask",
        name: "Ask",
        icon: "Ask.png",
        canOpen: true,
    },
    {
        id: "photos",
        name: "Gallery",
        icon: "photos.png",
        canOpen: true,
    },
    {
        id: "contact",
        name: "Contact",
        icon: "contact.png",
        canOpen: true,
    },
    {
        id: "terminal",
        name: "Skills",
        icon: "terminal.png",
        canOpen: true,
    },
    {
        id: "trash",
        name: "Archive",
        icon: "trash.png",
        canOpen: true,
        window: "finder",
    },
];


const techStack = [
    {
        category: "Frontend",
        items: ["React.js", "EJS"],
    },

    {
        category: "Styling",
        items: ["Tailwind CSS", "CSS"],
    },
    {
        category: "Backend",
        items: ["Node.js", "Express"],
    },
    {
        category: "Database",
        items: ["MongoDB", "PostgreSQL"],
    },
    {
        category: "AI/ML",
        items: ["NLP", "Computer Vision"],
    },
    {
        category: "Dev Tools",
        items: ["Git", "GitHub", "Vercel", "Render"],
    },
];

const socials = [
    {
        id: 1,
        text: "Github",
        icon: "/icons/github.svg",
        bg: "#f4656b",
        link: "https://github.com/muragesh46",
    },
    {
        id: 2,
        text: "Portfolio",
        icon: "/icons/atom.svg",
        bg: "#4bcb63",
        link: "https://muragesh-webos.vercel.app/",
    },
    {
        id: 3,
        text: "Twitter/X",
        icon: "/icons/twitter.svg",
        bg: "#ff866b",
        link: "https://x.com/4_6_muragesh",
    },
    {
        id: 4,
        text: "LinkedIn",
        icon: "/icons/linkedin.svg",
        bg: "#05b6f6",
        link: "https://www.linkedin.com/in/muragesh-mirje/",
    },
];

const photosLinks = [
    {
        id: 1,
        icon: "/icons/gicon1.svg",
        title: "Library",
    },
    {
        id: 2,
        icon: "/icons/gicon2.svg",
        title: "Memories",
    },
    {
        id: 3,
        icon: "/icons/file.svg",
        title: "Places",
    },
    {
        id: 4,
        icon: "/icons/gicon4.svg",
        title: "People",
    },
    {
        id: 5,
        icon: "/icons/gicon5.svg",
        title: "Favorites",
    },
];

const gallery = [
    {
        id: 1,
        img: "/images/gal1.png",
    },
    {
        id: 2,
        img: "/images/gal2.png",
    },
    {
        id: 3,
        img: "/images/gal3.png",
    },
    {
        id: 4,
        img: "/images/gal4.png",
    },
];



const WORK_LOCATION = {
    id: 1,
    type: "work",
    name: "Work",
    icon: "/icons/work.svg",
    kind: "folder",
    children: [

        {
            id: 5,
            name: "Crop Recommendation System",
            icon: "/images/folder.png",
            kind: "folder",
            position: "top-10 left-5",
            windowPosition: "top-[5vh] left-5",
            children: [
                {
                    id: 1,
                    name: "Crop Recommendation Project.txt",
                    icon: "/images/txt.png",
                    kind: "file",
                    fileType: "txt",
                    position: "top-5 left-10",
                    description: [
                        "Crop Recommendation System helps farmers choose the right crop based on soil type, weather, and environmental factors.",
                        "The system analyzes real-time data to reduce guesswork and increase yield.",
                        "Think of it like a smart farming assistant that guides farmers toward better decisions.",
                        "Built using Next.js, Node.js, and API integrations, it offers fast performance and real-time insights."
                    ],
                },
                {
                    id: 2,
                    name: "crop.com",
                    icon: "/images/Ask.png",
                    kind: "file",
                    fileType: "url",
                    href: "https://github.com/muragesh46/farming",
                    position: "top-10 right-20",
                },
                {
                    id: 4,
                    name: "crop.png",
                    icon: "/images/image.png",
                    kind: "file",
                    fileType: "img",
                    position: "top-52 right-80",
                    imageUrl: "/images/project-1.jpg",
                },

            ],
        },


        {
            id: 6,
            name: "Muragesh WebOS",
            icon: "/images/folder.png",
            kind: "folder",
            position: "top-52 right-80",
            windowPosition: "top-[20vh] left-7",
            children: [
                {
                    id: 1,
                    name: "WebOS Project.txt",
                    icon: "/images/txt.png",
                    kind: "file",
                    fileType: "txt",
                    position: "top-5 right-10",
                    description: [
                        "Muragesh WebOS is an interactive web-based operating system that brings the desktop experience to your browser.",
                        "Instead of a traditional portfolio, this project offers an immersive OS-like interface with draggable windows, a dock, and file system navigation.",
                        "Think of it like macOS—but running entirely in your web browser with smooth animations and intuitive interactions.",
                        "Built with React.js, it showcases advanced UI/UX design, state management, and real-time interactivity."
                    ],
                },
                {
                    id: 2,
                    name: "muragesh-webos.vercel.app",
                    icon: "/images/Ask.png",
                    kind: "file",
                    fileType: "url",
                    href: "https://muragesh-webos.vercel.app/",
                    position: "top-20 left-20",
                },
                {
                    id: 4,
                    name: "webos-screenshot.png",
                    icon: "/images/image.png",
                    kind: "file",
                    fileType: "img",
                    position: "top-52 left-80",
                    imageUrl: "/images/project-2.png",
                },
            ],
        },


        {
            id: 7,
            name: "Marnani - Airbnb Clone",
            icon: "/images/folder.png",
            kind: "folder",
            position: "top-10 left-80",
            windowPosition: "top-[15vh] left-7",
            children: [
                {
                    id: 1,
                    name: "Marnani Project.txt",
                    icon: "/images/txt.png",
                    kind: "file",
                    fileType: "txt",
                    position: "top-5 left-10",
                    description: [
                        "Marnani is a full-stack Airbnb clone that allows users to browse, list, and book vacation rentals worldwide.",
                        "Instead of just static listings, it features user authentication, interactive maps, real-time booking, and detailed property reviews.",
                        "Think of it like Airbnb—with complete CRUD operations, secure user sessions, and a responsive booking interface.",
                        "Built with Node.js, Express, MongoDB, and EJS templating, it delivers a production-ready rental marketplace."
                    ],
                },
                {
                    id: 2,
                    name: "marnani.onrender.com",
                    icon: "/images/Ask.png",
                    kind: "file",
                    fileType: "url",
                    href: "https://marnani.onrender.com/",
                    position: "top-10 right-20",
                },
                {
                    id: 4,
                    name: "marnani-screenshot.png",
                    icon: "/images/image.png",
                    kind: "file",
                    fileType: "img",
                    position: "top-52 right-80",
                    imageUrl: "/images/project-3.jpg",
                },
            ],
        },
    ],
};

const ABOUT_LOCATION = {
    id: 2,
    type: "about",
    name: "About me",
    icon: "/icons/info.svg",
    kind: "folder",
    children: [
        {
            id: 1,
            name: "me.png",
            icon: "/images/image.png",
            kind: "file",
            fileType: "img",
            position: "top-10 left-5",
            imageUrl: "/images/muragesh.jpg",
        },
        {
            id: 2,
            name: "me-infront-shiva.png",
            icon: "/images/image.png",
            kind: "file",
            fileType: "img",
            position: "top-28 right-72",
            imageUrl: "/images/muragesh-2.jpg",
        },
        {
            id: 3,
            name: "me-me.png",
            icon: "/images/image.png",
            kind: "file",
            fileType: "img",
            position: "top-52 left-80",
            imageUrl: "/images/muragesh-3.jpg",
        },
        {
            id: 4,
            name: "about-me.txt",
            icon: "/images/txt.png",
            kind: "file",
            fileType: "txt",
            position: "top-60 left-5",
            subtitle: "Meet the Developer Behind the Code",
            image: "/images/muragesh.jpg",
            description: [
                "Hey! I'm Muragesh 👋, a developer who enjoys building sleek, interactive websites that actually work well.",
                "I worked in JavaScript, React, and Node.js—and I love making things feel smooth, fast, and just a little bit delightful.",
                "I’m big on clean UI, good UX, and writing code that doesn’t need a search party to debug.",
                "Outside of dev work, you'll find me playing chess or impulse-buying products I absolutely convinced myself I needed 😅",
            ],
        },
    ],
};

const RESUME_LOCATION = {
    id: 3,
    type: "resume",
    name: "Resume",
    icon: "/icons/file.svg",
    kind: "folder",
    children: [
        {
            id: 1,
            name: "Resume.pdf",
            icon: "/images/pdf.png",
            kind: "file",
            fileType: "pdf",

        },
    ],
};

const TRASH_LOCATION = {
    id: 4,
    type: "trash",
    name: "Trash",
    icon: "/icons/trash.svg",
    kind: "folder",
    children: [
        {
            id: 1,
            name: "windows.png",
            icon: "/images/image.png",
            kind: "file",
            fileType: "img",
            position: "top-10 left-10",
            imageUrl: "/images/trash-1.png",
        },
        {
            id: 2,
            name: "android.png",
            icon: "/images/image.png",
            kind: "file",
            fileType: "img",
            position: "top-40 left-80",
            imageUrl: "/images/trash-2.png",
        },
    ],
};

export const locations = {
    work: WORK_LOCATION,
    about: ABOUT_LOCATION,
    resume: RESUME_LOCATION,
    trash: TRASH_LOCATION,
};

const INITIAL_Z_INDEX = 1000;

const WINDOW_CONFIG = {
    finder: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    about: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    contact: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    resume: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    Ask: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    photos: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    terminal: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    txtfile: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    imgfile: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
    calendar: { isOpen: false, zIndex: INITIAL_Z_INDEX, data: null },
};

export { INITIAL_Z_INDEX, WINDOW_CONFIG };
export {
    navLinks,
    navIcons,
    dockApps,
    techStack,
    socials,
    photosLinks,
    gallery,
};
