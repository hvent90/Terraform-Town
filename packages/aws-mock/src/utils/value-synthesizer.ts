import type { ResourceDefinition, AttributeInfo } from "./schema-parser";

// Well-known values for common attribute names
const WELL_KNOWN_VALUES: Record<string, string> = {
  cidr_block: "10.0.0.0/16",
  bucket: "test-bucket",
  instance_type: "t2.micro",
  ami: "ami-00000000000000001",
  engine: "mysql",
  engine_version: "8.0",
  allocated_storage: "20",
  db_name: "testdb",
  username: "admin",
  password: "testpassword123",
  master_username: "admin",
  master_password: "testpassword123",
  availability_zone: "us-east-1a",
  region: "us-east-1",
  protocol: "tcp",
  from_port: "0",
  to_port: "65535",
  domain_name: "example.com",
  assume_role_policy: '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
  policy: '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}',
  arn: "arn:aws:service:us-east-1:123456789012:resource/test",
  runtime: "nodejs18.x",
  handler: "index.handler",
  filename: "lambda.zip",
  function_name: "test-function",
  role: "arn:aws:iam::123456789012:role/test-role",
  subnet_id: "subnet-00000000000000001",
  vpc_id: "vpc-00000000000000001",
  security_group_id: "sg-00000000000000001",
  target_group_arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/0000000000000001",
  listener_arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/test/0000000000000001/0000000000000002",
  cluster_identifier: "test-cluster",
  node_type: "cache.t2.micro",
  launch_type: "FARGATE",
  desired_count: "1",
  task_definition: "test-task:1",
  type: "ingress",
  description: "test resource",
};

function synthesizeValue(attr: AttributeInfo, resourceType: string): unknown {
  // Check well-known values first
  const wellKnown = WELL_KNOWN_VALUES[attr.name];
  if (wellKnown !== undefined) {
    if (attr.type === "number") return Number(wellKnown);
    if (attr.type === "bool") return false;
    return wellKnown;
  }

  // Type-based fallback
  if (attr.type === "string") {
    // Use resource type in name to avoid collisions
    if (attr.name === "name" || attr.name.endsWith("_name")) {
      const short = resourceType.replace(/^aws_/, "").replace(/_/g, "-");
      return `test-${short}`;
    }
    return `test-${attr.name}`;
  }
  if (attr.type === "number") return 1;
  if (attr.type === "bool") return false;
  if (attr.type.startsWith("map(")) return {};
  if (attr.type.startsWith("list(")) return [];
  if (attr.type.startsWith("set(")) return [];
  return "test-value";
}

// Optional attrs that hand-written handlers depend on
const REQUIRED_BY_HANDLER: Record<string, string[]> = {
  aws_s3_bucket: ["bucket"],
  aws_iam_role: ["name"],
  aws_instance: ["ami", "instance_type"],
};

export function synthesizeMinimalAttributes(
  schema: ResourceDefinition,
  resourceType: string,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};

  // Fill required args
  for (const arg of schema.requiredArgs) {
    attrs[arg.name] = synthesizeValue(arg, resourceType);
  }

  // Fill handler-required optional attrs
  const extraRequired = REQUIRED_BY_HANDLER[resourceType];
  if (extraRequired) {
    for (const name of extraRequired) {
      if (!(name in attrs)) {
        const optAttr = schema.optionalArgs.find((a) => a.name === name);
        if (optAttr) {
          attrs[name] = synthesizeValue(optAttr, resourceType);
        }
      }
    }
  }

  return attrs;
}

export function synthesizeUpdateAttributes(
  schema: ResourceDefinition,
  resourceType: string,
): Record<string, unknown> {
  // Prefer tags if available
  const hasTags = schema.optionalArgs.some((a) => a.name === "tags");
  if (hasTags) {
    return { tags: { updated: "true" } };
  }

  // Otherwise pick the first mutable optional string attribute
  for (const attr of schema.optionalArgs) {
    if (attr.type === "string" && attr.name !== "id") {
      return { [attr.name]: `updated-${attr.name}` };
    }
  }

  // Last resort
  return { tags: { updated: "true" } };
}
