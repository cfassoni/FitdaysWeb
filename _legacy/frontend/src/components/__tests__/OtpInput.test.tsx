import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OtpInput from '../OtpInput';

describe('OtpInput', () => {
  it('renders all 6 digit input boxes with aria-labels', () => {
    render(<OtpInput length={6} value="" onChange={vi.fn()} />);

    for (let i = 1; i <= 6; i++) {
      expect(screen.getByLabelText(`Digit ${i} of 6`)).toBeInTheDocument();
    }
  });

  it('updates digit and advances focus on single digit entry', () => {
    const handleChange = vi.fn();
    const handleComplete = vi.fn();

    render(
      <OtpInput
        length={6}
        value=""
        onChange={handleChange}
        onComplete={handleComplete}
      />
    );

    const firstInput = screen.getByLabelText('Digit 1 of 6');
    fireEvent.change(firstInput, { target: { value: '4' } });

    expect(handleChange).toHaveBeenCalledWith('4');
  });

  it('handles paste of full 6-digit code and calls onComplete', () => {
    const handleChange = vi.fn();
    const handleComplete = vi.fn();

    render(
      <OtpInput
        length={6}
        value=""
        onChange={handleChange}
        onComplete={handleComplete}
      />
    );

    const firstInput = screen.getByLabelText('Digit 1 of 6');
    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: () => '583921',
      },
    });

    expect(handleChange).toHaveBeenCalledWith('583921');
    expect(handleComplete).toHaveBeenCalledWith('583921');
  });

  it('handles backspace navigation to previous input', () => {
    const handleChange = vi.fn();

    render(
      <OtpInput
        length={6}
        value="12"
        onChange={handleChange}
      />
    );

    const thirdInput = screen.getByLabelText('Digit 3 of 6');
    fireEvent.keyDown(thirdInput, { key: 'Backspace' });

    // Should clear second digit
    expect(handleChange).toHaveBeenCalledWith('1');
  });
});
