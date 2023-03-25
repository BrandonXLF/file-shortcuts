import * as vscode from 'vscode';
import { GroupStore } from './groupStore';
import { Group, ItemTypes, Shortcut, ShortcutNodeProvider } from './shortcutNodeProvider';
import { StorageAreas, areasFromContext, StorageArea } from './storageAreas';

let context: vscode.ExtensionContext;
let nodeProvider: ShortcutNodeProvider;
let areas: Record<StorageAreas, StorageArea>;
let groupStore: GroupStore;

async function addShortcut(e?: {fsPath: string}) {
	if (!e) {
		let editor = vscode.window.activeTextEditor;
		
		if (!editor) return;
		
		e = editor.document.uri;
	}

	let file = e.fsPath;
	
	type QuickPickOption = {
		label: string;
		kind?: number;
	} | {
		label: string;
		area: StorageAreas;
		index: number;
	};
	
	const options: QuickPickOption[] = groupStore.getAll().map(groupData => ({
		label: `$(${areas[groupData.area].icon}) ${groupData.name || areas[groupData.area].name}`,
		area: groupData.area,
		index: groupData.index
	}));
	
	options.splice(2, 0, {
		label: 'Groups',
		kind: -1
	});

	let areaChoice: { area: StorageAreas; index: number; } | {} | undefined = await vscode.window.showQuickPick(
		[
			...options,
			{ label: '', kind: -1 },
			{ label: '$(add) New group' }
		],
		{ placeHolder: 'Select a group' }
	);

	if (!areaChoice) return;

	if (!('index' in areaChoice)) {
		areaChoice = await groupStore.create();
	}
	
	if (!areaChoice || !('index' in areaChoice))
		return;
	
	const group = groupStore.get(areaChoice.area, areaChoice.index);

	if (group.items.some(item => item.file === file)) {
		vscode.window.showErrorMessage('Group already contains that file.');
		
		return;
	}

	group.items.push({ file, index: NaN });
	groupStore.set(areaChoice.area, areaChoice.index, group);
	
	nodeProvider.refresh();
}

function removeShortcut(item: Group | Shortcut) {
	if (item.type === ItemTypes.Group) {
		groupStore.delete(item.data.area, item.data.index);
	} else {
		const group = groupStore.getInArea(item.group.data.area)[item.group.data.index];

		group.items.splice(item.data.index, 1);
		groupStore.set(item.group.data.area, item.group.data.index, group);
	}

	nodeProvider.refresh();
}

function openShortcut(e: Shortcut) {
	vscode.commands.executeCommand('vscode.open', e.resourceUri);
}

export function activate(localContext: vscode.ExtensionContext) {
	context = localContext;
	areas = areasFromContext(localContext);
	groupStore = new GroupStore(areas);
	nodeProvider = new ShortcutNodeProvider(groupStore);

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('shortcuts', nodeProvider),
		vscode.commands.registerCommand('shortcuts.add', addShortcut),
		vscode.commands.registerCommand('shortcuts.remove', removeShortcut),
		vscode.commands.registerCommand('shortcuts.open', openShortcut)
	);
}