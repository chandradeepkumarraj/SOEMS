import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { SERVER_CONFIG } from '../../config/serverConfig';

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        role: string;
    } | any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            token = authHeader.split(' ')[1];
            
            // Reject uninitialized token strings (common in JS/React errors)
            if (!token || token === 'null' || token === 'undefined') {
                return res.status(401).json({ message: 'Not authorized, malformed token' });
            }

            const decoded: any = jwt.verify(token, SERVER_CONFIG.JWT_SECRET as string);

            // Attach user info from token to request (Scalability: Stop mandatory DB hit on every HB)
            req.user = { _id: decoded.id, role: decoded.role };

            return next();
        } catch (error) {
            console.error('[AuthMiddleware] Token Verification Failed:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Utility to fetch full user only when needed (Lazy Loading)
 */
export const populateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?._id) {
        const fullUser = await User.findById(req.user._id).select('-password');
        if (fullUser) {
            req.user = fullUser;
        }
    }
    next();
};

export const teacher = (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (role === 'teacher' || role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as a teacher' });
    }
};

export const proctor = (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (role === 'proctor' || role === 'admin' || role === 'teacher') {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as a proctor or teacher' });
    }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
