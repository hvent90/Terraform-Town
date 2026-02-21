/**
 * Validates an S3 bucket name follows DNS naming rules.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateBucketName(name: string): string | null {
  if (name.length < 3 || name.length > 63) {
    return `Bucket name must be between 3 and 63 characters long, got ${name.length}`;
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return `Bucket name must contain only lowercase letters, numbers, and hyphens`;
  }

  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
    return `Bucket name must start and end with a letter or number`;
  }

  return null;
}

/**
 * Validates that a string is valid JSON (for IAM policies, S3 bucket policies, etc.).
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePolicyJson(json: string): string | null {
  try {
    JSON.parse(json);
    return null;
  } catch {
    return "Invalid JSON: must be a valid JSON policy document";
  }
}

const VALID_REGIONS = new Set([
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "af-south-1",
  "ap-east-1",
  "ap-south-1",
  "ap-south-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-southeast-3",
  "ap-southeast-4",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "ca-central-1",
  "ca-west-1",
  "eu-central-1",
  "eu-central-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-south-1",
  "eu-south-2",
  "eu-north-1",
  "il-central-1",
  "me-south-1",
  "me-central-1",
  "sa-east-1",
]);

/**
 * Validates that a string is a valid AWS region code.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateRegion(region: string): string | null {
  if (!VALID_REGIONS.has(region)) {
    return `Invalid region: "${region}" is not a valid AWS region`;
  }
  return null;
}
