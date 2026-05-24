const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const WIKI_DIR = path.resolve(__dirname, '../public/assets/wiki');
const OUTPUT_FILE = path.resolve(__dirname, '../public/assets/wiki-index.json');

// Comprehensive dictionary mapping folder names to Greek titles
const categoryMap = {
  'adeies': 'Άδειες',
  'anergia': 'Ανεργία',
  'apolysi': 'Απόλυση & Παραίτηση',
  'asfalisi': 'Ασφάλιση & ΕΦΚΑ',
  'misthos': 'Μισθός & Δώρα',
  'orario': 'Ωράριο & Βάρδιες',
  'symvasi': 'Σύμβαση Εργασίας',
  'syntaxi': 'Συντάξεις',
  'ygeia': 'Υγεία & Ασφάλεια',
  '.': 'Γενικά',
};

// Material icon mapping per category
const iconMap = {
  'adeies': 'event_available',
  'anergia': 'work_off',
  'apolysi': 'person_remove',
  'asfalisi': 'shield',
  'misthos': 'payments',
  'orario': 'schedule',
  'symvasi': 'description',
  'syntaxi': 'account_balance',
  'ygeia': 'health_and_safety',
  '.': 'folder',
};

/**
 * Normalize a string for diacritic-insensitive link resolution.
 * Strips Greek accents/diacritics, lowercases, and trims.
 */
function normalizeStr(str) {
  if (!str) return '';
  return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getCategoryTitle(folderName) {
  return categoryMap[folderName] || folderName;
}

function getAllMdFiles(dir, basePath = '') {
  const results = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Wiki directory not found: ${dir}`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...getAllMdFiles(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push({ fullPath, relativePath });
    }
  }

  return results;
}

function main() {
  console.log('📚 Generating wiki index...');

  const files = getAllMdFiles(WIKI_DIR);

  if (files.length === 0) {
    console.log('⚠️  No markdown files found. Writing empty index.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ categories: [], linkMap: {} }, null, 2), 'utf-8');
    return;
  }

  const categories = new Map();
  const linkMap = {};

  for (const { fullPath, relativePath } of files) {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { data: frontmatter } = matter(raw);

    // Determine category from parent folder; root files use '.'
    const parentFolder = path.dirname(relativePath).split('/')[0];
    const category = frontmatter.category || (parentFolder === '.' ? '.' : parentFolder);
    const categoryTitle = getCategoryTitle(category);

    const title = frontmatter.title || path.basename(relativePath, '.md');

    const article = {
      title,
      path: relativePath,
      tags: frontmatter.tags || [],
    };

    if (!categories.has(category)) {
      categories.set(category, {
        category,
        categoryTitle,
        icon: iconMap[category] || 'folder',
        articles: [],
      });
    }

    categories.get(category).articles.push(article);

    // Populate linkMap: normalize keys (diacritic-insensitive) to prevent broken [[Links]]
    const titleKey = normalizeStr(title);
    const fileKey = normalizeStr(path.basename(relativePath, '.md'));
    if (titleKey) {
      linkMap[titleKey] = relativePath;
    }
    // Ignore raw 'index' files to prevent them from overwriting each other
    if (fileKey && fileKey !== 'index' && fileKey !== 'general_index') {
      linkMap[fileKey] = relativePath;
    }

    // Support Obsidian aliases from frontmatter
    if (frontmatter.aliases && Array.isArray(frontmatter.aliases)) {
      frontmatter.aliases.forEach(alias => {
        const aliasKey = normalizeStr(alias);
        if (aliasKey) {
          linkMap[aliasKey] = relativePath;
        }
      });
    }
  }

  // Sort articles within each category alphabetically
  for (const cat of categories.values()) {
    cat.articles.sort((a, b) => a.title.localeCompare(b.title, 'el'));
  }

  const output = {
    categories: Array.from(categories.values()),
    linkMap,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ Wiki index generated: ${files.length} articles in ${output.categories.length} categories, ${Object.keys(linkMap).length} link entries.`);
}

main();
