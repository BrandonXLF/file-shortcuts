import * as vscode from 'vscode';
import { StorageAreas, StorageArea } from "./storageAreas";

export type ShortcutData = {
	file: string;
	index: number;
};

export type GroupData = {
	name: string;
	items: ShortcutData[];
	area: StorageAreas;
	index: number;
};

export class GroupStore {
	constructor(public areas: Record<StorageAreas, StorageArea>) { }
	
	getInArea(area: StorageAreas): GroupData[] {
		const storedGroups = this.areas[area].store.get<{
			name: string;
			items: ShortcutData[];
		}[]>('groups', []);
		
		if (storedGroups[0]?.name !== '')
			storedGroups.push({
				name: '',
				items: []
			});
		
		return storedGroups.map(({ name, items }, index) => ({
			name,
			items: items.map((item, index) => ({ ...item, index })),
			area,
			index
		}));
	}
	
	setInArea(area: StorageAreas, groups: GroupData[]) {
		this.areas[area].store.update('groups', groups.map(group => {
			let storedGroup: Omit<GroupData, 'area' | 'index'> & Partial<GroupData> = { ...group };
			
			delete storedGroup.area;
			delete storedGroup.index;
			storedGroup.items.forEach((item: Partial<ShortcutData>) => delete item.index);
			
			return storedGroup;
		}));
	}
	
	getAll(): GroupData[] {
		const workspace = this.getInArea(StorageAreas.Workspace);
		const global = this.getInArea(StorageAreas.Global);
		const all = [];
	
		// Merge sorted GroupData arrays
		let workspaceIndex = 0;
		let globalIndex = 0;
	
		for (let i = 0; i < workspace.length + global.length; i++) {
			const addFromGlobal = workspaceIndex === workspace.length || (
				globalIndex < global.length &&
				global[globalIndex].name < workspace[workspaceIndex].name
			);
	
			all[i] = addFromGlobal ? global[globalIndex++] : workspace[workspaceIndex++];
		}
	
		return all;
	}
	
	get(area: StorageAreas, index: number) {
		return this.getInArea(area)[index];
	}
	
	set(area: StorageAreas, index: number, group: GroupData) {
		const groups = this.getInArea(area);
		
		groups[index] = group;
		
		this.setInArea(area, groups);
	}
	
	delete(area: StorageAreas, index: number) {
		const groups = this.getInArea(area);
		
		groups.splice(index, 1);
		
		this.setInArea(area, groups);
	}
	
	getAreaInfo(group: GroupData) {
		return this.areas[group.area];
	}
	
	async create(): Promise<GroupData | undefined> {
		const name = await vscode.window.showInputBox({ placeHolder: 'Enter group name' });
	
		if (!name) return;
	
		const areaChoice = await vscode.window.showQuickPick(
			[
				{
					label: `$(${this.areas[StorageAreas.Workspace].icon}) ${this.areas[StorageAreas.Workspace].name}`,
					area: StorageAreas.Workspace
				},
				{
					label: `$(${this.areas[StorageAreas.Global].icon}) ${this.areas[StorageAreas.Global].name}`,
					area: StorageAreas.Global
				}
			],
			{ placeHolder: 'Select an area' }
		);
	
		if (!areaChoice) return;
	
		const groups = this.getInArea(areaChoice.area);
	
		if (groups.some(group => group.name === name)) {
			vscode.window.showErrorMessage('A group with that name already exists in that area.');
	
			return;
		}
	
		let index = groups.findIndex(group => group.name > name);
		
		if (index === -1)
			index = groups.length;
			
		const groupData = {
			name,
			area: areaChoice.area,
			items: [],
			index
		};
		
		groups.splice(index, 0, groupData);
		this.setInArea(areaChoice.area, groups);
		
		return groupData;
	}
	
	async rename(area: StorageAreas, index: number): Promise<boolean> {
		const newName = await vscode.window.showInputBox({ placeHolder: 'Enter group name' });
		
		if (!newName) return false;
		
		const groups = this.getInArea(area);
		
		if (groups.some(group => group.name === newName)) {
			vscode.window.showErrorMessage('A group with that name already exists in that area.');
	
			return false;
		}
		
		groups[index].name = newName;
		this.setInArea(area, groups);
		
		return true;
	}
}