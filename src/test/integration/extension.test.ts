import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Tests', () => {
  const EXTENSION_ID = 'ryu1kn.partial-diff';

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, 'Extension not found');
  });

  test('Extension should activate without errors', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, 'Extension not found');

    await extension.activate();
    assert.strictEqual(extension.isActive, true, 'Extension failed to activate');
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = [
      'extension.partialDiff.markSection1',
      'extension.partialDiff.markSection2AndTakeDiff',
      'extension.partialDiff.diffSelectionWithClipboard',
      'extension.partialDiff.diffVisibleEditors',
      'extension.partialDiff.togglePreComparisonTextNormalizationRules',
    ];

    for (const cmd of expectedCommands) {
      assert.ok(
        commands.includes(cmd),
        `Command ${cmd} not registered`
      );
    }
  });

  test('diffVisibleEditors should show message when fewer than 2 editors', async () => {
    // Close all editors first
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    // This should show "Please first open 2 documents to compare" message
    // but not throw an error
    await vscode.commands.executeCommand('extension.partialDiff.diffVisibleEditors');

    // If we get here without throwing, the command executed successfully
    assert.ok(true);
  });
});
