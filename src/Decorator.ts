import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'

const lineThroughDecoration = vscode.window.createTextEditorDecorationType({
	textDecoration: "line-through"
})

interface HeaderDecorationOptions extends vscode.DecorationOptions {
	headerLevel: number
}

interface HeaderLine {
	headerLevel: number,
	setextHeader: boolean,
	lineIdx: number,
	startChar: number,
	endChar: number,
	endHeaderLineIdx: number
}

enum LineType {
	START_OF_DOC = "START_OF_DOC",
	FENCED_CODE_BLOCK = "FENCED_CODE_BLOCK",
	INDENTED_CODE_BLOCK = "INDENTED_CODE_BLOCK",
	HEADER = "HEADER",
	HORIZONTAL_RULE = "HORIZONTAL_RULE",
	LIST = "LIST",
	LIST_PARAGRAPH = "LIST_PARAGRAPH",
	LIST_PARAGRAPH_WHITESPACE = "LIST_PARAGRAPH_WHITESPACE",
	WHITESPACE = "WHITESPACE",
	MISC = "MISC",
	BLOCKQUOTE = "BLOCKQUOTE"
}

export interface TextDocumentCancelToken {
	isCancellationRequested: boolean
	document?: vscode.TextDocument;
}

interface DecoratedRanges {
	fencedCodeBlocks: vscode.DecorationOptions[];
	indentedCodeBlocks: vscode.DecorationOptions[];
	inlineCodeBlocks: vscode.DecorationOptions[];
	blockquoteText: vscode.DecorationOptions[];
	blockquoteSymbols: vscode.DecorationOptions[];
	horizontalRules: vscode.DecorationOptions[];
	strikeThroughBlocks: vscode.DecorationOptions[];
	invisibleLineBreaks: vscode.DecorationOptions[];
	activeHeaders: HeaderDecorationOptions[];
	setextStyleL1Headers: vscode.DecorationOptions[];
	setextStyleL2Headers: vscode.DecorationOptions[];
}

