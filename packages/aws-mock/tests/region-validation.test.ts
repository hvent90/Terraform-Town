import { describe, expect, test } from "bun:test";
import { validateRegion } from "../src/utils/validation";

describe("validateRegion", () => {
  describe("valid regions", () => {
    test("accepts us-east-1", () => {
      expect(validateRegion("us-east-1")).toBeNull();
    });

    test("accepts us-west-2", () => {
      expect(validateRegion("us-west-2")).toBeNull();
    });

    test("accepts eu-west-1", () => {
      expect(validateRegion("eu-west-1")).toBeNull();
    });

    test("accepts ap-southeast-1", () => {
      expect(validateRegion("ap-southeast-1")).toBeNull();
    });

    test("accepts eu-central-1", () => {
      expect(validateRegion("eu-central-1")).toBeNull();
    });

    test("accepts ap-northeast-1", () => {
      expect(validateRegion("ap-northeast-1")).toBeNull();
    });
  });

  describe("invalid regions", () => {
    test("rejects empty string", () => {
      const error = validateRegion("");
      expect(error).toBeString();
      expect(error).toContain("region");
    });

    test("rejects arbitrary string", () => {
      const error = validateRegion("not-a-region");
      expect(error).toBeString();
      expect(error).toContain("region");
    });

    test("rejects region with wrong format", () => {
      const error = validateRegion("us-east");
      expect(error).toBeString();
    });

    test("rejects uppercase region", () => {
      const error = validateRegion("US-EAST-1");
      expect(error).toBeString();
    });
  });
});
