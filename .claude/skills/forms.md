# Angular Forms — Formularios Reactivos con PrimeNG

Patrones para formularios reactivos en Angular 21 con PrimeNG.

---

## Estructura base — Reactive Forms

```typescript
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-feature-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, /* PrimeNG components */],
  templateUrl: './feature-form.component.html',
})
export class FeatureFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      age: [null, [Validators.min(0), Validators.max(120)]],
      description: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    // procesar this.form.value
  }
}
```

---

## Template con PrimeNG

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">

  <!-- Input de texto -->
  <div class="flex flex-col gap-1">
    <label for="name">Nombre *</label>
    <input
      pInputText
      id="name"
      formControlName="name"
      [class.ng-invalid]="form.get('name')?.invalid && form.get('name')?.touched"
      aria-describedby="name-error"
    />
    @if (form.get('name')?.invalid && form.get('name')?.touched) {
      <small id="name-error" class="text-red-500">El nombre es requerido</small>
    }
  </div>

  <!-- Dropdown -->
  <div class="flex flex-col gap-1">
    <label for="status">Estado *</label>
    <p-select
      inputId="status"
      formControlName="status"
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Seleccionar..."
    />
  </div>

  <!-- Botones -->
  <div class="flex gap-2 justify-end mt-4">
    <p-button label="Cancelar" severity="secondary" (onClick)="cancel()" />
    <p-button label="Guardar" type="submit" [disabled]="form.invalid" />
  </div>

</form>
```

---

## Signal Forms (experimental Angular 21)

Para formularios nuevos, alternativa signal-based:

```typescript
import { form, field } from '@angular/forms/experimental'; // cuando esté estable

// Modelo como signal
data = signal<FeatureDto>({ name: '', email: '' });

// Formulario signal-based
featureForm = form(this.data, {
  name: field({ required: true, maxLength: 100 }),
  email: field({ required: true, email: true }),
});

// Estado reactivo
featureForm.valid()    // boolean
featureForm.dirty()    // boolean
featureForm.touched()  // boolean
```

> Usar Reactive Forms para producción. Signal Forms son experimentales en v21.

---

## Validadores comunes

```typescript
this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  email: ['', [Validators.required, Validators.email]],
  phone: ['', [Validators.pattern(/^\d{10}$/)]],
  price: [null, [Validators.required, Validators.min(0)]],
});
```

### Validador personalizado

```typescript
function noSpaces(control: AbstractControl): ValidationErrors | null {
  return control.value?.includes(' ')
    ? { noSpaces: true }
    : null;
}
```

### Validación cross-field

```typescript
function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

this.fb.group({ password: [''], confirmPassword: [''] }, { validators: passwordMatch });
```

---

## Patch de valores (modo edición)

```typescript
ngOnInit(): void {
  this.form = this.buildForm();

  if (this.editData()) {
    this.form.patchValue(this.editData()!);
  }
}
```

---

## Helper para errores en template

```typescript
hasError(field: string, error: string): boolean {
  const control = this.form.get(field);
  return !!(control?.hasError(error) && control.touched);
}
```

```html
@if (hasError('email', 'required')) {
  <small class="text-red-500">El email es requerido</small>
}
@if (hasError('email', 'email')) {
  <small class="text-red-500">El email no es válido</small>
}
```

---

## Accesibilidad en formularios (obligatorio)

- Cada input con `id` único y `<label for="id">` asociado
- Mensajes de error con `aria-describedby` apuntando al id del mensaje
- Campos requeridos con indicador visual y `aria-required="true"`
- Formulario con `role="form"` o `<form>` nativo
