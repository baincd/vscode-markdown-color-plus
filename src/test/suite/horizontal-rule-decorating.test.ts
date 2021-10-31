import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Horizontal Rule decorating', () => {
	vscode.window.showInformationMessage('Running Strike Through tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.horizontalRule.enabled = true;
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

	it('should decorate horizontal rule of 3 asterisks', async () => {
		const editor = await openMarkdownDocument(["", "***"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
	});
	
	it('should NOT decorate horizontal rules when horizontal rule highlighting is not enabled', async () => {
		ConfigurationHandler.config.horizontalRule.enabled = false;
		const editor = await openMarkdownDocument(["", "***", "", "---", "", "___", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(0);
	});

	it('should decorate horizontal rule of 3 dashes', async () => {
		const editor = await openMarkdownDocument(["", "---"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
	});

	it('should decorate horizontal rule of 3 underscores', async () => {
		const editor = await openMarkdownDocument(["", "___"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
	});

	it('should decorate horizontal rule of 3 asterisks at top of file', async () => {
		const editor = await openMarkdownDocument(["***"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(0);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(0);
	});
	
	it('should decorate horizontal rule of 3 dashes at top of file', async () => {
		const editor = await openMarkdownDocument(["---"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(0);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(0);
	});

	it('should decorate horizontal rule of 3 underscores at top of file', async () => {
		const editor = await openMarkdownDocument(["___"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(0);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(0);
	});

	it('should decorate horizontal rule of 3 asterisks with blank line before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "", "***", "", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});
	
	it('should decorate horizontal rule of 3 dashes with blank line before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "", "---", "", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});

	it('should decorate horizontal rule of 3 underscores with blank line before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "", "___", "", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});

	it('should decorate horizontal rule of 3 asterisks with space lines before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "   ", "***", "   ", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});
	
	it('should decorate horizontal rule of 3 dashes with space lines before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "   ", "---", "   ", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});

	it('should decorate horizontal rule of 3 underscores with space lines before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "   ", "___", "   ", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});

	it('should decorate horizontal rule of 3 asterisks with text before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "***", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
	});
	
	it('should NOT decorate horizontal rule of 3 dashes with text before', async () => {
		const editor = await openMarkdownDocument(["text before", "---", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(0);
	});

	it('should decorate horizontal rule of 3 dashes with text after', async () => {
		const editor = await openMarkdownDocument(["", "---", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
	});

	it('should decorate horizontal rule of 3 underscores with text before and after', async () => {
		const editor = await openMarkdownDocument(["text before", "___", "text after"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
	});

	it('should decorate multiple horizontal rules in a row', async () => {
		const editor = await openMarkdownDocument(["***", "***", "---", "---", "___", "___"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(6);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(0);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(0);
		expect(actual?.horizontalRules[1].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[1].range.end.line).to.be.eq(1);
		expect(actual?.horizontalRules[2].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[2].range.end.line).to.be.eq(2);
		expect(actual?.horizontalRules[3].range.start.line).to.be.eq(3);
		expect(actual?.horizontalRules[3].range.end.line).to.be.eq(3);
		expect(actual?.horizontalRules[4].range.start.line).to.be.eq(4);
		expect(actual?.horizontalRules[4].range.end.line).to.be.eq(4);
		expect(actual?.horizontalRules[5].range.start.line).to.be.eq(5);
		expect(actual?.horizontalRules[5].range.end.line).to.be.eq(5);
	});

	it('should decorate horizontal rules with longer than 3 chars', async () => {
		const editor = await openMarkdownDocument(["****", "*****", "------", "__________"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(4);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(0);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(0);
		expect(actual?.horizontalRules[1].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[1].range.end.line).to.be.eq(1);
		expect(actual?.horizontalRules[2].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[2].range.end.line).to.be.eq(2);
		expect(actual?.horizontalRules[3].range.start.line).to.be.eq(3);
		expect(actual?.horizontalRules[3].range.end.line).to.be.eq(3);
	});

	it('should decorate horizontal rules with leading and trailing spaces', async () => {
		const editor = await openMarkdownDocument([" ****", "  *****", "   ------", "___ ", "***   ", "   ---   "]);

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(6);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(0);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(0);
		expect(actual?.horizontalRules[1].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[1].range.end.line).to.be.eq(1);
		expect(actual?.horizontalRules[2].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[2].range.end.line).to.be.eq(2);
		expect(actual?.horizontalRules[3].range.start.line).to.be.eq(3);
		expect(actual?.horizontalRules[3].range.end.line).to.be.eq(3);
		expect(actual?.horizontalRules[4].range.start.line).to.be.eq(4);
		expect(actual?.horizontalRules[4].range.end.line).to.be.eq(4);
		expect(actual?.horizontalRules[5].range.start.line).to.be.eq(5);
		expect(actual?.horizontalRules[5].range.end.line).to.be.eq(5);
	});

	it('should NOT decorate horizontal rules trailing chars', async () => {
		const editor = await openMarkdownDocument(["****X"]);

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(0);
	});

	it('should decorate horizontal rules following a header', async () => {
		const editor = await openMarkdownDocument(["# header", "---", "", "# header", "***", "", "header", "---", "---"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(3);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(1);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(1);
		expect(actual?.horizontalRules[1].range.start.line).to.be.eq(4);
		expect(actual?.horizontalRules[1].range.end.line).to.be.eq(4);
		expect(actual?.horizontalRules[2].range.start.line).to.be.eq(8);
		expect(actual?.horizontalRules[2].range.end.line).to.be.eq(8);
	});

	it('should decorate horizontal rules following a fenced code block', async () => {
		const editor = await openMarkdownDocument(["", "```", "code", "```", "***"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(4);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(4);
	});

	it('should decorate horizontal rules following a indented code block', async () => {
		const editor = await openMarkdownDocument(["", "    code", "***"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});

	it('should decorate horizontal rules following blockquote', async () => {
		const editor = await openMarkdownDocument(["", "> BQ", "***"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.horizontalRules).to.be.lengthOf(1);
		expect(actual?.horizontalRules[0].range.start.line).to.be.eq(2);
		expect(actual?.horizontalRules[0].range.end.line).to.be.eq(2);
	});

});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
