import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { writeAuditLog } from '../utils/auditLog.js';

// JWT generator utility
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'dental_clinic_jwt_secret_key_change_me_in_production_12345',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'PATIENT',
      },
    });

    const token = generateToken(user.id, user.role);

    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: "PATIENT_REGISTERED",
      entity: "User",
      entityId: user.id,
      details: `Patient registered: ${user.email}`,
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration controller error:', error);
    if (error?.name === 'PrismaClientInitializationError') {
      return res.status(503).json({
        message: 'Database is unavailable. Check DATABASE_URL / Neon connection.',
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Register a new doctor
// @route   POST /api/auth/register-doctor
// @access  Public
export const registerDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    specialization,
    qualification,
    experience,
    bio,
    workingDays,
    workingHours,
  } = req.body;

  try {
    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        message: 'Name, email, password, and specialization are required',
      });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialization,
            qualification: qualification || null,
            experience: experience ? Number(experience) : null,
            bio: bio || null,
            workingDays: workingDays || null,
            workingHours: workingHours || null,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      message: 'Doctor registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorProfile: user.doctorProfile,
      },
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    if (error?.name === 'PrismaClientInitializationError') {
      return res.status(503).json({
        message: 'Database is unavailable. Check DATABASE_URL / Neon connection.',
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: `Login: ${user.email} (${user.role})`,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Login controller error:', error);
    if (error?.name === 'PrismaClientInitializationError') {
      return res.status(503).json({
        message: 'Database is unavailable. Check DATABASE_URL / Neon connection.',
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Logout user (client-side clears token, server API provides success hook)
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  return res.json({ message: 'Successfully logged out. Please clear client-side token.' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await writeAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: req.user.id,
      details: "User changed password",
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
