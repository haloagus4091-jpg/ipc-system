const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 5 login attempts per windowMs
  message: {
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: {
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiting - slow down responses after certain threshold
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 50, // allow 50 requests at full speed
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  }
});

// SQL Injection prevention middleware
const sqlInjectionPrevention = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT|TABLE|FROM|WHERE|AND|OR|NOT|NULL|TRUE|FALSE)\b)|(--|#|\/\*|\*\/|;|'|"|\|\|)/gi;
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPattern.test(value);
    }
    return false;
  };
  
  const checkObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) return true;
      } else if (checkValue(obj[key])) {
        return true;
      }
    }
    return false;
  };
  
  // Check query params
  if (checkObject(req.query)) {
    return res.status(403).json({ message: 'Potentially malicious request detected (SQL Injection)' });
  }
  
  // Check body
  if (checkObject(req.body)) {
    return res.status(403).json({ message: 'Potentially malicious request detected (SQL Injection)' });
  }
  
  // Check params
  if (checkObject(req.params)) {
    return res.status(403).json({ message: 'Potentially malicious request detected (SQL Injection)' });
  }
  
  next();
};

// XSS Prevention - sanitize input
const xssPrevention = (req, res, next) => {
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove script tags
      return value.replace(xssPattern, '');
    }
    return value;
  };
  
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      } else {
        obj[key] = sanitizeValue(obj[key]);
      }
    }
  };
  
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  next();
};

// Input sanitization - trim and escape
const sanitizeInput = (req, res, next) => {
  const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  const trimAndEscape = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimAndEscape(obj[key]);
      } else if (typeof obj[key] === 'string') {
        obj[key] = escapeHtml(obj[key].trim());
      }
    }
  };
  
  if (req.body) trimAndEscape(req.body);
  if (req.query) trimAndEscape(req.query);
  
  next();
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Error handler that doesn't expose internal details
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose internal error details to client
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Request logging for security audit
const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('user-agent');
  
  // Log suspicious requests
  const suspiciousPatterns = /(<script|javascript:|onerror=|onload=|SELECT.*FROM|DROP.*TABLE)/i;
  const bodyStr = JSON.stringify(req.body);
  
  if (suspiciousPatterns.test(url) || suspiciousPatterns.test(bodyStr)) {
    console.warn(`[SECURITY ALERT] ${timestamp} - Suspicious request from ${ip}: ${method} ${url}`);
    console.warn(`  User-Agent: ${userAgent}`);
    console.warn(`  Body: ${bodyStr}`);
  }
  
  next();
};

module.exports = {
  loginLimiter,
  apiLimiter,
  speedLimiter,
  sqlInjectionPrevention,
  xssPrevention,
  sanitizeInput,
  securityHeaders,
  errorHandler,
  securityLogger
};
