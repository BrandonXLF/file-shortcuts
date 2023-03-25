import * as vscode from 'vscode';

export enum StorageAreas {
	Workspace,
	Global
};

export type StorageArea = {
	name: string;
	store: vscode.Memento;
};

export function areasFromContext(context: vscode.ExtensionContext): Record<StorageAreas, StorageArea> {
	return {
		[StorageAreas.Workspace]: {
			name: 'Workspace',
			store: context.workspaceState
		},
		[StorageAreas.Global]: {
			name: 'Global',
			store: context.globalState
		}
	};
}