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
