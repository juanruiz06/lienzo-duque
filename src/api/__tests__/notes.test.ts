import { createNote, listNotes } from '../notes';
import { supabase } from '../supabase';

/**
 * Test de la capa de datos SIN base de datos: sustituimos el cliente de Supabase por uno falso
 * ("mock") y comprobamos que llamamos a la tabla correcta y gestionamos los errores.
 * (Probar las reglas RLS de verdad es trabajo de la base local: ver skill /revisar-rls.)
 */
jest.mock('../supabase', () => ({ supabase: { from: jest.fn() } }));

const from = supabase.from as jest.Mock;

/** Imita la cadena `supabase.from(...).select(...).order(...)...` devolviendo `result`. */
function mockQuery(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']) {
    chain[method] = jest.fn(() => chain);
  }
  chain.single = jest.fn(async () => result);
  chain.maybeSingle = jest.fn(async () => result);
  // `await` sobre la cadena (sin .single()) también debe resolver con `result`.
  (chain as unknown as PromiseLike<unknown>).then = ((resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve)) as never;
  from.mockReturnValue(chain);
  return chain;
}

afterEach(() => jest.clearAllMocks());

describe('listNotes', () => {
  it('lee de la tabla notes, las más recientes primero', async () => {
    const chain = mockQuery({ data: [{ id: '1', title: 'Hola' }], error: null });
    await expect(listNotes()).resolves.toEqual([{ id: '1', title: 'Hola' }]);
    expect(from).toHaveBeenCalledWith('notes');
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('propaga el error de Supabase', async () => {
    mockQuery({ data: null, error: { message: 'boom' } });
    await expect(listNotes()).rejects.toEqual({ message: 'boom' });
  });
});

describe('createNote', () => {
  it('valida antes de llamar a Supabase', async () => {
    await expect(createNote({ title: '   ', body: '' })).rejects.toThrow(
      'La nota necesita un título.',
    );
    expect(from).not.toHaveBeenCalled();
  });

  it('no manda user_id (lo pone la base de datos)', async () => {
    const chain = mockQuery({ data: { id: '1', title: 'Hola', body: '' }, error: null });
    await createNote({ title: ' Hola ', body: '' });
    expect(chain.insert).toHaveBeenCalledWith({ title: 'Hola', body: '' });
  });
});