// RegExs based on https://github.com/microsoft/vscode/blob/a699ffaee62010c4634d301da2bbdb7646b8d1da/extensions/markdown-basics/syntaxes/markdown.tmLanguage.json
const fencedCodeBlockStartRegEx = /^[ ]{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/ // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"
const fencedCodeBlockEndRegExStr = "^[ ]{0,3}{MATCH1}+\\s*$" // Based on fenced_code_block_unknown (limiting preceding spaces to 3) "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"

const indentedCodeBlockRegEx = /^(?:[ ]{4}|[ ]*\t)/; // Based on raw_block "(^|\\G)([ ]{4}|\\t)"

const horizontalRuleRegEx = /^[ ]{0,3}(?:\*\*\*+|---+|___+)\s*$/

const nonPlainLineRegEx = /^\s*(#{1,6} .*|={2,}|-{2,}|\s{4}.*|\t.*|\*{3,}|_{3,}|\|.*\|)\s*$/ // # Header | Header == | Header -- | indented code block spaces | indented code block tab | Horizontal Rule *** | Horizontal Rule ___ | Table-ish (start and end with pipe)
const invisibleLineBreakRegEx = /\s\s$/

const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^ {0,3}(={3,}|(-{3,}))\s*$/

const ListRegEx = /^[ ]{0,2}(?:-|\*|\+|\d+\.)\s+\S/

const listParagraphRegEx = /^(?:[ ]{2,}|[ ]*\t)/;

const BlockquoteSymbolRegEx = /^[ ]{0,3}>/;
const BlockquoteEmbeddedInListSymbolRegEx = /^\s*>/;

const nonWhitespaceRegEx = /\S/;


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



function isIndentedCodeBlockStart(lineText: string, document: vscode.TextDocument, lineIdx: number, prevLineType: LineType): boolean {
	return indentedCodeBlockRegEx.test(lineText) && 
	         ( prevLineType === LineType.WHITESPACE 
	         || prevLineType === LineType.HEADER
	         || prevLineType === LineType.FENCED_CODE_BLOCK
	         || prevLineType === LineType.HORIZONTAL_RULE
	         || prevLineType === LineType.START_OF_DOC) 
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


/** - Find all inline code within line, add to inlineCodeBlocks
 *  - Find all strike through sections within line, add to strikeThroughBlocks
 */
 function findAndProcessAllInlineDecorations(currentLineText: string, currentLineIdx: number, inlineCodeBlocks: vscode.DecorationOptions[], strikeThroughBlocks: vscode.DecorationOptions[], token: TextDocumentCancelToken | undefined) {
	const possibleStrikeThrough = currentLineText.indexOf("~~") >= 0;
	const modifiedLineText = findAndProcessInlineCodeBlocks(currentLineText, currentLineIdx, inlineCodeBlocks, possibleStrikeThrough);
	if (possibleStrikeThrough) {
		findAndProcessInlineStrikeThroughBlocks(modifiedLineText, currentLineIdx, strikeThroughBlocks);
	}
}

/** - Find all inline code within line
 *  - Add to inlineCodeBlocks
 *  - Return currentLineText with inlineCodeBlocks replaced with X's
 */
function findAndProcessInlineCodeBlocks(currentLineText: string, currentLineIdx: number, inlineCodeBlocks: vscode.DecorationOptions[], possibleStrikeThrough: boolean) {
	let searchFrom = 0;
	let startIdx: number;
	while ((startIdx = currentLineText.indexOf("`", searchFrom)) > -1) {
		searchFrom = startIdx + 1;
		let endIdx;
		if ((endIdx = currentLineText.indexOf("`", searchFrom)) > -1) {
			inlineCodeBlocks.push({ range: new vscode.Range(currentLineIdx, startIdx + 1, currentLineIdx, endIdx) });
			searchFrom = endIdx + 1;
			if (possibleStrikeThrough) {
				currentLineText = currentLineText.slice(0, startIdx) + "X".repeat(endIdx - startIdx) + currentLineText.substring(endIdx);
		}
	}
	}
	return currentLineText;
}

/** - Find all strike through blocks within inline-code-free line
 *  - Add to strikeThroughBlocks
 */
 function findAndProcessInlineStrikeThroughBlocks(currentLineText: string, currentLineIdx: number, strikeThroughBlocks: vscode.DecorationOptions[]) {
	let startIdx: number | undefined;
	let endIdx: number | undefined;

	const startMarkerRegEx = /(?<!~)~~[^\s~]/g;
	const endMarkerRegEx = /(?<![\s~])~~(?!~)/g;

	while ((startIdx = startMarkerRegEx.exec(currentLineText)?.index) !== undefined) {
		endMarkerRegEx.lastIndex = startIdx + 2;
		if ((endIdx = endMarkerRegEx.exec(currentLineText)?.index) !== undefined) {
			strikeThroughBlocks.push({ range: new vscode.Range(currentLineIdx, startIdx, currentLineIdx, endIdx + 2) });
			startMarkerRegEx.lastIndex = endIdx + 3;
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
	if (currentLineText.trim().length == 0) {
		return;
	} else if ( match = currentLineText.match(HeaderRegEx) ) {
		return {
			headerLevel: match[3].length,
			lineIdx: currentLineIdx,
			startChar: match[1].length,
			endChar: match[1].length + match[2].length,
			endHeaderLineIdx: currentLineIdx,
			setextHeader: false
		};
	} else if ( ++currentLineIdx < document.lineCount && (match = document.lineAt(currentLineIdx).text.match(AltHeaderRegEx)) ) {
		return {
			headerLevel: (match[1].charAt(0) == '=' ? 1 : 2),
			lineIdx: currentLineIdx - 1,
			startChar: currentLineText.length - currentLineText.trimLeft().length,
			endChar: currentLineText.trimRight().length,
			endHeaderLineIdx: currentLineIdx,
			setextHeader: true
		};
	}
}

function processForActiveHeader(headerLine: HeaderLine, cursorLineIdx: number | undefined, activeHeaders: HeaderDecorationOptions[]) {
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

function processForSetextHeader(headerLine: HeaderLine, setextStyleHeaders: vscode.DecorationOptions[][]) {
	if (headerLine.setextHeader) {
		const headerDecorationRange = { range: new vscode.Range(headerLine.lineIdx, headerLine.startChar, headerLine.lineIdx, headerLine.endChar) };
		setextStyleHeaders[headerLine.headerLevel - 1].push(headerDecorationRange);
	}
}

function processIfBlockquote(currentLineText: string, currentLineIdx: number, prevLineType: LineType, blockquoteTextLines: vscode.DecorationOptions[], blockquoteSymbols: vscode.DecorationOptions[]): boolean {
	let isBlockquoteLine = false;
	let match = (prevLineType.startsWith("LIST") ? currentLineText.match(BlockquoteEmbeddedInListSymbolRegEx) : currentLineText.match(BlockquoteSymbolRegEx))
	if (match) {
		isBlockquoteLine = true;

		let offset = 0;
		let remainingLine = currentLineText;
		do {
			offset = offset + match[0].length
			blockquoteSymbols.push({ range: new vscode.Range(currentLineIdx,offset - 1,currentLineIdx,offset)});
			remainingLine = remainingLine.substring(match[0].length)
		} while (match = remainingLine.match(BlockquoteSymbolRegEx));
		blockquoteTextLines.push({ range: new vscode.Range(currentLineIdx, offset, currentLineIdx, currentLineText.length)});
	} else if (prevLineType == LineType.BLOCKQUOTE && currentLineText.match(nonWhitespaceRegEx)) {
		blockquoteTextLines.push({ range: new vscode.Range(currentLineIdx, 0 ,currentLineIdx, currentLineText.length)});
		isBlockquoteLine = true;
	}

	return isBlockquoteLine;
}



function determinePrevLineListStatus(prevLineType: LineType, currentLineText: string): LineType {
	if (prevLineType.startsWith("LIST")) {
		if (currentLineText.trim().length == 0) {
			return LineType.LIST_PARAGRAPH_WHITESPACE;
		} else if (currentLineText.match(ListRegEx)) {
			return LineType.LIST;
		} else if (currentLineText.match(listParagraphRegEx)) {
			return LineType.LIST_PARAGRAPH;
		} else {
			return (prevLineType === LineType.LIST_PARAGRAPH_WHITESPACE ? LineType.MISC : LineType.LIST_PARAGRAPH);
		}

	} else {
		if (currentLineText.trim().length == 0) {
			return LineType.WHITESPACE;
		} else if (currentLineText.match(ListRegEx)) {
			return LineType.LIST;
		} else {
			return LineType.MISC;
		}
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
	const blockquoteTextLines: vscode.DecorationOptions[] = [];
	const blockquoteSymbols: vscode.DecorationOptions[] = [];
	const horizontalRules: vscode.DecorationOptions[] = [];
	const strikeThroughBlocks: vscode.DecorationOptions[] = [];
	const invisibleLineBreaks: vscode.DecorationOptions[] = [];
	const activeHeaders: HeaderDecorationOptions[] = [];
	const setextStyleHeaders: vscode.DecorationOptions[][] = [[],[]];
	
	let prevLineType = LineType.START_OF_DOC;
	let currentLineIdx = -1;
	while (!token?.isCancellationRequested && ++currentLineIdx < document.lineCount) {
		let currentLineText = document.lineAt(currentLineIdx).text;
		let match: RegExpMatchArray | null;

		if ( match = currentLineText.match(fencedCodeBlockStartRegEx) ) {
			currentLineIdx = processFencedCodeBlock(document, currentLineIdx, match[1], fencedCodeBlocks, token);
			prevLineType = LineType.FENCED_CODE_BLOCK;
		} else if (isIndentedCodeBlockStart(currentLineText, document, currentLineIdx, prevLineType)) {
			currentLineIdx = processIndentedCodeBlock(document, currentLineIdx, indentedCodeBlocks, token);
			prevLineType = LineType.INDENTED_CODE_BLOCK;
		} else if (currentLineText.match(horizontalRuleRegEx)) {
			horizontalRules.push({range: new vscode.Range(currentLineIdx,0,currentLineIdx,document.lineAt(currentLineIdx).text.length)})
			prevLineType = LineType.HORIZONTAL_RULE;
		} else {
			findAndProcessAllInlineDecorations(currentLineText, currentLineIdx, inlineCodeBlocks, strikeThroughBlocks, token);

			let headerLine;
			if (processIfBlockquote(currentLineText, currentLineIdx, prevLineType, blockquoteTextLines, blockquoteSymbols)) {
				findAndProcessInvisibleLineBreaks(currentLineText, currentLineIdx, invisibleLineBreaks, token);
				prevLineType = prevLineType.startsWith("LIST") ? LineType.LIST_PARAGRAPH : LineType.BLOCKQUOTE
			} else if ( headerLine = isHeader(document, currentLineText, currentLineIdx)) {
				processForSetextHeader(headerLine, setextStyleHeaders);
				processForActiveHeader(headerLine, selectedLineIdx, activeHeaders);
				currentLineIdx = headerLine.endHeaderLineIdx;
				prevLineType = LineType.HEADER;
			} else {
				findAndProcessInvisibleLineBreaks(currentLineText, currentLineIdx, invisibleLineBreaks, token);
				prevLineType = determinePrevLineListStatus(prevLineType, currentLineText);
			}
		}
	}	

	if (!token?.isCancellationRequested) {
		const config = ConfigurationHandler.config;

		const decoratedRanges: DecoratedRanges = {
			fencedCodeBlocks:     (config.fencedCodeBlock.enabled     ? fencedCodeBlocks      : []),
			indentedCodeBlocks:   (config.indentedCodeBlock.enabled   ? indentedCodeBlocks    : []),
			inlineCodeBlocks:     (config.inlineCode.enabled          ? inlineCodeBlocks      : []),
			blockquoteText:       (config.blockquoteLine.enabled      ? blockquoteTextLines   : []),
			blockquoteSymbols:    (config.blockquoteSymbol.enabled    ? blockquoteSymbols     : []),
			horizontalRules:      (config.horizontalRule.enabled      ? horizontalRules       : []),
			strikeThroughBlocks:  (config.strikeThrough.enabled       ? strikeThroughBlocks   : []),
			invisibleLineBreaks:  (config.invisibleLineBreak.enabled  ? invisibleLineBreaks   : []),
			activeHeaders:        (config.activeHeader.enabled        ? activeHeaders         : []),
			setextStyleL1Headers: (config.setextStyleHeaderL1.enabled ? setextStyleHeaders[0] : []),
			setextStyleL2Headers: (config.setextStyleHeaderL2.enabled ? setextStyleHeaders[1] : []),
		}

		editor.setDecorations(config.fencedCodeBlock.decorationType,     decoratedRanges.fencedCodeBlocks);
		editor.setDecorations(config.indentedCodeBlock.decorationType,   decoratedRanges.indentedCodeBlocks);
		editor.setDecorations(config.inlineCode.decorationType,          decoratedRanges.inlineCodeBlocks);
		editor.setDecorations(config.blockquoteLine.decorationType,      decoratedRanges.blockquoteText);
		editor.setDecorations(config.blockquoteText.decorationType,      decoratedRanges.blockquoteText);
		editor.setDecorations(config.blockquoteSymbol.decorationType,    decoratedRanges.blockquoteSymbols);
		editor.setDecorations(config.horizontalRule.decorationType,      decoratedRanges.horizontalRules);
		editor.setDecorations(lineThroughDecoration,                     lineThroughBlocks(decoratedRanges.strikeThroughBlocks));
		editor.setDecorations(config.strikeThrough.decorationType,       decoratedRanges.strikeThroughBlocks);
		editor.setDecorations(config.invisibleLineBreak.decorationType,  decoratedRanges.invisibleLineBreaks);
		if (selectedLineIdx) {
			editor.setDecorations(config.activeHeader.decorationType,       decoratedRanges.activeHeaders);
		}
		editor.setDecorations(config.setextStyleHeaderL1.decorationType, decoratedRanges.setextStyleL1Headers);
		editor.setDecorations(config.setextStyleHeaderL2.decorationType, decoratedRanges.setextStyleL2Headers);

		return decoratedRanges;
	} 
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor.setDecorations(ConfigurationHandler.config.fencedCodeBlock.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.indentedCodeBlock.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.inlineCode.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.blockquoteLine.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.blockquoteSymbol.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.horizontalRule.decorationType, []);
	editor.setDecorations(lineThroughDecoration, []);
	editor.setDecorations(ConfigurationHandler.config.strikeThrough.decorationType, []);
	editor.setDecorations(ConfigurationHandler.config.invisibleLineBreak.decorationType,    []);
	editor.setDecorations(ConfigurationHandler.config.activeHeader.decorationType, []);
	editor.setDecorations(ConfigurationHandler.config.setextStyleHeaderL1.decorationType, []);
	editor.setDecorations(ConfigurationHandler.config.setextStyleHeaderL2.decorationType, []);
}

function lineThroughBlocks(strikeThroughBlocks: vscode.DecorationOptions[]): vscode.DecorationOptions[] {
	const blocks: vscode.DecorationOptions[] = [];
	strikeThroughBlocks.forEach(strikeThroughBlock => {
		const outer = strikeThroughBlock.range;
		blocks.push({range: new vscode.Range(outer.start.line, outer.start.character + 2, outer.end.line, outer.end.character - 2)});
	});
	return blocks;
}

