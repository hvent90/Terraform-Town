package main

import (
	"context"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceSubnet() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceSubnetCreate,
		ReadContext:   resourceSubnetRead,
		UpdateContext: resourceSubnetUpdate,
		DeleteContext: resourceSubnetDelete,
		Schema:        resourceSubnetSchema(),
	}
}

func resourceSubnetCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceSubnetSchema())

	result, err := client.CreateResource("aws_subnet", attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(result.ID)
	return setAttributes(d, result.Attributes, resourceSubnetSchema())
}

func resourceSubnetRead(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	result, err := client.ReadResource("aws_subnet", d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	if result == nil {
		d.SetId("")
		return nil
	}

	return setAttributes(d, result.Attributes, resourceSubnetSchema())
}

func resourceSubnetUpdate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceSubnetSchema())

	result, err := client.UpdateResource("aws_subnet", d.Id(), attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	return setAttributes(d, result.Attributes, resourceSubnetSchema())
}

func resourceSubnetDelete(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	if err := client.DeleteResource("aws_subnet", d.Id()); err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}
