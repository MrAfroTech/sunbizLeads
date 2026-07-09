import fs from 'fs';
import path from 'path';

const DEPLOYMENT_ID = 'dpl_Hnp52y4NLUPgsoLBrX5CagF4ivya';
const TOKEN = 'vcp_7ZdPjMHWndQT35VKJkCBCDC71GjkaK370yoel1Q8geoNoTxZGT2GBLXv'; // Use a fresh token!
const OUTPUT_DIR = '/Users/missioncontrol/SeamlessMarketplace/SeamlessVendorUI/recoveryFiles/recovered-source-fixed';

async function fetchRootFiles() {
  const url = `https://api.vercel.com/v8/deployments/${DEPLOYMENT_ID}/files`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const data = await res.json();

  if (data.error) {
    console.error('API Error:', data.error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

async function downloadFile(fileId, filePath) {
  try {
    const res = await fetch(
      `https://api.vercel.com/v8/deployments/${DEPLOYMENT_ID}/files/${fileId}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (!res.ok) {
      console.log(`Skipped (not downloadable): ${filePath}`);
      return;
    }

    const responseData = await res.json();
    
    let content;
    
    // Check if response has base64 data field
    if (responseData && responseData.data) {
      // Decode base64 to actual file bytes
      content = Buffer.from(responseData.data, 'base64');
    } else {
      console.log(`Skipped (unexpected format): ${filePath}`);
      return;
    }

    const fullPath = path.join(OUTPUT_DIR, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log(`Downloaded: ${filePath}`);
  } catch (err) {
    console.log(`Error downloading ${filePath}: ${err.message}`);
  }
}

async function processFiles(files, currentPath = '') {
  if (!files || !Array.isArray(files)) {
    return;
  }

  for (const file of files) {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;

    if (file.type === 'directory') {
      if (file.children && file.children.length > 0) {
        await processFiles(file.children, filePath);
      }
    } else {
      await downloadFile(file.uid, filePath);
    }
  }
}

async function main() {
  console.log('Starting full deployment recovery (with base64 decoding)...');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = await fetchRootFiles();

  if (!files || files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log(`Found ${files.length} root items\n`);
  await processFiles(files);

  console.log(`\nDone! Files saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);