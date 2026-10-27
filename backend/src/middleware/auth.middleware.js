const jwt = require('jsonwebtoken');
const User = require('../apps/auth/user.model');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (token === 'guest-portfolio-demo-token') {
                let guestUser = await User.findOne({ email: 'guest@webos.system' });
                if (!guestUser) {
                    guestUser = await User.create({
                        fullName: 'Guest Explorer',
                        displayName: 'Guest',
                        email: 'guest@webos.system',
                        password: 'GuestPassword123!',
                        isOnline: true
                    });
                }
                req.user = guestUser;
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
