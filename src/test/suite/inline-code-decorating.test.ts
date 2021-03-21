import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Inline code decorating', () => {
	vscode.window.showInformationMessage('Running Inline Code tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.inlineCode.enabled = true;
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

	it('should highlight inline code between backticks', async () => {
		const editor = await openMarkdownDocument(["", "Not code `code` not code"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.inlineCodeBlocks).to.be.lengthOf(1);
		expect(actual?.inlineCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.inlineCodeBlocks[0].range.start.character).to.be.eq(10);
		expect(actual?.inlineCodeBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.inlineCodeBlocks[0].range.end.character).to.be.eq(14);
	});

	it('should not highlight an inline code when feature is disabled', async () => {
		ConfigurationHandler.config.inlineCode.enabled = false;
		const editor = await openMarkdownDocument(["", "Not code `code` not code"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.inlineCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight inline multiple code between backticks', async () => {
		const editor = await openMarkdownDocument(["Not code `code` not code `code again`"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.inlineCodeBlocks).to.be.lengthOf(2);
		expect(actual?.inlineCodeBlocks[0].range.start.line).to.be.eq(0);
		expect(actual?.inlineCodeBlocks[0].range.start.character).to.be.eq(10);
		expect(actual?.inlineCodeBlocks[0].range.end.line).to.be.eq(0);
		expect(actual?.inlineCodeBlocks[0].range.end.character).to.be.eq(14);
		expect(actual?.inlineCodeBlocks[1].range.start.line).to.be.eq(0);
		expect(actual?.inlineCodeBlocks[1].range.start.character).to.be.eq(26);
		expect(actual?.inlineCodeBlocks[1].range.end.line).to.be.eq(0);
		expect(actual?.inlineCodeBlocks[1].range.end.character).to.be.eq(36);
	});

	it('should not highlight unmatched backtick', async () => {
		const editor = await openMarkdownDocument(["Not code `code` not code `unmatched backtick", "Line 2"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.inlineCodeBlocks).to.be.lengthOf(1);
		expect(actual?.inlineCodeBlocks[0].range.start.line).to.be.eq(0);
		expect(actual?.inlineCodeBlocks[0].range.start.character).to.be.eq(10);
		expect(actual?.inlineCodeBlocks[0].range.end.line).to.be.eq(0);
		expect(actual?.inlineCodeBlocks[0].range.end.character).to.be.eq(14);
	});

});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
