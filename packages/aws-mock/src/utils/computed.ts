export function generateS3Arn(bucketName: string): string {
  return `arn:aws:s3:::${bucketName}`;
}

export function generateS3Id(bucketName: string): string {
  return bucketName;
}

export function generateS3Domain(bucketName: string, region: string): string {
  if (region === "us-east-1") {
    return `${bucketName}.s3.amazonaws.com`;
  }
  return `${bucketName}.s3.${region}.amazonaws.com`;
}

const MOCK_ACCOUNT_ID = "123456789012";

export function generateAccountId(): string {
  return MOCK_ACCOUNT_ID;
}
