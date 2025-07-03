const fs = require('fs');
const path = require('path');

// Read the current JSON file
const jsonPath = path.join(__dirname, 'assets', 'flashcards.json');
let content = fs.readFileSync(jsonPath, 'utf8');

console.log('Fixing JSON file...');

// Fix specific problematic patterns
content = content
  // Fix unescaped quotes in strings
  .replace(/prior years" budgets/g, 'prior years\\" budgets')
  .replace(/Shareholders" Equity/g, 'Shareholders\\" Equity')
  .replace(/company\\s ability/g, 'company\\\\s ability')
  // Fix any remaining unescaped quotes
  .replace(/([^\\])"([^"]*)"([^"]*)"([^"]*)/g, '$1\\"$2\\"$3\\"$4')
  // Fix any remaining unescaped backslashes
  .replace(/\\([^"\\])/g, '\\\\$1');

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
  console.error('Error at position:', error.message.match(/position (\d+)/)?.[1] || 'unknown');
} 