package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type MockClient struct {
	BackendURL string
	HTTPClient *http.Client
}

type ResourceResponse struct {
	ID         string                 `json:"id"`
	Attributes map[string]interface{} `json:"attributes"`
}

func (c *MockClient) ConfigureProvider(region string) error {
	body, err := json.Marshal(map[string]string{"region": region})
	if err != nil {
		return err
	}

	resp, err := c.HTTPClient.Post(
		fmt.Sprintf("%s/provider/configure", c.BackendURL),
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		var errResp struct {
			Error string `json:"error"`
		}
		if json.Unmarshal(respBody, &errResp) == nil && errResp.Error != "" {
			return fmt.Errorf("%s", errResp.Error)
		}
		return fmt.Errorf("provider configuration failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *MockClient) CreateResource(resourceType string, attrs map[string]interface{}) (*ResourceResponse, error) {
	body, err := json.Marshal(map[string]interface{}{"attributes": attrs})
	if err != nil {
		return nil, err
	}

	resp, err := c.HTTPClient.Post(
		fmt.Sprintf("%s/resource/%s", c.BackendURL, resourceType),
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("create failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var result ResourceResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *MockClient) ReadResource(resourceType, id string) (*ResourceResponse, error) {
	resp, err := c.HTTPClient.Get(
		fmt.Sprintf("%s/resource/%s/%s", c.BackendURL, resourceType, id),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, nil
	}
	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("read failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var result ResourceResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *MockClient) UpdateResource(resourceType, id string, attrs map[string]interface{}) (*ResourceResponse, error) {
	body, err := json.Marshal(map[string]interface{}{"attributes": attrs})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("PUT",
		fmt.Sprintf("%s/resource/%s/%s", c.BackendURL, resourceType, id),
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("update failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var result ResourceResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *MockClient) DeleteResource(resourceType, id string) error {
	req, err := http.NewRequest("DELETE",
		fmt.Sprintf("%s/resource/%s/%s", c.BackendURL, resourceType, id),
		nil,
	)
	if err != nil {
		return err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 204 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}
