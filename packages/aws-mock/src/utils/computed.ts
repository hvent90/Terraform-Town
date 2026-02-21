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

export function generateInstanceId(): string {
  return `i-${randomHex(17)}`;
}

export function generateInstanceArn(instanceId: string, region: string): string {
  return `arn:aws:ec2:${region}:${MOCK_ACCOUNT_ID}:instance/${instanceId}`;
}

export function generateEniId(): string {
  return `eni-${randomHex(17)}`;
}

export function generatePrivateIp(): string {
  const octet2 = Math.floor(Math.random() * 256);
  const octet3 = Math.floor(Math.random() * 254) + 1;
  return `10.0.${octet2}.${octet3}`;
}

export function generatePublicIp(): string {
  const octet1 = Math.floor(Math.random() * 223) + 1;
  const octet2 = Math.floor(Math.random() * 256);
  const octet3 = Math.floor(Math.random() * 256);
  const octet4 = Math.floor(Math.random() * 254) + 1;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

export function generatePrivateDns(privateIp: string): string {
  const dashed = privateIp.replace(/\./g, "-");
  return `ip-${dashed}.ec2.internal`;
}

export function generatePublicDns(publicIp: string): string {
  const dashed = publicIp.replace(/\./g, "-");
  return `ec2-${dashed}.compute-1.amazonaws.com`;
}

export function generateIamRoleArn(roleName: string): string {
  return `arn:aws:iam::${MOCK_ACCOUNT_ID}:role/${roleName}`;
}

export function generateIamUniqueId(): string {
  return `AROA${randomHex(16).toUpperCase()}`;
}
