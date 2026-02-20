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
