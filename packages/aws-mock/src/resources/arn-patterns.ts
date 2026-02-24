const MOCK_ACCOUNT_ID = "123456789012";

type ArnTemplate = (resourceId: string, region: string, account: string) => string;

// Service-specific ARN patterns
const ARN_PATTERNS: Record<string, ArnTemplate> = {
  // S3 — global, no region/account
  aws_s3_bucket: (id) => `arn:aws:s3:::${id}`,
  aws_s3_bucket_policy: (id) => `arn:aws:s3:::${id}`,

  // IAM — global, no region
  aws_iam_role: (id, _r, acct) => `arn:aws:iam::${acct}:role/${id}`,
  aws_iam_policy: (id, _r, acct) => `arn:aws:iam::${acct}:policy/${id}`,
  aws_iam_user: (id, _r, acct) => `arn:aws:iam::${acct}:user/${id}`,
  aws_iam_group: (id, _r, acct) => `arn:aws:iam::${acct}:group/${id}`,
  aws_iam_instance_profile: (id, _r, acct) =>
    `arn:aws:iam::${acct}:instance-profile/${id}`,

  // EC2
  aws_vpc: (id, r, acct) => `arn:aws:ec2:${r}:${acct}:vpc/${id}`,
  aws_subnet: (id, r, acct) => `arn:aws:ec2:${r}:${acct}:subnet/${id}`,
  aws_security_group: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:security-group/${id}`,
  aws_instance: (id, r, acct) => `arn:aws:ec2:${r}:${acct}:instance/${id}`,
  aws_internet_gateway: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:internet-gateway/${id}`,
  aws_route_table: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:route-table/${id}`,
  aws_nat_gateway: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:natgateway/${id}`,
  aws_network_acl: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:network-acl/${id}`,
  aws_network_interface: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:network-interface/${id}`,
  aws_eip: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:elastic-ip/${id}`,
  aws_ebs_volume: (id, r, acct) => `arn:aws:ec2:${r}:${acct}:volume/${id}`,
  aws_ami: (id, r, acct) => `arn:aws:ec2:${r}:${acct}:image/${id}`,
  aws_key_pair: (id, r, acct) => `arn:aws:ec2:${r}:${acct}:key-pair/${id}`,
  aws_launch_template: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:launch-template/${id}`,

  // Lambda
  aws_lambda_function: (id, r, acct) =>
    `arn:aws:lambda:${r}:${acct}:function:${id}`,
  aws_lambda_layer_version: (id, r, acct) =>
    `arn:aws:lambda:${r}:${acct}:layer:${id}`,

  // SQS / SNS
  aws_sqs_queue: (id, r, acct) => `arn:aws:sqs:${r}:${acct}:${id}`,
  aws_sns_topic: (id, r, acct) => `arn:aws:sns:${r}:${acct}:${id}`,

  // DynamoDB
  aws_dynamodb_table: (id, r, acct) =>
    `arn:aws:dynamodb:${r}:${acct}:table/${id}`,

  // RDS
  aws_db_instance: (id, r, acct) => `arn:aws:rds:${r}:${acct}:db:${id}`,
  aws_rds_cluster: (id, r, acct) =>
    `arn:aws:rds:${r}:${acct}:cluster:${id}`,

  // ECS
  aws_ecs_cluster: (id, r, acct) =>
    `arn:aws:ecs:${r}:${acct}:cluster/${id}`,
  aws_ecs_service: (id, r, acct) =>
    `arn:aws:ecs:${r}:${acct}:service/${id}`,
  aws_ecs_task_definition: (id, r, acct) =>
    `arn:aws:ecs:${r}:${acct}:task-definition/${id}`,

  // EKS
  aws_eks_cluster: (id, r, acct) =>
    `arn:aws:eks:${r}:${acct}:cluster/${id}`,

  // CloudWatch
  aws_cloudwatch_log_group: (id, r, acct) =>
    `arn:aws:logs:${r}:${acct}:log-group:${id}`,
  aws_cloudwatch_metric_alarm: (id, r, acct) =>
    `arn:aws:cloudwatch:${r}:${acct}:alarm:${id}`,

  // Kinesis
  aws_kinesis_stream: (id, r, acct) =>
    `arn:aws:kinesis:${r}:${acct}:stream/${id}`,

  // ECR
  aws_ecr_repository: (id, r, acct) =>
    `arn:aws:ecr:${r}:${acct}:repository/${id}`,

  // SSM
  aws_ssm_parameter: (id, r, acct) =>
    `arn:aws:ssm:${r}:${acct}:parameter/${id}`,

  // Secrets Manager
  aws_secretsmanager_secret: (id, r, acct) =>
    `arn:aws:secretsmanager:${r}:${acct}:secret:${id}`,

  // ElastiCache
  aws_elasticache_cluster: (id, r, acct) =>
    `arn:aws:elasticache:${r}:${acct}:cluster:${id}`,

  // CodeBuild / CodePipeline
  aws_codebuild_project: (id, r, acct) =>
    `arn:aws:codebuild:${r}:${acct}:project/${id}`,
  aws_codepipeline: (id, r, acct) =>
    `arn:aws:codepipeline:${r}:${acct}:${id}`,

  // Elasticsearch / OpenSearch
  aws_elasticsearch_domain: (id, r, acct) =>
    `arn:aws:es:${r}:${acct}:domain/${id}`,
  aws_opensearch_domain: (id, r, acct) =>
    `arn:aws:es:${r}:${acct}:domain/${id}`,

  // Route53
  aws_route53_zone: (id, _r, _acct) =>
    `arn:aws:route53:::hostedzone/${id}`,

  // CloudFront
  aws_cloudfront_distribution: (id, _r, acct) =>
    `arn:aws:cloudfront::${acct}:distribution/${id}`,

  // ALB/NLB
  aws_lb: (id, r, acct) =>
    `arn:aws:elasticloadbalancing:${r}:${acct}:loadbalancer/${id}`,
  aws_alb: (id, r, acct) =>
    `arn:aws:elasticloadbalancing:${r}:${acct}:loadbalancer/${id}`,
  aws_lb_target_group: (id, r, acct) =>
    `arn:aws:elasticloadbalancing:${r}:${acct}:targetgroup/${id}`,
  aws_alb_target_group: (id, r, acct) =>
    `arn:aws:elasticloadbalancing:${r}:${acct}:targetgroup/${id}`,

  // Auto Scaling
  aws_autoscaling_group: (id, r, acct) =>
    `arn:aws:autoscaling:${r}:${acct}:autoScalingGroup:${id}`,

  // VPN
  aws_vpn_gateway: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:vpn-gateway/${id}`,
  aws_vpn_connection: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:vpn-connection/${id}`,
  aws_customer_gateway: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:customer-gateway/${id}`,
  aws_vpc_peering_connection: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:vpc-peering-connection/${id}`,
  aws_vpc_endpoint: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:vpc-endpoint/${id}`,

  // Transit Gateway
  aws_transit_gateway: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:transit-gateway/${id}`,
  aws_transit_gateway_attachment: (id, r, acct) =>
    `arn:aws:ec2:${r}:${acct}:transit-gateway-attachment/${id}`,

  // WAF
  aws_waf_web_acl: (id, r, acct) =>
    `arn:aws:waf:${r}:${acct}:webacl/${id}`,
  aws_wafv2_web_acl: (id, r, acct) =>
    `arn:aws:wafv2:${r}:${acct}:webacl/${id}`,
};

export function generateResourceArn(
  resourceType: string,
  resourceId: string,
  region: string,
): string | null {
  const template = ARN_PATTERNS[resourceType];
  if (!template) return null;
  return template(resourceId, region, MOCK_ACCOUNT_ID);
}
