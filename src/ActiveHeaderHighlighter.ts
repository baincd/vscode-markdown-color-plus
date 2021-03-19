import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'

import * as Decorator from './Decorator'


class ActiveHeaderHighlighterProvider implements vscode.DocumentHighlightProvider {

	lastTextDocChangeCancellationToken: Decorator.TextDocumentCancelToken = { isCancellationRequested: true };

	updateHighlights(document: vscode.TextDocument, pos: vscode.Position, token: Decorator.TextDocumentCancelToken) {
		if (!ConfigurationHandler.config.activeHeader.enabled || vscode.window.activeTextEditor?.document !== document) {
			return;
		}

		Decorator.updateDecorations(vscode.window.activeTextEditor, pos, token);
	}
	

	provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentHighlight[]> {
		this.updateHighlights(document, position, token);
		return [];
	}

}

export function activate(context: vscode.ExtensionContext) {

	let activeHeaderHighlighter = new ActiveHeaderHighlighterProvider();

	context.subscriptions.push(
		vscode.languages.registerDocumentHighlightProvider(
			{ language: 'markdown' },
			activeHeaderHighlighter
		)
	);

}
