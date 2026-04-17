const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const PAGE_SIZE = 24;

// ── GET /api/books ────────────────────────────────────────────
// Query params: ?page=1 &search=algebra &subject=Mathematics
router.get('/', requireAuth, async (req, res) => {
  try {
    const category = req.user.role === 'admin'
      ? (req.query.category || null)
      : req.user.category;

    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const search  = (req.query.search  || '').trim();
    const subject = (req.query.subject || '').trim();
    const from    = (page - 1) * PAGE_SIZE;
    const to      = from + PAGE_SIZE - 1;

    let query = supabase
      .from('books')
      .select('id,title,author,subject,category,description,emoji,cover_color,file_path,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category);
    if (subject)  query = query.eq('subject',  subject);
    if (search)   query = query.or(
      `title.ilike.%${search}%,author.ilike.%${search}%,subject.ilike.%${search}%`
    );

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ books: data, total: count, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(count / PAGE_SIZE) });
  } catch (err) {
    console.error('fetch books error:', err);
    res.status(500).json({ error: 'Could not fetch books.' });
  }
});

// ── GET /api/books/subjects ───────────────────────────────────
router.get('/subjects', requireAuth, async (req, res) => {
  try {
    const category = req.user.role === 'admin'
      ? (req.query.category || null)
      : req.user.category;

    let query = supabase.from('books').select('subject');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    const subjects = [...new Set(data.map(b => b.subject))].sort();
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch subjects.' });
  }
});

// ── GET /api/books/:id/read  — log + return signed URL ───────
router.get('/:id/read', requireAuth, async (req, res) => {
  try {
    const { data: book, error } = await supabase
      .from('books').select('*').eq('id', req.params.id).single();

    if (error || !book) return res.status(404).json({ error: 'Book not found.' });

    if (req.user.role !== 'admin' && book.category !== req.user.category)
      return res.status(403).json({ error: 'This book is outside your library category.' });

    // Guard against seed/sample books with no real file uploaded yet
    if (!book.file_path || book.file_path === 'sample/placeholder.pdf') {
      return res.status(422).json({
        error: 'No file attached to this book yet. Ask your admin to upload the PDF.',
      });
    }
    const { data: signed, error: signErr } = await supabase
      .storage.from('ebooks').createSignedUrl(book.file_path, 3600);

    if (signErr) throw signErr;

    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      action:  'book_open',
      book_id: book.id,
      meta:    { title: book.title },
    });

    res.json({ signedUrl: signed.signedUrl, book });
  } catch (err) {
    console.error('read book error:', err);
    res.status(500).json({ error: 'Could not open book.' });
  }
});

module.exports = router;
