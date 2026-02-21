package main

import (
	"context"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceS3BucketPolicy() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceS3BucketPolicyCreate,
		ReadContext:   resourceS3BucketPolicyRead,
		UpdateContext: resourceS3BucketPolicyUpdate,
		DeleteContext: resourceS3BucketPolicyDelete,
		Schema:        resourceS3BucketPolicySchema(),
	}
}

func resourceS3BucketPolicyCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceS3BucketPolicySchema())

	result, err := client.CreateResource("aws_s3_bucket_policy", attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(result.ID)
	return setAttributes(d, result.Attributes, resourceS3BucketPolicySchema())
}

func resourceS3BucketPolicyRead(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	result, err := client.ReadResource("aws_s3_bucket_policy", d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	if result == nil {
		d.SetId("")
		return nil
	}

	return setAttributes(d, result.Attributes, resourceS3BucketPolicySchema())
}

func resourceS3BucketPolicyUpdate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceS3BucketPolicySchema())

	result, err := client.UpdateResource("aws_s3_bucket_policy", d.Id(), attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	return setAttributes(d, result.Attributes, resourceS3BucketPolicySchema())
}

func resourceS3BucketPolicyDelete(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	if err := client.DeleteResource("aws_s3_bucket_policy", d.Id()); err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}
