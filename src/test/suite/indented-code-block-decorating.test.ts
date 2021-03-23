import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Indented code block decorating', () => {
	vscode.window.showInformationMessage('Running Indented Code Block tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.indentedCodeBlock.enabled = true;
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

	it('should highlight an indented code block indented with 4 spaces', async () => {
		const editor = await openMarkdownDocument(["", "    CodeLine", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should highlight an indented code block indented with 2 spaces and a tab', async () => {
		const editor = await openMarkdownDocument(["", "  \tCodeLine", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should not highlight an indented code block when feature is disabled', async () => {
		ConfigurationHandler.config.indentedCodeBlock.enabled = false;
		const editor = await openMarkdownDocument(["", "    CodeLine", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight an indented code block with 2 lines each indented with 4 spaces', async () => {
		const editor = await openMarkdownDocument(["", "    CodeLine1", "    CodeLine2", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block with 2 lines each indented with 4 spaces with a blank line between them', async () => {
		const editor = await openMarkdownDocument(["", "    CodeLine1", "", "    CodeLine2", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(3);
	});

	it('should highlight an indented code block with 2 lines each indented with 4 spaces with a line of 2 spaces between them', async () => {
		const editor = await openMarkdownDocument(["", "    CodeLine1", "  ", "    CodeLine2", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(3);
	});

	it('should highlight an indented code block with lines indented with tabs', async () => {
		const editor = await openMarkdownDocument(["", "\tCodeLine1", "\tCodeLine2", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block with a mix of lines indented with tabs and at least 4 spaces', async () => {
		const editor = await openMarkdownDocument(["", "\tCodeLine1", "      CodeLine2", "    CodeLine3", "", "\t Code Line 5", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(5);
	});

	it('should highlight an indented code block starting on first line', async () => {
		const editor = await openMarkdownDocument(["    Line0", "\tLine1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(0);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should highlight an indented code block that follows a line of only whitespace', async () => {
		const editor = await openMarkdownDocument(["  ", "\tLine1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should highlight an indented code block that follows a line of only whitespace', async () => {
		const editor = await openMarkdownDocument(["  ", "\tLine1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should highlight an indented code block that immediately follows header', async () => {
		const editor = await openMarkdownDocument(["# Header", "\tLine1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should highlight an indented code block that immediately follows a code fence', async () => {
		const editor = await openMarkdownDocument(["```", "fenced code", "```", "\tLine1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(3);
	});

	it('should not highlight an indented code block that immediately follows list', async () => {
		const editor = await openMarkdownDocument(["- List Item", "    Line1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight multiple indented lines that follow text', async () => {
		const editor = await openMarkdownDocument(["Line of text", 
		                                           "    Indented line (not code)", 
												   "    Indented line (not code)", 
												   ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight indented lines following blank', async () => {
		const editor = await openMarkdownDocument(["Line of text", 
		                                           "    Indented line (not code)", 
		                                           "    Indented line (not code)", 
		                                           "",
		                                           "    Indented line (code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(4);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(4);
	});

	it('should not highlight multiple indented lines immediately follow list', async () => {
		const editor = await openMarkdownDocument(["- List item", 
		                                           "    Indented line (not code)", 
		                                           "    Indented line (not code)", 
		                                           ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line 4th level list item', async () => {
		const editor = await openMarkdownDocument(["- List level 1", 
		                                           "  - List level 2",
		                                           "    - List level 3",
		                                           "      - List level 4", 
		                                           "    Indented line (not code)",
		                                           ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line 4th level list item where list item has 2 leading spaces', async () => {
		const editor = await openMarkdownDocument(["  - List level 2", 
		                                           "  - List level 2",
		                                           "    - List level 3",
		                                           "      - List level 4", 
		                                           "    Indented line (not code)",
		                                           ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight indented line that starts with bullet', async () => {
		const editor = await openMarkdownDocument(["", "    - Code"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should not highlight an indented code block that immediately follows ordered list', async () => {
		const editor = await openMarkdownDocument(["  12. List Item", "    Indented line (not code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight an indented code block that immediately follows list using asterisk bullet point', async () => {
		const editor = await openMarkdownDocument(["  * List Item", "    Indented line (not code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight an indented code block that immediately follows list using plus bullet point', async () => {
		const editor = await openMarkdownDocument(["  + List Item", "    Indented line (not code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight an indented code block that immediately follows fenced code block', async () => {
		const editor = await openMarkdownDocument(["```","fenced code block", "```", "    Indented line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(3);
	});

	it('should highlight an indented code block that immediately follows fenced code block with leading spaces and more chars', async () => {
		const editor = await openMarkdownDocument(["```````","fenced code block", "   ``````` \t ", "    Indented line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(3);
	});

	it('should not highlight whitespace lines that follow indented code block', async () => {
		const editor = await openMarkdownDocument(["","    Indented line (code)", "  ", "Non-Indented line", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
	});

	it('should highlight an indented code block when starts with 3 backticks', async () => {
		const editor = await openMarkdownDocument(["","    ```", "    Code Line", "Non Code Line", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight an indented code block when starts with 3 squigglies', async () => {
		const editor = await openMarkdownDocument(["","    ~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(1);
		expect(actual?.fencedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight an indented code block that immediately follows a block quote', async () => {
		const editor = await openMarkdownDocument([" > Blockquote", "    Line1", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight an indented code block that immediately follows horizontal rule using asterisks', async () => {
		const editor = await openMarkdownDocument(["", "***", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows horizontal rule using hyphens', async () => {
		const editor = await openMarkdownDocument(["", "---", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows horizontal rule using underscores', async () => {
		const editor = await openMarkdownDocument(["", "___", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows horizontal rule using more than 3 asterisks ', async () => {
		const editor = await openMarkdownDocument(["", "*****", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows horizontal rule with trailing whitespace', async () => {
		const editor = await openMarkdownDocument(["", "*****  \t  ", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows horizontal rule with up to 3 leading spaces', async () => {
		const editor = await openMarkdownDocument(["", "  ***", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows header using level 1 alternate syntax', async () => {
		const editor = await openMarkdownDocument(["Header", "===", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block that immediately follows header using level 2 alternate syntax', async () => {
		const editor = await openMarkdownDocument(["Header", "---", "    Indented Line (code)", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight an indented code block using tab when starts with 3 backticks', async () => {
		const editor = await openMarkdownDocument(["","\t```", "\tCode Line", "Non Code Line", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.indentedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.indentedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight list items 3 levels deep', async () => {
		const editor = await openMarkdownDocument(["- List item", 
		                                           "  - List item", 
		                                           "    - List Item (Not Code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight multiple indented lines intermixed with whitespace immediately following list', async () => {
		const editor = await openMarkdownDocument(["- List item", 
		                                           "    Indented line (not code)", 
		                                           "    Indented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight multiple indented lines intermixed with whitespace immediately following lists using asterisk', async () => {
		const editor = await openMarkdownDocument(["* List item", 
		                                           "    Indented line (not code)", 
		                                           "    Indented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight multiple indented lines intermixed with whitespace immediately following lists using plus', async () => {
		const editor = await openMarkdownDocument(["+ List item", 
		                                           "    Indented line (not code)", 
		                                           "    Indented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight multiple indented lines intermixed with whitespace immediately following ordered list', async () => {
		const editor = await openMarkdownDocument(["12. List item", 
		                                           "    Indented line (not code)", 
		                                           "    Indented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line follows list / indented line (4 spaces) / blank / indented line (2 spaces)', async () => {
		const editor = await openMarkdownDocument(["- List item", 
		                                           "    Indented line (not code)", 
		                                           "", 
		                                           "  Indented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line follows list / indented line (4 spaces) / blank / indented line (tab)', async () => {
		const editor = await openMarkdownDocument(["- List item", 
		                                           "    Indented line (not code)", 
		                                           "", 
		                                           "\tIndented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line follows list / indented line (4 spaces) / blank / indented line (space+tab)', async () => {
		const editor = await openMarkdownDocument(["- List item", 
		                                           "    Indented line (not code)", 
		                                           "", 
		                                           " \tIndented line (not code)", 
		                                           "",
		                                           "    Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line follows list with 1 leading space / indented line (4 spaces) / blank / indented line (space+tab)', async () => {
		const editor = await openMarkdownDocument([" - List item with one leading space",
		                                           "",
		                                           "     Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not highlight indented line follows list with 2 leading space / indented line (4 spaces) / blank / indented line (space+tab)', async () => {
		const editor = await openMarkdownDocument(["  - List item with one leading space",
		                                           "",
		                                           "     Indented line (not code)"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.indentedCodeBlocks).to.be.lengthOf(0);
	});

});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
