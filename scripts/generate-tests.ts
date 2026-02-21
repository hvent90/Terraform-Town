#!/usr/bin/env bun
/**
 * Generate integration test suite from AWS provider schema
 * Usage: bun run scripts/generate-tests.ts <resource_type>
 * Example: bun run scripts/generate-tests.ts aws_instance
 */

import { readFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";

interface SchemaAttribute {
  type: string;
  description?: string;
  required?: boolean;
  optional?: boolean;
  computed?: boolean;
  sensitive?: boolean;
}

interface BlockType {
  nesting_mode: "single" | "list" | "set";
  block: Block;
  min_items?: number;
  max_items?: number;
}

interface Block {
  attributes: Record<string, SchemaAttribute>;
  block_types?: Record<string, BlockType>;
}

interface ResourceSchema {
  version: number;
  block: Block;
}

interface ProviderSchema {
  format_version: string;
  provider_schemas: Record<string, {
    resource_schemas: Record<string, ResourceSchema>;
    data_source_schemas?: Record<string, ResourceSchema>;
  }>;
}

// Computed value generators per resource type
const COMPUTED_GENERATORS: Record<string, (attrs: Record<string, any>) => Record<string, string>> = {
  aws_instance: (attrs) => ({
    id: `i-${generateHex(17)}`,
    arn: `arn:aws:ec2:us-east-1:123456789012:instance/i-${generateHex(17)}`,
    primary_network_interface_id: `eni-${generateHex(17)}`,
    private_ip: generatePrivateIP(),
    public_ip: attrs.associate_public_ip_address ? generatePublicIP() : "",
    instance_state: "running",
  }),
  aws_vpc: (attrs) => ({
    id: `vpc-${generateHex(17)}`,
    arn: `arn:aws:ec2:us-east-1:123456789012:vpc/vpc-${generateHex(17)}`,
    cidr_block: attrs.cidr_block || "10.0.0.0/16",
    default_network_acl_id: `acl-${generateHex(17)}`,
    default_route_table_id: `rtb-${generateHex(17)}`,
    default_security_group_id: `sg-${generateHex(17)}`,
    owner_id: "123456789012",
  }),
  aws_subnet: (attrs) => ({
    id: `subnet-${generateHex(17)}`,
    arn: `arn:aws:ec2:us-east-1:123456789012:subnet/subnet-${generateHex(17)}`,
    cidr_block: attrs.cidr_block || "10.0.1.0/24",
    vpc_id: attrs.vpc_id || "",
    availability_zone: attrs.availability_zone || "us-east-1a",
    owner_id: "123456789012",
  }),
  aws_security_group: (attrs) => ({
    id: `sg-${generateHex(17)}`,
    arn: `arn:aws:ec2:us-east-1:123456789012:security-group/sg-${generateHex(17)}`,
    vpc_id: attrs.vpc_id || "",
    owner_id: "123456789012",
  }),
  aws_iam_role: (attrs) => ({
    id: `arn:aws:iam::123456789012:role/${attrs.name || "role"}`,
    arn: `arn:aws:iam::123456789012:role/${attrs.name || "role"}`,
    name: attrs.name || "role",
    unique_id: `AROA${generateHex(16)}`,
  }),
  aws_lambda_function: (attrs) => ({
    id: attrs.function_name || "function",
    arn: `arn:aws:lambda:us-east-1:123456789012:function:${attrs.function_name || "function"}`,
    invoke_arn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${attrs.function_name || "function"}/invocations`,
    qualified_arn: `arn:aws:lambda:us-east-1:123456789012:function:${attrs.function_name || "function"}:$LATEST`,
  }),
  // Default fallback
  _default: (attrs) => ({
    id: `${generateHex(8)}`,
    arn: `arn:aws:mock:us-east-1:123456789012:resource/${generateHex(8)}`,
  }),
};

// Reference relationships - which attributes reference other resources
const REFERENCE_PATTERNS: Record<string, Record<string, string>> = {
  aws_instance: {
    subnet_id: "aws_subnet",
    vpc_security_group_ids: "aws_security_group",
    iam_instance_profile: "aws_iam_instance_profile",
    key_name: "aws_key_pair",
  },
  aws_subnet: {
    vpc_id: "aws_vpc",
  },
  aws_security_group: {
    vpc_id: "aws_vpc",
  },
  aws_security_group_rule: {
    security_group_id: "aws_security_group",
    source_security_group_id: "aws_security_group",
  },
  aws_iam_role_policy_attachment: {
    role: "aws_iam_role",
    policy_arn: "aws_iam_policy",
  },
  aws_lambda_function: {
    role: "aws_iam_role",
    // vpc_config references handled specially in nested blocks
  },
};

// Default values for common attributes
const DEFAULT_VALUES: Record<string, any> = {
  // EC2
  instance_type: "t3.micro",
  ami: "ami-0c55b159cbfafe1f0", // Amazon Linux 2 in us-east-1
  associate_public_ip_address: true,
  
  // Networking
  cidr_block: "10.0.0.0/16",
  availability_zone: "us-east-1a",
  
  // IAM
  assume_role_policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "ec2.amazonaws.com" },
    }],
  }),
  
  // Lambda
  runtime: "nodejs18.x",
  handler: "index.handler",
  filename: "function.zip",
  source_code_hash: "placeholder",
};

function generateHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generatePrivateIP(): string {
  return `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
}

function generatePublicIP(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function parseResourceSchema(schemaPath: string, resourceType: string): Block | null {
  const schema: ProviderSchema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const providerKey = "registry.terraform.io/hashicorp/aws";
  
  if (!schema.provider_schemas[providerKey]?.resource_schemas?.[resourceType]) {
    return null;
  }
  
  return schema.provider_schemas[providerKey].resource_schemas[resourceType].block;
}

function analyzeSchema(block: Block): {
  required: string[];
  optional: string[];
  computed: string[];
  nestedBlocks: string[];
} {
  const required: string[] = [];
  const optional: string[] = [];
  const computed: string[] = [];
  const nestedBlocks = block.block_types ? Object.keys(block.block_types) : [];
  
  for (const [name, attr] of Object.entries(block.attributes)) {
    if (name === "id") continue; // Always computed, handled separately
    
    if (attr.required) {
      required.push(name);
    } else if (attr.computed && !attr.optional) {
      computed.push(name);
    } else if (attr.optional) {
      optional.push(name);
    }
  }
  
  return { required, optional, computed, nestedBlocks };
}

function generateMinimalConfig(resourceType: string, block: Block): string {
  const { required, optional, nestedBlocks } = analyzeSchema(block);
  const lines: string[] = [
    `resource "${resourceType}" "test" {`,
  ];
  
  // Add required attributes with defaults
  for (const attr of required) {
    const value = DEFAULT_VALUES[attr] ?? `"placeholder-${attr}"`;
    const formatted = typeof value === "string" && !value.startsWith("[")
      ? value.startsWith('"') ? value : `"${value}"`
      : JSON.stringify(value);
    lines.push(`  ${attr} = ${formatted}`);
  }
  
  // Add a few optional attributes with defaults
  const optionalWithDefaults = optional.filter(a => DEFAULT_VALUES[a] !== undefined).slice(0, 2);
  for (const attr of optionalWithDefaults) {
    if (!required.includes(attr)) {
      const value = DEFAULT_VALUES[attr];
      const formatted = typeof value === "string" && !value.startsWith("[")
        ? value.startsWith('"') ? value : `"${value}"`
        : JSON.stringify(value);
      lines.push(`  ${attr} = ${formatted}`);
    }
  }
  
  lines.push("}");
  return lines.join("\n");
}

function generateConfigWithReferences(
  resourceType: string,
  block: Block,
  references: Record<string, string>
): { config: string; dependencies: string[] } {
  const { required, optional } = analyzeSchema(block);
  const dependencies: string[] = [];
  const lines: string[] = [
    `resource "${resourceType}" "test" {`,
  ];
  
  for (const attr of required) {
    if (references[attr]) {
      const depType = references[attr];
      dependencies.push(depType);
      lines.push(`  ${attr} = ${depType}.test.id`);
    } else if (DEFAULT_VALUES[attr] !== undefined) {
      const value = DEFAULT_VALUES[attr];
      const formatted = typeof value === "string" && !value.startsWith("[")
        ? value.startsWith('"') ? value : `"${value}"`
        : JSON.stringify(value);
      lines.push(`  ${attr} = ${formatted}`);
    } else {
      lines.push(`  ${attr} = "placeholder"`);
    }
  }
  
  lines.push("}");
  
  return { config: lines.join("\n"), dependencies };
}

function generateExpectedOutputs(
  resourceType: string,
  attrs: Record<string, any>
): Record<string, string> {
  const generator = COMPUTED_GENERATORS[resourceType] || COMPUTED_GENERATORS._default;
  return generator(attrs);
}

function generateTestSuite(schemaPath: string, resourceType: string, outputDir: string) {
  const block = parseResourceSchema(schemaPath, resourceType);
  if (!block) {
    console.error(`Resource type ${resourceType} not found in schema`);
    process.exit(1);
  }
  
  const { required, optional, computed, nestedBlocks } = analyzeSchema(block);
  const resourceDir = join(outputDir, resourceType);
  mkdirSync(resourceDir, { recursive: true });
  
  console.log(`Generating test suite for ${resourceType}...`);
  console.log(`  Required: ${required.length} attributes`);
  console.log(`  Optional: ${optional.length} attributes`);
  console.log(`  Computed: ${computed.length} attributes`);
  console.log(`  Nested blocks: ${nestedBlocks.length}`);
  
  // 1. Minimal config
  const minimalConfig = generateMinimalConfig(resourceType, block);
  writeFileSync(join(resourceDir, "minimal.tf"), minimalConfig);
  
  // 2. Expected outputs
  const expectedOutputs = generateExpectedOutputs(resourceType, {});
  writeFileSync(join(resourceDir, "expected_outputs.json"), JSON.stringify(expectedOutputs, null, 2));
  
  // 3. Config with references (if applicable)
  const references = REFERENCE_PATTERNS[resourceType] || {};
  if (Object.keys(references).length > 0) {
    const { config, dependencies } = generateConfigWithReferences(resourceType, block, references);
    writeFileSync(join(resourceDir, "with_references.tf"), config);
    writeFileSync(join(resourceDir, "dependencies.json"), JSON.stringify({ dependencies }, null, 2));
  }
  
  // 4. Test metadata
  const metadata = {
    resourceType,
    required,
    optional,
    computed,
    nestedBlocks,
    referencePatterns: references,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(resourceDir, "metadata.json"), JSON.stringify(metadata, null, 2));
  
  // 5. Generate test file
  const testContent = generateTestFile(resourceType, required, computed, references);
  writeFileSync(join(resourceDir, `${resourceType}.test.ts`), testContent);
  
  console.log(`\nGenerated files in ${resourceDir}:`);
  console.log(`  - minimal.tf`);
  console.log(`  - expected_outputs.json`);
  if (Object.keys(references).length > 0) {
    console.log(`  - with_references.tf`);
    console.log(`  - dependencies.json`);
  }
  console.log(`  - metadata.json`);
  console.log(`  - ${resourceType}.test.ts`);
}

function generateTestFile(
  resourceType: string,
  required: string[],
  computed: string[],
  references: Record<string, string>
): string {
  const hasReferences = Object.keys(references).length > 0;
  
  return `import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { join } from "path";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { startBackend, stopBackend } from "../helpers";

const resourceType = "${resourceType}";

describe(\`\${resourceType} integration\`, () => {
  let testDir: string;
  let statePath: string;
  let backendUrl: string;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), "tf-test-"));
    statePath = join(testDir, "state.json");
    backendUrl = await startBackend(statePath);
    
    // Copy test configs
    await $\`cp \${import.meta.dir}/minimal.tf \${testDir}/\`;
    await $\`cp \${import.meta.dir}/expected_outputs.json \${testDir}/\`;
  });

  afterAll(async () => {
    stopBackend();
    await rm(testDir, { recursive: true });
  });

  test("terraform init succeeds", async () => {
    const result = await $\`terraform init -no-color\`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
  });

  test("terraform plan shows resource to create", async () => {
    const result = await $\`terraform plan -no-color\`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 to add");
  });

  test("terraform apply creates resource", async () => {
    const result = await $\`terraform apply -auto-approve -no-color\`.cwd(testDir).quiet();
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
    
    ${computed.map(attr => `expect(attrs["${attr}"]).toMatch(/${getExpectedPattern(attr)}/);`).join("\n    ")}
  });

  ${hasReferences ? `
  test("references resolve correctly", async () => {
    // TODO: Test with dependencies
  });
  ` : ""}

  test("terraform destroy removes resource", async () => {
    const result = await $\`terraform destroy -auto-approve -no-color\`.cwd(testDir).quiet();
    expect(result.exitCode).toBe(0);
    
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(0);
  });
});
`;
}

function getExpectedPattern(attr: string): string {
  const patterns: Record<string, string> = {
    id: "^[a-z]+-[a-f0-9]+$",
    arn: "^arn:aws:",
    private_ip: "^[0-9]+\\\\.[0-9]+\\\\.[0-9]+\\\\.[0-9]+$",
    public_ip: "^[0-9]+\\\\.[0-9]+\\\\.[0-9]+\\\\.[0-9]+$",
    instance_state: "^(pending|running|stopped|terminated)$",
  };
  return patterns[attr] || ".+";
}

// CLI
const resourceType = process.argv[2];
if (!resourceType) {
  console.error("Usage: bun run scripts/generate-tests.ts <resource_type>");
  console.error("Example: bun run scripts/generate-tests.ts aws_instance");
  process.exit(1);
}

const schemaPath = join(import.meta.dir, "..", "packages", "aws-mock", "schema", "aws-provider-schema.json");
const outputDir = join(import.meta.dir, "..", "tests", "generated");

generateTestSuite(schemaPath, resourceType, outputDir);
