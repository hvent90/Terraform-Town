type Vec3 = [number, number, number];

const SPREAD_OFFSET = 0.15;

export function manhattanRoute(from: Vec3, to: Vec3, index: number): Vec3[] {
	const [fx, , fz] = from;
	const [tx, , tz] = to;

	if (fx === tx && fz === tz) return [];

	const y = 0;

	if (fx === tx) return [[fx, y, fz], [tx, y, tz]];
	if (fz === tz) return [[fx, y, fz], [tx, y, tz]];

	const midZ = (fz + tz) / 2 + index * SPREAD_OFFSET;

	return [
		[fx, y, fz],
		[fx, y, midZ],
		[tx, y, midZ],
		[tx, y, tz],
	];
}
