import { AppError } from '../errors';
import { noteSchema, parseOrThrow, signUpSchema, validateForm } from '../validation';

describe('validateForm', () => {
  it('devuelve los datos limpios si todo es válido', () => {
    const result = validateForm(noteSchema, { title: '  Compra  ', body: 'pan' });
    expect(result.errors).toBeNull();
    expect(result.data).toEqual({ title: 'Compra', body: 'pan' });
  });

  it('devuelve un error por campo', () => {
    const result = validateForm(signUpSchema, {
      displayName: '',
      email: 'no-es-email',
      password: '123',
    });
    expect(result.data).toBeNull();
    expect(result.errors).toEqual({
      displayName: 'Dinos cómo te llamas.',
      email: 'Escribe un email válido.',
      password: 'La contraseña necesita al menos 8 caracteres.',
    });
  });
});

describe('parseOrThrow', () => {
  it('lanza AppError con un mensaje para el usuario', () => {
    expect(() => parseOrThrow(noteSchema, { title: '', body: '' })).toThrow(AppError);
    expect(() => parseOrThrow(noteSchema, { title: '', body: '' })).toThrow(
      'La nota necesita un título.',
    );
  });

  it('respeta el límite de 120 caracteres del título (igual que la migración SQL)', () => {
    expect(() => parseOrThrow(noteSchema, { title: 'x'.repeat(121), body: '' })).toThrow(
      'Máximo 120 caracteres.',
    );
  });
});
