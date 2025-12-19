import { Editor } from 'obsidian';
import { SortOrder } from './sorting';

export type EditorSelection = ReturnType<Editor['listSelections']>[number];

export interface LineRange {
	fromLine: number;
	toLine: number;
}

/**
 * Sorts ranges by their fromLine property.
 *
 * @param ranges - Array of ranges with their content
 * @param order - Sort order (Ascending or Descending). Defaults to Ascending.
 * @returns The ranges sorted by fromLine
 */
export function sortRanges<T extends { range: LineRange }>(
	ranges: T[],
	order = SortOrder.Ascending
): T[] {
	const sorted = [...ranges].sort((a, b) => a.range.fromLine - b.range.fromLine);
	return order === SortOrder.Descending ? sorted.reverse() : sorted;
}

/**
 * Normalizes a selection (anchor/head) into a line range (from/to).
 *
 * @param anchor - The anchor line number of the selection
 * @param head - The head line number of the selection
 * @returns The normalized line range with fromLine and toLine
 */
export function lineRangeFromSelection(anchor: number, head: number): LineRange {
	return {
		fromLine: Math.min(anchor, head),
		toLine: Math.max(anchor, head),
	};
}

/**
 * Gets lines from the editor within a specified range.
 *
 * @param editor - The Obsidian editor instance
 * @param range - The line range to retrieve content from
 * @returns An object containing the range and array of line contents
 */
export function getLineRangeContent(
	editor: Editor,
	range: LineRange
): { range: LineRange; lines: string[] } {
	const lines: string[] = [];
	for (let i = range.fromLine; i <= range.toLine; i++) {
		const lineContent = editor.getLine(i);
		if (lineContent !== undefined) {
			lines.push(lineContent);
		}
	}
	return { range, lines };
}

/**
 * Replaces lines in the editor with new content.
 *
 * @param editor - The Obsidian editor instance
 * @param range - The line range to replace
 * @param lines - Array of new line contents
 * @returns True if the replacement was successful, false if the range was invalid
 */
export function replaceLineRange(editor: Editor, range: LineRange, lines: string[]): boolean {
	const toLine = editor.getLine(range.toLine);
	if (toLine === undefined) {
		return false; // Skip invalid ranges
	}

	const from = { line: range.fromLine, ch: 0 };
	const to = {
		line: range.toLine,
		ch: toLine.length,
	};

	// Replace the original range with the new lines
	editor.replaceRange(lines.join('\n'), from, to);
	return true;
}

/**
 * Creates a selection object spanning the specified line range.
 *
 * @param editor - The Obsidian editor instance
 * @param fromLine - The starting line number
 * @param toLine - The ending line number
 * @returns An editor selection object spanning the line range
 */
export function lineSelection(editor: Editor, fromLine: number, toLine: number): EditorSelection {
	const lastLine = editor.getLine(toLine);
	return {
		anchor: { line: fromLine, ch: 0 },
		head: {
			line: toLine,
			ch: lastLine?.length ?? 0,
		},
	};
}

/**
 * Transforms the selected lines using the provided transformer function.
 *
 * @param editor - The Obsidian editor instance
 * @param transformer - Function that takes an array of lines and returns transformed lines
 */
export function transformLineSelections(
	editor: Editor,
	transformer: (lines: string[]) => string[]
) {
	// Get all selections to support multiple cursors
	const selections = editor.listSelections();

	if (selections.length === 0) {
		return; // No selections to transform
	}

	// Build ranges with their content
	const ranges = selections.map(selection => {
		const range = lineRangeFromSelection(selection.anchor.line, selection.head.line);
		return getLineRangeContent(editor, range);
	});

	// Transform the content within each range
	const rangesWithTransformedContent = ranges.map(({ range, lines }) => ({
		range,
		lines: transformer(lines),
	}));

	const newSelections: EditorSelection[] = [];

	// Apply transformed results to editor in reverse order to avoid
	// position shifts due to changed content
	const transformedRanges = sortRanges(rangesWithTransformedContent, SortOrder.Descending);
	for (const { range, lines } of transformedRanges) {
		if (!replaceLineRange(editor, range, lines)) {
			continue; // Skip invalid ranges
		}

		// Preserve the selection for this range
		const toLine = range.fromLine + lines.length - 1;
		newSelections.push(lineSelection(editor, range.fromLine, toLine));
	}

	// Restore all selections (in original order)
	if (newSelections.length > 0) {
		editor.setSelections(newSelections.reverse());
	}
}
