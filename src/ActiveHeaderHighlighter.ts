import * as vscode from 'vscode';

interface CancelToken {
	isCancellationRequested: boolean
}

interface HeaderDecorationOptions extends vscode.DecorationOptions {
	headerLevel: number
}

const UncancelableToken = { isCancellationRequested: false };

const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^(={3,}|(-{3,}))[ \t]*$/

const fencedCodeBlockEndRegEx = /^\s{0,3}(`{3,}|~{3,})\s*$/ // Based on fenced_code_block_unknown "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"

const fencedCodeBlockStartRegEx = /^\s{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/  // Based on fenced_code_block_unknown "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"

function findEndOfFencedCodeBlockLineIdx(document: vscode.TextDocument, startLineIdx: number, maxLineIdxToCheck: number) {
	let currentLineIdx = startLineIdx;
	while (++currentLineIdx < maxLineIdxToCheck && !document.lineAt(currentLineIdx).text.match(fencedCodeBlockEndRegEx)) {
	}
	return currentLineIdx;
}

function resetHeaderLevels(activeHeaders: HeaderDecorationOptions[], headerLevel: number) {
	while (activeHeaders[activeHeaders.length - 1]?.headerLevel >= headerLevel) {
		activeHeaders.pop();
	}

}


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
		
		let activeHeaders: HeaderDecorationOptions[] = [];
		const selectedLineIdx = pos.line;

		let currentLineIdx = -1;
		while (++currentLineIdx <= selectedLineIdx) {
			let currentLineText = document.lineAt(currentLineIdx).text;
			let currentHeaderLineIdx: number = -1;
			let currentHeaderLevel: number | null = null;
			let currentHeaderStartChar: number = 0;
			let currentHeaderEndChar: number = 0;
			let match: RegExpMatchArray | null;

			if (currentLineText.match(fencedCodeBlockStartRegEx)) {
				currentLineIdx = findEndOfFencedCodeBlockLineIdx(document, currentLineIdx, selectedLineIdx);
			} else if ( (match = currentLineText.match(HeaderRegEx)) ) {
				currentHeaderLineIdx = currentLineIdx;
				currentHeaderLevel = match[3].length;
				currentHeaderStartChar = match[1].length;
				currentHeaderEndChar = match[1].length + match[2].length;
			} else if ( (match = currentLineText.match(AltHeaderRegEx)) ) {
				currentHeaderLineIdx = currentLineIdx - 1;
				currentHeaderLevel = (match[1].charAt(0) == '=' ? 1 : 2);
				currentHeaderStartChar = 0;
				currentHeaderEndChar = document.lineAt(currentLineIdx).text.trimEnd().length
			}

			if (currentHeaderLevel) {
				resetHeaderLevels(activeHeaders, currentHeaderLevel);
				if (currentLineIdx < selectedLineIdx) {
					activeHeaders.push({ headerLevel: currentHeaderLevel, range: new vscode.Range(currentHeaderLineIdx, currentHeaderStartChar, currentHeaderLineIdx, currentHeaderEndChar) })
				}
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
