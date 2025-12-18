import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { createSorter, SortComparators } from './sorting';
import { transformLineSelections } from './editor';
import { groupTaskLines } from './tasks';

interface SortCommand {
	id: string;
	name: string;
	comparator: (a: string, b: string) => number;
	enabledByDefault: boolean;
	groupFn?: (lines: string[]) => string[][]; // Optional function to group lines before sorting
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
		groupFn: groupTaskLines,
		enabledByDefault: true,
	},
	{
		id: 'sorty-sort-tasks-by-completion',
		name: 'Sort Tasks (By Completion)',
		comparator: SortComparators.tasksByCompletion,
		groupFn: groupTaskLines,
		enabledByDefault: true,
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
								const sorter = createSorter(command.comparator, command.groupFn);
								transformLineSelections(view.editor, sorter);
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
