// Pure sorting utility functions that don't depend on the Editor

import { TaskComparators } from './tasks';

export enum SortOrder {
	Ascending,
	Descending,
}

export const SortComparators = {
	alpha: (a: string, b: string) => a.localeCompare(b),
	reverseAlpha: (a: string, b: string) => b.localeCompare(a),
	numeric: (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }),
	reverseNumeric: (a: string, b: string) => b.localeCompare(a, undefined, { numeric: true }),
	...TaskComparators,
};

/**
 * Creates a sorter function that sorts lines using the provided comparator and grouping functions.
 *
 * @param compareFn - The comparison function to use for sorting
 * @param groupFn - Optional function to group lines before sorting
 * @returns A function that takes lines and returns sorted lines
 */
export function createSorter(
	compareFn: (a: string, b: string) => number,
	groupFn?: ((lines: string[]) => string[][]) | undefined
): (lines: string[]) => string[] {
	return (lines: string[]) => {
		if (groupFn) {
			// Group lines using the provided grouping function
			const groups = groupFn(lines);

			// Sort groups by their first line
			const sortedGroups = groups.sort((a, b) => compareFn(a[0], b[0]));

			// Flatten back to individual lines
			return sortedGroups.flat();
		} else {
			// Normal line-by-line sorting
			return [...lines].sort(compareFn);
		}
	};
}
