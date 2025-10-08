#!/usr/bin/env tsx

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config({
  path: ".env.local",
});

// Configuration
const CLOUDFLARE_WEB3_TOKEN = process.env.CLOUDFLARE_WEB3_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const GATEWAY_HOSTNAME = "permissionless-safe.gearbox.foundation";
const IPFS_DEPLOYMENT_FILE = path.join(process.cwd(), "ipfs-deployment.json");

interface IPFSDeployment {
  ipfsHash: string;
  uploadDate: string;
  pinataUrl: string;
  publicUrl: string;
}

interface CloudflareWeb3Gateway {
  id: string;
  name: string;
  description: string;
  status: string;
  target: string;
  dnslink: string;
  created_on: string;
  modified_on: string;
}

interface CloudflareApiResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: CloudflareWeb3Gateway;
}

interface CloudflareListResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: CloudflareWeb3Gateway[];
}

function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  if (!CLOUDFLARE_WEB3_TOKEN) missingVars.push("CLOUDFLARE_WEB3_TOKEN");
  if (!CLOUDFLARE_ZONE_ID) missingVars.push("CLOUDFLARE_ZONE_ID");

  if (missingVars.length > 0) {
    console.error("❌ Error: Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.log(`  ${varName}`);
    });
    console.log("\nPlease set these variables in your .env.local file:");
    console.log("CLOUDFLARE_WEB3_TOKEN=your_api_token_here");
    console.log("CLOUDFLARE_ZONE_ID=your_zone_id_here");
    process.exit(1);
  }
}

function loadIPFSDeployment(): IPFSDeployment {
  if (!fs.existsSync(IPFS_DEPLOYMENT_FILE)) {
    console.error(
      `❌ Error: IPFS deployment file not found at ${IPFS_DEPLOYMENT_FILE}`
    );
    console.log(
      "Please run 'pnpm publish-ipfs' first to generate the IPFS deployment file"
    );
    process.exit(1);
  }

  try {
    const deploymentData = fs.readFileSync(IPFS_DEPLOYMENT_FILE, "utf-8");
    const deployment = JSON.parse(deploymentData) as IPFSDeployment;

    if (!deployment.ipfsHash) {
      console.error("❌ Error: No IPFS hash found in deployment file");
      process.exit(1);
    }

    console.log(`✅ Found IPFS deployment with hash: ${deployment.ipfsHash}`);
    return deployment;
  } catch (error) {
    console.error("❌ Error reading IPFS deployment file:", error);
    process.exit(1);
  }
}

