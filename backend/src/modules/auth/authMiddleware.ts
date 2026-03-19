import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

            req.user = await User.findById(decoded.id).select('-password');

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    return;
};

export const teacher = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as a teacher' });
    }
};

export const proctor = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'proctor' || req.user.role === 'admin' || req.user.role === 'teacher')) {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as a proctor or teacher' });
    }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
