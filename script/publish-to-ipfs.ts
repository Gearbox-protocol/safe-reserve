#!/usr/bin/env tsx

import { PinataSDK } from "pinata";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({
    path: ".env.local"
});

// Configuration
const OUT_FOLDER = path.join(process.cwd(), "out");
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud";

// Initialize Pinata SDK
if (!PINATA_JWT) {
  console.error("❌ Error: PINATA_JWT environment variable is required");
  console.log("Please set your Pinata JWT token in your .env file:");
  console.log("PINATA_JWT=your_jwt_token_here");
  process.exit(1);
}

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY_URL,
});

async function checkOutFolder(): Promise<void> {
  if (!fs.existsSync(OUT_FOLDER)) {
    console.error(`❌ Error: 'out' folder not found at ${OUT_FOLDER}`);
    console.log("Please run 'npm run build' or 'pnpm build' first to generate the out folder");
    process.exit(1);
  }

  const stats = fs.statSync(OUT_FOLDER);
  if (!stats.isDirectory()) {
    console.error(`❌ Error: 'out' is not a directory`);
    process.exit(1);
  }

  console.log(`✅ Found out folder at: ${OUT_FOLDER}`);
}

async function getFilesFromDirectory(dirPath: string): Promise<File[]> {
  const files: File[] = [];
  
  function readDirRecursive(currentPath: string, relativePath = "") {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively read subdirectories
        readDirRecursive(fullPath, path.join(relativePath, item));
      } else {
        // Create File object with proper path structure
        const fileBuffer = fs.readFileSync(fullPath);
        const blob = new Blob([fileBuffer]);
        const fileName = relativePath ? `${relativePath}/${item}` : item;
        const file = new File([blob], fileName, { 
          type: getMimeType(fullPath) 
        });
        files.push(file);
      }
    }
  }
  
  readDirRecursive(dirPath);
  return files;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function publishToIPFS(): Promise<void> {
  try {
    console.log("🚀 Starting IPFS upload via Pinata...");
    
    // Upload the entire out folder using fileArray method
    const files = await getFilesFromDirectory(OUT_FOLDER);
    const upload = await pinata.upload.public.fileArray(files)
      .name(`website-build-${new Date().toISOString()}`)
      .keyvalues({
        description: "Static website build published to IPFS",
        buildDate: new Date().toISOString(),
      });

    console.log("✅ Successfully uploaded to IPFS!");
    console.log(`📝 IPFS Hash: ${upload.cid}`);
    console.log(`🔗 Pinata URL: https://gateway.pinata.cloud/ipfs/${upload.cid}`);
    console.log(`🔗 Public IPFS URL: https://${upload.cid}.ipfs.dweb.link`);
    
    // Save the hash to a file for reference
    const hashInfo = {
      ipfsHash: upload.cid,
      uploadDate: new Date().toISOString(),
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${upload.cid}`,
      publicUrl: `https://${upload.cid}.ipfs.dweb.link`,
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), "ipfs-deployment.json"),
      JSON.stringify(hashInfo, null, 2)
    );
    
    console.log("💾 Deployment info saved to ipfs-deployment.json");
    
  } catch (error) {
    console.error("❌ Error uploading to IPFS:", error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log("🌐 IPFS Publisher using Pinata SDK");
  console.log("==================================");
  
  await checkOutFolder();
  await publishToIPFS();
  
  console.log("🎉 Process completed successfully!");
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
} 