export { default as authRoutes } from './authRoutes';
export * from './authController';
export { protect, admin, teacher, proctor, AuthRequest } from './authMiddleware';
