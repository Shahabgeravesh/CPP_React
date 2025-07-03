const fs = require('fs');
const path = require('path');

// Read the current JSON file
const jsonPath = path.join(__dirname, 'assets', 'flashcards.json');
let content = fs.readFileSync(jsonPath, 'utf8');

console.log('Fixing JSON file...');

// Fix common JSON formatting issues
content = content
  // Fix unquoted keys
  .replace(/(\s+)(\w+):/g, '$1"$2":')
  // Fix unquoted string values that should be quoted
  .replace(/:\s*([^",\{\}\[\]]+)(?=\s*[,}\]])/g, ': "$1"')
  // Fix boolean values that got quoted
  .replace(/"false"/g, 'false')
  .replace(/"true"/g, 'true')
  // Fix numbers that got quoted
  .replace(/"(\d+)"/g, '$1')
  // Fix unescaped quotes in strings
  .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"')
  // Fix unescaped backslashes
  .replace(/\\\\([^"\\])/g, '\\\\$1')
  // Fix specific problematic patterns
  .replace(/prior years" budgets/g, 'prior years\\" budgets')
  .replace(/company\\s ability/g, 'company\\\\s ability')
  .replace(/Shareholders" Equity/g, 'Shareholders\\" Equity')
  .replace(/\\s ability/g, '\\\\s ability')
  .replace(/\\s ability/g, '\\\\s ability');

// Write the fixed content back
fs.writeFileSync(jsonPath, content);
console.log('JSON file has been fixed!');

// Test the JSON
try {
  const testData = JSON.parse(content);
  console.log('JSON is valid!');
  console.log('Number of flashcards:', testData.flashcards ? testData.flashcards.length : 'No flashcards array found');
} catch (error) {
  console.error('JSON is still invalid:', error.message);
} 