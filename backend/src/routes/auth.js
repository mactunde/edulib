const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validate');

// ── Helper: calculate age category from DOB ──────────────────
function getCategory(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age >= 5 && age <= 11) return 'primary';
  if (age >= 12 && age <= 16) return 'secondary';
  if (age >= 17) return 'tertiary';
  return null;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, category: user.category },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', validate(registerRules), async (req, res) => {
  try {
    const { firstName, lastName, dob, className, school, username, password } = req.body;

    // Validation
    if (!firstName || !lastName || !dob || !className || !school || !username || !password)
      return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const category = getCategory(dob);
    if (!category)
      return res.status(400).json({ error: 'Learner must be at least 5 years old.' });

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .single();
    if (existing) return res.status(409).json({ error: 'Username already taken.' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        class_name: className,
        school_name: school,
        username: username.toLowerCase(),
        password_hash: passwordHash,
        category,
        role: 'learner',
      })
      .select('id, first_name, last_name, username, category, role, school_name, class_name')
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'signup',
      meta: { school, className },
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', validate(loginRules), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required.' });

    // Admin shortcut (credentials from env)
    if (
      username.toLowerCase() === process.env.ADMIN_USERNAME?.toLowerCase() &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const adminUser = { id: 0, username: 'admin', role: 'admin', category: null };
      return res.json({ token: signToken(adminUser), user: adminUser });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid username or password.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password.' });

    // Recalculate category from DOB (it may change over time)
    const currentCategory = getCategory(user.date_of_birth);
    if (currentCategory && currentCategory !== user.category) {
      await supabase.from('users').update({ category: currentCategory }).eq('id', user.id);
      user.category = currentCategory;
    }

    await supabase.from('activity_log').insert({ user_id: user.id, action: 'login' });

    const safeUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      category: user.category,
      role: user.role,
      school: user.school_name,
      className: user.class_name,
    };

    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  // Admin is not stored in the DB — return synthetic user from token
  if (req.user.role === 'admin') {
    return res.json({ user: { id: 0, username: req.user.username, role: 'admin', category: null } });
  }
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, username, category, role, school_name, class_name, created_at')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(404).json({ error: 'User not found.' });
  // Normalize to camelCase — same shape as login response
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
      createdAt: data.created_at,
    },
  });
});

module.exports = router;
