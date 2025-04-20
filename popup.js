document.getElementById('start').addEventListener('click', async () => {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return;

  const text = await file.text();
  const rows = parseCSV(text);
  
  chrome.runtime.sendMessage({
    action: "startProcessing",
    data: rows
  });
});

function parseCSV(csv) {
  return csv.split('\n').filter(row => row.trim()).map(row => {
    const result = [];
    let inQuotes = false;
    let current = '';
    
    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  });
}