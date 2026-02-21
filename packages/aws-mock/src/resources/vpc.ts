import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import {
  generateVpcId,
  generateVpcArn,
  generateNetworkAclId,
  generateRouteTableId,
  generateSecurityGroupId,
  generateDhcpOptionsId,
  generateIpv6AssociationId,
  generateAccountId,
} from "../utils/computed";

const DEFAULT_REGION = "us-east-1";

function buildComputedAttributes(vpcId: string, region: string): Record<string, unknown> {
  return {
    id: vpcId,
    arn: generateVpcArn(vpcId, region),
    default_network_acl_id: generateNetworkAclId(),
    default_route_table_id: generateRouteTableId(),
    default_security_group_id: generateSecurityGroupId(),
    dhcp_options_id: generateDhcpOptionsId(),
    ipv6_association_id: generateIpv6AssociationId(),
    main_route_table_id: generateRouteTableId(),
    owner_id: generateAccountId(),
  };
}

export function createVpcHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const vpcId = generateVpcId();
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        ...buildComputedAttributes(vpcId, region),
        enable_dns_support: ctx.attributes.enable_dns_support ?? true,
        enable_dns_hostnames: ctx.attributes.enable_dns_hostnames ?? false,
        instance_tenancy: ctx.attributes.instance_tenancy ?? "default",
        assign_generated_ipv6_cidr_block: ctx.attributes.assign_generated_ipv6_cidr_block ?? false,
        enable_network_address_usage_metrics:
          ctx.attributes.enable_network_address_usage_metrics ?? false,
        tags,
        tags_all: { ...tags },
      };

      await store.createResource("aws_vpc", vpcId, attributes);

      return { id: vpcId, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_vpc", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const existing = await store.readResource("aws_vpc", id);
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...existing?.attributes,
        ...ctx.attributes,
        arn: generateVpcArn(id, region),
        id,
        owner_id: generateAccountId(),
        tags,
        tags_all: { ...tags },
      };

      await store.updateResource("aws_vpc", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_vpc", id);
    },
  };
}
