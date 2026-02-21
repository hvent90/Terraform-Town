package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceS3BucketPolicySchema() map[string]*schema.Schema {
	return map[string]*schema.Schema{
		"bucket": {
			Type:     schema.TypeString,
			Required: true,
		},
		"policy": {
			Type:     schema.TypeString,
			Required: true,
		},
	}
}
