import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

/**
 * Manages webview panels
 */
class WebviewInEditor {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: WebviewInEditor | undefined;

  private static readonly viewType = 'WebviewInEditor';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionPath: string;
  private readonly builtAppFolder: string;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionPath: string): WebviewInEditor {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // If we already have a panel, show it.
    // Otherwise, create Webview in editor panel.
    if (WebviewInEditor.currentPanel) {
      WebviewInEditor.currentPanel.panel.reveal(column);
    } else {
      WebviewInEditor.currentPanel = new WebviewInEditor(extensionPath, column || vscode.ViewColumn.One);
    }
    return WebviewInEditor.currentPanel;
  }

  // private uri: vscode.Uri | undefined = undefined;

  private constructor(extensionPath: string, column: vscode.ViewColumn) {
    this.extensionPath = extensionPath;
    this.builtAppFolder = 'dist';

    // Create and show a new webview panel
    this.panel = vscode.window.createWebviewPanel(WebviewInEditor.viewType, 'Webview in editor', column, {
      // Enable javascript in the webview
      enableScripts: true,

      retainContextWhenHidden: true,

      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [vscode.Uri.file(path.join(this.extensionPath, this.builtAppFolder))]
    });

    // Set the webview's initial html content
    this.panel.webview.html = this._getHtmlForWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage((data: any) => {
        switch (data.command) {
          case 'settings':
            this.settings();
            break;
          case 'showMessage':
            vscode.window.showInformationMessage(data.message);
            break;
          case 'showErrorMessage':
            vscode.window.showErrorMessage(data.message);
            break;
        }

      },
      null,
      this.disposables
    );

    vscode.window.onDidChangeActiveColorTheme((colorTheme: vscode.ColorTheme) => {
      this.setColorTheme(colorTheme);
    });
  }

  settings() {
    vscode.commands.executeCommand('workbench.action.openSettings', `@ext:sandipchitale.vscode-webview-in-editor`);
  }

  setColorTheme(colorTheme: vscode.ColorTheme) {
    this.panel.webview.postMessage({
      command: 'colorTheme',
      colorTheme
    });
  }

  refreshView() {
    this.panel.webview.postMessage({
      command: 'refreshView'
    });
  }

  public dispose() {
    WebviewInEditor.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  /**
   * Returns html of the start page (index.html)
   */
  private _getHtmlForWebview() {
    // path to dist folder
    const appDistPath = path.join(this.extensionPath, 'dist');
    const appDistPathUri = vscode.Uri.file(appDistPath);

    // path as uri
    const baseUri = this.panel.webview.asWebviewUri(appDistPathUri);

    // get path to index.html file from dist folder
    const indexPath = path.join(appDistPath, 'index.html');

    // read index file from file system
    let indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });

    // update the base URI tag
    indexHtml = indexHtml.replace('<base href="/">', `<base href="${String(baseUri)}/">`);

    return indexHtml;
  }
}

/**
 * Activates extension
 * @param context vscode extension context
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-webview-in-editor.show-webview', () => {
      WebviewInEditor.createOrShow(context.extensionPath);
    })
  );
}
