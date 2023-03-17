import * as vscode from 'vscode';

export enum StorageAreas {
	Workspace,
	Global
};

export type StorageArea = {
	name: string;
	icon: string;
	store: vscode.Memento;
};

export function areasFromContext(context: vscode.ExtensionContext): Record<StorageAreas, StorageArea> {
	return {
		[StorageAreas.Workspace]: {
			name: 'Workspace',
			icon: 'home',
			store: context.workspaceState
		},
		[StorageAreas.Global]: {
			name: 'Global',
			icon: 'globe',
			store: context.globalState
		}
	};
}