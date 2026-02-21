package main

import (
	"testing"
)

func TestProviderDeclaresS3Bucket(t *testing.T) {
	p := Provider()
	res, ok := p.ResourcesMap["aws_s3_bucket"]
	if !ok {
		t.Fatal("Provider does not declare aws_s3_bucket resource")
	}
	if res.Schema == nil {
		t.Fatal("aws_s3_bucket has nil schema")
	}
}

func TestS3BucketSchemaComputedAttributes(t *testing.T) {
	s := resourceS3BucketSchema()
	computedOnly := []string{
		"arn",
		"bucket_domain_name",
		"bucket_regional_domain_name",
		"hosted_zone_id",
		"region",
		"website_domain",
		"website_endpoint",
	}
	for _, name := range computedOnly {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing computed attribute: %s", name)
			continue
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
		if attr.Optional || attr.Required {
			t.Errorf("%s should be Computed-only (not Optional or Required)", name)
		}
	}
}

func TestS3BucketSchemaOptionalComputed(t *testing.T) {
	s := resourceS3BucketSchema()
	optionalComputed := []string{
		"bucket",
		"acl",
		"acceleration_status",
		"bucket_prefix",
		"object_lock_enabled",
		"policy",
		"request_payer",
		"tags_all",
	}
	for _, name := range optionalComputed {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing optional+computed attribute: %s", name)
			continue
		}
		if !attr.Optional {
			t.Errorf("%s should be Optional", name)
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
	}
}

func TestS3BucketSchemaOptionalOnly(t *testing.T) {
	s := resourceS3BucketSchema()

	// force_destroy is Optional but NOT Computed
	attr, ok := s["force_destroy"]
	if !ok {
		t.Fatal("missing force_destroy attribute")
	}
	if !attr.Optional {
		t.Error("force_destroy should be Optional")
	}
	if attr.Computed {
		t.Error("force_destroy should NOT be Computed")
	}

	// tags is Optional but NOT Computed
	tags, ok := s["tags"]
	if !ok {
		t.Fatal("missing tags attribute")
	}
	if !tags.Optional {
		t.Error("tags should be Optional")
	}
	if tags.Computed {
		t.Error("tags should NOT be Computed")
	}
}

func TestS3BucketSchemaNestedBlocks(t *testing.T) {
	s := resourceS3BucketSchema()
	nestedBlocks := []string{
		"cors_rule",
		"grant",
		"lifecycle_rule",
		"logging",
		"object_lock_configuration",
		"replication_configuration",
		"server_side_encryption_configuration",
		"versioning",
		"website",
	}
	for _, name := range nestedBlocks {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing nested block: %s", name)
			continue
		}
		if attr.Elem == nil {
			t.Errorf("%s should have Elem (nested resource)", name)
		}
	}
}

func TestS3BucketSchemaNoRequiredAttributes(t *testing.T) {
	s := resourceS3BucketSchema()
	for name, attr := range s {
		if attr.Required {
			t.Errorf("top-level attribute %s should not be Required (aws_s3_bucket has no required top-level attrs)", name)
		}
	}
}

// --- EC2 Stack: All 4 resources registered ---

func TestProviderDeclaresEC2StackResources(t *testing.T) {
	p := Provider()
	ec2Resources := []string{"aws_vpc", "aws_subnet", "aws_security_group", "aws_instance"}
	for _, name := range ec2Resources {
		res, ok := p.ResourcesMap[name]
		if !ok {
			t.Errorf("Provider does not declare %s resource", name)
			continue
		}
		if res.Schema == nil {
			t.Errorf("%s has nil schema", name)
		}
	}
}

// --- aws_vpc schema tests ---

func TestVpcSchemaComputedOnly(t *testing.T) {
	s := resourceVpcSchema()
	computedOnly := []string{
		"arn",
		"default_network_acl_id",
		"default_route_table_id",
		"default_security_group_id",
		"dhcp_options_id",
		"ipv6_association_id",
		"main_route_table_id",
		"owner_id",
	}
	for _, name := range computedOnly {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing computed attribute: %s", name)
			continue
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
		if attr.Optional || attr.Required {
			t.Errorf("%s should be Computed-only (not Optional or Required)", name)
		}
	}
}

func TestVpcSchemaOptionalComputed(t *testing.T) {
	s := resourceVpcSchema()
	optionalComputed := []string{
		"cidr_block",
		"enable_dns_hostnames",
		"enable_dns_support",
		"instance_tenancy",
		"tags_all",
	}
	for _, name := range optionalComputed {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing optional+computed attribute: %s", name)
			continue
		}
		if !attr.Optional {
			t.Errorf("%s should be Optional", name)
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
	}
}

