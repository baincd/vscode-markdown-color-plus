import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	// console.log('markdown-color-plus');

	// ***** Read config and manage text decorations *****
	// https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
	// https://code.visualstudio.com/api/references/vscode-api#DecorationOptions
	let fencedCodeBlockDecorationType: vscode.TextEditorDecorationType;

	function disposeAllTextDecorations() {
		fencedCodeBlockDecorationType?.dispose();
	}

	function handleUpdatedConfig() {
		disposeAllTextDecorations();
		let colorizerConfig = vscode.workspace.getConfiguration("markdown-color-plus");


		fencedCodeBlockDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "#CCCCCCCC",
			isWholeLine: true
		});

	}

	handleUpdatedConfig();

	// ***** Decorate diff Text Editors *****

	function updateDecorationsOnAllVisibleEditors() {
		vscode.window.visibleTextEditors.forEach(e => updateDecorationsOnEditor(e));
	}


	// RegExs based on https://github.com/microsoft/vscode/blob/a699ffaee62010c4634d301da2bbdb7646b8d1da/extensions/markdown-basics/syntaxes/markdown.tmLanguage.json
	const fencedCodeBlockStartRegEx = /^(\s*)(`{3,}|~{3,})\s*(?=([^`~]*)?$)/ // Based on fenced_code_block_unknown "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"
	const fencedCodeBlockEndRegExStr = "^({MATCH1}|\\s{0,3})({MATCH2})\\s*$" // Based on fenced_code_block_unknown "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$",

	const codeBlockRegEx = /^([ ]{4}|\\t)/; // Based on raw_block "(^|\\G)([ ]{4}|\\t)"

	const headingRegEx = /^[ ]{0,3}(#{1,6}\s+(.*?)(\s+#{1,6})?\s*)$/
	const endFencedCodeBlockRegEx = /^\s*(`{3,}|~{3,})\s*/
	const blockQuoteRegEx = /^[ ]{0,3}(>) ?/

	function updateDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		if (editor?.document.languageId != 'markdown') {
			return;
		}

		const fencedCodeBlocks: vscode.DecorationOptions[] = [];

		let doc = editor.document;
		let match: RegExpMatchArray | null = null;5
		let lineIdx = -1;
		while (++lineIdx < doc.lineCount) {
			let line = doc.lineAt(lineIdx);
			if (match = line.text.match(fencedCodeBlockStartRegEx)) {
				let startLine = lineIdx + 1;
				let fencedCodeBlockEndRegEx = new RegExp(fencedCodeBlockEndRegExStr.replace("{MATCH1}",match[1]).replace("{MATCH2}",match[2]));
				let endLine = 0;
				while (endLine == 0 && ++lineIdx < doc.lineCount) {
					line = doc.lineAt(lineIdx);
					if (line.text.match(fencedCodeBlockEndRegEx)) {
						endLine = lineIdx - 1;
					}
				}
				if (endLine == 0) {
					endLine = doc.lineCount - 1;
				}
				fencedCodeBlocks.push({range: new vscode.Range(startLine,0,endLine,doc.lineAt(endLine).text.length)})
			} else if (codeBlockRegEx.test(line.text)) {
				let isCodeBlock: boolean;
				if (lineIdx == 0) {
					isCodeBlock = true;
				} else {
					let prevLineText = doc.lineAt(lineIdx - 1).text;
					isCodeBlock = prevLineText.trim().length == 0 
								|| headingRegEx.test(prevLineText)
								|| endFencedCodeBlockRegEx.test(prevLineText)
								|| blockQuoteRegEx.test(prevLineText);
				}
				if (isCodeBlock) {
					let startLine = lineIdx;
					while (++lineIdx < doc.lineCount && codeBlockRegEx.test(doc.lineAt(lineIdx).text)) {
					}
					let endLine = --lineIdx;
					fencedCodeBlocks.push({range: new vscode.Range(startLine,0,endLine,doc.lineAt(endLine).text.length)})
				}
			}
		}
		editor.setDecorations(fencedCodeBlockDecorationType, fencedCodeBlocks);
	}

	function clearDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		editor?.setDecorations(fencedCodeBlockDecorationType, []);
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
		if (doc.languageId != 'markdown') {
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

