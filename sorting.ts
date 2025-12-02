// Pure sorting utility functions that don't depend on the Editor

export interface LineRange {
	fromLine: number;
	toLine: number;
}

export interface SortedResult {
	sortedLines: string[];
	lineCount: number;
}

/**
 * Normalizes a selection (anchor/head) into a line range (from/to)
 */
export function normalizeSelection(anchor: number, head: number): LineRange {
	return {
		fromLine: Math.min(anchor, head),
		toLine: Math.max(anchor, head),
	};
}

/**
 * Sorts an array of lines using the provided comparator function.
 * Optionally groups nested items together when sorting.
 *
 * @param lines - The lines to sort
 * @param compareFn - The comparison function to use for sorting
 * @param groupNested - Whether to group nested items (tasks) together
 * @returns The sorted lines and metadata
 */
export function sortLinesArray(
	lines: string[],
	compareFn: (a: string, b: string) => number,
	groupNested: boolean = false,
	groupTaskLines: (lines: string[]) => string[][]
): SortedResult {
	let sortedLines: string[];

	if (groupNested) {
		// Group lines by top-level tasks
		const groups = groupTaskLines(lines);

		// Sort groups by their first line (the parent task)
		const sortedGroups = groups.sort((a, b) => compareFn(a[0], b[0]));

		// Flatten back to individual lines
		sortedLines = sortedGroups.flat();
	} else {
		// Normal line-by-line sorting
		sortedLines = [...lines].sort(compareFn);
	}

	return {
		sortedLines,
		lineCount: sortedLines.length,
	};
}

/**
 * Sorts multiple independent line ranges.
 * Returns the sorted results in reverse order (for bottom-to-top processing).
 *
 * @param ranges - Array of line ranges with their content
 * @param compareFn - The comparison function to use for sorting
 * @param groupNested - Whether to group nested items together
 * @returns Array of sorted results with their ranges, in reverse order
 */
export function sortMultipleRanges(
	ranges: Array<{ range: LineRange; lines: string[] }>,
	compareFn: (a: string, b: string) => number,
	groupNested: boolean,
	groupTaskLines: (lines: string[]) => string[][]
): Array<{ range: LineRange; result: SortedResult }> {
	// Sort ranges in reverse order (bottom to top) to avoid position shifts
	const sortedRanges = [...ranges].sort((a, b) => b.range.fromLine - a.range.fromLine);

	return sortedRanges.map(({ range, lines }) => ({
		range,
		result: sortLinesArray(lines, compareFn, groupNested, groupTaskLines),
	}));
}