async function createWeb3Gateway(
  ipfsHash: string
): Promise<CloudflareWeb3Gateway> {
  const dnslink = `/ipfs/${ipfsHash}`;
  const apiUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/web3/hostnames`;

  const requestBody = {
    name: GATEWAY_HOSTNAME,
    description: `IPFS DNSLink gateway for Gearbox Permissionless Safe - deployed on ${new Date().toISOString()}`,
    target: "ipfs",
    dnslink: dnslink,
  };

  console.log(`🌐 Creating Web3 gateway for ${GATEWAY_HOSTNAME}...`);
  console.log(`📝 DNSLink: ${dnslink}`);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_WEB3_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as CloudflareApiResponse;

    if (!response.ok || !data.success) {
      console.error("❌ Error creating Web3 gateway:");
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error) => {
          console.error(`  Code ${error.code}: ${error.message}`);
        });
      } else {
        console.error(`  HTTP ${response.status}: ${response.statusText}`);
      }
      process.exit(1);
    }

    return data.result;
  } catch (error) {
    console.error("❌ Error making API request:", error);
    process.exit(1);
  }
}

async function findExistingGateway(): Promise<CloudflareWeb3Gateway | null> {
  const apiUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/web3/hostnames`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_WEB3_TOKEN!}`,
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as CloudflareListResponse;

    if (response.ok && data.success && data.result) {
      const existingGateway = data.result.find(
        (gateway) => gateway.name === GATEWAY_HOSTNAME
      );
      return existingGateway || null;
    }

    return null;
  } catch (error) {
    console.warn("⚠️  Could not check existing gateways:", error);
    return null;
  }
}

async function updateWeb3Gateway(
  gatewayId: string,
  ipfsHash: string
): Promise<CloudflareWeb3Gateway> {
  const dnslink = `/ipfs/${ipfsHash}`;
  const apiUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/web3/hostnames/${gatewayId}`;

  const requestBody = {
    description: `IPFS DNSLink gateway for Gearbox Permissionless Safe - updated on ${new Date().toISOString()}`,
    dnslink: dnslink,
  };

  console.log(`🔄 Updating Web3 gateway ${GATEWAY_HOSTNAME}...`);
  console.log(`📝 New DNSLink: ${dnslink}`);

  try {
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_WEB3_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as CloudflareApiResponse;

    if (!response.ok || !data.success) {
      console.error("❌ Error updating Web3 gateway:");
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error) => {
          console.error(`  Code ${error.code}: ${error.message}`);
        });
      } else {
        console.error(`  HTTP ${response.status}: ${response.statusText}`);
      }
      process.exit(1);
    }

    return data.result;
  } catch (error) {
    console.error("❌ Error making API request:", error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log("🚀 Cloudflare Web3 Gateway Setup");
  console.log("==================================");

  // Parse command line arguments
  const args = process.argv.slice(2);
  const forceCreate = args.includes("--create") || args.includes("-c");
  const forceUpdate = args.includes("--update") || args.includes("-u");
  const showHelp = args.includes("--help") || args.includes("-h");

  if (showHelp) {
    console.log("Usage: tsx script/set-dns-record.ts [options]");
    console.log("\nOptions:");
    console.log(
      "  --create, -c    Force creation of a new gateway (fails if gateway exists)"
    );
    console.log(
      "  --update, -u    Force update of existing gateway (fails if gateway doesn't exist)"
    );
    console.log("  --help, -h      Show this help message");
    console.log("\nDefault behavior:");
    console.log("  - Creates gateway if it doesn't exist");
    console.log("  - Updates gateway if it exists and IPFS hash changed");
    console.log("  - Does nothing if gateway exists and IPFS hash is the same");
    process.exit(0);
  }

  if (forceCreate && forceUpdate) {
    console.error("❌ Error: Cannot specify both --create and --update flags");
    console.log(
      "Usage: tsx script/set-dns-record.ts [--create|-c] [--update|-u] [--help|-h]"
    );
    process.exit(1);
  }

  // Validate environment variables
  validateEnvironmentVariables();

  // Load IPFS deployment info
  const deployment = loadIPFSDeployment();

  // Check if gateway already exists
  const existingGateway = await findExistingGateway();

  let gateway: CloudflareWeb3Gateway;

  if (existingGateway) {
    console.log(`🔍 Found existing gateway: ${existingGateway.name}`);
    console.log(`   Current DNSLink: ${existingGateway.dnslink}`);
    console.log(`   Status: ${existingGateway.status}`);
    console.log(`   Created: ${existingGateway.created_on}`);

    if (forceCreate) {
      console.error(
        "❌ Error: Gateway already exists but --create flag was specified"
      );
      console.log("   Use --update flag to update the existing gateway");
      process.exit(1);
    }

    const currentHash = existingGateway.dnslink.replace("/ipfs/", "");
    if (currentHash === deployment.ipfsHash && !forceUpdate) {
      console.log(
        "✅ Gateway is already pointing to the current IPFS hash - no update needed!"
      );
      console.log("   Use --update flag to force an update anyway");
      return;
    }

    console.log("🔄 Updating gateway with new IPFS hash...");
    gateway = await updateWeb3Gateway(existingGateway.id, deployment.ipfsHash);

    console.log("✅ Successfully updated Web3 gateway!");
  } else {
    if (forceUpdate) {
      console.error(
        "❌ Error: No existing gateway found but --update flag was specified"
      );
      console.log("   Use --create flag to create a new gateway");
      process.exit(1);
    }

    console.log("🆕 No existing gateway found - creating new one...");
    gateway = await createWeb3Gateway(deployment.ipfsHash);

    console.log("✅ Successfully created Web3 gateway!");
  }

  console.log(`📝 Gateway ID: ${gateway.id}`);
  console.log(`🔗 Hostname: ${gateway.name}`);
  console.log(`📂 DNSLink: ${gateway.dnslink}`);
  console.log(`📊 Status: ${gateway.status}`);
  console.log(`📅 Modified: ${gateway.modified_on}`);

  console.log("\n🎉 Setup complete! Your IPFS content is now accessible at:");
  console.log(`   https://${gateway.name}`);

  console.log(
    "\n📝 Note: It may take a few minutes for DNS propagation to complete."
  );
  console.log(
    "   The gateway will automatically create the necessary DNS records."
  );
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
}
