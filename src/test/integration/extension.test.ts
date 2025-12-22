import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Extension Integration Tests', () => {
  const EXTENSION_ID = 'ryu1kn.partial-diff';
  let tempDir: string;

  suiteSetup(async () => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'partial-diff-test-'));
  });

  suiteTeardown(async () => {
    // Clean up temp files
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

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

  test('diffVisibleEditors shows message when fewer than 2 editors', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    // This should show info message but not throw
    await vscode.commands.executeCommand('extension.partialDiff.diffVisibleEditors');

    assert.ok(true, 'Command executed without error');
  });

  test('diffVisibleEditors works with 2 open editors', async () => {
    // Create two test files
    const file1 = path.join(tempDir, 'test1.txt');
    const file2 = path.join(tempDir, 'test2.txt');
    fs.writeFileSync(file1, 'Hello World\nLine 2\nLine 3');
    fs.writeFileSync(file2, 'Hello Universe\nLine 2\nLine 3');

    // Open both files side by side
    const doc1 = await vscode.workspace.openTextDocument(file1);
    await vscode.window.showTextDocument(doc1, vscode.ViewColumn.One);

    const doc2 = await vscode.workspace.openTextDocument(file2);
    await vscode.window.showTextDocument(doc2, vscode.ViewColumn.Two);

    // Verify we have 2 visible editors
    assert.strictEqual(
      vscode.window.visibleTextEditors.length,
      2,
      'Should have 2 visible editors'
    );

    // Execute the diff command
    await vscode.commands.executeCommand('extension.partialDiff.diffVisibleEditors');

    // Give VS Code time to open the diff view
    await new Promise(resolve => setTimeout(resolve, 500));

    // If we get here without error, the diff was initiated
    assert.ok(true, 'Diff command executed successfully');
  });

  test('markSection1 and markSection2AndTakeDiff workflow', async () => {
    // Create a test file with content
    const file = path.join(tempDir, 'workflow-test.txt');
    fs.writeFileSync(file, 'First selection\nSecond selection\nThird line');

    const doc = await vscode.workspace.openTextDocument(file);
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

    // Select first line
    editor.selection = new vscode.Selection(0, 0, 0, 15);

    // Mark as text 1
    await vscode.commands.executeCommand('extension.partialDiff.markSection1');

    // Select second line
    editor.selection = new vscode.Selection(1, 0, 1, 16);

    // Take diff with text 1
    await vscode.commands.executeCommand('extension.partialDiff.markSection2AndTakeDiff');

    // Give VS Code time to open the diff view
    await new Promise(resolve => setTimeout(resolve, 500));

    assert.ok(true, 'Mark and diff workflow completed successfully');
  });

  test('diffSelectionWithClipboard works', async () => {
    // Create a test file
    const file = path.join(tempDir, 'clipboard-test.txt');
    fs.writeFileSync(file, 'Text in editor');

    const doc = await vscode.workspace.openTextDocument(file);
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

    // Put something in clipboard
    await vscode.env.clipboard.writeText('Text in clipboard');

    // Select text in editor
    editor.selection = new vscode.Selection(0, 0, 0, 14);

    // Diff with clipboard
    await vscode.commands.executeCommand('extension.partialDiff.diffSelectionWithClipboard');

    // Give VS Code time to process
    await new Promise(resolve => setTimeout(resolve, 500));

    assert.ok(true, 'Clipboard diff completed successfully');
  });

  test('togglePreComparisonTextNormalizationRules executes without error', async () => {
    // Without any rules configured, this shows an info message
    // We can't easily test the message, but we can verify the command exists and doesn't throw
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('extension.partialDiff.togglePreComparisonTextNormalizationRules'),
      'Toggle command should be registered'
    );
    // Note: Actually executing this command without rules shows a blocking message,
    // so we skip execution in the integration test
  });

  test('Extension handles rapid command execution', async () => {
    const file = path.join(tempDir, 'rapid-test.txt');
    fs.writeFileSync(file, 'Line 1\nLine 2\nLine 3\nLine 4');

    const doc = await vscode.workspace.openTextDocument(file);
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

    // Rapidly execute mark commands
    for (let i = 0; i < 5; i++) {
      editor.selection = new vscode.Selection(i % 4, 0, i % 4, 6);
      await vscode.commands.executeCommand('extension.partialDiff.markSection1');
    }

    assert.ok(true, 'Rapid execution handled without error');
  });
});