func TestVpcSchemaNoRequiredAttributes(t *testing.T) {
	s := resourceVpcSchema()
	for name, attr := range s {
		if attr.Required {
			t.Errorf("top-level attribute %s should not be Required (aws_vpc has no required top-level attrs)", name)
		}
	}
}

// --- aws_subnet schema tests ---

func TestSubnetSchemaComputedOnly(t *testing.T) {
	s := resourceSubnetSchema()
	computedOnly := []string{
		"arn",
		"ipv6_cidr_block_association_id",
		"owner_id",
	}
	for _, name := range computedOnly {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing computed attribute: %s", name)
			continue
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
		if attr.Optional || attr.Required {
			t.Errorf("%s should be Computed-only (not Optional or Required)", name)
		}
	}
}

func TestSubnetSchemaVpcIdRequired(t *testing.T) {
	s := resourceSubnetSchema()
	attr, ok := s["vpc_id"]
	if !ok {
		t.Fatal("missing vpc_id attribute")
	}
	if !attr.Required {
		t.Error("vpc_id should be Required")
	}
}

func TestSubnetSchemaOptionalComputed(t *testing.T) {
	s := resourceSubnetSchema()
	optionalComputed := []string{
		"availability_zone",
		"cidr_block",
		"map_public_ip_on_launch",
		"tags_all",
	}
	for _, name := range optionalComputed {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing optional+computed attribute: %s", name)
			continue
		}
		if !attr.Optional {
			t.Errorf("%s should be Optional", name)
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
	}
}

// --- aws_security_group schema tests ---

func TestSecurityGroupSchemaComputedOnly(t *testing.T) {
	s := resourceSecurityGroupSchema()
	computedOnly := []string{
		"arn",
		"owner_id",
	}
	for _, name := range computedOnly {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing computed attribute: %s", name)
			continue
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
		if attr.Optional || attr.Required {
			t.Errorf("%s should be Computed-only (not Optional or Required)", name)
		}
	}
}

func TestSecurityGroupSchemaNestedBlocks(t *testing.T) {
	s := resourceSecurityGroupSchema()
	nestedBlocks := []string{"egress", "ingress"}
	for _, name := range nestedBlocks {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing nested block: %s", name)
			continue
		}
		if attr.Elem == nil {
			t.Errorf("%s should have Elem (nested resource)", name)
		}
		if !attr.Optional {
			t.Errorf("%s should be Optional", name)
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
	}
}

func TestSecurityGroupSchemaNoRequiredAttributes(t *testing.T) {
	s := resourceSecurityGroupSchema()
	for name, attr := range s {
		if attr.Required {
			t.Errorf("top-level attribute %s should not be Required (aws_security_group has no required top-level attrs)", name)
		}
	}
}

// --- aws_instance schema tests ---

func TestInstanceSchemaComputedOnly(t *testing.T) {
	s := resourceInstanceSchema()
	computedOnly := []string{
		"arn",
		"instance_lifecycle",
		"instance_state",
		"outpost_arn",
		"password_data",
		"primary_network_interface_id",
		"private_dns",
		"public_dns",
		"public_ip",
		"spot_instance_request_id",
	}
	for _, name := range computedOnly {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing computed attribute: %s", name)
			continue
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
		if attr.Optional || attr.Required {
			t.Errorf("%s should be Computed-only (not Optional or Required)", name)
		}
	}
}

func TestInstanceSchemaOptionalComputed(t *testing.T) {
	s := resourceInstanceSchema()
	optionalComputed := []string{
		"ami",
		"instance_type",
		"subnet_id",
		"vpc_security_group_ids",
		"availability_zone",
		"tags_all",
	}
	for _, name := range optionalComputed {
		attr, ok := s[name]
		if !ok {
			t.Errorf("missing optional+computed attribute: %s", name)
			continue
		}
		if !attr.Optional {
			t.Errorf("%s should be Optional", name)
		}
		if !attr.Computed {
			t.Errorf("%s should be Computed", name)
		}
	}
}

func TestInstanceSchemaNoRequiredAttributes(t *testing.T) {
	s := resourceInstanceSchema()
	for name, attr := range s {
		if attr.Required {
			t.Errorf("top-level attribute %s should not be Required (aws_instance has no required top-level attrs)", name)
		}
	}
}
