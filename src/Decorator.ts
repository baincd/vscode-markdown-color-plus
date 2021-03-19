import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'

interface HeaderDecorationOptions extends vscode.DecorationOptions {
	headerLevel: number
}

export interface TextDocumentCancelToken {
	isCancellationRequested: boolean
	document?: vscode.TextDocument;
}

// RegExs based on https://github.com/microsoft/vscode/blob/a699ffaee62010c4634d301da2bbdb7646b8d1da/extensions/markdown-basics/syntaxes/markdown.tmLanguage.json
const fencedCodeBlockStartRegEx = /^\s{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/ // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"
const fencedCodeBlockEndRegExStr = "^\\s{0,3}({MATCH1})\\s*$" // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"

const indentedCodeBlockRegEx = /^([ ]{4}|\t)/; // Based on raw_block "(^|\\G)([ ]{4}|\\t)"

const headingRegEx = /^[ ]{0,3}(#{1,6}\s+(.*?)(\s+#{1,6})?\s*)$/
const endFencedCodeBlockRegEx = /^\s*(`{3,}|~{3,})\s*/
const blockQuoteRegEx = /^[ ]{0,3}(>) ?/

const nonPlainLineRegEx = /^\s*(#{1,6} .*|={2,}|-{2,}|\s{4}.*|\t.*|\*{3,}|_{3,}|\|.*\|)\s*$/ // # Header | Header == | Header -- | indented code block spaces | indented code block tab | Horizontal Rule *** | Horizontal Rule ___ | Table-ish (start and end with pipe)
const invisibleLineBreakRegEx = /\s\s$/


const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^(={3,}|(-{3,}))[ \t]*$/


const fencedCodeBlockEndRegEx = /^\s{0,3}(`{3,}|~{3,})\s*$/ // Based on fenced_code_block_unknown "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"


function findEndOfFencedCodeBlockLineIdx(document: vscode.TextDocument, startLineIdx: number, fenceMarker: string, token?: TextDocumentCancelToken) {
	let fencedCodeBlockEndRegEx = new RegExp(fencedCodeBlockEndRegExStr.replace("{MATCH1}",fenceMarker));
	let currentLineIdx = startLineIdx;
	while (!token?.isCancellationRequested && ++currentLineIdx < document.lineCount && !document.lineAt(currentLineIdx).text.match(fencedCodeBlockEndRegEx)) {
	}
	return currentLineIdx;
}

function resetHeaderLevels(activeHeaders: HeaderDecorationOptions[], headerLevel: number) {
	while (activeHeaders[activeHeaders.length - 1]?.headerLevel >= headerLevel) {
		activeHeaders.pop();
	}

}

export function updateDecorations(editor: vscode.TextEditor, pos?: vscode.Position, token?: TextDocumentCancelToken) {
	if (!editor || editor.document.languageId != 'markdown') {
		return;
	}
	const document = editor.document;
	const selectedLineIdx = pos?.line;
	
	const fencedCodeBlocks: vscode.DecorationOptions[] = [];
	const indentedCodeBlocks: vscode.DecorationOptions[] = [];
	const inlineCodeBlocks: vscode.DecorationOptions[] = [];
	const invisibleLineBreaks: vscode.DecorationOptions[] = [];
	const activeHeaders: HeaderDecorationOptions[] = [];
	
	let currentLineIdx = -1;
	while (!token?.isCancellationRequested && ++currentLineIdx < document.lineCount) {
		let currentLineText = document.lineAt(currentLineIdx).text;
		let currentHeaderLineIdx: number = -1;
		let currentHeaderLevel: number | null = null;
		let currentHeaderStartChar: number = 0;
		let currentHeaderEndChar: number = 0;
		let match: RegExpMatchArray | null;

		if ( match = currentLineText.match(fencedCodeBlockStartRegEx)) {
			let codeFenceStartIdx = currentLineIdx;
			currentLineIdx = findEndOfFencedCodeBlockLineIdx(document, currentLineIdx, match[1], token);
			if (codeFenceStartIdx + 1 < currentLineIdx) {
				fencedCodeBlocks.push({range: new vscode.Range(codeFenceStartIdx+1, 0, currentLineIdx-1, document.lineAt(currentLineIdx-1).text.length)});
			}
		} else if (indentedCodeBlockRegEx.test(currentLineText)) {
			let isCodeBlock: boolean;
			if (currentLineIdx == 0) {
				isCodeBlock = true;
			} else {
				let prevLineText = document.lineAt(currentLineIdx - 1).text;
				isCodeBlock = prevLineText.trim().length == 0 
							|| headingRegEx.test(prevLineText)
							|| endFencedCodeBlockRegEx.test(prevLineText)
							|| blockQuoteRegEx.test(prevLineText);
			}
			if (isCodeBlock) {
				let startLine = currentLineIdx;
				let endOfBlockFound = false;
				let endLine = startLine;
				while (!endOfBlockFound && ++currentLineIdx < document.lineCount) {
					if (indentedCodeBlockRegEx.test(document.lineAt(currentLineIdx).text)) {
						endLine = currentLineIdx;
					} else if (document.lineAt(currentLineIdx).text.trim().length != 0) {
						endOfBlockFound = true
						currentLineIdx--; // set line index to previous line, so next time through loop evaluates this line
					}	
				}
				indentedCodeBlocks.push({range: new vscode.Range(startLine,0,endLine,document.lineAt(endLine).text.length)})
			}
		} else {
			let searchFrom = 0;
			let startIdx : number
			while ((startIdx = currentLineText.indexOf("`", searchFrom)) > -1) {
				searchFrom = startIdx + 1;
				let endIdx
				if ((endIdx = currentLineText.indexOf("`",searchFrom)) > -1) {
					inlineCodeBlocks.push({range: new vscode.Range(currentLineIdx,startIdx + 1,currentLineIdx, endIdx)});
					searchFrom = endIdx + 1;
				}
			}

			if (currentLineText.trim().length != 0 && invisibleLineBreakRegEx.test(currentLineText) && !nonPlainLineRegEx.test(currentLineText)) {
				invisibleLineBreaks.push({range: new vscode.Range(currentLineIdx, currentLineText.length-2, currentLineIdx, currentLineText.length)});
			}

			if ( (match = currentLineText.match(HeaderRegEx)) ) {
				currentHeaderLineIdx = currentLineIdx;
				currentHeaderLevel = match[3].length;
				currentHeaderStartChar = match[1].length;
				currentHeaderEndChar = match[1].length + match[2].length;
			} else if ( (match = currentLineText.match(AltHeaderRegEx)) ) {
				currentHeaderLineIdx = currentLineIdx - 1;
				currentHeaderLevel = (match[1].charAt(0) == '=' ? 1 : 2);
				currentHeaderStartChar = 0;
				currentHeaderEndChar = document.lineAt(currentLineIdx).text.trimRight().length
			}

			if (currentHeaderLevel) {
				if (selectedLineIdx && currentLineIdx <= selectedLineIdx) {
					resetHeaderLevels(activeHeaders, currentHeaderLevel);
					if (currentLineIdx < selectedLineIdx) {
						activeHeaders.push({ headerLevel: currentHeaderLevel, range: new vscode.Range(currentHeaderLineIdx, currentHeaderStartChar, currentHeaderLineIdx, currentHeaderEndChar) })
					}
				}
			}
		}

	}

	if (!token?.isCancellationRequested) {
		const config = ConfigurationHandler.config;

		editor.setDecorations(config.fencedCodeBlock.decorationType, (config.fencedCodeBlock.enabled ? fencedCodeBlocks : []));
		editor.setDecorations(config.indentedCodeBlock.decorationType, (config.indentedCodeBlock.enabled ? indentedCodeBlocks : []));
		editor.setDecorations(config.inlineCode.decorationType, (config.inlineCode.enabled ? inlineCodeBlocks : []));
		editor.setDecorations(config.invisibleLineBreak.decorationType, (config.invisibleLineBreak.enabled ? invisibleLineBreaks : []));
		editor.setDecorations(config.activeHeader.decorationType, (config.activeHeader.enabled && selectedLineIdx ? activeHeaders : []));
	}
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor.setDecorations(ConfigurationHandler.config.fencedCodeBlock.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.indentedCodeBlock.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.inlineCode.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.invisibleLineBreak.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.activeHeader.decorationType, []);
}
