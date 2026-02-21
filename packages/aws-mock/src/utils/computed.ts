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

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export function generateVpcId(): string {
  return `vpc-${randomHex(17)}`;
}

export function generateVpcArn(vpcId: string, region: string): string {
  return `arn:aws:ec2:${region}:${MOCK_ACCOUNT_ID}:vpc/${vpcId}`;
}

export function generateNetworkAclId(): string {
  return `acl-${randomHex(17)}`;
}

export function generateRouteTableId(): string {
  return `rtb-${randomHex(17)}`;
}

export function generateSecurityGroupId(): string {
  return `sg-${randomHex(17)}`;
}

export function generateDhcpOptionsId(): string {
  return `dopt-${randomHex(17)}`;
}

export function generateIpv6AssociationId(): string {
  return `vpc-cidr-assoc-${randomHex(17)}`;
}

export function generateSubnetId(): string {
  return `subnet-${randomHex(17)}`;
}

export function generateSubnetArn(subnetId: string, region: string): string {
  return `arn:aws:ec2:${region}:${MOCK_ACCOUNT_ID}:subnet/${subnetId}`;
}

export function generateSubnetIpv6AssociationId(): string {
  return `subnet-cidr-assoc-${randomHex(17)}`;
}

export function generateSecurityGroupArn(sgId: string, region: string): string {
  return `arn:aws:ec2:${region}:${MOCK_ACCOUNT_ID}:security-group/${sgId}`;
}
