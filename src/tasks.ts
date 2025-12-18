// Task-related utilities and constants

// Regular expressions for task detection
export const TASK_REGEX = /^- \[[xX ]\] /;
export const COMPLETED_TASK_REGEX = /^- \[[xX]\] /;
export const TASK_EXTRACT_REGEX = /^- \[[xX ]\] (.*)$/;

// Task-specific comparators
export const TaskComparators = {
	tasks: (a: string, b: string) => {
		// Extract task name from "- [ ] task" or "- [x] task" or "- [X] task" format
		const extractTaskName = (line: string): string => {
			const match = line.match(TASK_EXTRACT_REGEX);
			return match ? match[1] : line;
		};
		return extractTaskName(a).localeCompare(extractTaskName(b));
	},
	tasksByCompletion: (a: string, b: string) => {
		// Check if a task is completed (has [x] or [X])
		const isCompleted = (line: string): boolean => {
			return COMPLETED_TASK_REGEX.test(line);
		};

		const aCompleted = isCompleted(a);
		const bCompleted = isCompleted(b);

		// Incomplete tasks come before completed tasks
		if (!aCompleted && bCompleted) return -1;
		if (aCompleted && !bCompleted) return 1;

		// Same status - maintain stable order (return 0)
		return 0;
	},
};

// Helper function to check if a line is a top-level task (no leading whitespace)
export function isTopLevelTask(line: string): boolean {
	return TASK_REGEX.test(line);
}

// Helper function to get the indentation level of a line (number of leading spaces/tabs)
function getIndentationLevel(line: string): number {
	const match = line.match(/^(\s*)/);
	return match ? match[1].length : 0;
}

// Helper function to check if a line is a task (at any indentation level)
function isTask(line: string): boolean {
	return /^\s*- \[[xX ]\] /.test(line);
}

// Helper function to group lines into task blocks (parent + nested children)
export function groupTaskLines(lines: string[]): string[][] {
	const groups: string[][] = [];
	let currentGroup: string[] = [];
	let baseIndent: number | null = null;

	for (const line of lines) {
		if (isTask(line)) {
			const indent = getIndentationLevel(line);

			if (baseIndent === null) {
				// First task sets the baseline indentation
				// Push any accumulated non-task lines as a separate group
				if (currentGroup.length > 0) {
					groups.push(currentGroup);
				}
				baseIndent = indent;
				currentGroup = [line];
			} else if (indent < baseIndent) {
				// Task is less indented than baseline - this shouldn't happen in a valid selection
				// But we'll handle it gracefully by starting a new group and resetting baseline
				if (currentGroup.length > 0) {
					groups.push(currentGroup);
				}
				currentGroup = [line];
				baseIndent = indent;
			} else if (indent === baseIndent) {
				// Task at same indentation as baseline - start a new group
				if (currentGroup.length > 0) {
					groups.push(currentGroup);
				}
				currentGroup = [line];
			} else {
				// Task is more indented - it's a child, add to current group
				currentGroup.push(line);
			}
		} else {
			// Not a task (description, etc.) - add to current group
			currentGroup.push(line);
		}
	}

	// Don't forget the last group
	if (currentGroup.length > 0) {
		groups.push(currentGroup);
	}

	return groups;
}
