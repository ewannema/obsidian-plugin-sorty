import { SortComparators, groupTaskLines, isTopLevelTask } from './main';

describe('Task Nesting Helpers', () => {
	describe('isTopLevelTask', () => {
		it('should identify top-level incomplete tasks', () => {
			expect(isTopLevelTask('- [ ] Top level task')).toBe(true);
		});

		it('should identify top-level completed tasks', () => {
			expect(isTopLevelTask('- [x] Completed task')).toBe(true);
			expect(isTopLevelTask('- [X] Completed task')).toBe(true);
		});

		it('should reject indented tasks', () => {
			expect(isTopLevelTask('  - [ ] Nested task')).toBe(false);
			expect(isTopLevelTask('\t- [ ] Tab-indented task')).toBe(false);
		});

		it('should reject non-task lines', () => {
			expect(isTopLevelTask('Regular line')).toBe(false);
			expect(isTopLevelTask('- Regular list item')).toBe(false);
		});
	});

	describe('groupTaskLines', () => {
		it('should group tasks with their nested children', () => {
			const lines = [
				'- [ ] Parent 1',
				'  - [ ] Child 1.1',
				'  - [ ] Child 1.2',
				'- [ ] Parent 2',
				'  - [ ] Child 2.1',
			];
			const groups = groupTaskLines(lines);
			expect(groups).toEqual([
				['- [ ] Parent 1', '  - [ ] Child 1.1', '  - [ ] Child 1.2'],
				['- [ ] Parent 2', '  - [ ] Child 2.1'],
			]);
		});

		it('should handle tasks without children', () => {
			const lines = ['- [ ] Task 1', '- [ ] Task 2', '- [ ] Task 3'];
			const groups = groupTaskLines(lines);
			expect(groups).toEqual([['- [ ] Task 1'], ['- [ ] Task 2'], ['- [ ] Task 3']]);
		});

		it('should handle mixed indented and non-indented lines', () => {
			const lines = ['- [ ] Task 1', '  Some description', '  More details', '- [ ] Task 2'];
			const groups = groupTaskLines(lines);
			expect(groups).toEqual([
				['- [ ] Task 1', '  Some description', '  More details'],
				['- [ ] Task 2'],
			]);
		});

		it('should handle deeply nested tasks', () => {
			const lines = [
				'- [ ] Parent',
				'  - [ ] Child',
				'    - [ ] Grandchild',
				'      - [ ] Great-grandchild',
				'- [ ] Another parent',
			];
			const groups = groupTaskLines(lines);
			expect(groups).toEqual([
				['- [ ] Parent', '  - [ ] Child', '    - [ ] Grandchild', '      - [ ] Great-grandchild'],
				['- [ ] Another parent'],
			]);
		});

		it('should handle lines before first task', () => {
			const lines = ['Some header', 'Another line', '- [ ] First task', '  - [ ] Nested'];
			const groups = groupTaskLines(lines);
			expect(groups).toEqual([
				['Some header', 'Another line'],
				['- [ ] First task', '  - [ ] Nested'],
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

	describe('tasks', () => {
		it('should sort tasks by name ignoring completion status', () => {
			const tasks = [
				'- [x] Write tests',
				'- [ ] Add feature',
				'- [X] Review code',
				'- [ ] Fix bug',
			];
			const sorted = tasks.sort(SortComparators.tasks);
			expect(sorted).toEqual([
				'- [ ] Add feature',
				'- [ ] Fix bug',
				'- [X] Review code',
				'- [x] Write tests',
			]);
		});

		it('should handle mixed completed and incomplete tasks', () => {
			const tasks = [
				'- [x] Zebra task',
				'- [ ] Apple task',
				'- [X] Banana task',
				'- [ ] Mango task',
			];
			const sorted = tasks.sort(SortComparators.tasks);
			expect(sorted).toEqual([
				'- [ ] Apple task',
				'- [X] Banana task',
				'- [ ] Mango task',
				'- [x] Zebra task',
			]);
		});

		it('should preserve completion markers', () => {
			const tasks = ['- [x] Task C', '- [ ] Task A', '- [X] Task B'];
			const sorted = tasks.sort(SortComparators.tasks);
			expect(sorted[0]).toBe('- [ ] Task A');
			expect(sorted[1]).toBe('- [X] Task B');
			expect(sorted[2]).toBe('- [x] Task C');
		});

		it('should handle non-task lines as fallback', () => {
			const lines = ['- [x] Task', 'Regular line', '- [ ] Another task'];
			const sorted = lines.sort(SortComparators.tasks);
			expect(sorted).toEqual(['- [ ] Another task', 'Regular line', '- [x] Task']);
		});

		it('should handle tasks with empty names', () => {
			const tasks = ['- [x] ', '- [ ] Task A', '- [ ] '];
			const sorted = tasks.sort(SortComparators.tasks);
			expect(sorted).toEqual(['- [x] ', '- [ ] ', '- [ ] Task A']);
		});

		it('should be case-sensitive', () => {
			const tasks = ['- [ ] zebra', '- [x] Apple', '- [ ] Banana'];
			const sorted = tasks.sort(SortComparators.tasks);
			expect(sorted).toEqual(['- [x] Apple', '- [ ] Banana', '- [ ] zebra']);
		});
	});

	describe('tasksByCompletion', () => {
		it('should group incomplete tasks before completed tasks', () => {
			const tasks = [
				'- [x] Completed 1',
				'- [ ] Incomplete 1',
				'- [X] Completed 2',
				'- [ ] Incomplete 2',
			];
			const sorted = tasks.sort(SortComparators.tasksByCompletion);
			expect(sorted).toEqual([
				'- [ ] Incomplete 1',
				'- [ ] Incomplete 2',
				'- [x] Completed 1',
				'- [X] Completed 2',
			]);
		});

		it('should maintain stable order within incomplete tasks', () => {
			const tasks = ['- [ ] Task C', '- [ ] Task A', '- [ ] Task B'];
			const sorted = tasks.sort(SortComparators.tasksByCompletion);
			// Order should be preserved since all are incomplete
			expect(sorted).toEqual(['- [ ] Task C', '- [ ] Task A', '- [ ] Task B']);
		});

		it('should maintain stable order within completed tasks', () => {
			const tasks = ['- [x] Task Z', '- [X] Task M', '- [x] Task A'];
			const sorted = tasks.sort(SortComparators.tasksByCompletion);
			// Order should be preserved since all are completed
			expect(sorted).toEqual(['- [x] Task Z', '- [X] Task M', '- [x] Task A']);
		});

		it('should maintain stable order in mixed list', () => {
			const tasks = [
				'- [x] Completed Z',
				'- [ ] Incomplete C',
				'- [X] Completed M',
				'- [ ] Incomplete A',
				'- [x] Completed A',
				'- [ ] Incomplete B',
			];
			const sorted = tasks.sort(SortComparators.tasksByCompletion);
			expect(sorted).toEqual([
				// Incomplete tasks in original order
				'- [ ] Incomplete C',
				'- [ ] Incomplete A',
				'- [ ] Incomplete B',
				// Completed tasks in original order
				'- [x] Completed Z',
				'- [X] Completed M',
				'- [x] Completed A',
			]);
		});

		it('should handle all incomplete tasks', () => {
			const tasks = ['- [ ] Task 3', '- [ ] Task 1', '- [ ] Task 2'];
			const sorted = tasks.sort(SortComparators.tasksByCompletion);
			expect(sorted).toEqual(['- [ ] Task 3', '- [ ] Task 1', '- [ ] Task 2']);
		});

		it('should handle all completed tasks', () => {
			const tasks = ['- [x] Task 3', '- [X] Task 1', '- [x] Task 2'];
			const sorted = tasks.sort(SortComparators.tasksByCompletion);
			expect(sorted).toEqual(['- [x] Task 3', '- [X] Task 1', '- [x] Task 2']);
		});

		it('should handle non-task lines as incomplete', () => {
			const lines = ['- [x] Completed task', 'Regular line', '- [ ] Incomplete task'];
			const sorted = lines.sort(SortComparators.tasksByCompletion);
			// Non-task lines are treated as incomplete
			expect(sorted).toEqual(['Regular line', '- [ ] Incomplete task', '- [x] Completed task']);
		});
	});
});
