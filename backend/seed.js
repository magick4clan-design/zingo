const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Genres
  const genreData = [
    { name: 'اکشن', slug: 'action' },
    { name: 'کمدی', slug: 'comedy' },
    { name: 'درام', slug: 'drama' },
    { name: 'ترسناک', slug: 'horror' },
    { name: 'علمی-تخیلی', slug: 'sci-fi' },
    { name: 'عاشقانه', slug: 'romance' },
    { name: 'انیمه', slug: 'anime' },
    { name: 'جنایی', slug: 'crime' },
    { name: 'ماجراجویی', slug: 'adventure' },
    { name: 'هیجانی', slug: 'thriller' },
    { name: '奇幻', slug: 'fantasy' },
    { name: 'جنگی', slug: 'war' },
    { name: 'تاریخی', slug: 'historical' },
    { name: 'مستند', slug: 'documentary' },
    { name: 'خانوادگی', slug: 'family' },
    { name: '-animation', slug: 'animation' },
    { name: 'رازآلود', slug: 'mystery' },
    { name: 'ورزشی', slug: 'sports' },
  ];

  const genres = {};
  for (const g of genreData) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
    genres[g.slug] = genre;
  }
  console.log(`Created ${Object.keys(genres).length} genres`);

  // Movies
  const moviesData = [
    {
      title: 'دزدان دریایی کارائیب',
      slug: 'pirates-of-the-c Caribbean',
      originalTitle: 'Pirates of the Caribbean',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGYxZjFjMzMtNGhhNi00NzI2LTllOTMtOWY5MmZiZjYzNjBhXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200',
      description: 'جک اسپارو، دزد دریایی عجیب و غریب، ماجراهای خود را در دریای کارائیب آغاز می‌کند. او به دنبال گنج افسانه‌ای است و در این راه با دوستان و دشمنانی روبرو می‌شود.',
      releaseYear: 2003,
      duration: 143,
      imdbRating: 8.0,
      quality: '1080p BluRay',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'گور وربینسکی',
      cast: JSON.stringify(['جانی دپ', 'اورلندو بلوم', 'کیرا نایتلی']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      ]),
      trailerUrl: 'https://www.youtube.com/watch?v=naQr0HUTr5o',
      downloadLinks: JSON.stringify({
        '1080p BluRay': 'https://example.com/download/pirates-1080p',
        '720p': 'https://example.com/download/pirates-720p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/pirates',
      views: 15420,
      genreSlugs: ['action', 'adventure', 'comedy'],
    },
    {
      title: 'تلقین',
      slug: 'inception',
      originalTitle: 'Inception',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
      description: 'دومینیک کاب یک دزد حرفه‌ای اسرار است که توانایی نفوذ به رویاهای دیگران را دارد. او ماموریت می‌یابد که به جای دزدی، یک ایده را در ذهن کسی قرار دهد.',
      releaseYear: 2010,
      duration: 148,
      imdbRating: 8.8,
      quality: '2160p WEB-DL',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'کریستوفر نولان',
      cast: JSON.stringify(['لئوناردو دی‌کاپریو', 'توم هاردی', 'الی엇 پیج']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      ]),
      trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      downloadLinks: JSON.stringify({
        '2160p WEB-DL': 'https://example.com/download/inception-4k',
        '1080p': 'https://example.com/download/inception-1080p',
        '720p': 'https://example.com/download/inception-720p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/inception',
      views: 23100,
      genreSlugs: ['sci-fi', 'action', 'thriller'],
    },
    {
      title: 'شروع',
      slug: 'the-beginning',
      originalTitle: 'The Beginning',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BNjM1ZDQxYWUtMzQyZS00MTE1LWJmZGYtNGUyNTdlYjM3ZmVmXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
      description: 'یک ماجراجویی حماسی در دنیایی خیالی که قهرمان داستان باید با چالش‌های بزرگی روبرو شود و سرنوشت جهان را تغییر دهد.',
      releaseYear: 2023,
      duration: 155,
      imdbRating: 7.5,
      quality: '1080p BluRay',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'جیمز کامرون',
      cast: JSON.stringify(['تام هنکس', 'اسکارلت جوهانسون', 'مت دیمون']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      ]),
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      downloadLinks: JSON.stringify({
        '1080p BluRay': 'https://example.com/download/beginning-1080p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/beginning',
      views: 8750,
      genreSlugs: ['adventure', 'sci-fi'],
    },
    {
      title: 'شیرشاه',
      slug: 'the-lion-king',
      originalTitle: 'The Lion King',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BYTYxNGMyZTYtMjE3MS00MzNjLWFjNmYtMDk3NGYwZDZmNjZlXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200',
      description: 'سیمبا، شیر جوان، پس از مرگ پدرش باید برای بازپس‌گیری تاج و تخت خود با عموی شیطان صفت خود بجنگد.',
      releaseYear: 1994,
      duration: 88,
      imdbRating: 8.5,
      quality: '1080p BluRay',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'راجر آلرز',
      cast: JSON.stringify(['جیمز ارل جونز', 'متیو برودریک', 'جرمی آیرونز']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '1080p BluRay': 'https://example.com/download/lionking-1080p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/lionking',
      views: 19200,
      genreSlugs: ['animation', 'family', 'drama'],
    },
    {
      title: 'اینترنت اشیا',
      slug: 'iot-the-movie',
      originalTitle: 'IoT: The Movie',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjMxMDE0NzMxN15BMl5BanBnXkFtZTgwMDk2NDU5MTE@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200',
      description: 'در آینده‌ای نزدیک، فناوری اینترنت اشیا زندگی بشر را دگرگون می‌کند اما هکرها تهدیدی بزرگ برای امنیت سایبری محسوب می‌شوند.',
      releaseYear: 2024,
      duration: 120,
      imdbRating: 6.8,
      quality: '2160p WEB-DL',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'جورج میلر',
      cast: JSON.stringify(['کیانو ریوز', 'کریستین ویگ']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '2160p WEB-DL': 'https://example.com/download/iot-4k',
        '1080p': 'https://example.com/download/iot-1080p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/iot',
      views: 5400,
      genreSlugs: ['sci-fi', 'thriller'],
    },
    {
      title: 'بازی تاج و تخت',
      slug: 'game-of-thrones-movie',
      originalTitle: 'Game of Thrones',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWg4NjQtMjkwM2ZlMjM2MDFhXkEyXkFqcGdeQXVyMTAzMDg4NzU0._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
      description: 'نبرد بر سر تخت آهنی در سرزمین وستروس. خاندان‌های مختلف برای تصاحب تاج و تخت با هم می‌جنگند.',
      releaseYear: 2011,
      duration: 60,
      imdbRating: 9.2,
      quality: '1080p BluRay',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'دیوید بنیاف',
      cast: JSON.stringify(['کیت هرینگتون', 'امیلیا کلارک', 'پیتر دینکلیج']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '1080p BluRay': 'https://example.com/download/got-1080p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/got',
      views: 45000,
      genreSlugs: ['fantasy', 'drama', 'action'],
    },
    {
      title: 'شکست‌ناپذیر',
      slug: 'unbreakable',
      originalTitle: 'Unbreakable',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BOTA5NDZlZGUtMjAxOS00YTRhLThmMGUtYjMzYjMzN2MxZDRlXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
      description: 'مردی پس از یک سانحه قطار که به طرز معجزه‌آسایی از آن جان سالم به در می‌برد، متوجه قدرت‌های فوق‌العاده خود می‌شود.',
      releaseYear: 2000,
      duration: 106,
      imdbRating: 7.3,
      quality: '1080p',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'ام. نایت شامالان',
      cast: JSON.stringify(['بروس ویلیس', 'سموئل ال. جکسون']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '1080p': 'https://example.com/download/unbreakable-1080p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/unbreakable',
      views: 11200,
      genreSlugs: ['thriller', 'sci-fi'],
    },
    {
      title: 'الماس خونین',
      slug: 'blood-diamond',
      originalTitle: 'Blood Diamond',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTYwNTM5NTE5NF5BMl5BanBnXkFtZTcwNTk4MDk0Mw@@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
      description: 'در زمان جنگ داخلی سیرالئون، یک ماهیگیر و یک قاچاقچی الماس باید با هم همکاری کنند تا خانواده ماهیگیر را نجات دهند.',
      releaseYear: 2006,
      duration: 143,
      imdbRating: 8.0,
      quality: '1080p BluRay',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'ادوارد زوئیک',
      cast: JSON.stringify(['لئوناردو دی‌کاپریو', 'جیمی فاکس', 'جنوئیوو ویلسون']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '1080p BluRay': 'https://example.com/download/blooddiamond-1080p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/blooddiamond',
      views: 9800,
      genreSlugs: ['drama', 'thriller'],
    },
    {
      title: 'قلهور',
      slug: 'clove-or',
      originalTitle: 'Clove or',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTYwNTM5NTE5NF5BMl5BanBnXkFtZTcwNTk4MDk0Mw@@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
      description: 'ماجراجویی در دل طبیعت ایران با داستانی جذاب و هیجان‌انگیز.',
      releaseYear: 2023,
      duration: 110,
      imdbRating: 6.5,
      quality: '720p WEBRip',
      country: 'ایران',
      language: 'فارسی',
      director: 'پوریا حیدری',
      cast: JSON.stringify(['پیمان معادی', 'هادی حجازی‌فر']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '720p WEBRip': 'https://example.com/download/clove-720p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/clove',
      views: 3200,
      genreSlugs: ['drama', 'adventure'],
    },
    {
      title: 'مرد عنکبوتی',
      slug: 'spider-man',
      originalTitle: 'Spider-Man',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BZGMzYmRjODctODRhYy00OGY1LWI0MGYtOWRjMDQ0MzFkYjRhXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=1200',
      description: 'پیتر پارکر، دانش‌آموز دبیرستانی، پس از گزیده شدن توسط عنکبوتی genetically modified، قدرت‌های فوق‌العاده‌ای پیدا می‌کند.',
      releaseYear: 2002,
      duration: 121,
      imdbRating: 7.4,
      quality: '1080p BluRay',
      country: 'آمریکا',
      language: 'انگلیسی',
      director: 'سم ریمی',
      cast: JSON.stringify(['توبی مگوایر', 'کریستین دانست', 'ویلم دفو']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=800',
      ]),
      downloadLinks: JSON.stringify({
        '1080p BluRay': 'https://example.com/download/spiderman-1080p',
        '720p': 'https://example.com/download/spiderman-720p',
      }),
      source: 'seed',
      sourceUrl: 'https://example.com/spiderman',
      views: 28500,
      genreSlugs: ['action', 'sci-fi'],
    },
  ];

  let movieCount = 0;
  for (const m of moviesData) {
    const { genreSlugs, ...movieFields } = m;
    const movie = await prisma.movie.upsert({
      where: { slug: movieFields.slug },
      update: movieFields,
      create: movieFields,
    });

    // Connect genres
    for (const slug of genreSlugs) {
      if (genres[slug]) {
        await prisma.movieGenre.upsert({
          where: { movieId_genreId: { movieId: movie.id, genreId: genres[slug].id } },
          update: {},
          create: { movieId: movie.id, genreId: genres[slug].id },
        }).catch(() => {});
      }
    }
    movieCount++;
  }
  console.log(`Created ${movieCount} movies`);

  // Series
  const seriesData = [
    {
      title: 'آخرین ما',
      slug: 'the-last-of-us',
      originalTitle: 'The Last of Us',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BZiM0ZGMyZDQtMDdmZi00YThiLWIyZjAtMTZhNDY0NjM1M2JhXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200',
      description: 'در دنیایی پساآخرالزمانی، جول و الی باید از طریق آمریکا سفر کنند. رابطه بین این دو در طول سفر عمیق‌تر می‌شود.',
      releaseYear: 2023,
      imdbRating: 8.8,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'HBO',
      cast: JSON.stringify(['پدرو پاسکال', 'بل رمزی']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/tlou',
      views: 52000,
      genreSlugs: ['drama', 'sci-fi', 'thriller'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'زمانی که گم شدی' },
            { episodeNumber: 2, title: 'چشم‌های من را ببند' },
            { episodeNumber: 3, title: 'اینکه هرگز تنها نیستی' },
            { episodeNumber: 4, title: 'کسی توی خیابان' },
            { episodeNumber: 5, title: 'سینه به سینه' },
            { episodeNumber: 6, title: 'جواهر' },
            { episodeNumber: 7, title: 'خاطرات' },
            { episodeNumber: 8, title: 'چیزهایی که زنده ماندیم' },
            { episodeNumber: 9, title: 'تحت فشار' },
            { episodeNumber: 10, title: 'پایان' },
          ],
        },
      ],
    },
    {
      title: 'وراثت',
      slug: 'succession',
      originalTitle: 'Succession',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BZmVjMjE0ZTItNjRhMy00OGY4LWE0MDItNmI1OTI4ZGEzYWIwXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      description: 'خانواده روی، مالک یک امپراتورia رسانه‌ای، بر سر تصاحب قدرت با هم می‌جنگند.',
      releaseYear: 2018,
      imdbRating: 8.9,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'HBO',
      cast: JSON.stringify(['برندن گلیسون', 'جرمی اLTRB', 'سارا اسنک']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/succession',
      views: 38000,
      genreSlugs: ['drama'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'شروع' },
            { episodeNumber: 2, title: 'آینده' },
            { episodeNumber: 3, title: 'بازی' },
            { episodeNumber: 4, title: 'پایان' },
          ],
        },
        {
          seasonNumber: 2,
          title: 'فصل دوم',
          episodes: [
            { episodeNumber: 1, title: 'بازگشت' },
            { episodeNumber: 2, title: 'جنگ' },
            { episodeNumber: 3, title: 'صلح' },
            { episodeNumber: 4, title: 'قهرمان' },
            { episodeNumber: 5, title: 'پایان' },
          ],
        },
      ],
    },
    {
      title: 'چرنوبیل',
      slug: 'chernobyl',
      originalTitle: 'Chernobyl',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BNTU0NDEtODM5MjktYjg1Ny00YzRjLWJlMjktMjIzNDlhZjI5NjE1XkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200',
      description: 'داستان واقعی فاجعه هسته‌ای چرنوبیل و تلاش مردم برای مقابله با پیامدهای آن.',
      releaseYear: 2019,
      imdbRating: 9.4,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'HBO',
      cast: JSON.stringify([' Jared Harris', ' Stellan Skarsgård']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/chernobyl',
      views: 67000,
      genreSlugs: ['drama', 'historical'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: '۱:۲۳ صبح' },
            { episodeNumber: 2, title: 'آرامش خیال' },
            { episodeNumber: 3, title: 'تاریخ دروغ می‌گوید' },
            { episodeNumber: 4, title: 'قیمت جان' },
            { episodeNumber: 5, title: 'پایان مبهم' },
          ],
        },
      ],
    },
    {
      title: 'چیره‌شدن',
      slug: 'the-crown',
      originalTitle: 'The Crown',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BZmAzMjM0NjMtNjY0MC00ODkxLWEwNzItYjRhNjM2YWIzMDIwXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200',
      description: 'داستان زندگی ملکه الیزابت دوم و تاج و تخت بریتانیا از سال ۱۹۴۷ تا امروز.',
      releaseYear: 2016,
      imdbRating: 8.7,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'Netflix',
      cast: JSON.stringify(['کلر فوی', 'مت اسمیت', 'اولیویا کلمن']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/crown',
      views: 41000,
      genreSlugs: ['drama', 'historical'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'wolferton splash' },
            { episodeNumber: 2, title: ' Hyde Park Corner' },
            { episodeNumber: 3, title: 'Windsor' },
            { episodeNumber: 4, title: 'Act of God' },
            { episodeNumber: 5, title: 'Smoke and Mirrors' },
            { episodeNumber: 6, title: 'Gelignite' },
            { episodeNumber: 7, title: 'Scientia Potentia Est' },
            { episodeNumber: 8, title: 'Pride & Joy' },
            { episodeNumber: 9, title: 'Ducks and Drakes' },
            { episodeNumber: 10, title: 'Gloriana' },
          ],
        },
      ],
    },
    {
      title: 'خانه پوشالی',
      slug: 'house-of-cards',
      originalTitle: 'House of Cards',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BNjI0Y2Y0M2QtODk2OS00MjdlLThlMDEtNmRiZjBiY2NhNjA0XkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200',
      description: 'فرانک آندروود، سیاستمداری زیرک و بی‌رحم، برای کسب قدرت از هیچ تلاشی دریغ نمی‌کند.',
      releaseYear: 2013,
      imdbRating: 8.7,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'Netflix',
      cast: JSON.stringify(['کوین اسپیسی', 'رابین رایت']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/hoc',
      views: 33000,
      genreSlugs: ['drama', 'thriller'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'Chapter 1' },
            { episodeNumber: 2, title: 'Chapter 2' },
            { episodeNumber: 3, title: 'Chapter 3' },
            { episodeNumber: 4, title: 'Chapter 4' },
            { episodeNumber: 5, title: 'Chapter 5' },
            { episodeNumber: 6, title: 'Chapter 6' },
            { episodeNumber: 7, title: 'Chapter 7' },
            { episodeNumber: 8, title: 'Chapter 8' },
            { episodeNumber: 9, title: 'Chapter 9' },
            { episodeNumber: 10, title: 'Chapter 10' },
            { episodeNumber: 11, title: 'Chapter 11' },
            { episodeNumber: 12, title: 'Chapter 12' },
            { episodeNumber: 13, title: 'Chapter 13' },
          ],
        },
      ],
    },
    {
      title: 'وایکینگ‌ها',
      slug: 'vikings',
      originalTitle: 'Vikings',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDk1NjQ0NDItMjY4My00Y2FlLWEyZjAtZTRkYjY0MjMxNTBhXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
      description: 'داستان رگنار لوثبروک، وایکینگ افسانه‌ای، و ماجراهای او در جهان ناشناخته.',
      releaseYear: 2013,
      imdbRating: 8.5,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'History',
      cast: JSON.stringify(['تریوور ریس', 'کاترین وینیک']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/vikings',
      views: 42000,
      genreSlugs: ['drama', 'action', 'historical'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'رگنار' },
            { episodeNumber: 2, title: 'برادر' },
            { episodeNumber: 3, title: 'گنج' },
            { episodeNumber: 4, title: 'نبرد' },
            { episodeNumber: 5, title: 'پادشاه' },
            { episodeNumber: 6, title: 'زمستان' },
            { episodeNumber: 7, title: 'بهار' },
            { episodeNumber: 8, title: 'پایان' },
          ],
        },
      ],
    },
    {
      title: 'والتر وایت',
      slug: 'breaking-bad',
      originalTitle: 'Breaking Bad',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BYTUwYTNmZjQtMjVmNC00ODlhLThiMGItYjk3Y2QyMjhhMmRkXkEyXkFqcGc@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=1200',
      description: 'والتر وایت، معلم شیمی مبتلا به سرطان، برای تامین آینده خانواده‌اش شروع به تولید متامفتامین می‌کند.',
      releaseYear: 2008,
      imdbRating: 9.5,
      country: 'آمریکا',
      language: 'انگلیسی',
      network: 'AMC',
      cast: JSON.stringify(['برنن کریستوفر', 'آرون پال']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/bb',
      views: 89000,
      genreSlugs: ['drama', 'thriller', 'crime'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'پایلوت' },
            { episodeNumber: 2, title: 'کت‌کیت' },
            { episodeNumber: 3, title: 'در زیر فشار' },
            { episodeNumber: 4, title: 'حیاط خلوت' },
            { episodeNumber: 5, title: 'گری‌هند' },
            { episodeNumber: 6, title: 'پیچیده' },
            { episodeNumber: 7, title: 'کریستال' },
          ],
        },
        {
          seasonNumber: 2,
          title: 'فصل دوم',
          episodes: [
            { episodeNumber: 7, title: 'SE7EN' },
            { episodeNumber: 8, title: 'بهتر است زنگ بزنی' },
            { episodeNumber: 9, title: 'چه کسی نداند' },
            { episodeNumber: 10, title: 'گوزن قاطع' },
            { episodeNumber: 11, title: 'مانیتور' },
            { episodeNumber: 12, title: ' phoenix' },
            { episodeNumber: 13, title: 'ABQ' },
          ],
        },
      ],
    },
    {
      title: 'آخرین شاهزاده',
      slug: 'the-last-prince',
      originalTitle: 'The Last Prince',
      posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTQzOTUyNTY0OF5BMl5BanBnXkFtZTcwNjQ0ODk4Mw@@._V1_.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
      description: 'داستان امیر جوانی که باید برای بازپس‌گیری تاج و تخت خود با نیروهای تاریکی مبارزه کند.',
      releaseYear: 2024,
      imdbRating: 7.8,
      country: 'ترکیه',
      language: 'ترکی',
      network: 'Netflix',
      cast: JSON.stringify(['کرم بورسین', 'آکچای آیدین']),
      screenshots: JSON.stringify([
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      ]),
      source: 'seed',
      sourceUrl: 'https://example.com/lastprince',
      views: 18000,
      genreSlugs: ['drama', 'fantasy', 'romance'],
      seasons: [
        {
          seasonNumber: 1,
          title: 'فصل اول',
          episodes: [
            { episodeNumber: 1, title: 'آغاز' },
            { episodeNumber: 2, title: 'سفر' },
            { episodeNumber: 3, title: 'جنگ' },
            { episodeNumber: 4, title: 'عشق' },
            { episodeNumber: 5, title: 'خیانت' },
            { episodeNumber: 6, title: 'پیروزی' },
          ],
        },
      ],
    },
  ];

  let seriesCount = 0;
  for (const s of seriesData) {
    const { genreSlugs, seasons, ...seriesFields } = s;
    const series = await prisma.series.upsert({
      where: { slug: seriesFields.slug },
      update: seriesFields,
      create: seriesFields,
    });

    for (const slug of genreSlugs) {
      if (genres[slug]) {
        await prisma.seriesGenre.upsert({
          where: { seriesId_genreId: { seriesId: series.id, genreId: genres[slug].id } },
          update: {},
          create: { seriesId: series.id, genreId: genres[slug].id },
        }).catch(() => {});
      }
    }

    if (seasons) {
      for (const seasonData of seasons) {
        const existingSeason = await prisma.season.findFirst({
          where: { seriesId: series.id, seasonNumber: seasonData.seasonNumber },
        });
        let season;
        if (existingSeason) {
          season = existingSeason;
        } else {
          season = await prisma.season.create({
            data: {
              seriesId: series.id,
              seasonNumber: seasonData.seasonNumber,
              title: seasonData.title,
            },
          });
        }

        for (const ep of seasonData.episodes) {
          const exists = await prisma.episode.findFirst({
            where: { seasonId: season.id, episodeNumber: ep.episodeNumber },
          });
          if (!exists) {
            await prisma.episode.create({
              data: {
                seasonId: season.id,
                episodeNumber: ep.episodeNumber,
                title: ep.title,
                downloadLinks: JSON.stringify({
                  '1080p': `https://example.com/download/${s.slug}-s${seasonData.seasonNumber}e${ep.episodeNumber}-1080p`,
                  '720p': `https://example.com/download/${s.slug}-s${seasonData.seasonNumber}e${ep.episodeNumber}-720p`,
                }),
              },
            });
          }
        }
      }
    }
    seriesCount++;
  }
  console.log(`Created ${seriesCount} series`);

  // Sample admin user
  const bcrypt = require('bcryptjs');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@zingo.ir' },
    update: {},
    create: {
      email: 'admin@zingo.ir',
      passwordHash: adminPasswordHash,
      name: 'مدیر سایت',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('Created admin user: admin@zingo.ir / admin123');

  // Sample regular user
  const userPasswordHash = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@zingo.ir' },
    update: {},
    create: {
      email: 'user@zingo.ir',
      passwordHash: userPasswordHash,
      name: 'کاربر نمونه',
      role: 'USER',
      isVerified: true,
    },
  });
  console.log('Created user: user@zingo.ir / user123');

  // Sample ads
  const adsData = [
    {
      title: 'بنر تبلیغاتی هدر',
      type: 'BANNER',
      imageUrl: 'https://placehold.co/728x90/f43f5e/ffffff?text=Zingo+Ad+728x90',
      linkUrl: 'https://example.com',
      position: 'header',
      priority: 1,
      isActive: true,
    },
    {
      title: 'تبلیغ پاپ‌آپ',
      type: 'POPUP',
      imageUrl: 'https://placehold.co/600x400/1e293b/f8fafc?text=Zingo+Popup+Ad',
      linkUrl: 'https://example.com',
      position: 'popup',
      priority: 1,
      isActive: true,
    },
    {
      title: 'بنر محتوا',
      type: 'BANNER',
      imageUrl: 'https://placehold.co/728x90/334155/f8fafc?text=Zingo+Content+Ad',
      linkUrl: 'https://example.com',
      position: 'content',
      priority: 2,
      isActive: true,
    },
    {
      title: 'بنر فوتر',
      type: 'BANNER',
      imageUrl: 'https://placehold.co/728x90/0f172a/f8fafc?text=Zingo+Footer+Ad',
      linkUrl: 'https://example.com',
      position: 'footer',
      priority: 3,
      isActive: true,
    },
  ];

  for (const ad of adsData) {
    await prisma.ad.create({ data: ad }).catch(() => {});
  }
  console.log(`Created ${adsData.length} ads`);

  // Log
  await prisma.scrapLog.create({
    data: {
      source: 'seed',
      status: 'success',
      message: 'Database seeded successfully',
      itemsScraped: movieCount + seriesCount,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  console.log('\nSeed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
