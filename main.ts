import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { normalizeSelection, sortMultipleRanges } from './sorting';
import { TASK_REGEX, TASK_EXTRACT_REGEX, COMPLETED_TASK_REGEX } from './constants';

// Helper function to check if a line is a top-level task (no leading whitespace)
export function isTopLevelTask(line: string): boolean {
	return TASK_REGEX.test(line);
}

// Helper function to group lines into task blocks (parent + nested children)
export function groupTaskLines(lines: string[]): string[][] {
	const groups: string[][] = [];
	let currentGroup: string[] = [];

	for (const line of lines) {
		if (isTopLevelTask(line)) {
			// Start a new group
			if (currentGroup.length > 0) {
				groups.push(currentGroup);
			}
			currentGroup = [line];
		} else {
			// Add to current group (nested task or other line)
			currentGroup.push(line);
		}
	}

	// Don't forget the last group
	if (currentGroup.length > 0) {
		groups.push(currentGroup);
	}

	return groups;
}

export const SortComparators = {
	alpha: (a: string, b: string) => a.localeCompare(b),
	reverseAlpha: (a: string, b: string) => b.localeCompare(a),
	numeric: (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }),
	reverseNumeric: (a: string, b: string) => b.localeCompare(a, undefined, { numeric: true }),
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

interface SortCommand {
	id: string;
	name: string;
	comparator: (a: string, b: string) => number;
	enabledByDefault: boolean;
	groupNested?: boolean; // Whether to group nested tasks/items together when sorting
}

const SORT_COMMANDS: SortCommand[] = [
	{
		id: 'sorty-sort-lines',
		name: 'Sort Lines',
		comparator: SortComparators.alpha,
		enabledByDefault: true,
	},
	{
		id: 'sorty-sort-lines-reverse',
		name: 'Sort Lines (Reverse)',
		comparator: SortComparators.reverseAlpha,
		enabledByDefault: true,
	},
	{
		id: 'sorty-sort-lines-numeric',
		name: 'Sort Lines (Numeric)',
		comparator: SortComparators.numeric,
		enabledByDefault: true,
	},
	{
		id: 'sorty-sort-lines-numeric-reverse',
		name: 'Sort Lines (Numeric Reverse)',
		comparator: SortComparators.reverseNumeric,
		enabledByDefault: true,
	},
	{
		id: 'sorty-sort-tasks',
		name: 'Sort Tasks',
		comparator: SortComparators.tasks,
		enabledByDefault: true,
		groupNested: true,
	},
	{
		id: 'sorty-sort-tasks-by-completion',
		name: 'Sort Tasks (By Completion)',
		comparator: SortComparators.tasksByCompletion,
		enabledByDefault: true,
		groupNested: true,
	},
];

interface SortySettings {
	commandsEnabled: Record<string, boolean>;
}

const DEFAULT_SETTINGS: SortySettings = {
	commandsEnabled: Object.fromEntries(SORT_COMMANDS.map(cmd => [cmd.id, cmd.enabledByDefault])),
};

export default class Sorty extends Plugin {
	settings: SortySettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// Register all sort commands with conditional availability
		for (const command of SORT_COMMANDS) {
			this.addCommand({
				id: command.id,
				name: command.name,
				checkCallback: (checking: boolean) => {
					// Only show command if it's enabled in settings
					const isEnabled = this.settings.commandsEnabled[command.id] ?? command.enabledByDefault;

					if (isEnabled) {
						if (!checking) {
							const view = this.app.workspace.getActiveViewOfType(MarkdownView);
							if (view) {
								this.sortLines(view.editor, command.comparator, command.groupNested ?? false);
							}
						}
						return true;
					}
					return false;
				},
			});
		}

		this.addSettingTab(new SortySettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Sort the selected lines using the provided comparison function
	sortLines(
		editor: Editor,
		compareFn: (a: string, b: string) => number = SortComparators.alpha,
		groupNested: boolean = false
	) {
		// Get all selections to support multiple cursors
		const selections = editor.listSelections();

		if (selections.length === 0) {
			return; // No selections to sort
		}

		// Build ranges with their content
		const ranges = selections.map(selection => {
			const range = normalizeSelection(selection.anchor.line, selection.head.line);
			const lines: string[] = [];
			for (let i = range.fromLine; i <= range.toLine; i++) {
				const lineContent = editor.getLine(i);
				if (lineContent !== undefined) {
					lines.push(lineContent);
				}
			}
			return { range, lines };
		});

		// Sort all ranges (returns in reverse order for processing)
		const sortedRanges = sortMultipleRanges(ranges, compareFn, groupNested, groupTaskLines);

		const newSelections: Array<{
			anchor: { line: number; ch: number };
			head: { line: number; ch: number };
		}> = [];

		// Apply sorted results to editor (in reverse order to avoid position shifts)
		for (const { range, result } of sortedRanges) {
			const toLine = editor.getLine(range.toLine);
			if (toLine === undefined) {
				continue; // Skip invalid ranges
			}

			const from = { line: range.fromLine, ch: 0 };
			const to = {
				line: range.toLine,
				ch: toLine.length,
			};

			// Replace the lines with sorted versions
			editor.replaceRange(result.sortedLines.join('\n'), from, to);

			// Preserve the selection for this range
			const lastLine = editor.getLine(range.fromLine + result.lineCount - 1);
			newSelections.push({
				anchor: { line: range.fromLine, ch: 0 },
				head: {
					line: range.fromLine + result.lineCount - 1,
					ch: lastLine?.length ?? 0,
				},
			});
		}

		// Restore all selections (in original order)
		if (newSelections.length > 0) {
			editor.setSelections(newSelections.reverse());
		}
	}
}

class SortySettingTab extends PluginSettingTab {
	plugin: Sorty;

	constructor(app: App, plugin: Sorty) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName('Features').setHeading();

		// Create a toggle for each sort command
		for (const command of SORT_COMMANDS) {
			new Setting(containerEl)
				.setName(command.name)
				.setDesc(`Enable the ${command.name} command`)
				.addToggle(toggle =>
					toggle
						.setValue(this.plugin.settings.commandsEnabled[command.id] ?? command.enabledByDefault)
						.onChange(async value => {
							this.plugin.settings.commandsEnabled[command.id] = value;
							await this.plugin.saveSettings();
						})
				);
		}
	}
}
