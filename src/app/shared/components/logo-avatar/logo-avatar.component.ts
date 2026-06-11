import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-logo-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background-color]="logoUrl() ? 'transparent' : (color() || '#E8372C')"
      [attr.aria-label]="ariaLabel()"
    >
      @if (logoUrl()) {
        <img
          [src]="logoUrl()"
          [alt]="ariaLabel()"
          class="w-full h-full object-cover"
        />
      } @else {
        <span
          class="font-bold text-white leading-none select-none"
          [style.font-size.px]="fontSize()"
        >
          {{ inicial() }}
        </span>
      }
    </div>
  `,
})
export class LogoAvatarComponent {
  logoUrl = input<string | null | undefined>(null);
  marca   = input.required<string>();
  color   = input<string | null | undefined>(null);
  size    = input<number>(48);

  inicial  = computed(() => this.marca().charAt(0).toUpperCase());
  fontSize = computed(() => Math.round(this.size() * 0.4));
  ariaLabel = computed(() => `Logo de ${this.marca()}`);
}
