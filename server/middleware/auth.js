const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = {
    verifyToken: async (token) => {
        try {
            if (!token) throw new Error('No token provided');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user) throw new Error('User not found');
            
            return user;
        } catch (error) {
            throw new Error('Invalid token');
        }
    },

    generateToken: (userId) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    },

    authenticateRequest: async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const user = await auth.verifyToken(token);
            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Please authenticate' });
        }
    },

    isAdmin: async (req, res, next) => {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    }
};

module.exports = auth; 