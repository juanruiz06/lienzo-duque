import { AppError, toError, toUserMessage } from '../errors';

describe('toUserMessage', () => {
  it('traduce errores conocidos de Supabase Auth', () => {
    expect(toUserMessage(new Error('Invalid login credentials'))).toBe(
      'Email o contraseña incorrectos.',
    );
    expect(toUserMessage({ message: 'Network request failed' })).toBe(
      'Sin conexión. Revisa tu internet.',
    );
  });

  it('usa el mensaje de un AppError tal cual', () => {
    expect(toUserMessage(new AppError('Mensaje propio'))).toBe('Mensaje propio');
  });

  it('nunca enseña el error técnico crudo', () => {
    expect(toUserMessage(new Error('duplicate key value violates unique constraint'))).toBe(
      'Algo ha fallado. Inténtalo de nuevo.',
    );
  });
});

describe('toError', () => {
  it('convierte cualquier cosa en Error', () => {
    expect(toError('texto')).toBeInstanceOf(Error);
    expect(toError({ message: 'x' }).message).toBe('x');
    expect(toError(42).message).toBe('Error desconocido');
  });
});
