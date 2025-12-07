/**
 * Tests for Toast component.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/Toast';

// Test component to trigger toasts
function TestToastTrigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('success', 'Success message')}>Show Success</button>
      <button onClick={() => showToast('danger', 'Error message')}>Show Error</button>
      <button onClick={() => showToast('warning', 'Warning message')}>Show Warning</button>
      <button onClick={() => showToast('info', 'Info message')}>Show Info</button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders children', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows success toast', () => {
    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    // Advance timers slightly to trigger visibility
    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('shows error toast', () => {
    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows warning toast', () => {
    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Warning'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('shows info toast', () => {
    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('auto-dismisses toast after duration', () => {
    render(
      <ToastProvider duration={1000}>
        <TestToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Advance past duration + animation
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('closes toast when close button clicked', () => {
    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    // Advance past animation time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });
});

describe('useToast', () => {
  it('throws error when used outside ToastProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestToastTrigger />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });
});
