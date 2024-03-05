import * as vscode from 'vscode';
import { GroupData, GroupStore, ShortcutData } from './groupStore';

export enum ItemTypes {
	Shortcut,
	Group
}

export class Group extends vscode.TreeItem {
	public data;
	public type = ItemTypes.Group as const;

	constructor(data: GroupData, store: GroupStore) {
		super(
			data.name === '' ? store.getAreaInfo(data).name : data.name,
			data.name === ''
				? vscode.TreeItemCollapsibleState.Expanded
				: vscode.TreeItemCollapsibleState.Collapsed
		);
		
		if (data.name)
			this.description = store.getAreaInfo(data).name;
		
		this.data = data;
		this.contextValue = data.name ? 'group' : 'top';
	}
}

export class Shortcut extends vscode.TreeItem {
	public data;
	public group;
	public fsPath;
	public name;
	public contextValue = 'shortcut';
	public iconPath = vscode.ThemeIcon.File;
	public description = true;
	public type = ItemTypes.Shortcut as const;

	public command = {
		title: 'Open',
		command: 'file-shortcuts.open',
		arguments: [this]
	};

	constructor(data: ShortcutData, group: Group) {
		super(vscode.Uri.file(data.file), vscode.TreeItemCollapsibleState.None);

		this.data = data;
		this.group = group;
		this.fsPath = data.file;
		this.name = data.file;
		this.tooltip = data.file;
	}
}

export class ShortcutNodeProvider implements vscode.TreeDataProvider<Group | Shortcut> {
	private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<Group | Shortcut | null>();
  	readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
	
	constructor(public groupStore: GroupStore) { }

	getTreeItem(element: Group | Shortcut) {
		return element;
	}

	async getChildren(element?: Group | Shortcut): Promise<(Group | Shortcut)[]> {
		if (!element)
			return this.groupStore.getAll()
				.filter(group => group.name || group.items.length)
				.map(group => new Group(group, this.groupStore));

		if (!('items' in element.data)) return [];

		return element.data.items.map(item => new Shortcut(item, element as Group));
	}

	refresh() {
		this.onDidChangeTreeDataEmitter.fire(null);
	}
}