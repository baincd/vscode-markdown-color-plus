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


const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^(={3,}|(-{3,}))[ \t]*$/


const fencedCodeBlockEndRegEx = /^\s{0,3}(`{3,}|~{3,})\s*$/ // Based on fenced_code_block_unknown "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"


function findEndOfFencedCodeBlockLineIdx(document: vscode.TextDocument, startLineIdx: number, fenceMarker: string, token: TextDocumentCancelToken) {
	let fencedCodeBlockEndRegEx = new RegExp(fencedCodeBlockEndRegExStr.replace("{MATCH1}",fenceMarker));
	let currentLineIdx = startLineIdx;
	while (!token.isCancellationRequested && ++currentLineIdx < document.lineCount && !document.lineAt(currentLineIdx).text.match(fencedCodeBlockEndRegEx)) {
	}
	return currentLineIdx;
}

function resetHeaderLevels(activeHeaders: HeaderDecorationOptions[], headerLevel: number) {
	while (activeHeaders[activeHeaders.length - 1]?.headerLevel >= headerLevel) {
		activeHeaders.pop();
	}

}

export function updateDecorations(editor: vscode.TextEditor, pos: vscode.Position | null, token: TextDocumentCancelToken) {
	const document = editor.document;
	const selectedLineIdx = pos?.line;
	
	const fencedCodeBlocks: vscode.DecorationOptions[] = [];
	const activeHeaders: HeaderDecorationOptions[] = [];
	let currentLineIdx = -1;
	while (!token.isCancellationRequested && ++currentLineIdx < document.lineCount) {
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
		} else {
			if (selectedLineIdx && currentLineIdx <= selectedLineIdx) {
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
					resetHeaderLevels(activeHeaders, currentHeaderLevel);
					if (currentLineIdx < selectedLineIdx) {
						activeHeaders.push({ headerLevel: currentHeaderLevel, range: new vscode.Range(currentHeaderLineIdx, currentHeaderStartChar, currentHeaderLineIdx, currentHeaderEndChar) })
					}
				}
			}
		}

	}

	if (!token.isCancellationRequested) {
		const config = ConfigurationHandler.config;

		editor.setDecorations(config.fencedCodeBlock.decorationType, (config.fencedCodeBlock.enabled ? fencedCodeBlocks : []));
		if (selectedLineIdx) {
			editor.setDecorations(config.activeHeader.decorationType, (config.activeHeader.enabled ? activeHeaders : []));
		}
	}
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor?.setDecorations(ConfigurationHandler.config.fencedCodeBlock.decorationType,    []);
	editor?.setDecorations(ConfigurationHandler.config.activeHeader.decorationType, []);
}
