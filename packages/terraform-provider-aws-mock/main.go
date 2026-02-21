package main

import (
	"context"
	"net/http"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
	"github.com/hashicorp/terraform-plugin-sdk/v2/plugin"
)

func Provider() *schema.Provider {
	return &schema.Provider{
		Schema: map[string]*schema.Schema{
			"backend_url": {
				Type:        schema.TypeString,
				Optional:    true,
				DefaultFunc: schema.EnvDefaultFunc("AWS_MOCK_BACKEND_URL", "http://localhost:3000"),
				Description: "URL of the mock AWS backend server",
			},
			"region": {
				Type:        schema.TypeString,
				Required:    true,
				DefaultFunc: schema.EnvDefaultFunc("AWS_DEFAULT_REGION", nil),
				Description: "The AWS region to use",
			},
		},
		ResourcesMap: map[string]*schema.Resource{
			"aws_s3_bucket":        resourceS3Bucket(),
			"aws_s3_bucket_policy": resourceS3BucketPolicy(),
			"aws_vpc":              resourceVpc(),
			"aws_subnet":           resourceSubnet(),
			"aws_security_group":   resourceSecurityGroup(),
			"aws_instance":         resourceInstance(),
		},
		ConfigureContextFunc: providerConfigure,
	}
}

func providerConfigure(ctx context.Context, d *schema.ResourceData) (interface{}, diag.Diagnostics) {
	backendURL := d.Get("backend_url").(string)
	region := d.Get("region").(string)

	client := &MockClient{
		BackendURL: backendURL,
		HTTPClient: &http.Client{},
	}

	if err := client.ConfigureProvider(region); err != nil {
		return nil, diag.FromErr(err)
	}

	return client, nil
}

func main() {
	plugin.Serve(&plugin.ServeOpts{
		ProviderFunc: Provider,
	})
}
