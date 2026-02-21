package main

import (
	"context"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceVpc() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceVpcCreate,
		ReadContext:   resourceVpcRead,
		UpdateContext: resourceVpcUpdate,
		DeleteContext: resourceVpcDelete,
		Schema:        resourceVpcSchema(),
	}
}

func resourceVpcCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceVpcSchema())

	result, err := client.CreateResource("aws_vpc", attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(result.ID)
	return setAttributes(d, result.Attributes, resourceVpcSchema())
}

func resourceVpcRead(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	result, err := client.ReadResource("aws_vpc", d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	if result == nil {
		d.SetId("")
		return nil
	}

	return setAttributes(d, result.Attributes, resourceVpcSchema())
}

func resourceVpcUpdate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceVpcSchema())

	result, err := client.UpdateResource("aws_vpc", d.Id(), attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	return setAttributes(d, result.Attributes, resourceVpcSchema())
}

func resourceVpcDelete(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	if err := client.DeleteResource("aws_vpc", d.Id()); err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}
