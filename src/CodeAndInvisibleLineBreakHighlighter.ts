import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'

import * as Decorator from './Decorator'

export function activate(context: vscode.ExtensionContext) {

	// ***** Decorate diff Text Editors *****

	function updateDecorationsOnAllVisibleEditors() {
		vscode.window.visibleTextEditors.forEach(e => updateDecorationsOnEditor(e));
	}

	const fencedCodeBlockStartRegEx = /^\s{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/ // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"
	const fencedCodeBlockEndRegExStr = "^\\s{0,3}({MATCH1})\\s*$" // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"
	
	const indentedCodeBlockRegEx = /^([ ]{4}|\t)/; // Based on raw_block "(^|\\G)([ ]{4}|\\t)"

	const headingRegEx = /^[ ]{0,3}(#{1,6}\s+(.*?)(\s+#{1,6})?\s*)$/
	const endFencedCodeBlockRegEx = /^\s*(`{3,}|~{3,})\s*/
	const blockQuoteRegEx = /^[ ]{0,3}(>) ?/

	const nonPlainLineRegEx = /^\s*(#{1,6} .*|={2,}|-{2,}|\s{4}.*|\t.*|\*{3,}|_{3,}|\|.*\|)\s*$/ // # Header | Header == | Header -- | indented code block spaces | indented code block tab | Horizontal Rule *** | Horizontal Rule ___ | Table-ish (start and end with pipe)
	const invisibleLineBreakRegEx = /\s\s$/

	function updateDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		if (editor?.document.languageId != 'markdown') {
			return;
		}

		const indentedCodeBlocks: vscode.DecorationOptions[] = [];
		const inlineCodeBlocks: vscode.DecorationOptions[] = [];
		const invisibleLineBreaks: vscode.DecorationOptions[] = [];

		let doc = editor.document;
		let match: RegExpMatchArray | null = null;5
		let lineIdx = -1;
		while (++lineIdx < doc.lineCount) {
			let line = doc.lineAt(lineIdx);
			if (match = line.text.match(fencedCodeBlockStartRegEx)) {
				let startLine = lineIdx + 1;
				if (startLine < doc.lineCount) { 
					let fencedCodeBlockEndRegEx = new RegExp(fencedCodeBlockEndRegExStr.replace("{MATCH1}",match[1]));
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

				if (doc.lineAt(lineIdx).text.trim().length != 0 && invisibleLineBreakRegEx.test(line.text) && !nonPlainLineRegEx.test(line.text)) {
					invisibleLineBreaks.push({range: new vscode.Range(lineIdx, line.text.length-2, lineIdx, line.text.length)});
				}

			}
		}

		setEditorDecorations(editor, ConfigurationHandler.config.indentedCodeBlock,  indentedCodeBlocks );
		setEditorDecorations(editor, ConfigurationHandler.config.inlineCode,         inlineCodeBlocks   );
		setEditorDecorations(editor, ConfigurationHandler.config.invisibleLineBreak, invisibleLineBreaks);

		Decorator.updateDecorations(editor, null, {isCancellationRequested: false});
	}

	function setEditorDecorations(editor: vscode.TextEditor, config: ConfigurationHandler.ExtensionFeatureConfig, ranges: vscode.DecorationOptions[]) {
		editor?.setDecorations(config.decorationType, (config.enabled ? ranges : []));
	}

	function clearDecorationsOnEditor(editor: vscode.TextEditor | undefined) {
		editor?.setDecorations(ConfigurationHandler.config.indentedCodeBlock.decorationType,  []);
		editor?.setDecorations(ConfigurationHandler.config.inlineCode.decorationType,         []);
		editor?.setDecorations(ConfigurationHandler.config.invisibleLineBreak.decorationType, []);

		if (editor) {
			Decorator.clearDecorations(editor);
		}
	}

	// ***** Trigger updates of text editors *****

	let updateActiveEditorTimeout: NodeJS.Timer | undefined = undefined;
	let updateAllEditorsTimeout: NodeJS.Timer | undefined = undefined;

	function triggerUpdateActiveEditorDecorations(delay: number) {
		if (updateActiveEditorTimeout) {
			clearTimeout(updateActiveEditorTimeout);
			updateActiveEditorTimeout = undefined;
		}
		updateActiveEditorTimeout = setTimeout(() => updateDecorationsOnEditor(vscode.window.activeTextEditor), delay);
	}

	function triggerUpdateAllEditorsDecorations() {
		if (updateAllEditorsTimeout) {
			clearTimeout(updateAllEditorsTimeout);
			updateAllEditorsTimeout = undefined;
		}
		updateAllEditorsTimeout = setTimeout(updateDecorationsOnAllVisibleEditors, ConfigurationHandler.config.activeEditorChangeUpdateDelay);
	}

	triggerUpdateAllEditorsDecorations();

	// ***** Listeners for interesting events *****

	// vscode.window.onDidChangeActiveTextEditor(editor => {
	// 	if (editor) {
	// 		triggerUpdateActiveEditorDecorations(activeEditorChangeUpdateDelay);
	// 	}
	// }, null, context.subscriptions);

	vscode.window.onDidChangeVisibleTextEditors(editors => {
		triggerUpdateAllEditorsDecorations()
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
			triggerUpdateActiveEditorDecorations(ConfigurationHandler.config.editTextChangeUpdateDelay);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidOpenTextDocument(doc => {
		if (doc.languageId != 'markdown') {
			clearDecorationsOnEditor(vscode.window.activeTextEditor);
		} else {
			triggerUpdateActiveEditorDecorations(ConfigurationHandler.config.activeEditorChangeUpdateDelay);
		}
	}, null, context.subscriptions)
	
	vscode.workspace.onDidChangeConfiguration(e => {
		ConfigurationHandler.resetAllDecorations();
		ConfigurationHandler.readConfig();
		triggerUpdateAllEditorsDecorations();	
	}, null, context.subscriptions)

	// ***** Cleanup *****

	context.subscriptions.push({
		dispose: ConfigurationHandler.resetAllDecorations
	});
}

