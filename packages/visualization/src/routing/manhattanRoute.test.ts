import { describe, test, expect } from "bun:test";
import { manhattanRoute } from "./manhattanRoute";

describe("manhattanRoute", () => {
	test("routes L-shaped path between two positions on different row and column", () => {
		const path = manhattanRoute([0, 0, 0], [2.5, 0, 2.5], 0);
		expect(path.length).toBeGreaterThanOrEqual(3);
		expect(path[0]).toEqual([0, 0, 0]);
		expect(path[path.length - 1]).toEqual([2.5, 0, 2.5]);
		for (let i = 1; i < path.length; i++) {
			const dx = Math.abs(path[i][0] - path[i - 1][0]);
			const dz = Math.abs(path[i][2] - path[i - 1][2]);
			expect(dx === 0 || dz === 0).toBe(true);
		}
	});

	test("produces straight line for same-row nodes (same Z)", () => {
		const path = manhattanRoute([0, 0, 0], [5, 0, 0], 0);
		expect(path).toEqual([
			[0, 0, 0],
			[5, 0, 0],
		]);
	});

	test("produces straight line for same-column nodes (same X)", () => {
		const path = manhattanRoute([0, 0, 0], [0, 0, 5], 0);
		expect(path).toEqual([
			[0, 0, 0],
			[0, 0, 5],
		]);
	});

	test("offsets midpoint for parallel trace spreading", () => {
		const path0 = manhattanRoute([0, 0, 0], [2.5, 0, 2.5], 0);
		const path1 = manhattanRoute([0, 0, 0], [2.5, 0, 2.5], 1);
		const mid0z = path0[1][2];
		const mid1z = path1[1][2];
		expect(mid0z).not.toEqual(mid1z);
	});

	test("returns empty array when source equals target", () => {
		const path = manhattanRoute([1, 0, 1], [1, 0, 1], 0);
		expect(path).toEqual([]);
	});
});
