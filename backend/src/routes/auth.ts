import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { prisma } from '../services/prisma';
import { AuthRequest, authenticate } from '../middleware/auth';
import { sendVerificationEmail } from '../services/email';
import { z } from 'zod';

const router = Router();
const jwtExpiresIn = config.jwt.expiresIn as jwt.SignOptions['expiresIn'];

// ==================== Validation Schemas ====================
const registerSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

const verifyEmailSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
  code: z.string().regex(/^\d{6}$/, 'کد تایید باید ۶ رقم باشد'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateVerificationCode = () =>
  crypto.randomInt(100000, 1000000).toString();

const hashVerificationCode = (code: string) =>
  crypto
    .createHash('sha256')
    .update(`${code}:${config.jwt.secret}`)
    .digest('hex');

const createToken = (user: { id: number; email: string; role: string }) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: jwtExpiresIn }
  );

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  isVerified: true,
  createdAt: true,
};

const createAndSendVerificationCode = async (user: {
  id: number;
  email: string;
  name?: string | null;
}) => {
  const code = generateVerificationCode();
  const expiresAt = new Date(
    Date.now() + config.email.verificationCodeTtlMinutes * 60 * 1000
  );

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      codeHash: hashVerificationCode(code),
      expiresAt,
    },
  });

  const emailResult = await sendVerificationEmail({
    to: user.email,
    code,
    name: user.name,
  });

  return {
    emailResult,
    devCode: config.nodeEnv === 'production' ? undefined : code,
    expiresAt,
  };
};

// ==================== POST /api/auth/register ====================
router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = normalizeEmail(body.email);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'این ایمیل قبلاً ثبت شده است',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: body.name,
      },
      select: safeUserSelect,
    });

    const verification = await createAndSendVerificationCode(user);

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام انجام شد. کد فعال‌سازی به ایمیل شما ارسال شد',
      data: {
        user,
        requiresEmailVerification: true,
        emailProvider: verification.emailResult.provider,
        devCode: verification.devCode,
        expiresAt: verification.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت‌نام',
    });
  }
});

// ==================== POST /api/auth/login ====================
router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const email = normalizeEmail(body.email);

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است',
      });
    }

    const isValidPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است',
      });
    }

    if (!user.isVerified) {
      const verification = await createAndSendVerificationCode(user);
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'برای ورود ابتدا ایمیل خود را تایید کنید. کد جدید ارسال شد',
        data: {
          email: user.email,
          requiresEmailVerification: true,
          emailProvider: verification.emailResult.provider,
          devCode: verification.devCode,
          expiresAt: verification.expiresAt,
        },
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      message: 'ورود موفق',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'خطا در ورود',
    });
  }
});

// ==================== POST /api/auth/verify-email ====================
router.post('/verify-email', async (req, res) => {
  try {
    const body = verifyEmailSchema.parse(req.body);
    const email = normalizeEmail(body.email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { ...safeUserSelect, verificationCodes: false },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'حساب کاربری یافت نشد',
      });
    }

    if (user.isVerified) {
      const token = createToken(user);
      return res.json({
        success: true,
        message: 'ایمیل قبلاً تایید شده است',
        data: { user, token },
      });
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode || verificationCode.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'کد تایید منقضی شده است. لطفاً کد جدید بگیرید',
      });
    }

    if (verificationCode.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کد جدید بگیرید',
      });
    }

    const isValidCode =
      verificationCode.codeHash === hashVerificationCode(body.code);

    if (!isValidCode) {
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });

      return res.status(400).json({
        success: false,
        message: 'کد تایید اشتباه است',
      });
    }

    const verifiedUser = await prisma.$transaction(async (tx) => {
      await tx.verificationCode.update({
        where: { id: verificationCode.id },
        data: { consumedAt: new Date() },
      });

      await tx.verificationCode.updateMany({
        where: {
          userId: user.id,
          purpose: 'EMAIL_VERIFICATION',
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      return tx.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        select: safeUserSelect,
      });
    });

    const token = createToken(verifiedUser);

    res.json({
      success: true,
      message: 'ایمیل با موفقیت تایید شد',
      data: { user: verifiedUser, token },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'خطا در تایید ایمیل',
    });
  }
});

// ==================== POST /api/auth/resend-verification ====================
router.post('/resend-verification', async (req, res) => {
  try {
    const body = resendVerificationSchema.parse(req.body);
    const email = normalizeEmail(body.email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'حساب کاربری یافت نشد',
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'این ایمیل قبلاً تایید شده است',
        data: { requiresEmailVerification: false },
      });
    }

    const lastCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
      },
      orderBy: { sentAt: 'desc' },
    });

    if (
      lastCode &&
      Date.now() - lastCode.sentAt.getTime() <
        config.email.resendCooldownSeconds * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: `برای ارسال مجدد کمی صبر کنید`,
      });
    }

    const verification = await createAndSendVerificationCode(user);

    res.json({
      success: true,
      message: 'کد فعال‌سازی جدید ارسال شد',
      data: {
        requiresEmailVerification: true,
        emailProvider: verification.emailResult.provider,
        devCode: verification.devCode,
        expiresAt: verification.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال مجدد کد تایید',
    });
  }
});

// ==================== GET /api/auth/me ====================
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, isVerified: true, createdAt: true },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات کاربر',
    });
  }
});

export { router as authRoutes };
