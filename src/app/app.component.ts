import { AfterViewInit, Component, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { TranslateService } from '@ngx-translate/core';

import { AppService } from './app.service';

import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('main')
  mainElement;

  public busy = false;

  constructor(
    private translate: TranslateService,
    private appService: AppService,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone) {
    this.translate.setDefaultLang('en');

    this.appService.messageFromExtension.subscribe((message: any) => {
      this.ngZone.run(() => {
        switch (message.command) {
          case 'colorTheme':
            this.adjustTheme();
            break;
          case 'refreshView':
            break;
        }
      });
    });
  }

  ngOnInit(): void {
    // this.rt();
  }

  ngAfterViewInit(): void {
    this.adjustTheme();
  }

  adjustTheme() {
    let theme = 'light-theme';
    if (document.body.classList.contains('vscode-light')) {
      theme = 'light-theme';
    } else if (document.body.classList.contains('vscode-dark')) {
      theme = 'dark-theme';
    }
    const themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
    if (themeLink) {
        themeLink.href = theme + '.css';
    }
  }

  greet() {
    this.appService.showMessage('Hello from Webview in Editor');
  }

  close() {
    this.appService.close();
  }
}
