import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'
import * as Decorator from './Decorator'
import * as ActiveHeaderHighlighter from './ActiveHeaderHighlighter'

let updateActiveEditorTimeout: NodeJS.Timer | undefined = undefined;
let updateAllEditorsTimeout: NodeJS.Timer | undefined = undefined;

function triggerUpdateActiveEditorDecorations(delay: number, pos?: vscode.Position) {
	if (updateActiveEditorTimeout) {
		clearTimeout(updateActiveEditorTimeout);
		updateActiveEditorTimeout = undefined;
	}
	updateActiveEditorTimeout = setTimeout(() => Decorator.updateDecorations(vscode.window.activeTextEditor, pos), delay);
}

function triggerUpdateAllEditorsDecorations() {
	if (updateAllEditorsTimeout) {
		clearTimeout(updateAllEditorsTimeout);
		updateAllEditorsTimeout = undefined;
	}
	updateAllEditorsTimeout = setTimeout(() => vscode.window.visibleTextEditors.forEach(e => Decorator.updateDecorations(e)), ConfigurationHandler.config.activeEditorChangeUpdateDelay);
}


export function activate(context: vscode.ExtensionContext) {
	// console.log('markdown-color-plus Activated');

	// vscode.window.onDidChangeActiveTextEditor(editor => {
	// 	if (editor) {
	// 		triggerUpdateActiveEditorDecorations(activeEditorChangeUpdateDelay);
	// 	}
	// }, null, context.subscriptions);

	vscode.window.onDidChangeVisibleTextEditors(editors => {
		triggerUpdateAllEditorsDecorations()
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document === vscode.window.activeTextEditor?.document) {
			triggerUpdateActiveEditorDecorations(
				ConfigurationHandler.config.editTextChangeUpdateDelay,
				event.contentChanges.length == 1 ? event.contentChanges[0].range.start : undefined);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidOpenTextDocument(doc => {
		if (doc.languageId != 'markdown') {
			Decorator.clearDecorations(vscode.window.activeTextEditor);
		} else {
			triggerUpdateActiveEditorDecorations(ConfigurationHandler.config.activeEditorChangeUpdateDelay);
		}
	}, null, context.subscriptions)
	
	vscode.workspace.onDidChangeConfiguration(e => {
		ConfigurationHandler.resetAllDecorations();
		ConfigurationHandler.readConfig();
		triggerUpdateAllEditorsDecorations();	
	}, null, context.subscriptions)

	ActiveHeaderHighlighter.activate(context);

	// ***** Cleanup *****

	context.subscriptions.push({
		dispose: ConfigurationHandler.resetAllDecorations
	});

	triggerUpdateAllEditorsDecorations();
}
