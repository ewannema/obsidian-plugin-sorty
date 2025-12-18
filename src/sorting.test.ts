import { createSorter, SortComparators } from './sorting';
import { groupTaskLines } from './tasks';

describe('createSorter', () => {
	describe('without grouping', () => {
		it('should sort lines alphabetically', () => {
			const lines = ['zebra', 'apple', 'mango', 'banana'];
			const sorter = createSorter(SortComparators.alpha);
			const result = sorter(lines);
			expect(result).toEqual(['apple', 'banana', 'mango', 'zebra']);
			expect(result.length).toBe(4);
		});

		it('should not mutate original array', () => {
			const lines = ['zebra', 'apple', 'mango'];
			const original = [...lines];
			const sorter = createSorter(SortComparators.alpha);
			sorter(lines);
			expect(lines).toEqual(original);
		});

		it('should handle empty array', () => {
			const sorter = createSorter(SortComparators.alpha);
			const result = sorter([]);
			expect(result).toEqual([]);
			expect(result.length).toBe(0);
		});

		it('should handle single line', () => {
			const sorter = createSorter(SortComparators.alpha);
			const result = sorter(['only line']);
			expect(result).toEqual(['only line']);
			expect(result.length).toBe(1);
		});

		it('should work with numeric comparator', () => {
			const lines = ['file10.txt', 'file2.txt', 'file1.txt'];
			const sorter = createSorter(SortComparators.numeric);
			const result = sorter(lines);
			expect(result).toEqual(['file1.txt', 'file2.txt', 'file10.txt']);
		});
	});

	describe('with grouping', () => {
		it('should group and sort tasks with nested children', () => {
			const lines = [
				'- [ ] Zebra task',
				'  - [ ] Nested under zebra',
				'- [ ] Apple task',
				'  - [ ] Nested under apple',
				'  - [ ] Another nested',
			];
			const sorter = createSorter(SortComparators.tasks, groupTaskLines);
			const result = sorter(lines);
			expect(result).toEqual([
				'- [ ] Apple task',
				'  - [ ] Nested under apple',
				'  - [ ] Another nested',
				'- [ ] Zebra task',
				'  - [ ] Nested under zebra',
			]);
			expect(result.length).toBe(5);
		});

		it('should preserve task groups when sorting', () => {
			const lines = [
				'- [ ] Task B',
				'  Description for B',
				'  More details',
				'- [ ] Task A',
				'  Description for A',
			];
			const sorter = createSorter(SortComparators.tasks, groupTaskLines);
			const result = sorter(lines);
			expect(result).toEqual([
				'- [ ] Task A',
				'  Description for A',
				'- [ ] Task B',
				'  Description for B',
				'  More details',
			]);
		});

		it('should handle tasks without children', () => {
			const lines = ['- [ ] C', '- [ ] A', '- [ ] B'];
			const sorter = createSorter(SortComparators.tasks, groupTaskLines);
			const result = sorter(lines);
			expect(result).toEqual(['- [ ] A', '- [ ] B', '- [ ] C']);
		});

		it('should sort indented tasks at the same level while preserving indentation', () => {
			const lines = [
				'  - [ ] Zebra sub-task',
				'  - [ ] Apple sub-task',
				'  - [ ] Mango sub-task',
				'  - [ ] Banana sub-task',
			];
			const sorter = createSorter(SortComparators.tasks, groupTaskLines);
			const result = sorter(lines);
			expect(result).toEqual([
				'  - [ ] Apple sub-task',
				'  - [ ] Banana sub-task',
				'  - [ ] Mango sub-task',
				'  - [ ] Zebra sub-task',
			]);
		});

		it('should sort indented tasks with nested children while preserving child order', () => {
			const lines = [
				'    - [ ] AlphaB',
				'        - [ ] BetaB',
				'        - [ ] BetaC',
				'        - [ ] BetaA',
				'    - [ ] AlphaA',
				'    - [ ] AlphaC',
			];
			const sorter = createSorter(SortComparators.tasks, groupTaskLines);
			const result = sorter(lines);
			expect(result).toEqual([
				'    - [ ] AlphaA',
				'    - [ ] AlphaB',
				'        - [ ] BetaB',
				'        - [ ] BetaC',
				'        - [ ] BetaA',
				'    - [ ] AlphaC',
			]);
		});
	});
});

