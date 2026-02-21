package main

import (
	"context"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceSecurityGroup() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceSecurityGroupCreate,
		ReadContext:   resourceSecurityGroupRead,
		UpdateContext: resourceSecurityGroupUpdate,
		DeleteContext: resourceSecurityGroupDelete,
		Schema:        resourceSecurityGroupSchema(),
	}
}

func resourceSecurityGroupCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceSecurityGroupSchema())

	result, err := client.CreateResource("aws_security_group", attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(result.ID)
	return setAttributes(d, result.Attributes, resourceSecurityGroupSchema())
}

func resourceSecurityGroupRead(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	result, err := client.ReadResource("aws_security_group", d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	if result == nil {
		d.SetId("")
		return nil
	}

	return setAttributes(d, result.Attributes, resourceSecurityGroupSchema())
}

func resourceSecurityGroupUpdate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	attrs := extractAttributes(d, resourceSecurityGroupSchema())

	result, err := client.UpdateResource("aws_security_group", d.Id(), attrs)
	if err != nil {
		return diag.FromErr(err)
	}

	return setAttributes(d, result.Attributes, resourceSecurityGroupSchema())
}

func resourceSecurityGroupDelete(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
	client := meta.(*MockClient)

	if err := client.DeleteResource("aws_security_group", d.Id()); err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}
