import * as vscode from 'vscode';
import { GroupStore } from "./groupStore";
import { StorageAreas } from './storageAreas';

export class ShortcutManager {
	constructor(public groupStore: GroupStore) { }
	
	async create(e?: {fsPath: string}): Promise<boolean> {
		if (!e) {
			let editor = vscode.window.activeTextEditor;
			
			if (!editor) return false;
			
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
		
		const options: QuickPickOption[] = this.groupStore.getAll().map(groupData => {
			const areaInfo = this.groupStore.getAreaInfo(groupData);
			
			return {
				label: `$(${areaInfo.icon}) ${groupData.name || areaInfo.name}`,
				area: groupData.area,
				index: groupData.index
			}
		});
		
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
	
		if (!areaChoice) return false;
	
		if (!('index' in areaChoice)) {
			areaChoice = await this.groupStore.create();
		}
		
		if (!areaChoice || !('index' in areaChoice))
			return false;
		
		const group = this.groupStore.get(areaChoice.area, areaChoice.index);
	
		if (group.items.some(item => item.file === file)) {
			vscode.window.showErrorMessage('Group already contains that file.');
			
			return false;
		}
	
		group.items.push({ file, index: NaN });
		this.groupStore.set(areaChoice.area, areaChoice.index, group);
		
		return true;
	}
	
	delete(area: StorageAreas, groupIndex: number, shortcutIndex: number) {
		const group = this.groupStore.get(area, groupIndex);
		group.items.splice(shortcutIndex, 1);
		this.groupStore.set(area, groupIndex, group);
	}
}