const User = require('./user.model');
const Finder = require('../finder/finder.model');
const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { fullName, displayName, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        const user = await User.create({
            fullName,
            displayName,
            email,
            password,
        });

        if (user) {
            // Create root folders
            const rootFolders = await Finder.insertMany([
                { user: user._id, name: "Work", type: "folder", fileType: "folder", icon: "/icons/work.svg", parentId: null, isTrash: false },
                { user: user._id, name: "About me", type: "folder", fileType: "folder", icon: "/icons/info.svg", parentId: null, isTrash: false },
                { user: user._id, name: "Resume", type: "folder", fileType: "folder", icon: "/icons/file.svg", parentId: null, isTrash: false },
                { user: user._id, name: "Trash", type: "folder", fileType: "folder", icon: "/icons/trash.svg", parentId: null, isTrash: false }
            ]);

            const workId = rootFolders[0]._id;
            const aboutId = rootFolders[1]._id;
            const resumeId = rootFolders[2]._id;
            const trashId = rootFolders[3]._id;

            // Create subfolders in Work
            const workSubfolders = await Finder.insertMany([
                { user: user._id, name: "Crop Recommendation System", type: "folder", fileType: "folder", parentId: workId, isTrash: false },
                { user: user._id, name: "Muragesh WebOS", type: "folder", fileType: "folder", parentId: workId, isTrash: false },
                { user: user._id, name: "Marnani - Airbnb Clone", type: "folder", fileType: "folder", parentId: workId, isTrash: false }
            ]);

            const cropId = workSubfolders[0]._id;
            const webOSId = workSubfolders[1]._id;
            const marnaniId = workSubfolders[2]._id;

            // Populate all files
            await Finder.insertMany([
                // Crop Recommendation Files
                { user: user._id, name: "Crop Recommendation Project.txt", type: "file", fileType: "txt", content: "Crop Recommendation System helps farmers choose the right crop based on soil type, weather, and environmental factors. The system analyzes real-time data to reduce guesswork and increase yield. Built using Next.js, Node.js, and API integrations, it offers fast performance and real-time insights.", parentId: cropId, isTrash: false },
                { user: user._id, name: "crop.com", type: "file", fileType: "url", content: "https://github.com/muragesh46/farming", icon: "/images/Ask.png", parentId: cropId, isTrash: false },
                { user: user._id, name: "crop.png", type: "file", fileType: "img", content: "/images/project-1.jpg", icon: "/images/image.png", parentId: cropId, isTrash: false },

                // WebOS Files
                { user: user._id, name: "WebOS Project.txt", type: "file", fileType: "txt", content: "Muragesh WebOS is an interactive web-based operating system that brings the desktop experience to your browser. Instead of a traditional portfolio, this project offers an immersive OS-like interface with draggable windows, a dock, and file system navigation. Built with React.js, it showcases advanced UI/UX design, state management, and real-time interactivity.", parentId: webOSId, isTrash: false },
                { user: user._id, name: "muragesh-webos.vercel.app", type: "file", fileType: "url", content: "https://muragesh-webos.vercel.app/", icon: "/images/Ask.png", parentId: webOSId, isTrash: false },
                { user: user._id, name: "webos-screenshot.png", type: "file", fileType: "img", content: "/images/project-2.png", icon: "/images/image.png", parentId: webOSId, isTrash: false },

                // Marnani Files
                { user: user._id, name: "Marnani Project.txt", type: "file", fileType: "txt", content: "Marnani is a full-stack Airbnb clone that allows users to browse, list, and book vacation rentals worldwide. Instead of just static listings, it features user authentication, interactive maps, real-time booking, and detailed property reviews. Built with Node.js, Express, MongoDB, and EJS templating, it delivers a production-ready rental marketplace.", parentId: marnaniId, isTrash: false },
                { user: user._id, name: "marnani.onrender.com", type: "file", fileType: "url", content: "https://marnani.onrender.com/", icon: "/images/Ask.png", parentId: marnaniId, isTrash: false },
                { user: user._id, name: "marnani-screenshot.png", type: "file", fileType: "img", content: "/images/project-3.jpg", icon: "/images/image.png", parentId: marnaniId, isTrash: false },

                // About me Files
                { user: user._id, name: "me.png", type: "file", fileType: "img", content: "/images/muragesh.jpg", icon: "/images/image.png", parentId: aboutId, isTrash: false },
                { user: user._id, name: "me-infront-shiva.png", type: "file", fileType: "img", content: "/images/muragesh-2.jpg", icon: "/images/image.png", parentId: aboutId, isTrash: false },
                { user: user._id, name: "me-me.png", type: "file", fileType: "img", content: "/images/muragesh-3.jpg", icon: "/images/image.png", parentId: aboutId, isTrash: false },
                { user: user._id, name: "about-me.txt", type: "file", fileType: "txt", content: "Hey! I'm Muragesh 👋, a developer who enjoys building sleek, interactive websites that actually work well. I worked in JavaScript, React, and Node.js—and I love making things feel smooth, fast, and just a little bit delightful. I’m big on clean UI, good UX, and writing code that doesn’t need a search party to debug. Outside of dev work, you'll find me playing chess or impulse-buying products I absolutely convinced myself I needed 😅", parentId: aboutId, isTrash: false },

                // Resume Files
                { user: user._id, name: "Resume.pdf", type: "file", fileType: "pdf", icon: "/images/pdf.png", parentId: resumeId, isTrash: false },

                // Default Trash Files
                { user: user._id, name: "windows.png", type: "file", fileType: "img", content: "/images/trash-1.png", icon: "/images/image.png", parentId: trashId, isTrash: true },
                { user: user._id, name: "android.png", type: "file", fileType: "img", content: "/images/trash-2.png", icon: "/images/image.png", parentId: trashId, isTrash: true }
            ]);

            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                displayName: user.displayName,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                displayName: user.displayName,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Guest Login / Quick demo session
// @route   POST /api/auth/guest
// @access  Public
const guestLogin = async (req, res) => {
    try {
        const guestSuffix = Math.floor(100 + Math.random() * 900);
        const guestName = req.body?.name || `Guest_${guestSuffix}`;
        const guestEmail = `guest_${Date.now()}_${guestSuffix}@webos.system`;

        const guestUser = await User.create({
            fullName: guestName,
            displayName: guestName,
            email: guestEmail,
            password: 'GuestPassword123!',
            isOnline: true,
        });

        // Add existing users to contacts so guest can immediately chat and video call
        const existingUsers = await User.find({ _id: { $ne: guestUser._id } }).limit(10);
        if (existingUsers.length > 0) {
            guestUser.contacts = existingUsers.map((u) => u._id);
            await guestUser.save();

            for (const other of existingUsers) {
                if (!other.contacts) other.contacts = [];
                if (!other.contacts.includes(guestUser._id)) {
                    other.contacts.push(guestUser._id);
                    await other.save();
                }
            }
        }

        res.json({
            _id: guestUser._id,
            fullName: guestUser.fullName,
            displayName: guestUser.displayName,
            email: guestUser.email,
            isGuest: true,
            token: generateToken(guestUser._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    guestLogin,
};
