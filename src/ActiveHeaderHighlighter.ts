import * as vscode from 'vscode';

interface CancelToken {
	isCancellationRequested: boolean
}

const UncancelableToken = { isCancellationRequested: false };

const HeaderRegEx = /^\s*((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^(={3,}|(-{3,}))[ \t]*$/

class ActiveHeaderHighlighterProvider implements vscode.DocumentHighlightProvider {

	activeHeaderDecorationType!: vscode.TextEditorDecorationType;
	activeHeaderHighlightingEnabled: boolean = false;

	constructor() {
		this.handleUpdatedConfig();
	}

	handleUpdatedConfig() {
		this.activeHeaderDecorationType?.dispose();

		let colorizerConfig = vscode.workspace.getConfiguration("markdown-color-plus");
		this.activeHeaderHighlightingEnabled = colorizerConfig.get<boolean>('currentHeaders.background.enabled',false)
		this.activeHeaderDecorationType = vscode.window.createTextEditorDecorationType({
			light: { backgroundColor: colorizerConfig.get<string>('currentHeaders.background.lightThemeColor') },
			dark:  { backgroundColor: colorizerConfig.get<string>('currentHeaders.background.darkThemeColor') }
		});

	}

	updateHighlights(document: vscode.TextDocument, pos: vscode.Position, token: CancelToken) {
		if (!this.activeHeaderHighlightingEnabled || vscode.window.activeTextEditor?.document !== document) {
			return;
		}
		
		const activeHeaders: vscode.DecorationOptions[] = [];

		let currentLine = pos.line + 1;
		let currentHeaderLevel = 7;
		while (--currentLine > -1 && currentHeaderLevel > 0) {
			let newHeaderLevel: number | null = null;
			let newHeaderLength: number = 0;
			let match: RegExpMatchArray | null;
			if ( (match = document.lineAt(currentLine).text.match(HeaderRegEx)) ) {
				newHeaderLevel = match[2].length;
				newHeaderLength = match[1].length;
			} else if ( (match = document.lineAt(currentLine).text.match(AltHeaderRegEx)) ) {
				currentLine--
				newHeaderLevel = (match[1].charAt(0) == '=' ? 1 : 2);
				newHeaderLength = document.lineAt(currentLine).text.trimEnd().length
			}

			if (newHeaderLevel && newHeaderLevel < currentHeaderLevel) {
				if (currentLine != pos.line) {
					activeHeaders.push({ range: new vscode.Range(currentLine, 0, currentLine, newHeaderLength) })
				}
				currentHeaderLevel = newHeaderLevel;
			}
		}

		vscode.window.activeTextEditor.setDecorations(this.activeHeaderDecorationType, activeHeaders);
	}
	
	clearHighlights() {
		vscode.window.activeTextEditor?.setDecorations(this.activeHeaderDecorationType, []);
	}
	

	provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentHighlight[]> {
		this.updateHighlights(document, position, token);
		return [];
	}

	textDocumentChangeHandler(document: vscode.TextDocument, contentChanges: vscode.TextDocumentContentChangeEvent[]) {
		if (contentChanges.length == 1) {
			this.updateHighlights(document, contentChanges[0].range.start, UncancelableToken);
		} else {
			this.clearHighlights();
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
			activeHeaderHighlighter.handleUpdatedConfig();
		})
	);

}
