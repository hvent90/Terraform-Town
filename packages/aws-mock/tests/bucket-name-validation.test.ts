import { describe, expect, test } from "bun:test";
import { validateBucketName } from "../src/utils/validation";

describe("validateBucketName", () => {
  describe("valid names", () => {
    test("accepts lowercase letters and numbers", () => {
      expect(validateBucketName("mybucket123")).toBeNull();
    });

    test("accepts hyphens in the middle", () => {
      expect(validateBucketName("my-test-bucket")).toBeNull();
    });

    test("accepts minimum length (3 characters)", () => {
      expect(validateBucketName("abc")).toBeNull();
    });

    test("accepts maximum length (63 characters)", () => {
      const name = "a".repeat(63);
      expect(validateBucketName(name)).toBeNull();
    });
  });

  describe("invalid names", () => {
    test("rejects names shorter than 3 characters", () => {
      const error = validateBucketName("ab");
      expect(error).toBeString();
      expect(error).toContain("3");
      expect(error).toContain("63");
    });

    test("rejects names longer than 63 characters", () => {
      const name = "a".repeat(64);
      const error = validateBucketName(name);
      expect(error).toBeString();
      expect(error).toContain("3");
      expect(error).toContain("63");
    });

    test("rejects uppercase letters", () => {
      const error = validateBucketName("MyBucket");
      expect(error).toBeString();
      expect(error).toContain("lowercase");
    });

    test("rejects underscores", () => {
      const error = validateBucketName("my_bucket");
      expect(error).toBeString();
      expect(error).toContain("lowercase");
    });

    test("rejects names starting with a hyphen", () => {
      const error = validateBucketName("-mybucket");
      expect(error).toBeString();
      expect(error).toContain("start and end");
    });

    test("rejects names ending with a hyphen", () => {
      const error = validateBucketName("mybucket-");
      expect(error).toBeString();
      expect(error).toContain("start and end");
    });

    test("rejects names with dots", () => {
      const error = validateBucketName("my.bucket");
      expect(error).toBeString();
      expect(error).toContain("lowercase");
    });

    test("rejects names with spaces", () => {
      const error = validateBucketName("my bucket");
      expect(error).toBeString();
      expect(error).toContain("lowercase");
    });
  });
});
