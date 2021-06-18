import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Strike Through decorating', () => {
	vscode.window.showInformationMessage('Running Strike Through tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.strikeThrough.enabled = true;
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

	it('should decorate text between strike through markers', async () => {
		const editor = await openMarkdownDocument(["", " ~~strthr~~ "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(11);
	});

	it('should decorate text between strike through markers that start at index 0', async () => {
		const editor = await openMarkdownDocument(["", "~~strthr~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(0);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(10);
	});

	it('should not decorate text between strike through markers inside inline code block', async () => {
		const editor = await openMarkdownDocument(["", " `code ~~nostrthr~~` "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should decorate text between strike through markers with inline code block inside', async () => {
		const editor = await openMarkdownDocument(["", "~~`strthr code`~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(0);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(17);
	});

	it('should not decorate text if no closing strike through marker', async () => {
		const editor = await openMarkdownDocument(["", "`code` ~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should not consider text in inline code block as end strike through marker', async () => {
		const editor = await openMarkdownDocument(["", "  ~~`code ~~`~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(2);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(15);
	});

	it('should not consider any text in inline code block as end strike through marker', async () => {
		const editor = await openMarkdownDocument(["", "  ~~`code ~~ ~~`~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(2);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(18);
	});

	it('should not consider text in inline code block as start strike through marker', async () => {
		const editor = await openMarkdownDocument(["", " `code ~~` ~~strthr~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(11);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(21);
	});

	it('should not consider any text in inline code block as start strike through marker', async () => {
		const editor = await openMarkdownDocument(["", "", " `code ~~` `code ~~ code` ~~strthr~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(26);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(36);
	});


	it('should not consider any text in inline code block as start strike through marker', async () => {
		const editor = await openMarkdownDocument(["`code`", " ~~strthr~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(11);
	});

	it('should not consider squigglies followed by a space as a starting strike through marker', async () => {
		const editor = await openMarkdownDocument(["`code`", "~~ no strthr~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should not consider squigglies followed by a tab as a starting strike through marker', async () => {
		const editor = await openMarkdownDocument(["`code`", "~~	no strthr~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should not consider squigglies preceded by a space as a ending strike through marker', async () => {
		const editor = await openMarkdownDocument(["`code`", "~~no strthr ~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should not consider squigglies preceded by a tab as a ending strike through marker', async () => {
		const editor = await openMarkdownDocument(["`code`", "~~no strthr	~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should decorate multiple strike through sections', async () => {
		const editor = await openMarkdownDocument(["", " ~~strthr1~~ ~~strthr2~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(2);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(12);
		expect(actual?.strikeThroughBlocks[1].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[1].range.start.character).to.be.eq(13);
		expect(actual?.strikeThroughBlocks[1].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[1].range.end.character).to.be.eq(24);
	});

	it('should decorate multiple strike through sections without being confused by inner squigglies', async () => {
		const editor = await openMarkdownDocument(["", " ~~str ~~thr1~~ ~~strthr2~~ "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(2);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(15);
		expect(actual?.strikeThroughBlocks[1].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[1].range.start.character).to.be.eq(16);
		expect(actual?.strikeThroughBlocks[1].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[1].range.end.character).to.be.eq(27);
	});

	it('should not consider 3 squigglies as a starting strike through marker (matches GitHub)', async () => {
		const editor = await openMarkdownDocument(["", " ~~~no strthr~~ "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should not consider 3 squigglies as a ending strike through marker (matches GitHub)', async () => {
		const editor = await openMarkdownDocument(["", " ~~no strthr~~~ "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(0);
	});

	it('should not consider 3 squigglies as a ending strike through marker (matches GitHub)', async () => {
		const editor = await openMarkdownDocument(["", " ~~strthr~~~strthr~~ "])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(20);
	});

	it('should handle smallest possible strike through text', async () => {
		const editor = await openMarkdownDocument(["~~a~~"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.strikeThroughBlocks).to.be.lengthOf(1);
		expect(actual?.strikeThroughBlocks[0].range.start.line).to.be.eq(0);
		expect(actual?.strikeThroughBlocks[0].range.start.character).to.be.eq(0);
		expect(actual?.strikeThroughBlocks[0].range.end.line).to.be.eq(0);
		expect(actual?.strikeThroughBlocks[0].range.end.character).to.be.eq(5);
	});
	
});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
