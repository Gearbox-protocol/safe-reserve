#!/usr/bin/env tsx

import Cloudflare from "cloudflare";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
// In CI, env vars are already set; locally they're in .env.local
if (fs.existsSync(".env.local")) {
  dotenv.config({
    path: ".env.local",
  });
}

// Configuration
const CLOUDFLARE_WEB3_TOKEN = process.env.CLOUDFLARE_WEB3_TOKEN;
const CLOUDFLARE_ZONE_ID =
  process.env.CLOUDFLARE_EXTRACTED_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID;
const GATEWAY_HOSTNAME = process.env.GATEWAY_HOSTNAME || "safe.gear-dev.dev";
const IPFS_DEPLOYMENT_FILE = path.join(process.cwd(), "ipfs-deployment.json");

interface IPFSDeployment {
  ipfsHash: string;
  uploadDate: string;
  pinataUrl: string;
  publicUrl: string;
}

function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  if (!CLOUDFLARE_WEB3_TOKEN) missingVars.push("CLOUDFLARE_WEB3_TOKEN");
  if (!CLOUDFLARE_ZONE_ID)
    missingVars.push("CLOUDFLARE_EXTRACTED_ZONE_ID (or CLOUDFLARE_ZONE_ID)");

  if (missingVars.length > 0) {
    console.error("❌ Error: Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.log(`  ${varName}`);
    });
    console.log("\nPlease set these variables in your .env.local file:");
    console.log("CLOUDFLARE_WEB3_TOKEN=your_api_token_here");
    console.log("CLOUDFLARE_EXTRACTED_ZONE_ID=your_zone_id_here");
    process.exit(1);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  initialBackoffMs: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        throw error;
      }

      const backoffMs = initialBackoffMs * Math.pow(2, attempt);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.log(
        `   ⚠️  ${operationName} attempt ${attempt + 1}/${maxRetries} failed (${errorMsg}), retrying in ${backoffMs}ms...`
      );
      await sleep(backoffMs);
    }
  }

  throw new Error(`All retry attempts failed for ${operationName}`);
}

async function verifyIPFSAccessibility(ipfsHash: string): Promise<boolean> {
  console.log(`🔍 Verifying IPFS content accessibility...`);

  const gatewaysToTry = [
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://${ipfsHash}.ipfs.dweb.link`,
    // `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
  ];

  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF_MS = 1000; // Start with 1 second
  const TIMEOUT_MS = 15000; // 15 second timeout per attempt

  for (const gatewayUrl of gatewaysToTry) {
    console.log(`   Trying gateway: ${gatewayUrl}`);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(gatewayUrl, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`✅ IPFS content is accessible via: ${gatewayUrl}`);
          return true;
        } else if (attempt < MAX_RETRIES - 1) {
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.log(
            `   ⚠️  Attempt ${attempt + 1}/${MAX_RETRIES} failed (status ${response.status}), retrying in ${backoffMs}ms...`
          );
          await sleep(backoffMs);
        }
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.log(
            `   ⚠️  Attempt ${attempt + 1}/${MAX_RETRIES} failed (${errorMsg}), retrying in ${backoffMs}ms...`
          );
          await sleep(backoffMs);
        } else {
          console.log(`   ❌ All attempts failed for ${gatewayUrl}`);
        }
      }
    }
  }

  return false;
}

