import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	// console.log('diff-lang-colorizer activated');

	// ***** Read config and manage text decorations *****
	// https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
	// https://code.visualstudio.com/api/references/vscode-api#DecorationOptions
	let headerDecorationType: vscode.TextEditorDecorationType;
	let rangeDecorationType: vscode.TextEditorDecorationType;
	let extendedHeaderDecorationType: vscode.TextEditorDecorationType;

	function disposeAllTextDecorations() {
		headerDecorationType?.dispose();
		rangeDecorationType?.dispose();
		extendedHeaderDecorationType?.dispose();
	}

	function handleUpdatedConfig() {
		disposeAllTextDecorations();
		let colorizerConfig = vscode.workspace.getConfiguration("diff-lang-colorizer");

		headerDecorationType = vscode.window.createTextEditorDecorationType({
			fontWeight: colorizerConfig.get<string>('header.fontWeight'),
			fontStyle:  colorizerConfig.get<string>('header.fontStyle'),
			light: {
				color: colorizerConfig.get<string>('header.lightThemeForegroundColor')
			},
			dark: {
				color: colorizerConfig.get<string>('header.darkThemeForegroundColor')
			},
		});

		rangeDecorationType = vscode.window.createTextEditorDecorationType({
			fontWeight: colorizerConfig.get<string>('range.fontWeight'),
			fontStyle:  colorizerConfig.get<string>('range.fontStyle'),
			light: {
				color: colorizerConfig.get<string>('range.lightThemeForegroundColor')
			},
			dark: {
				color: colorizerConfig.get<string>('range.darkThemeForegroundColor')
			},
		});

		extendedHeaderDecorationType = vscode.window.createTextEditorDecorationType({
			fontWeight: colorizerConfig.get<string>('extendedHeader.fontWeight'),
			fontStyle:  colorizerConfig.get<string>('extendedHeader.fontStyle'),
			opacity: colorizerConfig.get<string>('extendedHeader.opacity')
		});
	}

	handleUpdatedConfig();

	// ***** Decorate diff Text Editors *****

	function updateDecorationsOnAllVisibleEditors() {
		vscode.window.visibleTextEditors.forEach(e => updateDecorationsOnEditor(e));
	}

	// Regexs based on https://github.com/microsoft/vscode/blob/main/extensions/git/syntaxes/diff.tmLanguage.json
	// const HeaderGitRegEx = /^diff --git a\/.*$/; // Git RegEx isn't necessary - HeaderCmdRegEx will cover it
	const HeaderCmdRegEx = /^diff (-|\S+\s+\S+).*$/
	const rangeNormalRegEx = /^\d+(,\d+)*(a|d|c)\d+(,\d+)*$/
	const rangeUnifiedRegEx = /^(@@)\s*(.+?)\s*(@@)/
	const rangeContextRegEx = /^(((\-{3}) .+ (\-{4}))|((\*{3}) .+ (\*{4})))$/

	function updateDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		if (editor?.document.languageId != 'diff') {
			return;
		}

		const headers: vscode.DecorationOptions[] = [];
		const ranges: vscode.DecorationOptions[] = [];
		const extHeaders: vscode.DecorationOptions[] = [];

		let doc = editor.document;
		let match: RegExpMatchArray | null = null;
		let lineIdx;
		let inExtHeader = false;
		for (lineIdx = 0; lineIdx < doc.lineCount; lineIdx++) {
			let line = doc.lineAt(lineIdx);
			if (HeaderCmdRegEx.test(line.text)) {
				headers.push({ range: line.range });
				inExtHeader = true;
			} else if ( (match = rangeUnifiedRegEx.exec(line.text))) {
				ranges.push({ range: new vscode.Range(lineIdx, 0, lineIdx, match[0].length) });
				inExtHeader = false;
			} else if (rangeNormalRegEx.test(line.text) ||  rangeContextRegEx.test(line.text)) {
				ranges.push({ range: line.range });
				inExtHeader = false;
			} else if (inExtHeader) {
				extHeaders.push({ range: line.range });
			}
		}
		editor.setDecorations(headerDecorationType, headers);
		editor.setDecorations(rangeDecorationType, ranges);
		editor.setDecorations(extendedHeaderDecorationType, extHeaders);
	}

	function clearDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		editor?.setDecorations(headerDecorationType, []);
		editor?.setDecorations(rangeDecorationType, []);
		editor?.setDecorations(extendedHeaderDecorationType, []);
	}

	// ***** Trigger updates of text editors *****

	let updateActiveEditorTimeout: NodeJS.Timer | undefined = undefined;
	let updateAllEditorsTimeout: NodeJS.Timer | undefined = undefined;


	function triggerUpdateActiveEditorDecorations() {
		if (updateActiveEditorTimeout) {
			clearTimeout(updateActiveEditorTimeout);
			updateActiveEditorTimeout = undefined;
		}
		updateActiveEditorTimeout = setTimeout(() => updateDecorationsOnEditor(vscode.window.activeTextEditor), 100);
	}

	function triggerUpdateAllEditorsDecorations() {
		if (updateAllEditorsTimeout) {
			clearTimeout(updateAllEditorsTimeout);
			updateAllEditorsTimeout = undefined;
		}
		updateAllEditorsTimeout = setTimeout(updateDecorationsOnAllVisibleEditors, 100);
	}

	triggerUpdateAllEditorsDecorations();

	// ***** Listeners for interesting events *****

	// vscode.window.onDidChangeActiveTextEditor(editor => {
	// 	if (editor) {
	// 		triggerUpdateActiveEditorDecorations();
	// 	}
	// }, null, context.subscriptions);

	vscode.window.onDidChangeVisibleTextEditors(editors => {
		triggerUpdateAllEditorsDecorations()
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
			triggerUpdateActiveEditorDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidOpenTextDocument(doc => {
		if (doc.languageId != 'diff') {
			clearDecorationsOnEditor(vscode.window.activeTextEditor);
		} else {
			triggerUpdateActiveEditorDecorations();
		}
	}, null, context.subscriptions)
	
	vscode.workspace.onDidChangeConfiguration(e => {
		handleUpdatedConfig();
		triggerUpdateAllEditorsDecorations();	
	}, null, context.subscriptions)

	// ***** Cleanup *****

	context.subscriptions.push({
		dispose: disposeAllTextDecorations
	});
}

