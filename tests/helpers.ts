import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Server } from "bun";
import { createApp } from "../packages/aws-mock/src/index";

const PROJECT_ROOT = join(import.meta.dir, "..");
const PROVIDER_DIR = join(PROJECT_ROOT, "packages/terraform-provider-aws-mock");
const PROVIDER_BINARY = join(PROVIDER_DIR, "terraform-provider-aws-mock");

let currentServer: Server | null = null;
let currentBackendUrl = "";

export function startBackend(statePath: string): string {
  const app = createApp(statePath);
  currentServer = Bun.serve({
    port: 0,
    fetch: app.fetch,
  });
  currentBackendUrl = `http://localhost:${currentServer.port}`;
  return currentBackendUrl;
}

export function stopBackend(): void {
  if (currentServer) {
    currentServer.stop(true);
    currentServer = null;
  }
}

export async function setupProviderMirror(testDir: string): Promise<void> {
  const os = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "amd64";

  const mirrorPath = join(
    testDir,
    "mirror",
    "registry.terraform.io",
    "terraform-town",
    "aws-mock",
    "0.1.0",
    `${os}_${arch}`,
  );
  await mkdir(mirrorPath, { recursive: true });
  await cp(PROVIDER_BINARY, join(mirrorPath, "terraform-provider-aws-mock_v0.1.0"));

  const terraformrc = `provider_installation {
  filesystem_mirror {
    path    = "${join(testDir, "mirror")}"
    include = ["terraform-town/aws-mock"]
  }
  direct {
    exclude = ["terraform-town/aws-mock"]
  }
}
`;
  await Bun.write(join(testDir, ".terraformrc"), terraformrc);
}

export function terraformEnv(testDir: string): Record<string, string> {
  return {
    ...(process.env as Record<string, string>),
    TF_CLI_CONFIG_FILE: join(testDir, ".terraformrc"),
  };
}
