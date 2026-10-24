import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { users, admins } from '../schemas/index';
import { env } from '../config/env';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Generate JWT token
const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

const generateAdminToken = (adminId: number, email: string, role: string): string => {
  return jwt.sign({ adminId, email, role }, env.JWT_ADMIN_SECRET, {
    expiresIn: env.JWT_ADMIN_EXPIRES_IN,
  } as jwt.SignOptions);
};

// ============================
// CUSTOMER AUTH
// ============================

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return next(new AppError('All fields are required', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  // Check existing user
  const existingUser = await db.select().from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return next(new AppError('Email already registered', 409));
  }

  const existingPhone = await db.select().from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (existingPhone.length > 0) {
    return next(new AppError('Phone number already registered', 409));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const [newUser] = await db.insert(users).values({
    name,
    email,
    phone,
    password: hashedPassword,
  }).returning();

  const token = generateToken(newUser.id, newUser.email);

  return res.status(201).json({
    success: true,
    message: 'Registration successful!',
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        role: newUser.role,
        loyaltyPoints: newUser.loyaltyPoints,
        createdAt: newUser.createdAt,
      },
    },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const [user] = await db.select().from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact support.', 403));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  const token = generateToken(user.id, user.email);

  return res.json({
    success: true,
    message: 'Login successful!',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
      },
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const [user] = await db.select().from(users)
    .where(eq(users.id, req.userId!))
    .limit(1);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
    },
  });
});

// PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, phone } = req.body;

  const [updated] = await db.update(users)
    .set({
      name: name || undefined,
      phone: phone || undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, req.userId!))
    .returning();

  if (!updated) {
    return next(new AppError('User not found', 404));
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatar: updated.avatar,
    },
  });
});

// PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new AppError('Old and new password are required', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  const [user] = await db.select().from(users)
    .where(eq(users.id, req.userId!))
    .limit(1);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    return next(new AppError('Current password is incorrect', 401));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, req.userId!));

  return res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// ============================
// ADMIN AUTH
// ============================

// POST /api/auth/admin/login
export const adminLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const [admin] = await db.select().from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (!admin) {
    return next(new AppError('Invalid admin credentials', 401));
  }

  if (!admin.isActive) {
    return next(new AppError('Admin account is deactivated', 403));
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid admin credentials', 401));
  }

  // Update last login
  await db.update(admins)
    .set({ lastLogin: new Date() })
    .where(eq(admins.id, admin.id));

  const token = generateAdminToken(admin.id, admin.email, admin.role);

  return res.json({
    success: true,
    message: 'Admin login successful!',
    data: {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
      },
    },
  });
});