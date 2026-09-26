import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

/** Test de componente: se renderiza "de mentira" y se pulsa como lo haría un usuario. */
describe('<Button />', () => {
  it('llama a onPress al pulsarlo', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no se puede pulsar mientras carga', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
