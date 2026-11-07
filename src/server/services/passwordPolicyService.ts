import crypto from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0 to 100 strength score
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notCommon: boolean;
    notSimilarToUser: boolean;
    notEntirelyNumeric: boolean;
  };
}

// Django COMMON_PASSWORDS blocklist
const COMMON_WEAK_PASSWORDS = new Set([
  'password', 'password123', 'password123!', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'admin', 'admin123', 'administrator', 'welcome', 'welcome123', 'iloveyou',
  'sunshine', 'princess', 'football', 'monkey', 'shadow', 'master', 'dragon', 'baseball',
  'superman', 'trustno1', 'secret', 'letmein', 'solo', 'starwars', 'pass1234', 'p@ssword',
  'azerty', 'azerty123', 'motdepasse', 'kibosh123', 'enterprise'
]);

export class PasswordPolicyService {
  /**
   * Minimum required length for Enterprise HR / Payroll passwords
   */
  static MIN_LENGTH = 12;

  /**
   * Password expiry duration in days (90 days standard)
   */
  static EXPIRY_DAYS = 90;

  /**
   * Validates a candidate password against Django AUTH_PASSWORD_VALIDATORS rules
   */
  static validate(password: string, userAttributes?: { email?: string; username?: string; fullName?: string }): PasswordValidationResult {
    const errors: string[] = [];

    const minLength = password.length >= this.MIN_LENGTH;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password);
    const notEntirelyNumeric = !/^\d+$/.test(password);

    // 1. Minimum Length Check
    if (!minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${this.MIN_LENGTH} caractères.`);
    }

    // 2. Character Diversity / Complexity Check
    if (!hasUppercase) {
      errors.push('Le mot de passe doit inclure au moins une lettre majuscule (A-Z).');
    }
    if (!hasLowercase) {
      errors.push('Le mot de passe doit inclure au moins une lettre minuscule (a-z).');
    }
    if (!hasNumber) {
      errors.push('Le mot de passe doit inclure au moins un chiffre (0-9).');
    }
    if (!hasSpecialChar) {
      errors.push('Le mot de passe doit inclure au moins un caractère spécial (!@#$%^&*...).');
    }

    // 3. Numeric Check
    if (!notEntirelyNumeric) {
      errors.push('Le mot de passe ne peut pas être uniquement composé de chiffres.');
    }

    // 4. Common Password Check (Django CommonPasswordValidator)
    const normalizedPwd = password.toLowerCase().replace(/[^a-z0-9]/g, '');
    const notCommon = !COMMON_WEAK_PASSWORDS.has(password.toLowerCase()) && !COMMON_WEAK_PASSWORDS.has(normalizedPwd);
    if (!notCommon) {
      errors.push('Ce mot de passe fait partie des mots de passe trop fréquents ou faciles à deviner.');
    }

    // 5. User Attribute Similarity Check (Django UserAttributeSimilarityValidator)
    let notSimilarToUser = true;
    if (userAttributes) {
      const candidates = [
        userAttributes.username?.toLowerCase(),
        userAttributes.email?.split('@')[0]?.toLowerCase(),
        userAttributes.fullName?.toLowerCase()
      ].filter(Boolean) as string[];

      for (const candidate of candidates) {
        if (candidate.length >= 3 && password.toLowerCase().includes(candidate)) {
          notSimilarToUser = false;
          errors.push('Le mot de passe ressemble trop à vos informations personnelles (nom, e-mail ou identifiant).');
          break;
        }
      }
    }

    // Calculate strength score (0 to 100)
    let score = 0;
    if (password.length >= 12) score += 25;
    if (password.length >= 16) score += 15;
    if (hasUppercase) score += 15;
    if (hasLowercase) score += 10;
    if (hasNumber) score += 15;
    if (hasSpecialChar) score += 20;
    if (!notCommon) score = Math.min(score, 30);
    if (!notSimilarToUser) score = Math.min(score, 40);

    return {
      isValid: errors.length === 0,
      errors,
      score,
      checks: {
        minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar,
        notCommon,
        notSimilarToUser,
        notEntirelyNumeric
      }
    };
  }

  /**
   * Verifies whether a password has expired (older than 90 days)
   */
  static isPasswordExpired(lastChangedIsoDate?: string): boolean {
    if (!lastChangedIsoDate) return false;
    const changed = new Date(lastChangedIsoDate).getTime();
    const now = Date.now();
    const ageDays = (now - changed) / (1000 * 60 * 60 * 24);
    return ageDays > this.EXPIRY_DAYS;
  }
}
