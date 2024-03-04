import * as vscode from 'vscode';
import { GroupStore } from './groupStore';
import { ShortcutManager } from './shortcutManger';
import { Group, ItemTypes, Shortcut, ShortcutNodeProvider } from './shortcutNodeProvider';
import { StorageAreas, areasFromContext, StorageArea } from './storageAreas';

let context: vscode.ExtensionContext;
let areas: Record<StorageAreas, StorageArea>;
let groupStore: GroupStore;
let shortcutManager: ShortcutManager;
let nodeProvider: ShortcutNodeProvider;

async function addShortcut(file?: Object | vscode.Uri, files?: Object | Object[] | vscode.Uri[]) {
	let addFiles: vscode.Uri[] = [];
	
	if (Array.isArray(files) && files[0] instanceof vscode.Uri)
		addFiles = files as vscode.Uri[];
	else if (file instanceof vscode.Uri)
		addFiles = [file];
	
	await shortcutManager.add(addFiles);
	nodeProvider.refresh();
}

async function renameGroup(item: Group) {
	await groupStore.rename(item.data.area, item.data.index);
	nodeProvider.refresh();
}

function removeShortcut(item: Group | Shortcut) {
	if (item.type === ItemTypes.Group)
		groupStore.delete(item.data.area, item.data.index);
	else
		shortcutManager.delete(item.group.data.area, item.group.data.index, item.data.index);

	nodeProvider.refresh();
}

function openShortcut(e: Shortcut) {
	vscode.commands.executeCommand('vscode.open', e.resourceUri);
}

function refreshShortcut() {
	nodeProvider.refresh();
}

export function activate(localContext: vscode.ExtensionContext) {
	context = localContext;
	areas = areasFromContext(localContext);
	groupStore = new GroupStore(areas);
	shortcutManager = new ShortcutManager(groupStore);
	nodeProvider = new ShortcutNodeProvider(groupStore);

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('file-shortcuts', nodeProvider),
		vscode.commands.registerCommand('file-shortcuts.add', addShortcut),
		vscode.commands.registerCommand('file-shortcuts.rename', renameGroup),
		vscode.commands.registerCommand('file-shortcuts.remove', removeShortcut),
		vscode.commands.registerCommand('file-shortcuts.open', openShortcut),
		vscode.commands.registerCommand('file-shortcuts.refresh', refreshShortcut)
	);
}