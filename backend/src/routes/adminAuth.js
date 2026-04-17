const router = require('express').Router();
const { body } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── POST /api/admin/change-password ──────────────────────────
router.post(
  '/change-password',
  requireAuth,
  requireAdmin,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be 8–128 characters.'),
  ]),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (currentPassword !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: 'Current password is incorrect.' });

      // In production: update ADMIN_PASSWORD in your env vars + redeploy
      res.json({
        success: true,
        message:
          'Password verified. Update ADMIN_PASSWORD in your Render environment ' +
          'variables and redeploy to make the change permanent.',
      });
    } catch (err) {
      console.error('admin change-password error:', err);
      res.status(500).json({ error: 'Could not process request.' });
    }
  }
);

module.exports = router;
