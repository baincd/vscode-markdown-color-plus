import {expect} from 'chai'

import * as vscode from 'vscode';

import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension Loaded', () => {
		const started = vscode.extensions.getExtension(
			"baincd.markdown-color-plus",
		)?.isActive;

		expect(started).to.not.be.undefined;
	});

});
