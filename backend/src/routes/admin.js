const router  = require('express').Router();
const multer  = require('multer');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate, bookUploadRules } = require('../middleware/validate');
// Multer — store file in memory, then stream to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/epub+zip'];
    // Some browsers send PDF with a different mimetype
    const allowedExt = ['pdf', 'epub'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and EPUB files are allowed.'));
    }
  },
});

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: totalBooks },
      { count: totalUsers },
      { count: primaryBooks },
      { count: secondaryBooks },
      { count: tertiaryBooks },
      { count: totalActivity },
    ] = await Promise.all([
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }).eq('category', 'primary'),
      supabase.from('books').select('*', { count: 'exact', head: true }).eq('category', 'secondary'),
      supabase.from('books').select('*', { count: 'exact', head: true }).eq('category', 'tertiary'),
      supabase.from('activity_log').select('*', { count: 'exact', head: true }),
    ]);

    res.json({ totalBooks, totalUsers, primaryBooks, secondaryBooks, tertiaryBooks, totalActivity });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
});

// ── GET /api/admin/books ──────────────────────────────────────
router.get('/books', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ books: data });
  } catch (err) {
    console.error('admin list books error:', err);
    res.status(500).json({ error: 'Could not fetch books.' });
  }
});

// ── POST /api/admin/books  (multipart upload) ─────────────────
router.post('/books', upload.single('file'), validate(bookUploadRules), async (req, res) => {
  try {
    const { title, author, subject, category, description, emoji } = req.body;
    if (!title || !author || !subject || !category)
      return res.status(400).json({ error: 'Title, author, subject and category are required.' });
    if (!req.file)
      return res.status(400).json({ error: 'A PDF or EPUB file is required.' });

    // Upload file to Supabase Storage bucket "ebooks"
    const ext = req.file.originalname.split('.').pop();
    const filePath = `${category}/${uuidv4()}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from('ebooks')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (storageErr) {
      console.error('Supabase storage error:', storageErr);
      return res.status(500).json({ error: `Storage error: ${storageErr.message}` });
    }

    // Get public URL (only for public bucket) — we use signed URLs for private bucket
    const coverColors = { primary: '#fff3e8', secondary: '#e8f8f5', tertiary: '#f0e6ff' };

    const { data: book, error: dbErr } = await supabase
      .from('books')
      .insert({
        title,
        author,
        subject,
        category,
        description: description || '',
        emoji: emoji || '📗',
        cover_color: coverColors[category] || '#f0f0f0',
        file_path: filePath,
        uploaded_by_admin: true,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    await supabase.from('activity_log').insert({
      action: 'book_upload',
      meta: { title, category },
    });

    res.status(201).json({ book });
  } catch (err) {
    console.error('upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed.' });
  }
});

// ── DELETE /api/admin/books/:id ───────────────────────────────
router.delete('/books/:id', async (req, res) => {
  try {
    const { data: book } = await supabase
      .from('books').select('file_path').eq('id', req.params.id).single();

    if (book?.file_path) {
      await supabase.storage.from('ebooks').remove([book.file_path]);
    }

    const { error } = await supabase.from('books').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete book.' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, category, school_name, class_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: data });
  } catch (err) {
    console.error('admin list users error:', err);
    res.status(500).json({ error: 'Could not fetch users.' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('admin delete user error:', err);
    res.status(500).json({ error: 'Could not remove user.' });
  }
});

// ── GET /api/admin/activity ───────────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        id, action, meta, created_at,
        users ( first_name, last_name, username, category ),
        books ( title )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ activity: data });
  } catch (err) {
    console.error('admin activity error:', err);
    res.status(500).json({ error: 'Could not fetch activity.' });
  }
});

// ── PATCH /api/admin/books/:id  (edit book metadata) ─────────
router.patch('/books/:id',
  validate([
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.')
      .isLength({ max: 300 }).withMessage('Title too long.'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty.'),
    body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty.'),
    body('category').optional().isIn(['primary','secondary','tertiary'])
      .withMessage('Category must be primary, secondary, or tertiary.'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description too long.'),
  ]),
  async (req, res) => {
    try {
      const allowed = ['title','author','subject','category','description','emoji','cover_color'];
      const updates = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
      if (!Object.keys(updates).length)
        return res.status(400).json({ error: 'No valid fields to update.' });

      const { data, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!data)  return res.status(404).json({ error: 'Book not found.' });

      await supabase.from('activity_log').insert({
        action: 'book_edit',
        meta:   { id: req.params.id, fields: Object.keys(updates) },
      });

      res.json({ book: data });
    } catch (err) {
      console.error('edit book error:', err);
      res.status(500).json({ error: 'Could not update book.' });
    }
  }
);

// ── GET /api/admin/export/users  (CSV download) ───────────────
router.get('/export/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, username, category, school_name, class_name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const header = 'First Name,Last Name,Username,Category,School,Class,Joined\n';
    const rows = data.map(u =>
      [u.first_name, u.last_name, u.username, u.category,
       `"${(u.school_name||'').replace(/"/g,'""')}"`,
       `"${(u.class_name||'').replace(/"/g,'""')}"`,
       new Date(u.created_at).toLocaleDateString('en-GB')
      ].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="edulib-users.csv"');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not export users.' });
  }
});

// ── GET /api/admin/export/activity  (CSV download) ────────────
router.get('/export/activity', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`action, meta, created_at, users ( first_name, last_name, username ), books ( title )`)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) throw error;

    const ACTION_LABELS = {
      login: 'Login', signup: 'Sign Up', book_open: 'Read Book',
      book_upload: 'Upload', book_edit: 'Edit Book', password_change: 'Password Change',
    };

    const header = 'User,Username,Action,Book,Date\n';
    const rows = data.map(a => {
      const name = a.users ? `${a.users.first_name} ${a.users.last_name}` : 'Admin';
      const uname = a.users?.username || 'admin';
      const action = ACTION_LABELS[a.action] || a.action;
      const book = a.books?.title || '';
      const date = new Date(a.created_at).toLocaleString('en-GB');
      return [`"${name}"`, uname, action, `"${book.replace(/"/g,'""')}"`, `"${date}"`].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="edulib-activity.csv"');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not export activity.' });
  }
});

module.exports = router;
