import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Active headers decorating', () => {
	vscode.window.showInformationMessage('Running Active Headers tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.activeHeader.enabled = true;
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

	it('should highlight L1 header when cursor following L1 header', async () => {
		const editor = await openMarkdownDocument(["", "# Header L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(3, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);
		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(1);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(1);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});

	it('should not highlight active headers when feature is disabled', async () => {
		ConfigurationHandler.config.activeHeader.enabled = false;
		const editor = await openMarkdownDocument(["", "# Header L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(3, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(0);
	});

	it('should not highlight active headers when no cursor position', async () => {
		const editor = await openMarkdownDocument(["", "# Header L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, undefined);

		expect(actual?.activeHeaders).to.be.lengthOf(0);
	});

	it('should not highlight any headers when cursor / L1', async () => {
		const editor = await openMarkdownDocument(["", "# Header L1", "", "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(0, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(0);
	});

	it('should highlight L1, L2b, L3b when L1 / L2a / L2b / L3a / L3b / cursor', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "", 
		                                           "## Header L2a",
		                                           "",
		                                           "## Header L2b",
		                                           "",
		                                           "### Header L3a",
		                                           "",
		                                           "### Header L3b",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(10, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(3);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(4);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(4);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(13);

		expect(actual?.activeHeaders[2].range.start.line).to.be.eq(8);
		expect(actual?.activeHeaders[2].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[2].range.end.line).to.be.eq(8);
		expect(actual?.activeHeaders[2].range.end.character).to.be.eq(14);
	});

	it('should highlight L1, L2b, L3a when L1 / L2a / L2b / L3a / cursor / L3b', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "", 
		                                           "## Header L2a",
		                                           "",
		                                           "## Header L2b",
		                                           "",
		                                           "### Header L3a",
		                                           "",
		                                           "### Header L3b",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(7, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(3);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(4);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(4);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(13);

		expect(actual?.activeHeaders[2].range.start.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[2].range.end.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.end.character).to.be.eq(14);
	});

	it('should highlight L1, L2a when L1 / L2a / cursor / L2b / L3a / L3b', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "", 
		                                           "## Header L2a",
		                                           "",
		                                           "## Header L2b",
		                                           "",
		                                           "### Header L3a",
		                                           "",
		                                           "### Header L3b",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(3, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(2);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(2);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(2);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(13);
	});

	it('should highlight L1, L2, NOT L3 when L1 / L2 / L3 (cursor)', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "", 
		                                           "## Header L2",
		                                           "",
		                                           "### Header L3",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(4, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(2);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(2);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(2);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(12);
	});

	it('should highlight only L1 when L1 / L2a / L2b (cursor)', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "", 
		                                           "## Header L2a",
		                                           "",
		                                           "## Header L2b",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(4, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});

	it('should highlight L1, L2 when L1 / L3 / L2 / cursor', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "", 
		                                           "### Header L3",
		                                           "",
		                                           "## Header L2",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(6, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(2);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(4);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(4);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(12);
	});


	it('should not highlight active header leading spaces', async () => {
		const editor = await openMarkdownDocument(["   # Header L1", 
		                                           ""])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(1, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(3);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(14);
	});

	it('should not highlight lines that look like headers in unnamed language fenced code block', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "",
		                                           "```",
		                                           "# Not a header",
		                                           "```",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(6, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});
	
	it('should not highlight lines that look like headers in named language fenced code block', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "",
		                                           "```java",
		                                           "# Not a header",
		                                           "```",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(6, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});

	it('should not highlight lines that look like headers in indented code block using spaces', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "",
		                                           "    # Not a header",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(4, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});

	it('should not highlight lines that look like headers in indented code block using tab', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "",
		                                           "\t# Not a header",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(4, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});

	it('should not highlight lines that look like headers but actual headers when cursor in unnamed language fenced code block', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "",
		                                           "```",
		                                           "# Not a header",
		                                           "Code",
		                                           "```",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(4, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});
	
	it('should not highlight lines that look like headers but actual headers when cursor in indented code block', async () => {
		const editor = await openMarkdownDocument(["# Header L1", 
		                                           "",
		                                           "    # Not a header",
		                                           "    Code",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(3, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(1);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(11);
	});

	it('should highlight headers using alternate header syntax', async () => {
		const editor = await openMarkdownDocument(["Header L1", 
		                                           "===", 
		                                           "", 
		                                           "Header L2",
		                                           "---",
		                                           "",
		                                           "### Header L3",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(7, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(3);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(9);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(9);

		expect(actual?.activeHeaders[2].range.start.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[2].range.end.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.end.character).to.be.eq(13);
	});

	it('should highlight headers using alternate header syntax with more than 3 chars', async () => {
		const editor = await openMarkdownDocument(["Header L1", 
		                                           "=======", 
		                                           "", 
		                                           "Header L2",
		                                           "-------",
		                                           "",
		                                           "### Header L3",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(7, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(3);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(9);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(9);

		expect(actual?.activeHeaders[2].range.start.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[2].range.end.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.end.character).to.be.eq(13);
	});

	it('should highlight headers using alternate header syntax with leading spaces and trailing', async () => {
		const editor = await openMarkdownDocument(["Header L1", 
		                                           "   ===   ", 
		                                           "", 
		                                           "Header L2",
		                                           "   ---   ",
		                                           "",
		                                           "### Header L3",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(7, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(3);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(9);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(9);

		expect(actual?.activeHeaders[2].range.start.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.start.character).to.be.eq(0);
		expect(actual?.activeHeaders[2].range.end.line).to.be.eq(6);
		expect(actual?.activeHeaders[2].range.end.character).to.be.eq(13);
	});

	it('should not highlight leading spaces on headers using alternate header syntax', async () => {
		const editor = await openMarkdownDocument(["   Header L1", 
		                                           "===", 
		                                           "", 
		                                           "   Header L2",
		                                           "---",
		                                           "",
		                                           "Text"])

		let actual = ClassUnderTest.updateDecorations(editor, new vscode.Position(5, 0));

		expect(actual?.activeHeaders).to.be.lengthOf(2);

		expect(actual?.activeHeaders[0].range.start.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.start.character).to.be.eq(3);
		expect(actual?.activeHeaders[0].range.end.line).to.be.eq(0);
		expect(actual?.activeHeaders[0].range.end.character).to.be.eq(12);

		expect(actual?.activeHeaders[1].range.start.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.start.character).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.end.line).to.be.eq(3);
		expect(actual?.activeHeaders[1].range.end.character).to.be.eq(12);
	});

});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
