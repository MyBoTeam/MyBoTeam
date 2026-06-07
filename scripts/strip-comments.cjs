const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.worktrees',
  '.pnpm-store',
  'coverage',
  '.cache',
]);

const KEEP_PATTERN = /\b(TODO|FIXME|HACK|XXX|NOTE|biome-ignore)\b/i;

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs']);

const REGEX_START_AFTER = new Set([
  '(', '[', '{', '!', '&', '|', ',', ';', ':', '?', '~',
  '=', '+', '-', '*', '/', '%', '^', '<', '>',
  ' ', '\t', '\n', '\r',
]);

const REGEX_KEYWORDS = new Set([
  'return', 'throw', 'case', 'typeof', 'instanceof',
  'void', 'delete', 'new', 'in', 'of',
]);

function isRegexStart(sourceText, pos) {
  let j = pos - 1;
  while (j >= 0 && (sourceText[j] === ' ' || sourceText[j] === '\t' || sourceText[j] === '\n' || sourceText[j] === '\r')) j--;
  if (j < 0) return true;
  const prev = sourceText[j];
  if (REGEX_START_AFTER.has(prev)) return true;
  if (prev === ')' || prev === ']' || prev === '}') return false;
  if (/[a-zA-Z0-9_$]/.test(prev)) {
    if (/[a-zA-Z_]/.test(prev)) {
      let k = j;
      while (k >= 0 && /[a-zA-Z0-9_$]/.test(sourceText[k])) k--;
      const word = sourceText.slice(k + 1, j + 1);
      if (REGEX_KEYWORDS.has(word)) return true;
    }
    return false;
  }
  return true;
}

function stripComments(sourceText) {
  let result = '';
  let i = 0;
  const len = sourceText.length;

  const skipString = (quote) => {
    result += quote;
    i++;
    while (i < len) {
      if (sourceText[i] === '\\') {
        result += sourceText[i];
        if (i + 1 < len) {
          i++;
          result += sourceText[i];
        }
        i++;
        continue;
      }
      result += sourceText[i];
      if (sourceText[i] === quote) {
        i++;
        return;
      }
      i++;
    }
  };

  const skipTemplateLiteral = () => {
    result += '`';
    i++;
    let depth = 0;
    while (i < len) {
      if (sourceText[i] === '\\') {
        result += sourceText[i];
        if (i + 1 < len) {
          i++;
          result += sourceText[i];
        }
        i++;
        continue;
      }
      if (sourceText[i] === '$' && sourceText[i + 1] === '{') {
        depth++;
        result += '${';
        i += 2;
        continue;
      }
      if (sourceText[i] === '}' && depth > 0) {
        depth--;
        result += '}';
        i++;
        continue;
      }
      result += sourceText[i];
      if (sourceText[i] === '`' && depth === 0) {
        i++;
        return;
      }
      i++;
    }
  };

  const skipRegex = () => {
    result += '/';
    i++;
    let inClass = false;
    while (i < len) {
      if (sourceText[i] === '\\') {
        result += sourceText[i];
        if (i + 1 < len) {
          i++;
          result += sourceText[i];
        }
        i++;
        continue;
      }
      if (sourceText[i] === '[' && !inClass) {
        inClass = true;
        result += '[';
        i++;
        continue;
      }
      if (sourceText[i] === ']' && inClass) {
        inClass = false;
        result += ']';
        i++;
        continue;
      }
      if (sourceText[i] === '/' && !inClass) {
        result += '/';
        i++;
        while (i < len && /[a-z]/i.test(sourceText[i])) {
          result += sourceText[i];
          i++;
        }
        return;
      }
      result += sourceText[i];
      i++;
    }
  };

  while (i < len) {
    const ch = sourceText[i];
    const next = sourceText[i + 1];

                                        
    if (ch === '#' && next === '!' && i === 0) {
      while (i < len && sourceText[i] !== '\n') {
        result += sourceText[i];
        i++;
      }
      continue;
    }

                      
    if (ch === "'" || ch === '"') {
      skipString(ch);
      continue;
    }

                        
    if (ch === '`') {
      skipTemplateLiteral();
      continue;
    }

                          
    if (ch === '/' && next === '/') {
      const start = i;
      while (i < len && sourceText[i] !== '\n') i++;
      const comment = sourceText.slice(start, i);
      if (KEEP_PATTERN.test(comment)) {
        result += comment;
      } else {
        result += comment.replace(/[^\n]/g, ' ');
      }
      continue;
    }

                         
    if (ch === '/' && next === '*') {
      const start = i;
      i += 2;
      while (i < len && !(sourceText[i] === '*' && sourceText[i + 1] === '/')) i++;
      if (i < len) i += 2;
      const comment = sourceText.slice(start, i);
      if (KEEP_PATTERN.test(comment)) {
        result += comment;
      } else {
        result += comment.replace(/[^\n]/g, ' ');
      }
      continue;
    }

                                                         
    if (ch === '/' && isRegexStart(sourceText, i)) {
      skipRegex();
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

function findSourceFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        files.push(...findSourceFiles(fullPath));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const allFiles = findSourceFiles(ROOT);
console.log(`Found ${allFiles.length} source files`);

let modified = 0;
let skipped = 0;

for (const filePath of allFiles) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const stripped = stripComments(original);

  if (stripped !== original) {
    fs.writeFileSync(filePath, stripped, 'utf-8');
    modified++;
    if (modified <= 5) {
      console.log(`Modified: ${path.relative(ROOT, filePath)}`);
    }
  } else {
    skipped++;
  }
}

console.log(`\nDone. Modified: ${modified}, Skipped (no changes): ${skipped}`);
