import {
	normalizeSelection,
	sortLinesArray,
	sortMultipleRanges,
	calculateNewSelection
} from './sorting';
import { SortComparators, groupTaskLines } from './main';

describe('normalizeSelection', () => {
	it('should return from/to in correct order when anchor < head', () => {
		const result = normalizeSelection(5, 10);
		expect(result).toEqual({ fromLine: 5, toLine: 10 });
	});

	it('should return from/to in correct order when head < anchor', () => {
		const result = normalizeSelection(10, 5);
		expect(result).toEqual({ fromLine: 5, toLine: 10 });
	});

	it('should handle single line selection', () => {
		const result = normalizeSelection(7, 7);
		expect(result).toEqual({ fromLine: 7, toLine: 7 });
	});

	it('should handle line 0', () => {
		const result = normalizeSelection(0, 5);
		expect(result).toEqual({ fromLine: 0, toLine: 5 });
	});
});

describe('sortLinesArray', () => {
	describe('without grouping', () => {
		it('should sort lines alphabetically', () => {
			const lines = ['zebra', 'apple', 'mango', 'banana'];
			const result = sortLinesArray(lines, SortComparators.alpha, false, groupTaskLines);
			expect(result.sortedLines).toEqual(['apple', 'banana', 'mango', 'zebra']);
			expect(result.lineCount).toBe(4);
		});

		it('should not mutate original array', () => {
			const lines = ['zebra', 'apple', 'mango'];
			const original = [...lines];
			sortLinesArray(lines, SortComparators.alpha, false, groupTaskLines);
			expect(lines).toEqual(original);
		});

		it('should handle empty array', () => {
			const result = sortLinesArray([], SortComparators.alpha, false, groupTaskLines);
			expect(result.sortedLines).toEqual([]);
			expect(result.lineCount).toBe(0);
		});

		it('should handle single line', () => {
			const result = sortLinesArray(['only line'], SortComparators.alpha, false, groupTaskLines);
			expect(result.sortedLines).toEqual(['only line']);
			expect(result.lineCount).toBe(1);
		});

		it('should work with numeric comparator', () => {
			const lines = ['file10.txt', 'file2.txt', 'file1.txt'];
			const result = sortLinesArray(lines, SortComparators.numeric, false, groupTaskLines);
			expect(result.sortedLines).toEqual(['file1.txt', 'file2.txt', 'file10.txt']);
		});
	});

	describe('with grouping', () => {
		it('should group and sort tasks with nested children', () => {
			const lines = [
				'- [ ] Zebra task',
				'  - [ ] Nested under zebra',
				'- [ ] Apple task',
				'  - [ ] Nested under apple',
				'  - [ ] Another nested'
			];
			const result = sortLinesArray(lines, SortComparators.tasks, true, groupTaskLines);
			expect(result.sortedLines).toEqual([
				'- [ ] Apple task',
				'  - [ ] Nested under apple',
				'  - [ ] Another nested',
				'- [ ] Zebra task',
				'  - [ ] Nested under zebra'
			]);
			expect(result.lineCount).toBe(5);
		});

		it('should preserve task groups when sorting', () => {
			const lines = [
				'- [ ] Task B',
				'  Description for B',
				'  More details',
				'- [ ] Task A',
				'  Description for A'
			];
			const result = sortLinesArray(lines, SortComparators.tasks, true, groupTaskLines);
			expect(result.sortedLines).toEqual([
				'- [ ] Task A',
				'  Description for A',
				'- [ ] Task B',
				'  Description for B',
				'  More details'
			]);
		});

		it('should handle tasks without children', () => {
			const lines = ['- [ ] C', '- [ ] A', '- [ ] B'];
			const result = sortLinesArray(lines, SortComparators.tasks, true, groupTaskLines);
			expect(result.sortedLines).toEqual(['- [ ] A', '- [ ] B', '- [ ] C']);
		});
	});
});

