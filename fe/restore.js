const fs = require('fs');
const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\8cd46672-1a02-4b14-9113-c4c2ce4144ea\\.system_generated\\logs\\overview.txt';
const logContent = fs.readFileSync(logPath, 'utf8');

const targetStr = 'File Path: `file:///c:/Users/USER/nwigiri_joshua/job_bot/fe/src/components/layout/AppBar.tsx`';
const startIndex = logContent.lastIndexOf(targetStr);
if (startIndex !== -1) {
  const fileContentStartMatch = logContent.substring(startIndex).match(/1:\s*\"use client\";/);
  if (fileContentStartMatch) {
    const fileContentStart = startIndex + fileContentStartMatch.index;
    const fileContentEnd = logContent.indexOf('The above content shows the entire', fileContentStart);
    
    if (fileContentStart !== -1 && fileContentEnd !== -1) {
      const rawLines = logContent.substring(fileContentStart, fileContentEnd).split('\n');
      const cleanLines = rawLines.map(line => {
        const match = line.match(/^\d+:\s?(.*)$/);
        return match ? match[1] : line;
      });
      if (cleanLines[cleanLines.length - 1].trim() === '') cleanLines.pop();
      fs.writeFileSync('C:\\Users\\USER\\nwigiri_joshua\\job_bot\\fe\\src\\components\\layout\\AppBar.tsx', cleanLines.join('\n'));
      console.log('Restored AppBar.tsx successfully!');
    } else {
      console.log('End bound not found');
    }
  } else {
    console.log('Start match not found');
  }
} else {
  console.log('Target string not found');
}
