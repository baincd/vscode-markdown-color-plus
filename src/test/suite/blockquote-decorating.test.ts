import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Blockquote decorating', () => {
	vscode.window.showInformationMessage('Running blockquote tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.blockquoteLine.enabled = true;
		ConfigurationHandler.config.blockquoteSymbol.enabled = true;
	});

	afterEach('Close all editors',async () => {
		await vscode.commands.executeCommand("workbench.action.closeAllEditors");
	});

	specify('Extension Loaded', () => {
		const started = vscode.extensions.getExtension(
			"baincd.markdown-color-plus",
		)?.isActive;

		expect(started).to.not.be.undefined;
	});

	it('should highlight L1 blockquote line', async () => {
		const editor = await openMarkdownDocument(["", "> bq L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteText[0].range.end.line).to.be.eq(1);
	});

	it('should highlight L1 blockquote line on other lines', async () => {
		const editor = await openMarkdownDocument(["", "", "> bq L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range.start.line).to.be.eq(2);
		expect(actual?.blockquoteText[0].range.end.line).to.be.eq(2);
	});

	it('should not highlight blockquote line when blockquote line highlighting is disabled', async () => {
		ConfigurationHandler.config.blockquoteLine.enabled = false;
		ConfigurationHandler.config.blockquoteSymbol.enabled = false;
		const editor = await openMarkdownDocument(["", "> bq L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(0);
		expect(actual?.blockquoteSymbols).to.be.lengthOf(0);
	});

	it('should highlight multiple blockquote lines', async () => {
		const editor = await openMarkdownDocument(["", "> bq 1", "> bq2", "", "> bq3", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(3);
		expect(actual?.blockquoteText[0].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteText[0].range.end.line).to.be.eq(1);
		expect(actual?.blockquoteText[1].range.start.line).to.be.eq(2);
		expect(actual?.blockquoteText[1].range.end.line).to.be.eq(2);
		expect(actual?.blockquoteText[2].range.start.line).to.be.eq(4);
		expect(actual?.blockquoteText[2].range.end.line).to.be.eq(4);
	});

	it('should highlight blockquote line with leading spaces', async () => {
		const editor = await openMarkdownDocument(["", "   > bq 1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteText[0].range.end.line).to.be.eq(1);
	});

	it('should not highlight blockquote line that start with 4 spaces', async () => {
		const editor = await openMarkdownDocument(["", "    > indented code block", "", "\t> indented code block"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(0);
	});

	it('should not highlight blockquote line that does not have whitespace at the start', async () => {
		const editor = await openMarkdownDocument(["", "x> regular text line", "", "text"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(0);
	});

	it('should highlight blockquote line without > that trails a blockquote line with >', async () => {
		const editor = await openMarkdownDocument(["", "> bq 1", "bq 2"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(2);
		expect(actual?.blockquoteText[1].range.start.line).to.be.eq(2);
		expect(actual?.blockquoteText[1].range.end.line).to.be.eq(2);
	});

	it('should consider whitespace line as end of blockquote', async () => {
		const editor = await openMarkdownDocument(["", "> bq 1", "   ", "not bq"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteText[0].range.end.line).to.be.eq(1);
	});


	it('should decorate blockquote symbol at start of line', async () => {
		const editor = await openMarkdownDocument(["", "> bq 1", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteSymbols).to.be.lengthOf(1);
		expect(actual?.blockquoteSymbols[0].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[0].range.end.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[0].range.start.character).to.be.eq(0);
		expect(actual?.blockquoteSymbols[0].range.end.character).to.be.eq(1);
	});

	it('should not decorate blockquote symbol not on a blockquote line', async () => {
		const editor = await openMarkdownDocument(["", "not a bq >", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteSymbols).to.be.lengthOf(0);
	});

	it('should decorate blockquote symbol on correct line number', async () => {
		const editor = await openMarkdownDocument(["> bq 1" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteSymbols).to.be.lengthOf(1);
		expect(actual?.blockquoteSymbols[0].range.start.line).to.be.eq(0);
		expect(actual?.blockquoteSymbols[0].range.end.line).to.be.eq(0);
		expect(actual?.blockquoteSymbols[0].range.start.character).to.be.eq(0);
		expect(actual?.blockquoteSymbols[0].range.end.character).to.be.eq(1);
	});

	it('should decorate all blockquote used to identify blockquote', async () => {
		const editor = await openMarkdownDocument(["", "> > >> bq level 4 > ", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteSymbols).to.be.lengthOf(4);
		expect(actual?.blockquoteSymbols[0].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[0].range.end.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[0].range.start.character).to.be.eq(0);
		expect(actual?.blockquoteSymbols[0].range.end.character).to.be.eq(1);
		expect(actual?.blockquoteSymbols[1].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[1].range.end.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[1].range.start.character).to.be.eq(2);
		expect(actual?.blockquoteSymbols[1].range.end.character).to.be.eq(3);
		expect(actual?.blockquoteSymbols[2].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[2].range.end.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[2].range.start.character).to.be.eq(4);
		expect(actual?.blockquoteSymbols[2].range.end.character).to.be.eq(5);
		expect(actual?.blockquoteSymbols[3].range.start.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[3].range.end.line).to.be.eq(1);
		expect(actual?.blockquoteSymbols[3].range.start.character).to.be.eq(5);
		expect(actual?.blockquoteSymbols[3].range.end.character).to.be.eq(6);
	});

	it('should identify blockquote text chars', async () => {
		const editor = await openMarkdownDocument(["", "> bq level 1 > ", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range.start.character).to.be.eq(1);
		expect(actual?.blockquoteText[0].range.end.character).to.be.eq(15);
	});

	it('should identify blockquote text chars when multiple blockquote symbols', async () => {
		const editor = await openMarkdownDocument(["", "> > bq level 2 !!", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range.start.character).to.be.eq(3);
		expect(actual?.blockquoteText[0].range.end.character).to.be.eq(17);
	});

	it('should identify blockquote text chars as entire line when no leading blockquote symbol', async () => {
		const editor = await openMarkdownDocument(["", "> BQ 1", "   Some Text! ", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(2);
		expect(actual?.blockquoteText[1].range.start.character).to.be.eq(0);
		expect(actual?.blockquoteText[1].range.end.character).to.be.eq(14);
	});

	it('should not identify blockquote lines with more than 3 leading spaces', async () => {
		const editor = await openMarkdownDocument(["", "text", "    > > > Not a BQ (cannot have more than 3 spaces)", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(0);
	});

	it('should not identify blockquote lines with leading tab', async () => {
		const editor = await openMarkdownDocument(["", "text", "	> Not a BQ (cannot start with tab)", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(0);
	});

	// Complex Examples
	it('should not identify blockquote lines with more than 3 leading spaces', async () => {
		const editor = await openMarkdownDocument(["", 	"> BQ","   > > BQ","    > > > BQ line, no BQ symbols (cannot have more than 3 leading spaces)", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(3);
		expect(actual?.blockquoteText[0].range).to.satisfy(lineRange(1))
		expect(actual?.blockquoteText[1].range).to.satisfy(lineRange(2))
		expect(actual?.blockquoteText[2].range).to.satisfy(lineRange(3))

		expect(actual?.blockquoteSymbols).to.be.lengthOf(3);
		expect(actual?.blockquoteSymbols[0].range).to.satisfy(symbolRange(1,0))
		expect(actual?.blockquoteSymbols[1].range).to.satisfy(symbolRange(2,3))
		expect(actual?.blockquoteSymbols[2].range).to.satisfy(symbolRange(2,5))
	});

	it('should not identify blockquote lines with tab or more than 3 leading spaces', async () => {
		const editor = await openMarkdownDocument(["",	"text", "	> Not a BQ (cannot start with tab)", "", "  text", "    > Not a BQ (cannot have more than 3 spaces, even if previous text line as more than 3 spaces)", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(0);
		expect(actual?.blockquoteSymbols).to.be.lengthOf(0);
	});

	it('should identify blockquote lines with 5 leading spaces when embedded in list', async () => {
		const editor = await openMarkdownDocument(["", "- list", "     > BQ (max number of spaces increases to 5 when after first level list)", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range).to.satisfy(lineRange(2))

		expect(actual?.blockquoteSymbols).to.be.lengthOf(1);
		expect(actual?.blockquoteSymbols[0].range).to.satisfy(symbolRange(2,5))
	});

	it('should identify blockquote lines with leading tabs and spaces when embedded in list', async () => {
		const editor = await openMarkdownDocument(["", "- list", "	 > BQ (max number of spaces increases to 5 when after first level list)", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(1);
		expect(actual?.blockquoteText[0].range).to.satisfy(lineRange(2))

		expect(actual?.blockquoteSymbols).to.be.lengthOf(1);
		expect(actual?.blockquoteSymbols[0].range).to.satisfy(symbolRange(2,2))
	});

	it('should identify multiple blockquote lines with leading tabs and spaces when embedded in list', async () => {
		const editor = await openMarkdownDocument(["", "- list", "    > BQ", "    > BQ", "" ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.blockquoteText).to.be.lengthOf(2);
		expect(actual?.blockquoteText[0].range).to.satisfy(lineRange(2))
		expect(actual?.blockquoteText[1].range).to.satisfy(lineRange(3))

		expect(actual?.blockquoteSymbols).to.be.lengthOf(2);
		expect(actual?.blockquoteSymbols[0].range).to.satisfy(symbolRange(2,4))
		expect(actual?.blockquoteSymbols[1].range).to.satisfy(symbolRange(3,4))
	});

	

	// "- list", "some list text", "", "     > BQ (max number of spaces increases to 5 when after first level list)", 

});

function lineRange(lineIdx: number): Function {
	return function(r: vscode.Range) {
		expect(r.start.line).to.be.equal(lineIdx);
		expect(r.end.line).to.be.equal(lineIdx);
		return r.start.line == lineIdx && r.end.line == lineIdx
	}
}

function symbolRange(lineIdx: number, symbolIdx: number): Function {
	return function(r: vscode.Range) {
		expect(r.start.line).to.be.equal(lineIdx);
		expect(r.end.line).to.be.equal(lineIdx);
		expect(r.start.character).to.be.equal(symbolIdx);
		expect(r.end.character).to.be.equal(symbolIdx + 1);
		return r.start.line == lineIdx && r.end.line == lineIdx
			&& r.start.character == symbolIdx && r.end.character == symbolIdx + 1
	}
}

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
