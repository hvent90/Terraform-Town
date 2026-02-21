package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceInstanceSchema() map[string]*schema.Schema {
	return map[string]*schema.Schema{
		"ami": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"arn": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"associate_public_ip_address": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"availability_zone": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"cpu_core_count": {
			Type:     schema.TypeInt,
			Optional: true,
			Computed: true,
		},
		"cpu_threads_per_core": {
			Type:     schema.TypeInt,
			Optional: true,
			Computed: true,
		},
		"disable_api_stop": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"disable_api_termination": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"ebs_optimized": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"get_password_data": {
			Type:     schema.TypeBool,
			Optional: true,
		},
		"hibernation": {
			Type:     schema.TypeBool,
			Optional: true,
		},
		"host_id": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"host_resource_group_arn": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"iam_instance_profile": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"instance_initiated_shutdown_behavior": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"instance_lifecycle": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"instance_state": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"instance_type": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"ipv6_address_count": {
			Type:     schema.TypeInt,
			Optional: true,
			Computed: true,
		},
		"ipv6_addresses": {
			Type:     schema.TypeList,
			Optional: true,
			Computed: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
		"key_name": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"monitoring": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"outpost_arn": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"password_data": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"placement_group": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"placement_partition_number": {
			Type:     schema.TypeInt,
			Optional: true,
			Computed: true,
		},
		"primary_network_interface_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"private_dns": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"private_ip": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"public_dns": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"public_ip": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"secondary_private_ips": {
			Type:     schema.TypeSet,
			Optional: true,
			Computed: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
		"security_groups": {
			Type:     schema.TypeSet,
			Optional: true,
			Computed: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
		"source_dest_check": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"spot_instance_request_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"subnet_id": {
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
		"tenancy": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"user_data": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"user_data_base64": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"user_data_replace_on_change": {
			Type:     schema.TypeBool,
			Optional: true,
		},
		"volume_tags": {
			Type:     schema.TypeMap,
			Optional: true,
			Computed: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
		"vpc_security_group_ids": {
			Type:     schema.TypeSet,
			Optional: true,
			Computed: true,
			Elem:     &schema.Schema{Type: schema.TypeString},
		},
	}
}
