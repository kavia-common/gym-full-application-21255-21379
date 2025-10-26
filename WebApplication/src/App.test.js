import { render, screen } from '@testing-library/react';
import App from './App';

test('renders GymPro home title', () => {
  render(<App />);
  // Verify the public home renders
  const title = screen.getByText(/Welcome to GymPro/i);
  expect(title).toBeInTheDocument();
});