describe('SortComparators', () => {
	describe('alpha', () => {
		it('should sort strings in alphabetical order', () => {
			const strings = ['zebra', 'apple', 'mango', 'banana'];
			const sorted = strings.sort(SortComparators.alpha);
			expect(sorted).toEqual(['apple', 'banana', 'mango', 'zebra']);
		});

		it('should handle empty strings', () => {
			const strings = ['', 'a', 'b'];
			const sorted = strings.sort(SortComparators.alpha);
			expect(sorted).toEqual(['', 'a', 'b']);
		});

		it('should be case-sensitive', () => {
			const strings = ['Zebra', 'apple', 'Apple', 'zebra'];
			const sorted = strings.sort(SortComparators.alpha);
			expect(sorted).toEqual(['apple', 'Apple', 'zebra', 'Zebra']);
		});

		it('should handle identical strings', () => {
			const strings = ['test', 'test', 'test'];
			const sorted = strings.sort(SortComparators.alpha);
			expect(sorted).toEqual(['test', 'test', 'test']);
		});

		it('should handle leading spaces', () => {
			const strings = ['  indented', 'apple', ' single space', 'zebra'];
			const sorted = strings.sort(SortComparators.alpha);
			// Leading spaces sort before non-space characters
			// More spaces come before fewer spaces
			expect(sorted).toEqual(['  indented', ' single space', 'apple', 'zebra']);
		});
	});

	describe('reverseAlpha', () => {
		it('should sort strings in reverse alphabetical order', () => {
			const strings = ['apple', 'banana', 'mango', 'zebra'];
			const sorted = strings.sort(SortComparators.reverseAlpha);
			expect(sorted).toEqual(['zebra', 'mango', 'banana', 'apple']);
		});

		it('should handle empty strings', () => {
			const strings = ['a', 'b', ''];
			const sorted = strings.sort(SortComparators.reverseAlpha);
			expect(sorted).toEqual(['b', 'a', '']);
		});

		it('should be case-sensitive', () => {
			const strings = ['apple', 'Apple', 'zebra', 'Zebra'];
			const sorted = strings.sort(SortComparators.reverseAlpha);
			expect(sorted).toEqual(['Zebra', 'zebra', 'Apple', 'apple']);
		});

		it('should handle identical strings', () => {
			const strings = ['test', 'test', 'test'];
			const sorted = strings.sort(SortComparators.reverseAlpha);
			expect(sorted).toEqual(['test', 'test', 'test']);
		});
	});

	describe('alpha and reverseAlpha relationship', () => {
		it('should produce opposite orderings', () => {
			const strings = ['zebra', 'apple', 'mango', 'banana'];
			const alphaSort = [...strings].sort(SortComparators.alpha);
			const reverseSort = [...strings].sort(SortComparators.reverseAlpha);
			expect(alphaSort).toEqual(['apple', 'banana', 'mango', 'zebra']);
			expect(reverseSort).toEqual(['zebra', 'mango', 'banana', 'apple']);
		});
	});

	describe('numeric', () => {
		it('should sort strings with numbers naturally', () => {
			const strings = ['file10.txt', 'file2.txt', 'file1.txt', 'file20.txt'];
			const sorted = strings.sort(SortComparators.numeric);
			expect(sorted).toEqual(['file1.txt', 'file2.txt', 'file10.txt', 'file20.txt']);
		});

		it('should handle strings without numbers', () => {
			const strings = ['zebra', 'apple', 'mango', 'banana'];
			const sorted = strings.sort(SortComparators.numeric);
			expect(sorted).toEqual(['apple', 'banana', 'mango', 'zebra']);
		});

		it('should handle mixed numbers and text', () => {
			const strings = ['item 10', 'item 2', 'item 1', 'item 20'];
			const sorted = strings.sort(SortComparators.numeric);
			expect(sorted).toEqual(['item 1', 'item 2', 'item 10', 'item 20']);
		});

		it('should handle pure numbers as strings', () => {
			const strings = ['100', '20', '3', '1'];
			const sorted = strings.sort(SortComparators.numeric);
			expect(sorted).toEqual(['1', '3', '20', '100']);
		});
	});

	describe('reverseNumeric', () => {
		it('should sort strings with numbers in reverse natural order', () => {
			const strings = ['file1.txt', 'file2.txt', 'file10.txt', 'file20.txt'];
			const sorted = strings.sort(SortComparators.reverseNumeric);
			expect(sorted).toEqual(['file20.txt', 'file10.txt', 'file2.txt', 'file1.txt']);
		});

		it('should handle strings without numbers', () => {
			const strings = ['apple', 'banana', 'mango', 'zebra'];
			const sorted = strings.sort(SortComparators.reverseNumeric);
			expect(sorted).toEqual(['zebra', 'mango', 'banana', 'apple']);
		});

		it('should handle mixed numbers and text', () => {
			const strings = ['item 1', 'item 2', 'item 10', 'item 20'];
			const sorted = strings.sort(SortComparators.reverseNumeric);
			expect(sorted).toEqual(['item 20', 'item 10', 'item 2', 'item 1']);
		});

		it('should handle pure numbers as strings', () => {
			const strings = ['1', '3', '20', '100'];
			const sorted = strings.sort(SortComparators.reverseNumeric);
			expect(sorted).toEqual(['100', '20', '3', '1']);
		});
	});

	describe('numeric and reverseNumeric relationship', () => {
		it('should produce opposite orderings', () => {
			const strings = ['file10.txt', 'file2.txt', 'file1.txt', 'file20.txt'];
			const numericSort = [...strings].sort(SortComparators.numeric);
			const reverseNumericSort = [...strings].sort(SortComparators.reverseNumeric);
			expect(numericSort).toEqual(['file1.txt', 'file2.txt', 'file10.txt', 'file20.txt']);
			expect(reverseNumericSort).toEqual(['file20.txt', 'file10.txt', 'file2.txt', 'file1.txt']);
		});
	});
});
