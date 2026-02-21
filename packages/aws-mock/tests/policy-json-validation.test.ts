import { describe, expect, test } from "bun:test";
import { validatePolicyJson } from "../src/utils/validation";

describe("validatePolicyJson", () => {
  describe("valid JSON", () => {
    test("accepts valid IAM trust policy", () => {
      const policy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      });
      expect(validatePolicyJson(policy)).toBeNull();
    });

    test("accepts minimal JSON object", () => {
      expect(validatePolicyJson("{}")).toBeNull();
    });

    test("accepts JSON array", () => {
      expect(validatePolicyJson("[]")).toBeNull();
    });

    test("accepts compact JSON without whitespace", () => {
      expect(validatePolicyJson('{"Version":"2012-10-17","Statement":[]}')).toBeNull();
    });
  });

  describe("invalid JSON", () => {
    test("rejects empty string", () => {
      const error = validatePolicyJson("");
      expect(error).toBeString();
      expect(error).toContain("JSON");
    });

    test("rejects plain text", () => {
      const error = validatePolicyJson("not json at all");
      expect(error).toBeString();
      expect(error).toContain("JSON");
    });

    test("rejects malformed JSON with trailing comma", () => {
      const error = validatePolicyJson('{"key": "value",}');
      expect(error).toBeString();
      expect(error).toContain("JSON");
    });

    test("rejects single quotes", () => {
      const error = validatePolicyJson("{'key': 'value'}");
      expect(error).toBeString();
      expect(error).toContain("JSON");
    });

    test("rejects unquoted keys", () => {
      const error = validatePolicyJson("{key: value}");
      expect(error).toBeString();
      expect(error).toContain("JSON");
    });
  });
});
