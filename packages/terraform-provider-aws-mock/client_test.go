package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateResourceCallsPost(t *testing.T) {
	var method, path string
	var body map[string]interface{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method = r.Method
		path = r.URL.Path
		json.NewDecoder(r.Body).Decode(&body)

		w.WriteHeader(201)
		json.NewEncoder(w).Encode(ResourceResponse{
			ID: "my-bucket",
			Attributes: map[string]interface{}{
				"bucket": "my-bucket",
				"arn":    "arn:aws:s3:::my-bucket",
				"id":     "my-bucket",
			},
		})
	}))
	defer server.Close()

	client := &MockClient{BackendURL: server.URL, HTTPClient: server.Client()}

	result, err := client.CreateResource("aws_s3_bucket", map[string]interface{}{
		"bucket": "my-bucket",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if method != "POST" {
		t.Errorf("expected POST, got %s", method)
	}
	if path != "/resource/aws_s3_bucket" {
		t.Errorf("expected /resource/aws_s3_bucket, got %s", path)
	}
	attrs, ok := body["attributes"].(map[string]interface{})
	if !ok {
		t.Fatal("expected attributes in request body")
	}
	if attrs["bucket"] != "my-bucket" {
		t.Errorf("expected bucket=my-bucket in request, got %v", attrs["bucket"])
	}
	if result.ID != "my-bucket" {
		t.Errorf("expected id=my-bucket, got %s", result.ID)
	}
	if result.Attributes["arn"] != "arn:aws:s3:::my-bucket" {
		t.Errorf("expected arn in response, got %v", result.Attributes["arn"])
	}
}

func TestReadResourceCallsGet(t *testing.T) {
	var method, path string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method = r.Method
		path = r.URL.Path

		json.NewEncoder(w).Encode(ResourceResponse{
			ID: "my-bucket",
			Attributes: map[string]interface{}{
				"bucket":            "my-bucket",
				"arn":               "arn:aws:s3:::my-bucket",
				"bucket_domain_name": "my-bucket.s3.amazonaws.com",
				"region":            "us-east-1",
			},
		})
	}))
	defer server.Close()

	client := &MockClient{BackendURL: server.URL, HTTPClient: server.Client()}

	result, err := client.ReadResource("aws_s3_bucket", "my-bucket")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if method != "GET" {
		t.Errorf("expected GET, got %s", method)
	}
	if path != "/resource/aws_s3_bucket/my-bucket" {
		t.Errorf("expected /resource/aws_s3_bucket/my-bucket, got %s", path)
	}
	if result.ID != "my-bucket" {
		t.Errorf("expected id=my-bucket, got %s", result.ID)
	}
	if result.Attributes["arn"] != "arn:aws:s3:::my-bucket" {
		t.Errorf("expected arn in response, got %v", result.Attributes["arn"])
	}
	if result.Attributes["bucket_domain_name"] != "my-bucket.s3.amazonaws.com" {
		t.Errorf("expected bucket_domain_name, got %v", result.Attributes["bucket_domain_name"])
	}
}

func TestReadResourceReturnsNilOn404(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		json.NewEncoder(w).Encode(map[string]string{"error": "not found"})
	}))
	defer server.Close()

	client := &MockClient{BackendURL: server.URL, HTTPClient: server.Client()}

	result, err := client.ReadResource("aws_s3_bucket", "nonexistent")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil for 404, got %v", result)
	}
}

