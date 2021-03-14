import * as vscode from 'vscode';

interface CancelToken {
	isCancellationRequested: boolean
}

const UncancelableToken = { isCancellationRequested: false };

const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^(={3,}|(-{3,}))[ \t]*$/

const fencedCodeBlockEndRegEx = /^\s{0,3}(`{3,}|~{3,})\s*$/ // Based on fenced_code_block_unknown "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"

const fencedCodeBlockStartRegEx = /^\s{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/  // Based on fenced_code_block_unknown "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"


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
		
		let activeHeaders: vscode.DecorationOptions[] = [];

		let currentLineIdx = pos.line + 1;
		let prevHeaderLevel = 7;
		while (--currentLineIdx > -1 && prevHeaderLevel > 0) {
			let currentLineText = document.lineAt(currentLineIdx).text;
			let currentHeaderLevel: number | null = null;
			let currentHeaderLength: number = 0;
			let match: RegExpMatchArray | null;

			if (currentLineText.match(fencedCodeBlockEndRegEx)) {
				while (--currentLineIdx > -1 && !document.lineAt(currentLineIdx).text.match(fencedCodeBlockStartRegEx)) {
				}
			} else if (currentLineText.match(fencedCodeBlockStartRegEx)) {
				// Selected line must be within a fenced code block
				activeHeaders = [];
				prevHeaderLevel = 7;
			} else if ( (match = currentLineText.match(HeaderRegEx)) ) {
				currentHeaderLevel = match[3].length;
				currentHeaderLength = match[1].length + match[2].length;
			} else if ( (match = currentLineText.match(AltHeaderRegEx)) ) {
				currentLineIdx--
				currentHeaderLevel = (match[1].charAt(0) == '=' ? 1 : 2);
				currentHeaderLength = currentLineText.trimEnd().length
			}

			if (currentHeaderLevel && currentHeaderLevel < prevHeaderLevel) {
				if (currentLineIdx != pos.line) {
					activeHeaders.push({ range: new vscode.Range(currentLineIdx, 0, currentLineIdx, currentHeaderLength) })
				}
				prevHeaderLevel = currentHeaderLevel;
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
