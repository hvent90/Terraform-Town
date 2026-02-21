import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import {
  generateSubnetId,
  generateSubnetArn,
  generateSubnetIpv6AssociationId,
  generateAccountId,
} from "../utils/computed";

const DEFAULT_REGION = "us-east-1";

function buildComputedAttributes(subnetId: string, region: string): Record<string, unknown> {
  return {
    id: subnetId,
    arn: generateSubnetArn(subnetId, region),
    ipv6_cidr_block_association_id: generateSubnetIpv6AssociationId(),
    owner_id: generateAccountId(),
  };
}

export function createSubnetHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const subnetId = generateSubnetId();
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        ...buildComputedAttributes(subnetId, region),
        assign_ipv6_address_on_creation: ctx.attributes.assign_ipv6_address_on_creation ?? false,
        enable_dns64: ctx.attributes.enable_dns64 ?? false,
        enable_resource_name_dns_a_record_on_launch:
          ctx.attributes.enable_resource_name_dns_a_record_on_launch ?? false,
        enable_resource_name_dns_aaaa_record_on_launch:
          ctx.attributes.enable_resource_name_dns_aaaa_record_on_launch ?? false,
        ipv6_native: ctx.attributes.ipv6_native ?? false,
        map_customer_owned_ip_on_launch: ctx.attributes.map_customer_owned_ip_on_launch ?? false,
        map_public_ip_on_launch: ctx.attributes.map_public_ip_on_launch ?? false,
        private_dns_hostname_type_on_launch:
          ctx.attributes.private_dns_hostname_type_on_launch ?? "ip-name",
        tags,
        tags_all: { ...tags },
      };

      await store.createResource("aws_subnet", subnetId, attributes);

      return { id: subnetId, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_subnet", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const existing = await store.readResource("aws_subnet", id);
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...existing?.attributes,
        ...ctx.attributes,
        arn: generateSubnetArn(id, region),
        id,
        owner_id: generateAccountId(),
        tags,
        tags_all: { ...tags },
      };

      await store.updateResource("aws_subnet", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_subnet", id);
    },
  };
}
