package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceSecurityGroupSchema() map[string]*schema.Schema {
	return map[string]*schema.Schema{
		"arn": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"description": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"egress": {
			Type:     schema.TypeSet,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"cidr_blocks": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"description": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"from_port": {
						Type:     schema.TypeInt,
						Required: true,
					},
					"ipv6_cidr_blocks": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"prefix_list_ids": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"protocol": {
						Type:     schema.TypeString,
						Required: true,
					},
					"security_groups": {
						Type:     schema.TypeSet,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"self": {
						Type:     schema.TypeBool,
						Optional: true,
					},
					"to_port": {
						Type:     schema.TypeInt,
						Required: true,
					},
				},
			},
		},
		"ingress": {
			Type:     schema.TypeSet,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"cidr_blocks": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"description": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"from_port": {
						Type:     schema.TypeInt,
						Required: true,
					},
					"ipv6_cidr_blocks": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"prefix_list_ids": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"protocol": {
						Type:     schema.TypeString,
						Required: true,
					},
					"security_groups": {
						Type:     schema.TypeSet,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"self": {
						Type:     schema.TypeBool,
						Optional: true,
					},
					"to_port": {
						Type:     schema.TypeInt,
						Required: true,
					},
				},
			},
		},
		"name": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"name_prefix": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"owner_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"revoke_rules_on_delete": {
			Type:     schema.TypeBool,
			Optional: true,
		},
		"tags": {
			Type:     schema.TypeMap,
			Optional: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
		"tags_all": {
			Type:     schema.TypeMap,
			Optional: true,
			Computed: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
		"vpc_id": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
	}
}
