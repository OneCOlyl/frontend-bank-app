import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header.component';
import { FooterComponent } from './layout/footer.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main class="page">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-block-size: 100dvh;
      }
      .page {
        flex: 1;
        inline-size: 100%;
        max-inline-size: 1160px;
        margin-inline: auto;
        padding: 1.5rem 1rem;
      }
    `,
  ],
})
export class App {}
