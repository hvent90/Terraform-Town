package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceSubnetSchema() map[string]*schema.Schema {
	return map[string]*schema.Schema{
		"arn": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"assign_ipv6_address_on_creation": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"availability_zone": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"availability_zone_id": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"cidr_block": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"customer_owned_ipv4_pool": {
			Type:     schema.TypeString,
			Optional: true,
		},
		"enable_dns64": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"enable_lni_at_device_index": {
			Type:     schema.TypeInt,
			Optional: true,
			Computed: true,
		},
		"enable_resource_name_dns_a_record_on_launch": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"enable_resource_name_dns_aaaa_record_on_launch": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"ipv6_cidr_block": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"ipv6_cidr_block_association_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"ipv6_native": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"map_customer_owned_ip_on_launch": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"map_public_ip_on_launch": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"outpost_arn": {
			Type:     schema.TypeString,
			Optional: true,
		},
		"owner_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"private_dns_hostname_type_on_launch": {
			Type:     schema.TypeString,
			Optional: true,
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
		"vpc_id": {
			Type:     schema.TypeString,
			Required: true,
		},
	}
}
