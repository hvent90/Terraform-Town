import { randomHex } from "../utils/computed";

const ID_PREFIX_MAP: Record<string, string> = {
  aws_vpc: "vpc-",
  aws_subnet: "subnet-",
  aws_security_group: "sg-",
  aws_instance: "i-",
  aws_internet_gateway: "igw-",
  aws_route_table: "rtb-",
  aws_nat_gateway: "nat-",
  aws_network_acl: "acl-",
  aws_network_interface: "eni-",
  aws_eip: "eipalloc-",
  aws_ebs_volume: "vol-",
  aws_ami: "ami-",
  aws_snapshot: "snap-",
  aws_launch_template: "lt-",
  aws_placement_group: "pg-",
  aws_key_pair: "key-",
  aws_customer_gateway: "cgw-",
  aws_vpn_gateway: "vgw-",
  aws_vpn_connection: "vpn-",
  aws_vpc_peering_connection: "pcx-",
  aws_vpc_endpoint: "vpce-",
  aws_dhcp_options: "dopt-",
  aws_flow_log: "fl-",
  aws_lb: "alb-",
  aws_alb: "alb-",
  aws_lb_target_group: "tg-",
  aws_alb_target_group: "tg-",
  aws_autoscaling_group: "asg-",
  aws_ecs_cluster: "cluster-",
  aws_ecs_service: "svc-",
  aws_ecs_task_definition: "task-",
  aws_eks_cluster: "eks-",
  aws_rds_cluster: "cluster-",
  aws_db_instance: "db-",
  aws_elasticache_cluster: "ec-",
  aws_cloudfront_distribution: "E",
  aws_waf_web_acl: "waf-",
  aws_wafv2_web_acl: "wafv2-",
  aws_transit_gateway: "tgw-",
  aws_transit_gateway_attachment: "tgw-attach-",
};

// Resources where a name-like attribute is used as the ID
const NAME_AS_ID_ATTRS: Record<string, string> = {
  aws_s3_bucket: "bucket",
  aws_s3_bucket_policy: "bucket",
  aws_iam_role: "name",
  aws_iam_policy: "name",
  aws_iam_user: "name",
  aws_iam_group: "name",
  aws_iam_instance_profile: "name",
  aws_lambda_function: "function_name",
  aws_lambda_layer_version: "layer_name",
  aws_cloudwatch_log_group: "name",
  aws_cloudwatch_metric_alarm: "alarm_name",
  aws_sns_topic: "name",
  aws_sqs_queue: "name",
  aws_dynamodb_table: "name",
  aws_kinesis_stream: "name",
  aws_ecr_repository: "name",
  aws_ssm_parameter: "name",
  aws_secretsmanager_secret: "name",
  aws_codebuild_project: "name",
  aws_codepipeline: "name",
  aws_elasticsearch_domain: "domain_name",
  aws_opensearch_domain: "domain_name",
  aws_route53_zone: "name",
};

export function generateResourceId(
  resourceType: string,
  attributes: Record<string, unknown>,
): string {
  // Check name-as-id first
  const nameAttr = NAME_AS_ID_ATTRS[resourceType];
  if (nameAttr && attributes[nameAttr]) {
    return String(attributes[nameAttr]);
  }

  // Check prefix map
  const prefix = ID_PREFIX_MAP[resourceType];
  if (prefix) {
    return `${prefix}${randomHex(17)}`;
  }

  // Fallback: plain hex ID
  return randomHex(20);
}