func TestUpdateResourceCallsPut(t *testing.T) {
	var method, path string
	var body map[string]interface{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method = r.Method
		path = r.URL.Path
		json.NewDecoder(r.Body).Decode(&body)

		json.NewEncoder(w).Encode(ResourceResponse{
			ID: "my-bucket",
			Attributes: map[string]interface{}{
				"bucket": "my-bucket",
				"arn":    "arn:aws:s3:::my-bucket",
				"tags":   map[string]interface{}{"env": "prod"},
			},
		})
	}))
	defer server.Close()

	client := &MockClient{BackendURL: server.URL, HTTPClient: server.Client()}

	result, err := client.UpdateResource("aws_s3_bucket", "my-bucket", map[string]interface{}{
		"bucket": "my-bucket",
		"tags":   map[string]interface{}{"env": "prod"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if method != "PUT" {
		t.Errorf("expected PUT, got %s", method)
	}
	if path != "/resource/aws_s3_bucket/my-bucket" {
		t.Errorf("expected /resource/aws_s3_bucket/my-bucket, got %s", path)
	}
	attrs, ok := body["attributes"].(map[string]interface{})
	if !ok {
		t.Fatal("expected attributes in request body")
	}
	if attrs["bucket"] != "my-bucket" {
		t.Errorf("expected bucket in request, got %v", attrs["bucket"])
	}
	if result.Attributes["arn"] != "arn:aws:s3:::my-bucket" {
		t.Errorf("expected arn in response, got %v", result.Attributes["arn"])
	}
}

func TestDeleteResourceCallsDelete(t *testing.T) {
	var method, path string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method = r.Method
		path = r.URL.Path
		w.WriteHeader(204)
	}))
	defer server.Close()

	client := &MockClient{BackendURL: server.URL, HTTPClient: server.Client()}

	err := client.DeleteResource("aws_s3_bucket", "my-bucket")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if method != "DELETE" {
		t.Errorf("expected DELETE, got %s", method)
	}
	if path != "/resource/aws_s3_bucket/my-bucket" {
		t.Errorf("expected /resource/aws_s3_bucket/my-bucket, got %s", path)
	}
}

func TestComputedValuesReturnedFromBackend(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(201)
		json.NewEncoder(w).Encode(ResourceResponse{
			ID: "test-bucket",
			Attributes: map[string]interface{}{
				"id":                          "test-bucket",
				"bucket":                      "test-bucket",
				"arn":                         "arn:aws:s3:::test-bucket",
				"bucket_domain_name":          "test-bucket.s3.amazonaws.com",
				"bucket_regional_domain_name": "test-bucket.s3.us-east-1.amazonaws.com",
				"hosted_zone_id":              "Z3AQBSTGFYJSTF",
				"region":                      "us-east-1",
			},
		})
	}))
	defer server.Close()

	client := &MockClient{BackendURL: server.URL, HTTPClient: server.Client()}

	result, err := client.CreateResource("aws_s3_bucket", map[string]interface{}{
		"bucket": "test-bucket",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	computed := map[string]string{
		"arn":                         "arn:aws:s3:::test-bucket",
		"bucket_domain_name":          "test-bucket.s3.amazonaws.com",
		"bucket_regional_domain_name": "test-bucket.s3.us-east-1.amazonaws.com",
		"hosted_zone_id":              "Z3AQBSTGFYJSTF",
		"region":                      "us-east-1",
	}

	for key, expected := range computed {
		if val, ok := result.Attributes[key]; !ok {
			t.Errorf("missing computed value: %s", key)
		} else if val != expected {
			t.Errorf("computed %s: expected %q, got %q", key, expected, val)
		}
	}
}

func TestProviderConfigure(t *testing.T) {
	p := Provider()
	if p.Schema["backend_url"] == nil {
		t.Fatal("provider should have backend_url schema")
	}
	if p.ConfigureContextFunc == nil {
		t.Fatal("provider should have ConfigureContextFunc")
	}
}

func TestProviderResourceHasCRUD(t *testing.T) {
	p := Provider()
	res := p.ResourcesMap["aws_s3_bucket"]
	if res == nil {
		t.Fatal("aws_s3_bucket resource missing")
	}
	if res.CreateContext == nil {
		t.Error("aws_s3_bucket should have CreateContext")
	}
	if res.ReadContext == nil {
		t.Error("aws_s3_bucket should have ReadContext")
	}
	if res.UpdateContext == nil {
		t.Error("aws_s3_bucket should have UpdateContext")
	}
	if res.DeleteContext == nil {
		t.Error("aws_s3_bucket should have DeleteContext")
	}
}
