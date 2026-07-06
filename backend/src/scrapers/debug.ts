// @ts-nocheck
const axios = require('axios');
const cheerio = require('cheerio');

async function debug() {
  try {
    console.log('=== donyayeserial.com ===');
    let res = await axios.get('https://donyayeserial.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    let $ = cheerio.load(res.data);
    console.log('Title:', $('title').text());
    console.log('All link texts on page (first 30):');
    $('a').each((i, el) => {
      if (i > 30) return false;
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && href && !href.includes('#') && !href.includes('javascript')) {
        console.log(`  [${text.substring(0, 60)}] -> ${href.substring(0, 80)}`);
      }
    });

    console.log('\n=== animex.click ===');
    res = await axios.get('https://animex.click', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    $ = cheerio.load(res.data);
    console.log('Title:', $('title').text());
    console.log('All link texts on page (first 30):');
    $('a').each((i, el) => {
      if (i > 30) return false;
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && href && !href.includes('#') && !href.includes('javascript')) {
        console.log(`  [${text.substring(0, 60)}] -> ${href.substring(0, 80)}`);
      }
    });
  } catch(err) {
    console.error('Error:', err.message);
  }
}

debug();
