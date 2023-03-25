import * as vscode from 'vscode';
import { GroupData, GroupStore } from "./groupStore";
import { StorageAreas } from './storageAreas';

export class ShortcutManager {
	constructor(public groupStore: GroupStore) { }
	
	async add(files: vscode.Uri[] = []): Promise<undefined> {
		if (!files.length) {
			let editor = vscode.window.activeTextEditor;
			
			if (!editor) return;
			
			files[0] = editor.document.uri;
		}
		
		type QuickPickOption = {
			label: string;
			kind?: number;
		} | {
			label: string;
			area: StorageAreas;
			index: number;
		};
		
		const options: QuickPickOption[] = this.groupStore.getAll().map(groupData => {
			const areaInfo = this.groupStore.getAreaInfo(groupData);
			
			return {
				label: groupData.name || areaInfo.name,
				description: groupData.name ? areaInfo.name : undefined,
				area: groupData.area,
				index: groupData.index
			};
		});
		
		options.splice(2, 0, {
			label: 'Groups',
			kind: -1
		});
	
		let areaChoice: { area: StorageAreas; index: number; } | {} | undefined = await vscode.window.showQuickPick(
			[
				...options,
				{ label: '', kind: -1 },
				{ label: '$(add) Create new group...' }
			],
			{ placeHolder: 'Select a group' }
		);
	
		if (!areaChoice) return;
	
		if (!('index' in areaChoice)) {
			areaChoice = await this.groupStore.create();
		}
		
		if (!areaChoice || !('index' in areaChoice))
			return;
		
		const group = this.groupStore.get(areaChoice.area, areaChoice.index);
		files.forEach(file => this.addToGroup(group, file));
	}
	
	addToGroup(group: GroupData, file: vscode.Uri) {
		if (group.items.some(item => item.file === file.fsPath)) {
			vscode.window.showErrorMessage('Group already contains that file.');
			
			return;
		}
	
		group.items.push({ file: file.fsPath, index: NaN });
		this.groupStore.set(group.area, group.index, group);
	}
	
	delete(area: StorageAreas, groupIndex: number, shortcutIndex: number) {
		const group = this.groupStore.get(area, groupIndex);
		group.items.splice(shortcutIndex, 1);
		this.groupStore.set(area, groupIndex, group);
	}
}