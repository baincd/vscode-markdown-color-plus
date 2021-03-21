import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Invisible line break decorating', () => {
	vscode.window.showInformationMessage('Running Invisible Code Block tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.invisibleLineBreak.enabled = true;
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

	it('should highlight 2 trailing spaces of line with text', async () => {
		const editor = await openMarkdownDocument(["", "Text  "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(1);
		expect(actual?.invisibleLineBreaks[0].range.start.line).to.be.eq(1);
		expect(actual?.invisibleLineBreaks[0].range.start.character).to.be.eq(4);
		expect(actual?.invisibleLineBreaks[0].range.end.line).to.be.eq(1);
		expect(actual?.invisibleLineBreaks[0].range.end.character).to.be.eq(6);
	});

	it('should not highlight an invisible line breaks when feature is disabled', async () => {
		ConfigurationHandler.config.invisibleLineBreak.enabled = false;
		const editor = await openMarkdownDocument(["", "Text  "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should highlight only 2 trailing spaces of line with text', async () => {
		const editor = await openMarkdownDocument(["", "Text     "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(1);
		expect(actual?.invisibleLineBreaks[0].range.start.line).to.be.eq(1);
		expect(actual?.invisibleLineBreaks[0].range.start.character).to.be.eq(7);
		expect(actual?.invisibleLineBreaks[0].range.end.line).to.be.eq(1);
		expect(actual?.invisibleLineBreaks[0].range.end.character).to.be.eq(9);
	});

	it('should not highlight 2 trailing spaces of header', async () => {
		const editor = await openMarkdownDocument(["", "# Header  "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces within indented code block', async () => {
		const editor = await openMarkdownDocument(["", "    Indented code block  "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces within indented code block (with tab)', async () => {
		const editor = await openMarkdownDocument(["", "\tIndented code block  "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces within fenced code block', async () => {
		const editor = await openMarkdownDocument(["", "```  ", "fenced code block  ", "```  ", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces with on horizontal rule using hyphens', async () => {
		const editor = await openMarkdownDocument(["", "---  ", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces with on horizontal rule using asterisks', async () => {
		const editor = await openMarkdownDocument(["", "***  ", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces with on horizontal rule using underscores', async () => {
		const editor = await openMarkdownDocument(["", "___  ", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces on table-ish lines', async () => {
		const editor = await openMarkdownDocument(["", "| table-ish |  ", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

	it('should not highlight 2 trailing spaces on all space lines', async () => {
		const editor = await openMarkdownDocument(["", "   ", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.invisibleLineBreaks).to.be.lengthOf(0);
	});

});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
