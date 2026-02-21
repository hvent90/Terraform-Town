package main

import (
	"context"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceInstance() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceInstanceCreate,
		ReadContext:   resourceInstanceRead,
		UpdateContext: resourceInstanceUpdate,
		DeleteContext: resourceInstanceDelete,
		Schema:        resourceInstanceSchema(),
	}
}

func resourceInstanceCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceInstanceSchema())

	result, err := client.CreateResource("aws_instance", attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(result.ID)
	return setAttributes(d, result.Attributes, resourceInstanceSchema())
}

func resourceInstanceRead(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	result, err := client.ReadResource("aws_instance", d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	if result == nil {
		d.SetId("")
		return nil
	}

	return setAttributes(d, result.Attributes, resourceInstanceSchema())
}

func resourceInstanceUpdate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceInstanceSchema())

	result, err := client.UpdateResource("aws_instance", d.Id(), attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	return setAttributes(d, result.Attributes, resourceInstanceSchema())
}

func resourceInstanceDelete(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	if err := client.DeleteResource("aws_instance", d.Id()); err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}