async function loadIPFSDeployment(): Promise<IPFSDeployment> {
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

    // Verify IPFS content is accessible
    const isAccessible = await verifyIPFSAccessibility(deployment.ipfsHash);

    if (!isAccessible) {
      console.error(
        `❌ Error: IPFS content with hash ${deployment.ipfsHash} is not accessible`
      );
      console.log(
        "Please ensure the content has been properly uploaded and pinned to IPFS"
      );
      process.exit(1);
    }

    return deployment;
  } catch (error) {
    console.error("❌ Error reading IPFS deployment file:", error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log("🚀 Cloudflare Web3 Gateway Setup");
  console.log("==================================");

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
    process.exit(1);
  }

  validateEnvironmentVariables();
  const deployment = await loadIPFSDeployment();

  const cf = new Cloudflare({
    apiToken: CLOUDFLARE_WEB3_TOKEN,
    timeout: 60000, // 200 second timeout
  });

  const findExistingGateway = async () => {
    try {
      const hostnames = await retryWithBackoff(
        () =>
          cf.web3.hostnames.list({
            zone_id: CLOUDFLARE_ZONE_ID!,
          }),
        "List Web3 hostnames"
      );
      return hostnames.result?.find((h) => h.name === GATEWAY_HOSTNAME) || null;
    } catch (error) {
      console.warn("⚠️  Could not check existing gateways:", error);
      return null;
    }
  };

  const existingGateway = await findExistingGateway();
  let gateway: Cloudflare.Web3.Hostname;

  if (existingGateway) {
    console.log(existingGateway);
    console.log(`🔍 Found existing gateway: ${existingGateway.name}`);
    console.log(`   Current DNSLink: ${existingGateway.dnslink}`);
    console.log(`   Status: ${existingGateway.status}`);
    console.log(`   Created: ${existingGateway.created_on}`);

    if (forceCreate) {
      console.error(
        "❌ Error: Gateway already exists but --create flag was specified"
      );
      process.exit(1);
    }

    const currentHash = existingGateway.dnslink?.replace("/ipfs/", "") || "";
    if (currentHash === deployment.ipfsHash && !forceUpdate) {
      console.log(
        "✅ Gateway is already pointing to the current IPFS hash - no update needed!"
      );
      return;
    }

    console.log("🔄 Updating gateway with new IPFS hash...");
    try {
      if (!existingGateway.id) {
        console.error("❌ Error: Existing gateway has no ID");
        process.exit(1);
      }

      gateway = await retryWithBackoff(
        () =>
          cf.web3.hostnames.edit(existingGateway.id!, {
            zone_id: CLOUDFLARE_ZONE_ID!,
            dnslink: `/ipfs/${deployment.ipfsHash}`,
            description: `IPFS DNSLink gateway for Gearbox Permissionless Safe - updated on ${new Date().toISOString()}`,
          }),
        "Update Web3 gateway"
      );
      console.log("✅ Successfully updated Web3 gateway!");
    } catch (error) {
      console.error("❌ Error updating Web3 gateway:", error);
      process.exit(1);
    }
  } else {
    if (forceUpdate) {
      console.error(
        "❌ Error: No existing gateway found but --update flag was specified"
      );
      process.exit(1);
    }

    console.log("🆕 No existing gateway found - creating new one...");
    try {
      gateway = await retryWithBackoff(
        () =>
          cf.web3.hostnames.create({
            zone_id: CLOUDFLARE_ZONE_ID!,
            name: GATEWAY_HOSTNAME,
            target: "ipfs",
            dnslink: `/ipfs/${deployment.ipfsHash}`,
            description: `IPFS DNSLink gateway for Gearbox Permissionless Safe - deployed on ${new Date().toISOString()}`,
          }),
        "Create Web3 gateway"
      );
      console.log("✅ Successfully created Web3 gateway!");
    } catch (error) {
      // Check if it's a Cloudflare API error indicating the hostname already exists
      const isHostnameExistsError =
        error instanceof Error && error.message.includes("1001");

      if (isHostnameExistsError) {
        console.warn(
          "ℹ️ Hostname already exists. Falling back to update flow..."
        );
        const gw = await findExistingGateway();
        if (!gw || !gw.id) {
          console.error(
            "❌ Hostname reported as existing, but could not be found via list API."
          );
          process.exit(1);
        }
        gateway = await retryWithBackoff(
          () =>
            cf.web3.hostnames.edit(gw.id!, {
              zone_id: CLOUDFLARE_ZONE_ID!,
              dnslink: `/ipfs/${deployment.ipfsHash}`,
              description: `IPFS DNSLink gateway for Gearbox Permissionless Safe - updated on ${new Date().toISOString()}`,
            }),
          "Update Web3 gateway (fallback)"
        );
        console.log("✅ Successfully updated Web3 gateway!");
      } else {
        console.error("❌ Error creating Web3 gateway:", error);
        process.exit(1);
      }
    }
  }

  console.log(`📝 Gateway ID: ${gateway.id}`);
  console.log(`🔗 Hostname: ${gateway.name}`);
  console.log(`📂 DNSLink: ${gateway.dnslink}`);
  console.log(`📊 Status: ${gateway.status}`);
  console.log(`📅 Modified: ${gateway.modified_on}`);

  console.log("\n🎉 Setup complete! Your IPFS content is now accessible at:");
  console.log(`   https://${gateway.name}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
}
