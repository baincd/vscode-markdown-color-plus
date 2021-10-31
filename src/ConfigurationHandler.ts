import * as vscode from 'vscode';

// https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
// https://code.visualstudio.com/api/references/vscode-api#DecorationOptions

export interface ExtensionFeatureConfig {
	decorationType: vscode.TextEditorDecorationType;
	enabled: boolean;
};

export interface ExtensionConfiguration {
	activeEditorChangeUpdateDelay: number
	editTextChangeUpdateDelay: number;

	fencedCodeBlock: ExtensionFeatureConfig;
	indentedCodeBlock: ExtensionFeatureConfig;
	inlineCode: ExtensionFeatureConfig;
	blockquoteLine: ExtensionFeatureConfig;
	blockquoteText: ExtensionFeatureConfig;
	blockquoteSymbol: ExtensionFeatureConfig;
	horizontalRule: ExtensionFeatureConfig;
	strikeThrough: ExtensionFeatureConfig;
	invisibleLineBreak: ExtensionFeatureConfig;
	activeHeader: ExtensionFeatureConfig;
}

export function readConfig() {
	config = doReadConfig();
}

function doReadConfig(): ExtensionConfiguration {
	let colorizerConfig = vscode.workspace.getConfiguration("markdown-color-plus");

	return {

		activeEditorChangeUpdateDelay: colorizerConfig.get<number>("delays.activeEditorChanged",100),
		editTextChangeUpdateDelay: colorizerConfig.get<number>("delays.editTextChanged",100),


		fencedCodeBlock: {
			enabled: colorizerConfig.get<boolean>('fencedCodeBlock.background.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('fencedCodeBlock.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('fencedCodeBlock.background.darkThemeColor') },
				isWholeLine: true
			})
		},

		indentedCodeBlock: {
			enabled: colorizerConfig.get<boolean>('indentedCodeBlock.background.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('indentedCodeBlock.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('indentedCodeBlock.background.darkThemeColor') },
				isWholeLine: true
			})
		},

		inlineCode: {
			enabled: colorizerConfig.get<boolean>('inlineCode.background.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('inlineCode.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('inlineCode.background.darkThemeColor') },
			})
		},

		blockquoteLine: {
			enabled: colorizerConfig.get<boolean>('blockquote.style.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('blockquote.style.line.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('blockquote.style.line.background.darkThemeColor') },
				isWholeLine: true
			})
		},
		blockquoteText: {
			enabled: colorizerConfig.get<boolean>('blockquote.style.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				fontStyle: colorizerConfig.get<string>('blockquote.style.text.fontStyle'),
				opacity: colorizerConfig.get<string>('blockquote.style.text.opacity')
			})
		},
		blockquoteSymbol: {
			enabled: colorizerConfig.get<boolean>('blockquote.style.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('blockquote.style.symbol.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('blockquote.style.symbol.background.darkThemeColor') },
				opacity: colorizerConfig.get<string>('blockquote.style.symbol.opacity')
			})
		},

		horizontalRule: {
			enabled: colorizerConfig.get<boolean>('horizontalRule.style.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('horizontalRule.style.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('horizontalRule.style.background.darkThemeColor') },
				opacity: colorizerConfig.get<string>('horizontalRule.style.opacity'),
				isWholeLine: true
			})
		},

		strikeThrough: {
			enabled: colorizerConfig.get<boolean>('strikethrough.decoration.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				opacity: colorizerConfig.get<string>('strikethrough.decoration.opacity')
			})
		},

		invisibleLineBreak: {
			enabled: colorizerConfig.get<boolean>('invisibleLineBreak.background.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('invisibleLineBreak.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('invisibleLineBreak.background.darkThemeColor') },
			})
		},

		activeHeader: {
			enabled: colorizerConfig.get<boolean>('currentHeaders.background.enabled',false),
			decorationType: vscode.window.createTextEditorDecorationType({
				light: { backgroundColor: colorizerConfig.get<string>('currentHeaders.background.lightThemeColor') },
				dark:  { backgroundColor: colorizerConfig.get<string>('currentHeaders.background.darkThemeColor') }
			})
		}

	}
}

export function resetAllDecorations() {
	config.fencedCodeBlock.decorationType.dispose();
	config.indentedCodeBlock.decorationType.dispose();
	config.inlineCode.decorationType.dispose();
	config.invisibleLineBreak.decorationType.dispose();
	config.activeHeader.decorationType.dispose();
	
}

export let config = doReadConfig();
