import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type LogoVariant = 'light' | 'dark';
type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="dims().width"
      [attr.height]="dims().height"
      [attr.viewBox]="'0 0 ' + dims().width + ' ' + dims().height"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      [attr.aria-label]="'Buen Plan'"
      role="img"
    >
      <!-- Pin icon -->
      <g [attr.transform]="'translate(' + dims().pinX + ', ' + dims().pinY + ') scale(' + dims().scale + ')'">
        <path
          d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
          fill="#E8372C"
        />
        <circle cx="14" cy="14" r="5.5" [attr.fill]="pinInnerColor()" />
        <circle cx="14" cy="14" r="2.5" fill="#E8372C" />
      </g>
      <!-- Wordmark -->
      <text
        [attr.x]="dims().textX"
        [attr.y]="dims().textY"
        font-family="'Bricolage Grotesque', 'Inter', system-ui, sans-serif"
        [attr.font-size]="dims().fontSize"
        font-weight="800"
        letter-spacing="-0.5"
        [attr.fill]="wordmarkColor()"
      >Un Buen <tspan fill="#E8372C">Plan</tspan></text>
    </svg>
  `,
})
export class LogoComponent {
  variant = input<LogoVariant>('dark');
  size    = input<LogoSize>('md');

  wordmarkColor = computed(() => this.variant() === 'dark' ? '#111827' : '#ffffff');
  pinInnerColor = computed(() => this.variant() === 'dark' ? '#ffffff' : '#1a0000');

  dims = computed(() => {
    const sizes: Record<LogoSize, {
      scale: number; width: number; height: number;
      pinX: number; pinY: number;
      textX: number; textY: number; fontSize: number;
    }> = {
      sm: { scale: 0.72, width: 152, height: 32, pinX: 1, pinY: 1,  textX: 28, textY: 23, fontSize: 15 },
      md: { scale: 1.0,  width: 205, height: 44, pinX: 1, pinY: 4,  textX: 38, textY: 31, fontSize: 21 },
      lg: { scale: 1.35, width: 265, height: 58, pinX: 1, pinY: 4,  textX: 50, textY: 41, fontSize: 28 },
    };
    return sizes[this.size()];
  });
}
