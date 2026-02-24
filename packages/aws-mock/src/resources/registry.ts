import type { ResourceHandler } from "./types";
import type { StateStore } from "../state/store";
import { getAllResourceTypes } from "../utils/schema-parser";
import { createGenericHandler } from "./generic-handler";

// Hand-written handler factories, keyed by resource type
import { createS3BucketHandler } from "./s3-bucket";
import { createS3BucketPolicyHandler } from "./s3-bucket-policy";
import { createVpcHandler } from "./vpc";
import { createSubnetHandler } from "./subnet";
import { createSecurityGroupHandler } from "./security-group";
import { createInstanceHandler } from "./instance";
import { createIamRoleHandler } from "./iam-role";

const HAND_WRITTEN: Record<string, (store: StateStore) => ResourceHandler> = {
  aws_s3_bucket: createS3BucketHandler,
  aws_s3_bucket_policy: createS3BucketPolicyHandler,
  aws_vpc: createVpcHandler,
  aws_subnet: createSubnetHandler,
  aws_security_group: createSecurityGroupHandler,
  aws_instance: createInstanceHandler,
  aws_iam_role: createIamRoleHandler,
};

export async function buildHandlerRegistry(
  store: StateStore,
): Promise<Record<string, ResourceHandler>> {
  const allTypes = await getAllResourceTypes();
  const handlers: Record<string, ResourceHandler> = {};

  for (const resourceType of allTypes) {
    const handWritten = HAND_WRITTEN[resourceType];
    if (handWritten) {
      handlers[resourceType] = handWritten(store);
    } else {
      handlers[resourceType] = await createGenericHandler(resourceType, store);
    }
  }

  return handlers;
}
