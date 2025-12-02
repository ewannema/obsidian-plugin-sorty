# Obsidian Sorty Plugin

A powerful sorting plugin for Obsidian that provides various ways to sort lines of text, including alphabetical, numeric, and task-based sorting with support for nested content.

## Features

- **Multiple Sort Types**: Alphabetical, reverse alphabetical, numeric, and reverse numeric sorting
- **Task Sorting**: Sort Markdown tasks by name or completion status
- **Nested Task Support**: Automatically groups parent tasks with their children when sorting
- **Configurable Commands**: Enable/disable individual sort commands through settings

## Commands

All sort commands work on the currently selected lines in your editor.

### Basic Sorting

- **Sort Lines**: Sort lines alphabetically (A-Z)
- **Sort Lines (Reverse)**: Sort lines in reverse alphabetical order (Z-A)
- **Sort Lines (Numeric)**: Sort lines with natural number ordering (e.g., "file2.txt" before "file10.txt")
- **Sort Lines (Numeric Reverse)**: Sort lines in reverse numeric order

### Task Sorting

- **Sort Tasks**: Sort Markdown tasks by task name, ignoring completion status
  - Preserves nested subtasks with their parent tasks
  - Handles both `[x]` and `[X]` as completed

- **Sort Tasks (By Completion)**: Group tasks by completion status
  - Incomplete tasks (`[ ]`) appear first
  - Completed tasks (`[x]` or `[X]`) appear second
  - Maintains stable sort order within each group
  - Preserves nested subtasks with their parents

### How Nested Tasks Work

When sorting tasks, the plugin groups parent tasks with their indented children:

**Before sorting:**
```markdown
- [ ] Zebra task
  - [ ] Zebra subtask 1
  - [ ] Zebra subtask 2
- [ ] Apple task
  - [ ] Apple subtask
```

**After "Sort Tasks":**
```markdown
- [ ] Apple task
  - [ ] Apple subtask
- [ ] Zebra task
  - [ ] Zebra subtask 1
  - [ ] Zebra subtask 2
```

## Settings

The plugin includes a settings page where you can enable or disable individual sort commands:

- **Sort Lines**: Toggle the "Sort Lines" command
- **Sort Lines (Reverse)**: Toggle the "Sort Lines (Reverse)" command
- **Sort Lines (Numeric)**: Toggle the "Sort Lines (Numeric)" command
- **Sort Lines (Numeric Reverse)**: Toggle the "Sort Lines (Numeric Reverse)" command
- **Sort Tasks**: Toggle the "Sort Tasks" command
- **Sort Tasks (By Completion)**: Toggle the "Sort Tasks (By Completion)" command

Changes to settings take effect immediately—no need to restart Obsidian!

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

1. Build the plugin or download the release.
2. Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## API Documentation

See https://github.com/obsidianmd/obsidian-api
