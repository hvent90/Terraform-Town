package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceVpcSchema() map[string]*schema.Schema {
	return map[string]*schema.Schema{
		"arn": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"assign_generated_ipv6_cidr_block": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"cidr_block": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"default_network_acl_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"default_route_table_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"default_security_group_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"dhcp_options_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"enable_dns_hostnames": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"enable_dns_support": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"enable_network_address_usage_metrics": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"instance_tenancy": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"ipv4_ipam_pool_id": {
			Type:     schema.TypeString,
			Optional: true,
		},
		"ipv4_netmask_length": {
			Type:     schema.TypeInt,
			Optional: true,
		},
		"ipv6_association_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"ipv6_cidr_block": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"ipv6_cidr_block_network_border_group": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"ipv6_ipam_pool_id": {
			Type:     schema.TypeString,
			Optional: true,
		},
		"ipv6_netmask_length": {
			Type:     schema.TypeInt,
			Optional: true,
		},
		"main_route_table_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"owner_id": {
			Type:     schema.TypeString,
			Computed: true,
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
	}
}
