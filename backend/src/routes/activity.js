const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// ── GET /api/activity/my  — learner's own history ────────────
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, action, meta, created_at, books ( title, emoji )')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ activity: data });
  } catch (err) {
    console.error('activity/my error:', err);
    res.status(500).json({ error: 'Could not fetch activity.' });
  }
});

module.exports = router;
