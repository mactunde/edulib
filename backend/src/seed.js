/**
 * seed.js — Run once to populate the database with sample books.
 * Usage: node src/seed.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
require('dotenv').config();
const supabase = require('./lib/supabase');

const SAMPLE_BOOKS = [
  // ── Primary ──────────────────────────────────────────────
  { title: 'Adventures in Arithmetic',   author: 'J. Osei',       subject: 'Mathematics', category: 'primary',   description: 'Fun number adventures for young learners.',               emoji: '📐', cover_color: '#fff3e8', file_path: 'sample/placeholder.pdf' },
  { title: 'My First Science Book',      author: 'A. Mensah',     subject: 'Science',     category: 'primary',   description: 'Discover the wonders of nature around you.',              emoji: '🔬', cover_color: '#e8f4fd', file_path: 'sample/placeholder.pdf' },
  { title: 'Story Time: African Tales',  author: 'K. Asante',     subject: 'Literature',  category: 'primary',   description: 'Beloved folktales from across the continent.',            emoji: '📖', cover_color: '#fef9e7', file_path: 'sample/placeholder.pdf' },
  { title: 'Colours & Shapes',           author: 'B. Owusu',      subject: 'Art',         category: 'primary',   description: 'Creative exploration of colours and forms.',              emoji: '🎨', cover_color: '#f0e6ff', file_path: 'sample/placeholder.pdf' },
  { title: 'Our Earth',                  author: 'N. Boateng',    subject: 'Geography',   category: 'primary',   description: 'Learning about our amazing planet.',                      emoji: '🌍', cover_color: '#e8fdf0', file_path: 'sample/placeholder.pdf' },
  // ── Secondary ────────────────────────────────────────────
  { title: 'Algebra Essentials',         author: 'P. Darko',      subject: 'Mathematics', category: 'secondary', description: 'Master the foundations of algebra.',                      emoji: '📊', cover_color: '#e8f8f5', file_path: 'sample/placeholder.pdf' },
  { title: 'Human Biology',             author: 'E. Nkrumah',    subject: 'Biology',     category: 'secondary', description: 'Explore the incredible human body.',                      emoji: '🧬', cover_color: '#fde8e8', file_path: 'sample/placeholder.pdf' },
  { title: 'World History',             author: 'S. Acheampong', subject: 'History',     category: 'secondary', description: 'Key events that shaped civilizations.',                  emoji: '🏛️', cover_color: '#fef9e7', file_path: 'sample/placeholder.pdf' },
  { title: 'English Grammar',           author: 'G. Amponsah',   subject: 'English',     category: 'secondary', description: 'Sharpen your writing and communication skills.',          emoji: '✍️', cover_color: '#f0f4ff', file_path: 'sample/placeholder.pdf' },
  { title: 'Chemistry in Action',       author: 'R. Frimpong',   subject: 'Chemistry',   category: 'secondary', description: 'Reactions, elements and experiments explained.',          emoji: '⚗️', cover_color: '#fff3e8', file_path: 'sample/placeholder.pdf' },
  // ── Tertiary ─────────────────────────────────────────────
  { title: 'Calculus & Analysis',       author: 'D. Appiah',     subject: 'Mathematics', category: 'tertiary',  description: 'Advanced calculus for university students.',              emoji: '📈', cover_color: '#f5e8ff', file_path: 'sample/placeholder.pdf' },
  { title: 'Introduction to Economics', author: 'O. Asiedu',     subject: 'Economics',   category: 'tertiary',  description: 'Micro and macroeconomic principles explained.',           emoji: '💹', cover_color: '#e8fdf0', file_path: 'sample/placeholder.pdf' },
  { title: 'Organic Chemistry',         author: 'C. Owusu',      subject: 'Chemistry',   category: 'tertiary',  description: 'Comprehensive organic chemistry guide.',                  emoji: '🧪', cover_color: '#fde8f5', file_path: 'sample/placeholder.pdf' },
  { title: 'African Literature',        author: 'B. Attah',      subject: 'Literature',  category: 'tertiary',  description: 'Classic and contemporary African literary works.',        emoji: '📚', cover_color: '#fef9e7', file_path: 'sample/placeholder.pdf' },
  { title: 'Computer Science Fundamentals', author: 'F. Mensah', subject: 'ICT',         category: 'tertiary',  description: 'Programming, data structures and algorithms.',            emoji: '💻', cover_color: '#e8f4fd', file_path: 'sample/placeholder.pdf' },
];

async function seed() {
  console.log('🌱 Seeding EduLib database...\n');

  // Check if books already exist
  const { count } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true });

  if (count > 0) {
    console.log(`⚠️  Database already has ${count} books. Skipping seed.`);
    console.log('   To re-seed, delete all books first in the Supabase dashboard.\n');
    process.exit(0);
  }

  const { data, error } = await supabase
    .from('books')
    .insert(SAMPLE_BOOKS.map(b => ({ ...b, uploaded_by_admin: true })))
    .select('id, title, category');

  if (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${data.length} books:\n`);
  const cats = { primary: [], secondary: [], tertiary: [] };
  data.forEach(b => cats[b.category].push(b.title));
  Object.entries(cats).forEach(([cat, titles]) => {
    console.log(`  🏷  ${cat.toUpperCase()} (${titles.length})`);
    titles.forEach(t => console.log(`      • ${t}`));
  });

  console.log('\n✅ Seed complete! Start your server and log in as admin.\n');
  console.log('⚠️  Note: sample books have a placeholder file_path.');
  console.log('   Upload real PDF files via the Admin → Upload Book panel.\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
