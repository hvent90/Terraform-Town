package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceS3BucketSchema() map[string]*schema.Schema {
	return map[string]*schema.Schema{
		"acceleration_status": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"acl": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"arn": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"bucket": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"bucket_domain_name": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"bucket_prefix": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"bucket_regional_domain_name": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"force_destroy": {
			Type:     schema.TypeBool,
			Optional: true,
		},
		"hosted_zone_id": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"object_lock_enabled": {
			Type:     schema.TypeBool,
			Optional: true,
			Computed: true,
		},
		"policy": {
			Type:     schema.TypeString,
			Optional: true,
			Computed: true,
		},
		"region": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"request_payer": {
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
		"website_domain": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"website_endpoint": {
			Type:     schema.TypeString,
			Computed: true,
		},
		"cors_rule": {
			Type:     schema.TypeList,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"allowed_headers": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"allowed_methods": {
						Type:     schema.TypeList,
						Required: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"allowed_origins": {
						Type:     schema.TypeList,
						Required: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"expose_headers": {
						Type:     schema.TypeList,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"max_age_seconds": {
						Type:     schema.TypeInt,
						Optional: true,
					},
				},
			},
		},
		"grant": {
			Type:     schema.TypeSet,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"id": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"permissions": {
						Type:     schema.TypeSet,
						Required: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"type": {
						Type:     schema.TypeString,
						Required: true,
					},
					"uri": {
						Type:     schema.TypeString,
						Optional: true,
					},
				},
			},
		},
		"lifecycle_rule": {
			Type:     schema.TypeList,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"abort_incomplete_multipart_upload_days": {
						Type:     schema.TypeInt,
						Optional: true,
					},
					"enabled": {
						Type:     schema.TypeBool,
						Required: true,
					},
					"id": {
						Type:     schema.TypeString,
						Optional: true,
						Computed: true,
					},
					"prefix": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"tags": {
						Type:     schema.TypeMap,
						Optional: true,
						Elem:     &schema.Schema{Type: schema.TypeString},
					},
					"expiration": {
						Type:     schema.TypeList,
						MaxItems: 1,
						Optional: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"date": {
									Type:     schema.TypeString,
									Optional: true,
								},
								"days": {
									Type:     schema.TypeInt,
									Optional: true,
								},
								"expired_object_delete_marker": {
									Type:     schema.TypeBool,
									Optional: true,
								},
							},
						},
					},
					"noncurrent_version_expiration": {
						Type:     schema.TypeList,
						MaxItems: 1,
						Optional: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"days": {
									Type:     schema.TypeInt,
									Optional: true,
								},
							},
						},
					},
					"noncurrent_version_transition": {
						Type:     schema.TypeSet,
						Optional: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"days": {
									Type:     schema.TypeInt,
									Optional: true,
								},
								"storage_class": {
									Type:     schema.TypeString,
									Required: true,
								},
							},
						},
					},
					"transition": {
						Type:     schema.TypeSet,
						Optional: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"date": {
									Type:     schema.TypeString,
									Optional: true,
								},
								"days": {
									Type:     schema.TypeInt,
									Optional: true,
								},
								"storage_class": {
									Type:     schema.TypeString,
									Required: true,
								},
							},
						},
					},
				},
			},
		},
		"logging": {
			Type:     schema.TypeList,
			MaxItems: 1,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"target_bucket": {
						Type:     schema.TypeString,
						Required: true,
					},
					"target_prefix": {
						Type:     schema.TypeString,
						Optional: true,
					},
				},
			},
		},
		"object_lock_configuration": {
			Type:     schema.TypeList,
			MaxItems: 1,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"object_lock_enabled": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"rule": {
						Type:     schema.TypeList,
						MaxItems: 1,
						Optional: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"default_retention": {
									Type:     schema.TypeList,
									MaxItems: 1,
									MinItems: 1,
									Required: true,
									Elem: &schema.Resource{
										Schema: map[string]*schema.Schema{
											"days": {
												Type:     schema.TypeInt,
												Optional: true,
											},
											"mode": {
												Type:     schema.TypeString,
												Required: true,
											},
											"years": {
												Type:     schema.TypeInt,
												Optional: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		"replication_configuration": {
			Type:     schema.TypeList,
			MaxItems: 1,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"role": {
						Type:     schema.TypeString,
						Required: true,
					},
					"rules": {
						Type:     schema.TypeSet,
						Required: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"delete_marker_replication_status": {
									Type:     schema.TypeString,
									Optional: true,
								},
								"id": {
									Type:     schema.TypeString,
									Optional: true,
								},
								"prefix": {
									Type:     schema.TypeString,
									Optional: true,
								},
								"priority": {
									Type:     schema.TypeInt,
									Optional: true,
								},
								"status": {
									Type:     schema.TypeString,
									Required: true,
								},
								"destination": {
									Type:     schema.TypeList,
									MaxItems: 1,
									MinItems: 1,
									Required: true,
									Elem: &schema.Resource{
										Schema: map[string]*schema.Schema{
											"account_id": {
												Type:     schema.TypeString,
												Optional: true,
											},
											"bucket": {
												Type:     schema.TypeString,
												Required: true,
											},
											"replica_kms_key_id": {
												Type:     schema.TypeString,
												Optional: true,
											},
											"storage_class": {
												Type:     schema.TypeString,
												Optional: true,
											},
											"access_control_translation": {
												Type:     schema.TypeList,
												MaxItems: 1,
												Optional: true,
												Elem: &schema.Resource{
													Schema: map[string]*schema.Schema{
														"owner": {
															Type:     schema.TypeString,
															Required: true,
														},
													},
												},
											},
											"metrics": {
												Type:     schema.TypeList,
												MaxItems: 1,
												Optional: true,
												Elem: &schema.Resource{
													Schema: map[string]*schema.Schema{
														"minutes": {
															Type:     schema.TypeInt,
															Optional: true,
														},
														"status": {
															Type:     schema.TypeString,
															Optional: true,
														},
													},
												},
											},
											"replication_time": {
												Type:     schema.TypeList,
												MaxItems: 1,
												Optional: true,
												Elem: &schema.Resource{
													Schema: map[string]*schema.Schema{
														"minutes": {
															Type:     schema.TypeInt,
															Optional: true,
														},
														"status": {
															Type:     schema.TypeString,
															Optional: true,
														},
													},
												},
											},
										},
									},
								},
								"filter": {
									Type:     schema.TypeList,
									MaxItems: 1,
									Optional: true,
									Elem: &schema.Resource{
										Schema: map[string]*schema.Schema{
											"prefix": {
												Type:     schema.TypeString,
												Optional: true,
											},
											"tags": {
												Type:     schema.TypeMap,
												Optional: true,
												Elem:     &schema.Schema{Type: schema.TypeString},
											},
										},
									},
								},
								"source_selection_criteria": {
									Type:     schema.TypeList,
									MaxItems: 1,
									Optional: true,
									Elem: &schema.Resource{
										Schema: map[string]*schema.Schema{
											"sse_kms_encrypted_objects": {
												Type:     schema.TypeList,
												MaxItems: 1,
												Optional: true,
												Elem: &schema.Resource{
													Schema: map[string]*schema.Schema{
														"enabled": {
															Type:     schema.TypeBool,
															Required: true,
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		"server_side_encryption_configuration": {
			Type:     schema.TypeList,
			MaxItems: 1,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"rule": {
						Type:     schema.TypeList,
						MaxItems: 1,
						Required: true,
						Elem: &schema.Resource{
							Schema: map[string]*schema.Schema{
								"bucket_key_enabled": {
									Type:     schema.TypeBool,
									Optional: true,
								},
								"apply_server_side_encryption_by_default": {
									Type:     schema.TypeList,
									MaxItems: 1,
									Required: true,
									Elem: &schema.Resource{
										Schema: map[string]*schema.Schema{
											"kms_master_key_id": {
												Type:     schema.TypeString,
												Optional: true,
											},
											"sse_algorithm": {
												Type:     schema.TypeString,
												Required: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		"versioning": {
			Type:     schema.TypeList,
			MaxItems: 1,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"enabled": {
						Type:     schema.TypeBool,
						Optional: true,
					},
					"mfa_delete": {
						Type:     schema.TypeBool,
						Optional: true,
					},
				},
			},
		},
		"website": {
			Type:     schema.TypeList,
			MaxItems: 1,
			Optional: true,
			Computed: true,
			Elem: &schema.Resource{
				Schema: map[string]*schema.Schema{
					"error_document": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"index_document": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"redirect_all_requests_to": {
						Type:     schema.TypeString,
						Optional: true,
					},
					"routing_rules": {
						Type:     schema.TypeString,
						Optional: true,
					},
				},
			},
		},
	}
}
