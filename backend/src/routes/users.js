const router = require('express').Router();
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 6, max: 128 }).withMessage('New password must be 6–128 characters.'),
];

// ── POST /api/users/change-password ──────────────────────────
router.post('/change-password', requireAuth, validate(changePasswordRules), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'password_change',
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('change-password error:', err);
    res.status(500).json({ error: 'Could not update password.' });
  }
});

// ── GET /api/users/profile ────────────────────────────────────
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, category, role, school_name, class_name, date_of_birth, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({
      user: {
        id:        data.id,
        firstName: data.first_name,
        lastName:  data.last_name,
        username:  data.username,
        category:  data.category,
        role:      data.role,
        school:    data.school_name,
        className: data.class_name,
        dob:       data.date_of_birth,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error('profile GET error:', err);
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

// ── PATCH /api/users/profile ──────────────────────────────────
router.patch('/profile', requireAuth,
  validate([
    body('className').optional().trim().notEmpty().withMessage('Class cannot be empty.'),
    body('school').optional().trim().notEmpty().withMessage('School cannot be empty.'),
  ]),
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.className) updates.class_name  = req.body.className;
      if (req.body.school)    updates.school_name = req.body.school;
      if (!Object.keys(updates).length)
        return res.status(400).json({ error: 'Nothing to update.' });

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.id)
        .select('id, first_name, last_name, username, category, school_name, class_name')
        .single();

      if (error) throw error;
      res.json({
        user: {
          id:        data.id,
          firstName: data.first_name,
          lastName:  data.last_name,
          username:  data.username,
          category:  data.category,
          school:    data.school_name,
          className: data.class_name,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Could not update profile.' });
    }
  }
);

module.exports = router;
