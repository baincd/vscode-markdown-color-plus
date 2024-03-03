import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Setext headers', () => {
	vscode.window.showInformationMessage('Running Setext Headers tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.setextStyleHeaderL1.enabled = true;
		ConfigurationHandler.config.setextStyleHeaderL2.enabled = true;
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

	it('should decorate Setext L1 header on second line', async () => {
		const editor = await openMarkdownDocument(["", "Hello World", "==="])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.setextStyleL1Headers).to.be.lengthOf(1);
		expect(actual?.setextStyleL1Headers[0].range.start.line).to.be.eq(1);
		expect(actual?.setextStyleL1Headers[0].range.start.character).to.be.eq(0);
		expect(actual?.setextStyleL1Headers[0].range.end.line).to.be.eq(1);
		expect(actual?.setextStyleL1Headers[0].range.end.character).to.be.eq(11);
	});

	it('should decorate Setext L1 header on first line', async () => {
		const editor = await openMarkdownDocument(["Header 1", "=======", "==="])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.setextStyleL1Headers).to.be.lengthOf(1);
		expect(actual?.setextStyleL1Headers[0].range.start.line).to.be.eq(0);
		expect(actual?.setextStyleL1Headers[0].range.start.character).to.be.eq(0);
		expect(actual?.setextStyleL1Headers[0].range.end.line).to.be.eq(0);
		expect(actual?.setextStyleL1Headers[0].range.end.character).to.be.eq(8);
	});

	it('should decorate Setext L1 header that does not start at char 0', async () => {
		const editor = await openMarkdownDocument(["   ABC", "======="])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.setextStyleL1Headers).to.be.lengthOf(1);
		expect(actual?.setextStyleL1Headers[0].range.start.line).to.be.eq(0);
		expect(actual?.setextStyleL1Headers[0].range.start.character).to.be.eq(3);
		expect(actual?.setextStyleL1Headers[0].range.end.line).to.be.eq(0);
		expect(actual?.setextStyleL1Headers[0].range.end.character).to.be.eq(6);
	});

	it('should decorate Setext L2 header on second line', async () => {
		const editor = await openMarkdownDocument(["", "Hello World!", "---"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.setextStyleL2Headers).to.be.lengthOf(1);
		expect(actual?.setextStyleL2Headers[0].range.start.line).to.be.eq(1);
		expect(actual?.setextStyleL2Headers[0].range.start.character).to.be.eq(0);
		expect(actual?.setextStyleL2Headers[0].range.end.line).to.be.eq(1);
		expect(actual?.setextStyleL2Headers[0].range.end.character).to.be.eq(12);
	});

	it('should decorate Setext L2 header on first line', async () => {
		const editor = await openMarkdownDocument(["Header Level 2", "-------", "---"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.setextStyleL2Headers).to.be.lengthOf(1);
		expect(actual?.setextStyleL2Headers[0].range.start.line).to.be.eq(0);
		expect(actual?.setextStyleL2Headers[0].range.start.character).to.be.eq(0);
		expect(actual?.setextStyleL2Headers[0].range.end.line).to.be.eq(0);
		expect(actual?.setextStyleL2Headers[0].range.end.character).to.be.eq(14);
	});

	it('should decorate Setext L2 header that does not start at char 0', async () => {
		const editor = await openMarkdownDocument(["   ABC", "---"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.setextStyleL2Headers).to.be.lengthOf(1);
		expect(actual?.setextStyleL2Headers[0].range.start.line).to.be.eq(0);
		expect(actual?.setextStyleL2Headers[0].range.start.character).to.be.eq(3);
		expect(actual?.setextStyleL2Headers[0].range.end.line).to.be.eq(0);
		expect(actual?.setextStyleL2Headers[0].range.end.character).to.be.eq(6);
	});

});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
