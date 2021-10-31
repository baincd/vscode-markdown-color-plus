import {expect} from 'chai'

import * as vscode from 'vscode';

import * as ClassUnderTest from '../../Decorator';
import * as ConfigurationHandler from '../../ConfigurationHandler'

describe('Fenced code block decorating', () => {
	vscode.window.showInformationMessage('Running Fenced Code Block tests');

	beforeEach('Enable all features', async () => {
		ConfigurationHandler.config.fencedCodeBlock.enabled = true;
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

	it('should highlight a fenced code block with starting and ending code fences as 3 backticks', async () => {
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should not highlight a fenced code block when feature is disabled', async () => {
		ConfigurationHandler.config.fencedCodeBlock.enabled = false;
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight a fenced code block with beginning code fence preceded by 1 space', async () => {
		const editor = await openMarkdownDocument(["", " ```", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight a fenced code block with beginning code fence preceded by 1 space', async () => {
		const editor = await openMarkdownDocument(["", " ```", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight a fenced code block with beginning code fence preceded by 2 space', async () => {
		const editor = await openMarkdownDocument(["", "  ```", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight a fenced code block with beginning code fence preceded by 3 space', async () => {
		const editor = await openMarkdownDocument(["", "   ```", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight a fenced code block with the starting and ending code fences using the same chars', async () => {
		const editor = await openMarkdownDocument(["", "   ```", "CodeLine", "~~~", "This should still be in the code block", "```", "Outside fenced code block"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(4);
	});

	it('should highlight a fenced code block with starting and ending code fences as 3 squigglies', async () => {
		const editor = await openMarkdownDocument(["", "preceeding line", "~~~", "CodeLine", "~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(3);
	});

	it('should highlight multiple fenced code blocks', async () => {
		const editor = await openMarkdownDocument(["", "", "~~~", "CodeLine", "~~~", "", "```", "Code Line", "Code line", "```"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(3);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(7);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(8);
	});

	it('should highlight back to back fenced code blocks', async () => {
		const editor = await openMarkdownDocument(["", "", "~~~", "CodeLine", "~~~", "```", "Code Line", "Code line", "```"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(3);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(7);
	});

	it('should not consider 3 backticks with 4 preceding spaces as ending code fence', async () => {
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "    ```", "Still in code block", "```"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(4);
	});

	it('should not consider 3 backticks with preceding tab as starting code fence', async () => {
		const editor = await openMarkdownDocument(["", "\t```", "Not CodeLine", ])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(0);
	});

	it('should not consider 3 backticks with preceding tab as ending code fence', async () => {
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "\t```", "Still in code block", "```"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(4);
	});

	it('should consider 3 backticks with trailing spaces as ending fence', async () => {
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "```      ", "Not in code block", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should consider 3 backticks with language identifier as as with trailing spaces as ending code fence', async () => {
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "```      ", "Not in code block", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should highlight a fenced code block with starting code fence that has a language identifier', async () => {
		const editor = await openMarkdownDocument(["", "```java", "CodeLine", "```", "", "~~~javascript", "CodeLine", "~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(6);
	});

	it('should highlight a fenced code block with starting code fence that has language identifier and trailing spaces', async () => {
		const editor = await openMarkdownDocument(["", "```java     ", "CodeLine", "```", "", "~~~javascript     ", "CodeLine", "~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(6);
	});

	it('should highlight a fenced code block with starting code fence that has trailing spaces and less than 4 leading spaces', async () => {
		const editor = await openMarkdownDocument(["", "   ```     ", "CodeLine", "```", "", "   ~~~     ", "CodeLine", "~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(6);
	});

	it('should highlight a fenced code block with starting code fence that has trailing tabs and spaces', async () => {
		const editor = await openMarkdownDocument(["", "``` \t", "CodeLine", "```", "", "~~~ \t", "CodeLine", "~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(6);
	});

	it('should highlight a fenced code block with no ending code fence to end of document', async () => {
		const editor = await openMarkdownDocument(["", "```", "CodeLine", "CodeLine2",""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(4);
	});

	it('should highlight a fenced code block that starts on first line', async () => {
		const editor = await openMarkdownDocument(["```", "CodeLine", "CodeLine2","```"])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(1);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
	});

	it('should not highlight a fenced code block when there is no lined between starting and ending code fences', async () => {
		const editor = await openMarkdownDocument(["", "```", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(0);
	});

	it('should highlight a fenced code block with starting and ending code code fences having more than 3 chars', async () => {
		const editor = await openMarkdownDocument(["", "`````", "CodeLine", "`````", "", "~~~~~", "CodeLine", "~~~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(6);
	});

	it('should not consider fewer chars than starting code fence as ending code fence', async () => {
		const editor = await openMarkdownDocument(["", "`````java", "CodeLine", "````", "Still in code block", "`````", 
		                                           "", "~~~~~javascript", "CodeLine", "~~~~", "Still in code block", "~~~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(4);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(8);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(10);
	});

	it('should consider more chars than starting code fence as ending code fence', async () => {
		const editor = await openMarkdownDocument(["", "`````java", "CodeLine", "```````", 
		                                           "", "~~~~~javascript", "CodeLine", "~~~~~~~", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(2);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[1].range.start.line).to.be.eq(6);
		expect(actual?.fencedCodeBlocks[1].range.end.line).to.be.eq(6);
	});

	it('should not consider a line with trailing chars as ending code fence', async () => {
		const editor = await openMarkdownDocument(["", "```java", "CodeLine", "```java", "Still in code block", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(2);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(4);
	});

	it('should decorate a fenced code block that immediately follows a blockquote', async () => {
		const editor = await openMarkdownDocument(["", "> BQ", "```java", "CodeLine", "```", ""])

		let actual = ClassUnderTest.updateDecorations(editor);

		expect(actual?.fencedCodeBlocks).to.be.lengthOf(1);
		expect(actual?.fencedCodeBlocks[0].range.start.line).to.be.eq(3);
		expect(actual?.fencedCodeBlocks[0].range.end.line).to.be.eq(3);
	});


});

async function openMarkdownDocument(lines: string[]) {
	let document = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: lines.join("\n")
	});

	return await vscode.window.showTextDocument(document);
}
