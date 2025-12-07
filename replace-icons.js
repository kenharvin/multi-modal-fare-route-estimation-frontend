const fs = require('fs');
const path = require('path');

const iconReplacements = {
  '<Icon name="bus" size={50} color="#4caf50" />': '<Text>BUS</Text>',
  '<Icon name="car" size={50} color="#2196f3" />': '<Text>CAR</Text>',
  '<Icon name="check-circle"': '<Text>✓',
  '<Icon name="map-marker"': '<Text>*',
  '<Icon name="close-circle"': '<Text>X',
  '<Icon name="cash"': '<Text>$',
  '<Icon name="clock-outline"': '<Text>T',
  '<Icon name="swap-horizontal"': '<Text>↔',
  '<Icon name="star"': '<Text>*',
  '<Icon name="chevron-right"': '<Text>>',
  '<Icon name="map-search"': '<Text>MAP',
  '<Icon name="map-marker-path"': '<Text>PATH',
  '<Icon name="gas-station"': '<Text>GAS',
  '<Icon name="speedometer"': '<Text>SPD',
  '<Icon name="fuel"': '<Text>FUEL',
  '<Icon name="highway"': '<Text>ROAD',
  '<Icon name="currency-usd-off"': '<Text>NO$',
  '<Icon name="map-marker-distance"': '<Text>DIST',
  '<Icon name="map-marker-multiple"': '<Text>PINS',
  '<Icon name="map-marker-outline"': '<Text>PIN',
  '<Icon name="cash-multiple"': '<Text>$$',
  '<Icon name="map-outline"': '<Text>MAP',
  '<Icon name="map-search-outline"': '<Text>SEARCH',
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [pattern, replacement] of Object.entries(iconReplacements)) {
    if (content.includes(pattern)) {
      // Replace pattern and close the tag
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^/>]*/>', 'g');
      content = content.replace(regex, replacement + '</Text>');
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  });
}

walkDir('./src');
console.log('Done replacing icons');
