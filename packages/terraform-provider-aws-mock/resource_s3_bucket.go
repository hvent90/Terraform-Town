package main

import (
	"context"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceS3Bucket() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceS3BucketCreate,
		ReadContext:   resourceS3BucketRead,
		UpdateContext: resourceS3BucketUpdate,
		DeleteContext: resourceS3BucketDelete,
		Schema:        resourceS3BucketSchema(),
	}
}

func extractAttributes(d *schema.ResourceData, s map[string]*schema.Schema) map[string]interface{} {
	attrs := make(map[string]interface{})
	for key, field := range s {
		if field.Computed && !field.Optional {
			continue
		}
		if v, ok := d.GetOk(key); ok {
			if set, isSet := v.(*schema.Set); isSet {
				attrs[key] = set.List()
			} else {
				attrs[key] = v
			}
		}
	}
	return attrs
}

func setAttributes(d *schema.ResourceData, attrs map[string]interface{}, s map[string]*schema.Schema) diag.Diagnostics {
	var diags diag.Diagnostics
	for key := range s {
		if val, ok := attrs[key]; ok {
			if err := d.Set(key, val); err != nil {
				diags = append(diags, diag.Errorf("error setting %s: %s", key, err)...)
			}
		}
	}
	return diags
}

func resourceS3BucketCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceS3BucketSchema())

	result, err := client.CreateResource("aws_s3_bucket", attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(result.ID)
	return setAttributes(d, result.Attributes, resourceS3BucketSchema())
}

func resourceS3BucketRead(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	result, err := client.ReadResource("aws_s3_bucket", d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	if result == nil {
		d.SetId("")
		return nil
	}

	return setAttributes(d, result.Attributes, resourceS3BucketSchema())
}

func resourceS3BucketUpdate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceS3BucketSchema())

	result, err := client.UpdateResource("aws_s3_bucket", d.Id(), attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	return setAttributes(d, result.Attributes, resourceS3BucketSchema())
}

func resourceS3BucketDelete(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	if err := client.DeleteResource("aws_s3_bucket", d.Id()); err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}
