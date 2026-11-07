import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { PermissionKey } from '../../types/rbac';
import { hasPermission } from '../../utils/rbac';
import { redisService } from '../services/redisService';
import { PasswordPolicyService } from '../services/passwordPolicyService';
import { StorageService } from '../../services/storageService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    fullName: string;
    companyId: string;
    companyName: string;
    role: string;
    isPlatformOwner?: boolean;
    isMfaVerified?: boolean;
    mfaMethod?: string;
    passwordLastChanged?: string;
    customPermissions?: PermissionKey[];
    jti?: string;
  };
}

/**
 * Middleware: Verifies JWT token from HTTP-only Cookie or Authorization Header, enforces django-otp MFA verification, and checks token revocation
 */
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined = req.cookies?.kibosh_access_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentification requise. Aucun jeton de session valide fourni.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.jti) {
      const isRevoked = await redisService.isTokenRevoked(decoded.jti);
      if (isRevoked) {
        return res.status(401).json({
          error: 'REVOKED_TOKEN',
          message: 'Ce jeton a été révoqué. Veuillez vous re-connecter.'
        });
      }
    }

    // Strict Django-OTP Session Verification: Verify that the token has passed MFA verification
    if (decoded.isMfaVerified !== true) {
      return res.status(403).json({
        error: 'MFA_VERIFICATION_REQUIRED',
        message: 'Accès refusé. La vérification double facteur (django-otp) est obligatoire.'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Jeton de session expiré ou invalide. Veuillez vous re-connecter.'
    });
  }
};

/**
 * Middleware: Explicitly enforces mandatory Multi-Factor Authentication (django-otp)
 */
export const enforceMfaRequirement = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.isMfaVerified !== true) {
    return res.status(403).json({
      error: 'MFA_REQUIRED',
      message: 'Cette action requiert une session validée par double facteur django-otp (TOTP / Backup Code).'
    });
  }
  next();
};

/**
 * Middleware: Enforces multi-tenant isolation by ensuring user belongs to target companyId
 */
export const enforceTenantIsolation = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Non authentifié' });
  }

  // Target tenant from body, query, or params
  const targetCompanyId = req.body?.companyId || req.query?.companyId || req.params?.companyId;

  if (targetCompanyId && targetCompanyId !== req.user.companyId && !req.user.isPlatformOwner) {
    return res.status(403).json({
      error: 'TENANT_MISMATCH',
      message: 'Accès refusé. Violation d\'isolation multi-entreprises (Tentative de cross-tenant IDOR).'
    });
  }

  next();
};

/**
 * Middleware: Requires specific granular permission or role
 */
export const requirePermission = (permission: PermissionKey) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Non authentifié' });
    }

    const { role, customPermissions, isPlatformOwner } = req.user;

    // Platform Super Admin bypasses restrictions for tenant management
    if (isPlatformOwner || role === 'Platform Super Admin' || role === 'Super Administrator') {
      return next();
    }

    const mockSession = {
      id: req.user.userId,
      name: req.user.fullName,
      email: req.user.email,
      role: req.user.role as any,
      company: req.user.companyName,
      companyId: req.user.companyId,
      department: 'Direction',
      mfaEnabled: false,
      lastLogin: new Date().toISOString(),
      isPlatformOwner: !!req.user.isPlatformOwner
    };

    const isAllowed = hasPermission(role as any, permission, mockSession);

    if (!isAllowed) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Permission manquante : ${permission}. Action non autorisée pour votre rôle (${role}).`
      });
    }

    next();
  };
};

/**
 * Middleware: Requires Platform Owner privileges
 */
export const requirePlatformOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Non authentifié' });
  }

  if (!req.user.isPlatformOwner && req.user.role !== 'Platform Super Admin' && req.user.role !== 'Super Administrator') {
    return res.status(403).json({
      error: 'FORBIDDEN_PLATFORM_OWNER',
      message: 'Cette action exige le rôle de Propriétaire de la Plateforme SaaS.'
    });
  }

  next();
};

/**
 * Middleware: Enforces Django strict password complexity requirements
 * (Minimum 12 characters, uppercase, lowercase, number, special character, common password blocklist, and user similarity checks)
 */
export const enforceDjangoPasswordPolicy = (req: Request, res: Response, next: NextFunction) => {
  const candidatePassword = req.body?.password || req.body?.newPassword;

  if (!candidatePassword) {
    return res.status(400).json({
      error: 'PASSWORD_REQUIRED',
      message: 'Un mot de passe est requis dans la requête pour vérification de la politique de sécurité.'
    });
  }

  const userAttributes = {
    email: req.body?.email || (req as AuthenticatedRequest).user?.email,
    username: req.body?.username,
    fullName: req.body?.fullName || (req as AuthenticatedRequest).user?.fullName
  };

  const validation = PasswordPolicyService.validate(candidatePassword, userAttributes);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'PASSWORD_POLICY_VIOLATION',
      message: 'Le mot de passe ne respecte pas la politique de sécurité des mots de passe Django (AUTH_PASSWORD_VALIDATORS).',
      policyErrors: validation.errors,
      score: validation.score,
      checks: validation.checks
    });
  }

  next();
};

/**
 * Middleware: Enforces regular Django 90-day password rotation cycles
 */
export const enforcePasswordRotation = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Non authentifié' });
  }

  const lastChanged = req.user.passwordLastChanged;
  if (lastChanged && PasswordPolicyService.isPasswordExpired(lastChanged)) {
    return res.status(403).json({
      error: 'PASSWORD_EXPIRED',
      message: 'Votre mot de passe a expiré (politique de rotation obligatoire tous les 90 jours). Veuillez renouveler votre mot de passe.',
      expiryDays: PasswordPolicyService.EXPIRY_DAYS
    });
  }

  next();
};

