const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/\d/).withMessage('Senha deve conter pelo menos um número'),
  body('cpf')
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).withMessage('CPF inválido'),
  body('phone')
    .optional()
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/).withMessage('Telefone inválido'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória'),
  handleValidationErrors
];

// Lead/Interest form validators
const validateLead = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Telefone é obrigatório')
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/).withMessage('Telefone inválido'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Mensagem deve ter no máximo 1000 caracteres'),
  body('propertyId')
    .notEmpty().withMessage('ID do imóvel é obrigatório')
    .isInt({ min: 1 }).withMessage('ID do imóvel inválido'),
  body('acceptedTerms')
    .optional()
    .isBoolean().withMessage('Aceite dos termos deve ser verdadeiro ou falso'),
  body('recaptchaToken')
    .optional()
    .isString().withMessage('Token reCAPTCHA inválido'),
  handleValidationErrors
];

// Property search validators
const validatePropertySearch = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preço mínimo inválido'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preço máximo inválido'),
  query('state')
    .optional()
    .isLength({ min: 2, max: 2 }).withMessage('Estado deve ter 2 caracteres'),
  query('propertyType')
    .optional()
    .isIn(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'RURAL']).withMessage('Tipo de imóvel inválido'),
  query('auctionType')
    .optional()
    .isIn(['JUDICIAL', 'EXTRAJUDICIAL']).withMessage('Tipo de leilão inválido'),
  handleValidationErrors
];

// Property ID validator
const validatePropertyId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID do imóvel inválido'),
  handleValidationErrors
];

// User profile update validator
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),
  body('phone')
    .optional()
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/).withMessage('Telefone inválido'),
  body('currentPassword')
    .optional()
    .notEmpty().withMessage('Senha atual é obrigatória para alterar a senha'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/\d/).withMessage('Nova senha deve conter pelo menos um número'),
  handleValidationErrors
];

// Admin property form validator
const validateProperty = [
  body('title')
    .trim()
    .notEmpty().withMessage('Título é obrigatório')
    .isLength({ min: 5, max: 200 }).withMessage('Título deve ter entre 5 e 200 caracteres'),
  body('propertyType')
    .notEmpty().withMessage('Tipo de imóvel é obrigatório')
    .isIn(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'RURAL']).withMessage('Tipo inválido'),
  body('auctionType')
    .notEmpty().withMessage('Tipo de leilão é obrigatório')
    .isIn(['JUDICIAL', 'EXTRAJUDICIAL']).withMessage('Tipo de leilão inválido'),
  body('minBid')
    .notEmpty().withMessage('Lance mínimo é obrigatório')
    .isFloat({ min: 0 }).withMessage('Lance mínimo deve ser positivo'),
  body('state')
    .trim()
    .notEmpty().withMessage('Estado é obrigatório')
    .isLength({ min: 2, max: 2 }).withMessage('Estado deve ter 2 caracteres'),
  body('city')
    .trim()
    .notEmpty().withMessage('Cidade é obrigatória')
    .isLength({ min: 2, max: 100 }).withMessage('Cidade inválida'),
  body('externalUrl')
    .optional()
    .isURL().withMessage('URL externa inválida'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateLead,
  validatePropertySearch,
  validatePropertyId,
  validateProfileUpdate,
  validateProperty
};
