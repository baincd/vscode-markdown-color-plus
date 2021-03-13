import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	// console.log('markdown-color-plus');

	// ***** Read config and manage text decorations *****
	// https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
	// https://code.visualstudio.com/api/references/vscode-api#DecorationOptions
	let fencedCodeBlockDecorationType: vscode.TextEditorDecorationType;
	let indentedCodeBlockDecorationType: vscode.TextEditorDecorationType;
	let inlineCodeDecorationType: vscode.TextEditorDecorationType;

	function disposeAllTextDecorations() {
		fencedCodeBlockDecorationType?.dispose();
		indentedCodeBlockDecorationType?.dispose();
		inlineCodeDecorationType?.dispose();
	}

	function handleUpdatedConfig() {
		disposeAllTextDecorations();
		let colorizerConfig = vscode.workspace.getConfiguration("markdown-color-plus");

		fencedCodeBlockDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "#CCCCCCCC",
			isWholeLine: true
		});

		indentedCodeBlockDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "#CCCCCCCC",
			isWholeLine: true
		});

		inlineCodeDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "#CCCCCCCC"
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

	const indentedCodeBlockRegEx = /^([ ]{4}|\t)/; // Based on raw_block "(^|\\G)([ ]{4}|\\t)"

	const headingRegEx = /^[ ]{0,3}(#{1,6}\s+(.*?)(\s+#{1,6})?\s*)$/
	const endFencedCodeBlockRegEx = /^\s*(`{3,}|~{3,})\s*/
	const blockQuoteRegEx = /^[ ]{0,3}(>) ?/

	function updateDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		if (editor?.document.languageId != 'markdown') {
			return;
		}

		const fencedCodeBlocks: vscode.DecorationOptions[] = [];
		const indentedCodeBlocks: vscode.DecorationOptions[] = [];
		const inlineCodeBlocks: vscode.DecorationOptions[] = [];

		let doc = editor.document;
		let match: RegExpMatchArray | null = null;5
		let lineIdx = -1;
		while (++lineIdx < doc.lineCount) {
			let line = doc.lineAt(lineIdx);
			if (match = line.text.match(fencedCodeBlockStartRegEx)) {
				let startLine = lineIdx + 1;
				if (startLine < doc.lineCount) { 
					let fencedCodeBlockEndRegEx = new RegExp(fencedCodeBlockEndRegExStr.replace("{MATCH1}",match[1]).replace("{MATCH2}",match[2]));
					let endLine = -1;
					while (endLine == -1 && ++lineIdx < doc.lineCount) {
						line = doc.lineAt(lineIdx);
						if (line.text.match(fencedCodeBlockEndRegEx)) {
							endLine = lineIdx - 1;
						}
					}
					if (endLine == -1) {
						endLine = doc.lineCount - 1;
					}
					if (startLine <= endLine) {
						fencedCodeBlocks.push({range: new vscode.Range(startLine,0,endLine,doc.lineAt(endLine).text.length)})
					}
				}
			} else if (indentedCodeBlockRegEx.test(line.text)) {
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
					let endOfBlockFound = false;
					let endLine = startLine;
					while (!endOfBlockFound && ++lineIdx < doc.lineCount) {
						if (indentedCodeBlockRegEx.test(doc.lineAt(lineIdx).text)) {
							endLine = lineIdx;
						} else if (doc.lineAt(lineIdx).text.trim().length != 0) {
							endOfBlockFound = true
							lineIdx--; // set line index to previous line, so next time through loop evaluates this line
						}	
					}
					indentedCodeBlocks.push({range: new vscode.Range(startLine,0,endLine,doc.lineAt(endLine).text.length)})
				}
			} else {
				let searchFrom = 0;
				let startIdx : number
				while ((startIdx = line.text.indexOf("`", searchFrom)) > -1) {
					searchFrom = startIdx + 1;
					let endIdx
					if ((endIdx = line.text.indexOf("`",searchFrom)) > -1) {
						inlineCodeBlocks.push({range: new vscode.Range(lineIdx,startIdx + 1,lineIdx, endIdx)});
						searchFrom = endIdx + 1;
					}
				}

			}
		}
		editor.setDecorations(fencedCodeBlockDecorationType, fencedCodeBlocks);
		editor.setDecorations(indentedCodeBlockDecorationType, indentedCodeBlocks);
		editor.setDecorations(inlineCodeDecorationType, inlineCodeBlocks);
	}

	function clearDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		editor?.setDecorations(fencedCodeBlockDecorationType, []);
		editor?.setDecorations(indentedCodeBlockDecorationType, []);
		editor?.setDecorations(inlineCodeDecorationType, []);
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

