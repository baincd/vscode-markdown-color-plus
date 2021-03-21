import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'

interface HeaderDecorationOptions extends vscode.DecorationOptions {
	headerLevel: number
}

interface HeaderLine {
	headerLevel: number,
	lineIdx: number,
	startChar: number,
	endChar: number,
	endHeaderLineIdx: number
}

export interface TextDocumentCancelToken {
	isCancellationRequested: boolean
	document?: vscode.TextDocument;
}

interface DecoratedRanges {
	fencedCodeBlocks: vscode.DecorationOptions[];
	indentedCodeBlocks: vscode.DecorationOptions[];
	inlineCodeBlocks: vscode.DecorationOptions[];
	invisibleLineBreaks: vscode.DecorationOptions[];
	activeHeaders: HeaderDecorationOptions[];
}

// RegExs based on https://github.com/microsoft/vscode/blob/a699ffaee62010c4634d301da2bbdb7646b8d1da/extensions/markdown-basics/syntaxes/markdown.tmLanguage.json
const fencedCodeBlockStartRegEx = /^[ ]{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/ // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"
const fencedCodeBlockEndRegExStr = "^[ ]{0,3}{MATCH1}+\\s*$" // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"

const indentedCodeBlockRegEx = /^(?:[ ]{4}|[ ]*\t)/; // Based on raw_block "(^|\\G)([ ]{4}|\\t)"

const headingRegEx = /^[ ]{0,3}(#{1,6}\s+(.*?)(\s+#{1,6})?\s*)$/
const endFencedCodeBlockRegEx = /^\s*(`{3,}|~{3,})\s*/
const horizontalRuleRegEx = /^[ ]{0,3}(?:\*\*\*+|---+|___+)\s*$/

const nonPlainLineRegEx = /^\s*(#{1,6} .*|={2,}|-{2,}|\s{4}.*|\t.*|\*{3,}|_{3,}|\|.*\|)\s*$/ // # Header | Header == | Header -- | indented code block spaces | indented code block tab | Horizontal Rule *** | Horizontal Rule ___ | Table-ish (start and end with pipe)
const invisibleLineBreakRegEx = /\s\s$/

const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^ {0,3}(={3,}|(-{3,}))\s*$/

/** - Find the end of the fenced code block
 *  - Add the code block to the @param fencedCodeBlocks array
 *  - Return the line index of the ending code block fence line
 */
function processFencedCodeBlock(document: vscode.TextDocument, startFenceIdx: number, fence: string, fencedCodeBlocks: vscode.DecorationOptions[], token?: TextDocumentCancelToken): number {
	let endFenceLineIdx = findEndOfFencedCodeBlockLineIdx(document, startFenceIdx, fence, token);
	if (startFenceIdx + 1 < endFenceLineIdx) {
		fencedCodeBlocks.push({range: new vscode.Range(startFenceIdx+1, 0, endFenceLineIdx-1, document.lineAt(endFenceLineIdx-1).text.length)});
	}
	return endFenceLineIdx;
}

function findEndOfFencedCodeBlockLineIdx(document: vscode.TextDocument, startLineIdx: number, fenceMarker: string, token?: TextDocumentCancelToken) {
	let fencedCodeBlockEndRegEx = new RegExp(fencedCodeBlockEndRegExStr.replace("{MATCH1}",fenceMarker));
	let currentLineIdx = startLineIdx;
	while (++currentLineIdx < document.lineCount && !document.lineAt(currentLineIdx).text.match(fencedCodeBlockEndRegEx) && !token?.isCancellationRequested) {
	}
	return currentLineIdx;
}



function isIndentedCodeBlockStart(lineText: string, document: vscode.TextDocument, lineIdx: number): boolean {
	if ( ! lineText.match(indentedCodeBlockRegEx) ) {
		return false;
	}
	if (lineIdx == 0) {
		return true;
	} else {
		let prevLineText = document.lineAt(lineIdx - 1).text;
		return prevLineText.trim().length == 0 
		       || headingRegEx.test(prevLineText)
		       || endFencedCodeBlockRegEx.test(prevLineText)
		       || horizontalRuleRegEx.test(prevLineText)
		       || AltHeaderRegEx.test(prevLineText);
	}
}

/** - Find the end of the indented code block
 *  - Add the code block to the @param indentedCodeBlocks array
 *  - Return the line index of the larger of the last indented code block line or last consecutive whitespace line following the end of the indented code block
 */
function processIndentedCodeBlock(document: vscode.TextDocument, startLineIdx: number, indentedCodeBlocks: vscode.DecorationOptions[], token?: TextDocumentCancelToken): number {
	let currentLineIdx = startLineIdx;
	let endOfBlockFound = false;
	let endLine = startLineIdx;
	while (!endOfBlockFound && ++currentLineIdx < document.lineCount && !token?.isCancellationRequested) {
		if (indentedCodeBlockRegEx.test(document.lineAt(currentLineIdx).text)) {
			endLine = currentLineIdx;
		} else if (document.lineAt(currentLineIdx).text.trim().length != 0) {
			endOfBlockFound = true
			currentLineIdx--; // set line index to previous line, so next time through loop evaluates this line
		}	
	}
	indentedCodeBlocks.push({range: new vscode.Range(startLineIdx,0,endLine,document.lineAt(endLine).text.length)})
	return currentLineIdx;
}


/** - Find all inline code within line
 *  - Add to inlineCodeBlocks
 */
function findAndProcessAllInlineCode(currentLineText: string, currentLineIdx: number, inlineCodeBlocks: vscode.DecorationOptions[], token: TextDocumentCancelToken | undefined) {
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
}



function findAndProcessInvisibleLineBreaks(currentLineText: string, currentLineIdx: number, invisibleLineBreaks: vscode.DecorationOptions[], token: TextDocumentCancelToken | undefined) {
	if (currentLineText.trim().length != 0 && invisibleLineBreakRegEx.test(currentLineText) && !nonPlainLineRegEx.test(currentLineText)) {
		invisibleLineBreaks.push({range: new vscode.Range(currentLineIdx, currentLineText.length-2, currentLineIdx, currentLineText.length)});
	}
}



function isHeader(document: vscode.TextDocument, currentLineText: string, currentLineIdx: number): HeaderLine | undefined {
	let match: RegExpMatchArray | null;
	if ( match = currentLineText.match(HeaderRegEx) ) {
		return {
			headerLevel: match[3].length,
			lineIdx: currentLineIdx,
			startChar: match[1].length,
			endChar: match[1].length + match[2].length,
			endHeaderLineIdx: currentLineIdx
		};
	} else if ( ++currentLineIdx < document.lineCount && (match = document.lineAt(currentLineIdx).text.match(AltHeaderRegEx)) ) {
		return {
			headerLevel: (match[1].charAt(0) == '=' ? 1 : 2),
			lineIdx: currentLineIdx - 1,
			startChar: currentLineText.length - currentLineText.trimLeft().length,
			endChar: currentLineText.trimRight().length,
			endHeaderLineIdx: currentLineIdx
		};
	}
}

function processHeader(headerLine: HeaderLine, cursorLineIdx: number | undefined, activeHeaders: HeaderDecorationOptions[]) {
	if (cursorLineIdx && headerLine.lineIdx <= cursorLineIdx) {
		resetHeaderLevels(activeHeaders, headerLine.headerLevel);
		if (headerLine.lineIdx < cursorLineIdx) {
			activeHeaders.push({ headerLevel: headerLine.headerLevel, range: new vscode.Range(headerLine.lineIdx, headerLine.startChar, headerLine.lineIdx, headerLine.endChar) })
		}
	}
}

function resetHeaderLevels(activeHeaders: HeaderDecorationOptions[], headerLevel: number) {
	while (activeHeaders[activeHeaders.length - 1]?.headerLevel >= headerLevel) {
		activeHeaders.pop();
	}

}

export function updateDecorations(editor: vscode.TextEditor, pos?: vscode.Position, token?: TextDocumentCancelToken): DecoratedRanges | undefined {
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
		let match: RegExpMatchArray | null;

		if ( match = currentLineText.match(fencedCodeBlockStartRegEx) ) {
			currentLineIdx = processFencedCodeBlock(document, currentLineIdx, match[1], fencedCodeBlocks, token);
		} else if (isIndentedCodeBlockStart(currentLineText, document, currentLineIdx)) {
			currentLineIdx = processIndentedCodeBlock(document, currentLineIdx, indentedCodeBlocks, token);
		} else {
			let headerLine = isHeader(document, currentLineText, currentLineIdx);
			if (headerLine) {
				processHeader(headerLine, selectedLineIdx, activeHeaders)
			}

			findAndProcessAllInlineCode(currentLineText, currentLineIdx, inlineCodeBlocks, token);

			if (!headerLine) {
				findAndProcessInvisibleLineBreaks(currentLineText, currentLineIdx, invisibleLineBreaks, token);
			}

			currentLineIdx = headerLine?.endHeaderLineIdx || currentLineIdx;
		}

	}

	if (!token?.isCancellationRequested) {
		const config = ConfigurationHandler.config;

		const decoratedRanges: DecoratedRanges = {
			fencedCodeBlocks:    (config.fencedCodeBlock.enabled                 ? fencedCodeBlocks    : []),
			indentedCodeBlocks:  (config.indentedCodeBlock.enabled               ? indentedCodeBlocks  : []),
			inlineCodeBlocks:    (config.inlineCode.enabled                      ? inlineCodeBlocks    : []),
			invisibleLineBreaks: (config.invisibleLineBreak.enabled              ? invisibleLineBreaks : []),
			activeHeaders:       (config.activeHeader.enabled && selectedLineIdx ? activeHeaders       : []),
		}

		editor.setDecorations(config.fencedCodeBlock.decorationType,    decoratedRanges.fencedCodeBlocks);
		editor.setDecorations(config.indentedCodeBlock.decorationType,  decoratedRanges.indentedCodeBlocks);
		editor.setDecorations(config.inlineCode.decorationType,         decoratedRanges.inlineCodeBlocks);
		editor.setDecorations(config.invisibleLineBreak.decorationType, decoratedRanges.invisibleLineBreaks);
		editor.setDecorations(config.activeHeader.decorationType,       decoratedRanges.activeHeaders);

		return decoratedRanges;
	} 
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor.setDecorations(ConfigurationHandler.config.fencedCodeBlock.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.indentedCodeBlock.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.inlineCode.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.invisibleLineBreak.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.activeHeader.decorationType, []);
}
