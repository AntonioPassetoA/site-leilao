const axios = require('axios');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify reCAPTCHA token
 * @param {string} token - The reCAPTCHA token from the frontend
 * @param {string} remoteIp - The user's IP address (optional)
 * @returns {Promise<{success: boolean, score?: number, action?: string, error?: string}>}
 */
async function verifyRecaptcha(token, remoteIp = null) {
  // If reCAPTCHA is not configured, skip verification in development
  if (!RECAPTCHA_SECRET_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('reCAPTCHA not configured - skipping verification in development');
      return { success: true, score: 1.0, skipped: true };
    }
    return { success: false, error: 'reCAPTCHA not configured' };
  }

  if (!token) {
    return { success: false, error: 'Token reCAPTCHA não fornecido' };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET_KEY);
    params.append('response', token);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await axios.post(RECAPTCHA_VERIFY_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = response.data;

    if (data.success) {
      // For reCAPTCHA v3, check score (0.0 - 1.0)
      // Score >= 0.5 is generally considered human
      const score = data.score || 1.0;
      if (score < 0.5) {
        return {
          success: false,
          score,
          error: 'Verificação de segurança falhou. Tente novamente.'
        };
      }

      return {
        success: true,
        score,
        action: data.action,
        challengeTs: data.challenge_ts,
        hostname: data.hostname
      };
    } else {
      const errorCodes = data['error-codes'] || [];
      let errorMessage = 'Verificação reCAPTCHA falhou';

      if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'Token expirado. Recarregue a página e tente novamente.';
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Token inválido. Tente novamente.';
      }

      return {
        success: false,
        errorCodes,
        error: errorMessage
      };
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return {
      success: false,
      error: 'Erro ao verificar reCAPTCHA. Tente novamente.'
    };
  }
}

/**
 * Express middleware to verify reCAPTCHA
 * @param {Object} options - Options
 * @param {boolean} options.required - Whether reCAPTCHA is required (default: true in production)
 */
function recaptchaMiddleware(options = {}) {
  const required = options.required ?? (process.env.NODE_ENV === 'production');

  return async (req, res, next) => {
    const token = req.body.recaptchaToken;

    // Skip if not required and no token provided
    if (!required && !token) {
      return next();
    }

    const result = await verifyRecaptcha(token, req.ip);

    if (!result.success && !result.skipped) {
      return res.status(400).json({
        error: 'Falha na verificação de segurança',
        message: result.error
      });
    }

    // Attach result to request for logging/analytics
    req.recaptcha = result;
    next();
  };
}

module.exports = {
  verifyRecaptcha,
  recaptchaMiddleware
};
