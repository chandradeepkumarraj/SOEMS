import { Request, Response, NextFunction } from 'express';
import SystemConfig from '../models/SystemConfig';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { SERVER_CONFIG } from '../config/serverConfig';

/**
 * @desc    Middleware to check if system is in maintenance mode
 * @access  Public
 */
export const checkMaintenance = async (req: any, res: Response, next: NextFunction) => {
    try {
        const config = await (SystemConfig as any).getOrCreate();

        if (config.maintenanceMode) {
            // First, try to identify the user if a token is present
            let isAdmin = false;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded: any = jwt.verify(token, SERVER_CONFIG.JWT_SECRET, { algorithms: ['HS256'] });
                    const user = await User.findById(decoded.id).select('role');
                    if (user && user.role === 'admin') {
                        isAdmin = true;
                        req.user = user; // Populate req.user for downstream use
                    }
                } catch (authError) {
                    // Ignore auth errors here, we just care if they ARE an admin
                }
            }

            if (isAdmin) {
                return next();
            }

            // Allow administrative routes and the login route itself
            if (req.path.startsWith('/api/admin') || 
                req.path === '/api/auth/login' || 
                req.path === '/api/auth/maintenance-status') {
                return next();
            }

            return res.status(503).json({
                message: 'System is currently under maintenance. Please try again later.',
                maintenance: true
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance middleware error:', error);
        next(); // Proceed anyway if config check fails to avoid total lockout
    }
};
