import { describe, expect, test } from "bun:test";
import {
  generateS3Arn,
  generateS3Id,
  generateS3Domain,
  generateAccountId,
} from "../src/utils/computed";

describe("computed value generators", () => {
  describe("generateS3Arn", () => {
    test("returns correct ARN format for bucket name", () => {
      expect(generateS3Arn("my-bucket")).toBe("arn:aws:s3:::my-bucket");
    });

    test("handles bucket names with dots", () => {
      expect(generateS3Arn("my.bucket.name")).toBe("arn:aws:s3:::my.bucket.name");
    });
  });

  describe("generateS3Id", () => {
    test("returns bucket name as id", () => {
      expect(generateS3Id("my-bucket")).toBe("my-bucket");
    });
  });

  describe("generateS3Domain", () => {
    test("returns correct domain for us-east-1", () => {
      expect(generateS3Domain("my-bucket", "us-east-1")).toBe("my-bucket.s3.amazonaws.com");
    });

    test("returns correct domain for other regions", () => {
      expect(generateS3Domain("my-bucket", "eu-west-1")).toBe(
        "my-bucket.s3.eu-west-1.amazonaws.com",
      );
    });
  });

  describe("generateAccountId", () => {
    test("returns a 12-digit string", () => {
      const id = generateAccountId();
      expect(id).toMatch(/^\d{12}$/);
    });

    test("returns consistent value across calls", () => {
      const id1 = generateAccountId();
      const id2 = generateAccountId();
      expect(id1).toBe(id2);
    });
  });
});
