import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { writeAuditLog } from '../utils/auditLog.js';
import { signAuthToken } from '../utils/jwt.js';
import { sendPasswordSetupEmail } from '../utils/passwordReset.js';

// JWT generator utility
const generateToken = (id, role) => signAuthToken(id, role);

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

// @desc    Public doctor self-registration is disabled (admin creates doctors)
// @route   POST /api/auth/register-doctor
// @access  Disabled
export const registerDoctor = async (_req, res) => {
  return res.status(403).json({
    message:
      "Doctor accounts can only be created by the clinic admin. Please contact the clinic.",
  });
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

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (user) {
      await sendPasswordSetupEmail(user, "reset");
      await writeAuditLog({
        actorId: user.id,
        actorRole: user.role,
        actorEmail: user.email,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "User",
        entityId: user.id,
        details: "Password reset email requested",
      });
    }

    return res.json({
      message:
        "If that email is registered, we sent a password reset link. Check your inbox.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Reset password with token from email
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: String(token),
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired. Request a new one.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: user.id,
      details: "Password reset via email link",
    });

    return res.json({
      message: "Password updated. You can sign in now.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
