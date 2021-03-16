import * as vscode from 'vscode';

import * as ConfigurationHandler from './ConfigurationHandler'

interface HeaderDecorationOptions extends vscode.DecorationOptions {
	headerLevel: number
}

export interface TextDocumentCancelToken {
	isCancellationRequested: boolean
	document?: vscode.TextDocument;
}

const HeaderRegEx = /^( {0,3})((#{1,6}) .*\S)\s*/

const AltHeaderRegEx = /^(={3,}|(-{3,}))[ \t]*$/

const fencedCodeBlockEndRegEx = /^\s{0,3}(`{3,}|~{3,})\s*$/ // Based on fenced_code_block_unknown "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$"

const fencedCodeBlockStartRegEx = /^\s{0,3}(`{3,}|~{3,})\s*(?=([^`~]*)?$)/  // Based on fenced_code_block_unknown "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`~]*)?$)"

function findEndOfFencedCodeBlockLineIdx(document: vscode.TextDocument, startLineIdx: number, maxLineIdxToCheck: number, token: TextDocumentCancelToken) {
	let currentLineIdx = startLineIdx;
	while (!token.isCancellationRequested && ++currentLineIdx < maxLineIdxToCheck && !document.lineAt(currentLineIdx).text.match(fencedCodeBlockEndRegEx)) {
	}
	return currentLineIdx;
}

function resetHeaderLevels(activeHeaders: HeaderDecorationOptions[], headerLevel: number) {
	while (activeHeaders[activeHeaders.length - 1]?.headerLevel >= headerLevel) {
		activeHeaders.pop();
	}

}

export function updateDecorations(editor: vscode.TextEditor, pos: vscode.Position, token: TextDocumentCancelToken) {
	const document = editor.document;
	const selectedLineIdx = pos.line;
	
	const activeHeaders: HeaderDecorationOptions[] = [];
	let currentLineIdx = -1;
	while (!token.isCancellationRequested && ++currentLineIdx <= selectedLineIdx) {
		let currentLineText = document.lineAt(currentLineIdx).text;
		let currentHeaderLineIdx: number = -1;
		let currentHeaderLevel: number | null = null;
		let currentHeaderStartChar: number = 0;
		let currentHeaderEndChar: number = 0;
		let match: RegExpMatchArray | null;

		if (currentLineText.match(fencedCodeBlockStartRegEx)) {
			currentLineIdx = findEndOfFencedCodeBlockLineIdx(document, currentLineIdx, selectedLineIdx, token);
		} else if ( (match = currentLineText.match(HeaderRegEx)) ) {
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

	if (!token.isCancellationRequested) {
		const config = ConfigurationHandler.config;

		editor.setDecorations(config.activeHeader.decorationType, (config.activeHeader.enabled ? activeHeaders : []));
	}
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor?.setDecorations(ConfigurationHandler.config.activeHeader.decorationType, []);
}
