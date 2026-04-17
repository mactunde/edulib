const { body, validationResult } = require('express-validator');

/**
 * validate(rules) — run express-validator rules then short-circuit with 422 on failure.
 * Usage: router.post('/path', validate([body('email').isEmail()]), handler)
 */
function validate(rules) {
  return async (req, res, next) => {
    for (const rule of rules) await rule.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: errors.array()[0].msg,
        fields: errors.array().map(e => ({ field: e.path, msg: e.msg })),
      });
    }
    next();
  };
}

// ── Reusable rule sets ────────────────────────────────────────
const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required.')
    .isLength({ max: 100 }).withMessage('First name too long.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.')
    .isLength({ max: 100 }).withMessage('Last name too long.'),
  body('dob').isDate().withMessage('A valid date of birth is required.'),
  body('className').trim().notEmpty().withMessage('Class / form is required.'),
  body('school').trim().notEmpty().withMessage('School name is required.'),
  body('username')
    .trim().notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 40 }).withMessage('Username must be 3–40 characters.')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username may only contain letters, numbers, _ . -'),
  body('password')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters.'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const bookUploadRules = [
  body('title').trim().notEmpty().withMessage('Title is required.')
    .isLength({ max: 300 }).withMessage('Title too long.'),
  body('author').trim().notEmpty().withMessage('Author is required.'),
  body('subject').trim().notEmpty().withMessage('Subject is required.'),
  body('category').isIn(['primary', 'secondary', 'tertiary'])
    .withMessage('Category must be primary, secondary, or tertiary.'),
];

module.exports = { validate, registerRules, loginRules, bookUploadRules };
