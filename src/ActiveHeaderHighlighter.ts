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

	textDocumentChangeHandler(document: vscode.TextDocument, contentChanges: vscode.TextDocumentContentChangeEvent[]) {
		if (contentChanges.length == 1) {
			if (this.lastTextDocChangeCancellationToken.document == document) {
				this.lastTextDocChangeCancellationToken.isCancellationRequested = true;
			}
			this.lastTextDocChangeCancellationToken = {
				isCancellationRequested: false,
				document: document
			}
			this.updateHighlights(document, contentChanges[0].range.start, this.lastTextDocChangeCancellationToken);
		} else {
			if (vscode.window.activeTextEditor?.document === document) {
				Decorator.clearDecorations(vscode.window.activeTextEditor);
			}
		}
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

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document.languageId == 'markdown') {
				activeHeaderHighlighter.textDocumentChangeHandler(event.document, event.contentChanges);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			ConfigurationHandler.resetAllDecorations();
			ConfigurationHandler.readConfig();
		})
	);

}
