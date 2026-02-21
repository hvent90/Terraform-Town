import { mkdtemp, rm, cp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "bun";
import { createApp } from "../../packages/aws-mock/src/index";

const PROJECT_ROOT = join(import.meta.dir, "../..");
const PROVIDER_DIR = join(PROJECT_ROOT, "packages/terraform-provider-aws-mock");
const PROVIDER_BINARY = join(PROVIDER_DIR, "terraform-provider-aws-mock");

export interface TerraformEnv {
  workDir: string;
  cleanup: () => Promise<void>;
}

export interface BackendServer {
  url: string;
  stop: () => void;
}

export function startBackend(statePath: string): BackendServer {
  const app = createApp(statePath);
  const server: Server = Bun.serve({
    port: 0,
    fetch: app.fetch,
  });
  return {
    url: `http://localhost:${server.port}`,
    stop: () => server.stop(true),
  };
}

export async function buildProvider(): Promise<void> {
  const proc = Bun.spawn(["go", "build", "-o", "terraform-provider-aws-mock"], {
    cwd: PROVIDER_DIR,
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`go build failed: ${stderr}`);
  }
}

export async function setupTerraformEnv(tfConfig: string): Promise<TerraformEnv> {
  const workDir = await mkdtemp(join(tmpdir(), "tf-integration-"));

  const os = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "amd64";

  // Create filesystem mirror with unpacked layout
  const mirrorPath = join(
    workDir,
    "mirror",
    "registry.terraform.io",
    "terraform-town",
    "aws-mock",
    "0.1.0",
    `${os}_${arch}`,
  );
  await mkdir(mirrorPath, { recursive: true });
  await cp(PROVIDER_BINARY, join(mirrorPath, "terraform-provider-aws-mock_v0.1.0"));

  // Write Terraform CLI config pointing to the mirror
  const terraformrc = `provider_installation {
  filesystem_mirror {
    path    = "${join(workDir, "mirror")}"
    include = ["terraform-town/aws-mock"]
  }
  direct {
    exclude = ["terraform-town/aws-mock"]
  }
}
`;
  await Bun.write(join(workDir, ".terraformrc"), terraformrc);

  // Write Terraform config
  await Bun.write(join(workDir, "main.tf"), tfConfig);

  return {
    workDir,
    cleanup: () => rm(workDir, { recursive: true, force: true }),
  };
}

export async function terraform(
  env: TerraformEnv,
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["terraform", ...args], {
    cwd: env.workDir,
    env: {
      ...process.env,
      TF_CLI_CONFIG_FILE: join(env.workDir, ".terraformrc"),
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
}
