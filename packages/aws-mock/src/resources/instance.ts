import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import {
  generateInstanceId,
  generateInstanceArn,
  generateEniId,
  generatePrivateIp,
  generatePublicIp,
  generatePrivateDns,
  generatePublicDns,
} from "../utils/computed";
import { validateReferenceExists } from "../utils/validation";

const DEFAULT_REGION = "us-east-1";

function buildComputedAttributes(
  instanceId: string,
  region: string,
  associatePublicIp: boolean,
): Record<string, unknown> {
  const privateIp = generatePrivateIp();
  const publicIp = associatePublicIp ? generatePublicIp() : "";
  const publicDns = publicIp ? generatePublicDns(publicIp) : "";

  return {
    id: instanceId,
    arn: generateInstanceArn(instanceId, region),
    instance_state: "running",
    private_ip: privateIp,
    private_dns: generatePrivateDns(privateIp),
    public_ip: publicIp,
    public_dns: publicDns,
    primary_network_interface_id: generateEniId(),
    instance_lifecycle: "",
    outpost_arn: "",
    password_data: "",
    spot_instance_request_id: "",
  };
}

export function createInstanceHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      // Validate references
      const subnetId = ctx.attributes.subnet_id as string | undefined;
      if (subnetId) {
        const error = await validateReferenceExists(store, "aws_subnet", subnetId, "subnet_id");
        if (error) throw new Error(error);
      }

      const sgIds = ctx.attributes.vpc_security_group_ids as string[] | undefined;
      if (sgIds && sgIds.length > 0) {
        for (const sgId of sgIds) {
          const error = await validateReferenceExists(
            store,
            "aws_security_group",
            sgId,
            "vpc_security_group_ids",
          );
          if (error) throw new Error(error);
        }
      }

      const instanceId = generateInstanceId();
      const region = DEFAULT_REGION;
      const associatePublicIp = (ctx.attributes.associate_public_ip_address as boolean) ?? false;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        ...buildComputedAttributes(instanceId, region, associatePublicIp),
        associate_public_ip_address: associatePublicIp,
        ebs_optimized: ctx.attributes.ebs_optimized ?? false,
        monitoring: ctx.attributes.monitoring ?? false,
        source_dest_check: ctx.attributes.source_dest_check ?? true,
        tags,
        tags_all: { ...tags },
      };

      await store.createResource("aws_instance", instanceId, attributes);

      return { id: instanceId, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_instance", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const existing = await store.readResource("aws_instance", id);
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...existing?.attributes,
        ...ctx.attributes,
        arn: generateInstanceArn(id, region),
        id,
        tags,
        tags_all: { ...tags },
      };

      await store.updateResource("aws_instance", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_instance", id);
    },
  };
}
