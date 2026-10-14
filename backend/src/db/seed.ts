import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const sampleBooks = [
  {
    title: 'Noli Me Tangere',
    author: 'Jose Rizal',
    description:
      '"Noli Me Tangere" is a novel that exposed the social ills and colonial oppression of the Philippines during Spanish rule. It follows Crisostomo Ibarra as he returns home after seven years of study in Europe.',
    price: 250,
    category: 'Fiction',
    pages: 320,
    publisher: 'Anvil Press',
    published_year: 1887,
    rating: 4.8,
    reviews: 1234,
    is_featured: true,
    is_popular: true,
    is_new: false,
  },
  {
    title: 'El Filibusterismo',
    author: 'Jose Rizal',
    description:
      'The sequel to Noli Me Tangere, this novel continues the story of Crisostomo Ibarra, now disguised as the wealthy jeweler Simoun, plotting revolution against the Spanish colonial government.',
    price: 250,
    category: 'Fiction',
    pages: 380,
    publisher: 'Anvil Press',
    published_year: 1891,
    rating: 4.7,
    reviews: 987,
    is_featured: true,
    is_popular: true,
    is_new: false,
  },
  {
    title: 'The Woman Who Had Two Navels',
    author: 'Nick Joaquin',
    description:
      'A masterpiece of Philippine literature that explores themes of identity, colonialism, and the Filipino psyche through the story of a woman searching for her true self.',
    price: 350,
    category: 'Literary Fiction',
    pages: 256,
    publisher: 'Vera-Reyes',
    published_year: 1961,
    rating: 4.5,
    reviews: 654,
    is_featured: true,
    is_popular: false,
    is_new: true,
  },
  {
    title: 'Smaller and Smaller Circles',
    author: 'F.H. Batacan',
    description:
      'A gripping crime novel following two Jesuit priests as they investigate a series of murders in the slums of Manila, uncovering dark secrets along the way.',
    price: 299,
    category: 'Crime Fiction',
    pages: 288,
    publisher: 'UP Press',
    published_year: 2002,
    rating: 4.6,
    reviews: 789,
    is_featured: true,
    is_popular: true,
    is_new: false,
  },
  {
    title: 'Po-on',
    author: 'F. Sionil Jose',
    description:
      'The first novel in the Rosales Saga, tracing the journey of a family from Ilocos during the Philippine-American War as they seek a new life in the town of Rosales.',
    price: 320,
    category: 'Historical Fiction',
    pages: 352,
    publisher: 'Solidaridad',
    published_year: 1984,
    rating: 4.4,
    reviews: 543,
    is_featured: false,
    is_popular: true,
    is_new: false,
  },
  {
    title: "Dekada '70",
    author: 'Lualhati Bautista',
    description:
      'A powerful novel set during the Marcos era, following a middle-class family as they navigate the turbulent political landscape of the 1970s in the Philippines.',
    price: 280,
    category: 'Political Fiction',
    pages: 320,
    publisher: 'Anvil Press',
    published_year: 1983,
    rating: 4.5,
    reviews: 876,
    is_featured: false,
    is_popular: true,
    is_new: false,
  },
  {
    title: 'Gapô',
    author: 'Lualhati Bautista',
    description:
      'A powerful novel set in Olongapo City during the American colonial period, exploring themes of identity, love, and the Filipino-American relationship.',
    price: 280,
    category: 'Historical Fiction',
    pages: 240,
    publisher: 'Anvil Press',
    published_year: 1988,
    rating: 4.3,
    reviews: 432,
    is_featured: false,
    is_popular: false,
    is_new: true,
  },
  {
    title: 'America Is in the Heart',
    author: 'Carlos Bulosan',
    description:
      "A classic Filipino American autobiography that tells the story of a young man's journey from the Philippines to America, capturing the struggles of immigrant life.",
    price: 380,
    category: 'Autobiography',
    pages: 368,
    publisher: 'UW Press',
    published_year: 1946,
    rating: 4.3,
    reviews: 432,
    is_featured: false,
    is_popular: false,
    is_new: true,
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log('🌱 Seeding books...\n');

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const existing = await client.query('SELECT COUNT(*) FROM books');
    const count = parseInt(existing.rows[0].count, 10);

    if (count > 0) {
      console.log(`⚠️  Books table already has ${count} rows.`);
      console.log('   Deleting and re-inserting...\n');
      await client.query('DELETE FROM books');
    }

    for (const book of sampleBooks) {
      await client.query(
        `INSERT INTO books (
          title, author, description, price,
          category, pages, publisher, published_year,
          rating, reviews, stock, is_digital,
          is_featured, is_popular, is_new
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 999, TRUE, $11, $12, $13)`,
        [
          book.title,
          book.author,
          book.description,
          book.price,
          book.category,
          book.pages,
          book.publisher,
          book.published_year,
          book.rating,
          book.reviews,
          book.is_featured,
          book.is_popular,
          book.is_new,
        ]
      );
      console.log(`✅ Inserted: ${book.title}`);
    }

    console.log(`\n🎉 Seeded ${sampleBooks.length} books!`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  process.exit(0);
}

seed();