describe('sortMultipleRanges', () => {
	it('should sort ranges in reverse order (bottom to top)', () => {
		const ranges = [
			{ range: { fromLine: 0, toLine: 2 }, lines: ['c', 'a', 'b'] },
			{ range: { fromLine: 5, toLine: 7 }, lines: ['z', 'x', 'y'] },
			{ range: { fromLine: 10, toLine: 12 }, lines: ['3', '1', '2'] }
		];

		const results = sortMultipleRanges(ranges, SortComparators.alpha, false, groupTaskLines);

		// Should be in reverse order (highest line number first)
		expect(results[0].range.fromLine).toBe(10);
		expect(results[1].range.fromLine).toBe(5);
		expect(results[2].range.fromLine).toBe(0);

		// Each should be sorted
		expect(results[0].result.sortedLines).toEqual(['1', '2', '3']);
		expect(results[1].result.sortedLines).toEqual(['x', 'y', 'z']);
		expect(results[2].result.sortedLines).toEqual(['a', 'b', 'c']);
	});

	it('should handle single range', () => {
		const ranges = [
			{ range: { fromLine: 0, toLine: 2 }, lines: ['c', 'a', 'b'] }
		];

		const results = sortMultipleRanges(ranges, SortComparators.alpha, false, groupTaskLines);

		expect(results).toHaveLength(1);
		expect(results[0].result.sortedLines).toEqual(['a', 'b', 'c']);
	});

	it('should handle empty ranges array', () => {
		const results = sortMultipleRanges([], SortComparators.alpha, false, groupTaskLines);
		expect(results).toEqual([]);
	});

	it('should not mutate original ranges', () => {
		const ranges = [
			{ range: { fromLine: 0, toLine: 1 }, lines: ['b', 'a'] },
			{ range: { fromLine: 5, toLine: 6 }, lines: ['d', 'c'] }
		];
		const original = JSON.parse(JSON.stringify(ranges));

		sortMultipleRanges(ranges, SortComparators.alpha, false, groupTaskLines);

		expect(ranges).toEqual(original);
	});

	it('should work with grouping enabled', () => {
		const ranges = [
			{
				range: { fromLine: 0, toLine: 4 },
				lines: [
					'- [ ] Task B',
					'  - [ ] Nested B',
					'- [ ] Task A',
					'  - [ ] Nested A'
				]
			}
		];

		const results = sortMultipleRanges(ranges, SortComparators.tasks, true, groupTaskLines);

		expect(results[0].result.sortedLines).toEqual([
			'- [ ] Task A',
			'  - [ ] Nested A',
			'- [ ] Task B',
			'  - [ ] Nested B'
		]);
	});

	it('should handle ranges with overlapping line numbers correctly', () => {
		// This tests that ranges are sorted correctly even if they're provided out of order
		const ranges = [
			{ range: { fromLine: 10, toLine: 12 }, lines: ['3', '1', '2'] },
			{ range: { fromLine: 0, toLine: 2 }, lines: ['c', 'a', 'b'] },
			{ range: { fromLine: 5, toLine: 7 }, lines: ['z', 'x', 'y'] }
		];

		const results = sortMultipleRanges(ranges, SortComparators.alpha, false, groupTaskLines);

		// Should be sorted by line number descending
		expect(results[0].range.fromLine).toBe(10);
		expect(results[1].range.fromLine).toBe(5);
		expect(results[2].range.fromLine).toBe(0);
	});

	it('should work with different comparators', () => {
		const ranges = [
			{ range: { fromLine: 0, toLine: 2 }, lines: ['file10.txt', 'file2.txt', 'file1.txt'] }
		];

		const results = sortMultipleRanges(ranges, SortComparators.numeric, false, groupTaskLines);

		expect(results[0].result.sortedLines).toEqual(['file1.txt', 'file2.txt', 'file10.txt']);
	});
});

describe('calculateNewSelection', () => {
	it('should calculate selection for single line', () => {
		const result = calculateNewSelection(5, 1);
		expect(result).toEqual({
			anchor: { line: 5, ch: 0 },
			head: { line: 5, ch: 0 }
		});
	});

	it('should calculate selection for multiple lines', () => {
		const result = calculateNewSelection(5, 3);
		expect(result).toEqual({
			anchor: { line: 5, ch: 0 },
			head: { line: 7, ch: 0 }
		});
	});

	it('should handle starting at line 0', () => {
		const result = calculateNewSelection(0, 5);
		expect(result).toEqual({
			anchor: { line: 0, ch: 0 },
			head: { line: 4, ch: 0 }
		});
	});

	it('should calculate correct end line for large ranges', () => {
		const result = calculateNewSelection(10, 100);
		expect(result).toEqual({
			anchor: { line: 10, ch: 0 },
			head: { line: 109, ch: 0 }
		});
	});
});
