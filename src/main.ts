import * as vscode from 'vscode';

import * as CodeAndInvisibleLineBreakHighlighter from './CodeAndInvisibleLineBreakHighlighter'
import * as ActiveHeaderHighlighter from './ActiveHeaderHighlighter'

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
		// console.log('markdown-color-plus Activated');

		CodeAndInvisibleLineBreakHighlighter.activate(context);
		ActiveHeaderHighlighter.activate(context);
}
