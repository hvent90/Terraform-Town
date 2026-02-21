import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { join } from "path";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { startBackend, stopBackend } from "../../helpers";

const resourceType = "aws_instance";

describe.skip(`${resourceType} integration`, () => {
  let testDir: string;
  let statePath: string;
  let backendUrl: string;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), "tf-test-"));
    statePath = join(testDir, "state.json");
    backendUrl = await startBackend(statePath);
    
    // Copy test configs
    await $`cp ${import.meta.dir}/minimal.tf ${testDir}/`;
    await $`cp ${import.meta.dir}/expected_outputs.json ${testDir}/`;
  });

  afterAll(async () => {
    stopBackend();
    await rm(testDir, { recursive: true });
  });

  test("terraform init succeeds", async () => {
    const result = await $`terraform init -no-color`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
  });

  test("terraform plan shows resource to create", async () => {
    const result = await $`terraform plan -no-color`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 to add");
  });

  test("terraform apply creates resource", async () => {
    const result = await $`terraform apply -auto-approve -no-color`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
    
    // Check state file
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(1);
    expect(state.resources[0].type).toBe(resourceType);
  });

  test("computed values match expected format", async () => {
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    const attrs = state.resources[0].instances[0].attributes;
    const expected = JSON.parse(await readFile(join(testDir, "expected_outputs.json"), "utf-8"));
    
    expect(attrs["arn"]).toMatch(/^arn:aws:/);
    expect(attrs["instance_lifecycle"]).toMatch(/.+/);
    expect(attrs["instance_state"]).toMatch(/^(pending|running|stopped|terminated)$/);
    expect(attrs["outpost_arn"]).toMatch(/.+/);
    expect(attrs["password_data"]).toMatch(/.+/);
    expect(attrs["primary_network_interface_id"]).toMatch(/.+/);
    expect(attrs["private_dns"]).toMatch(/.+/);
    expect(attrs["public_dns"]).toMatch(/.+/);
    expect(attrs["public_ip"]).toMatch(/^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/);
    expect(attrs["spot_instance_request_id"]).toMatch(/.+/);
  });

  
  test("references resolve correctly", async () => {
    // TODO: Test with dependencies
  });
  

  test("terraform destroy removes resource", async () => {
    const result = await $`terraform destroy -auto-approve -no-color`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
    
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(0);
  });
});
