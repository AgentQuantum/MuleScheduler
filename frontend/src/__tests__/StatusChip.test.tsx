/**
 * Tests for StatusChip component.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import StatusChip from '../components/StatusChip';

describe('StatusChip', () => {
  it('renders label text', () => {
    render(<StatusChip label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with assigned variant', () => {
    const { container } = render(<StatusChip variant="assigned" label="Assigned" />);
    expect(container.firstChild).toHaveClass('ms-chip-assigned');
  });

  it('renders with unassigned variant', () => {
    const { container } = render(<StatusChip variant="unassigned" label="Unassigned" />);
    expect(container.firstChild).toHaveClass('ms-chip-unassigned');
  });

  it('renders with conflict variant', () => {
    const { container } = render(<StatusChip variant="conflict" label="Conflict" />);
    expect(container.firstChild).toHaveClass('ms-chip-conflict');
  });

  it('renders with open variant', () => {
    const { container } = render(<StatusChip variant="open" label="Open" />);
    expect(container.firstChild).toHaveClass('ms-chip-open');
  });

  it('renders with preferred variant', () => {
    const { container } = render(<StatusChip variant="preferred" label="Preferred" />);
    expect(container.firstChild).toHaveClass('ms-chip-preferred');
  });

  it('renders with upcoming variant', () => {
    const { container } = render(<StatusChip variant="upcoming" label="Upcoming" />);
    expect(container.firstChild).toHaveClass('ms-chip-upcoming');
  });

  it('renders with completed variant', () => {
    const { container } = render(<StatusChip variant="completed" label="Completed" />);
    expect(container.firstChild).toHaveClass('ms-chip-completed');
  });

  it('renders with today variant', () => {
    const { container } = render(<StatusChip variant="today" label="Today" />);
    expect(container.firstChild).toHaveClass('ms-chip-today');
  });

  it('renders with available variant', () => {
    const { container } = render(<StatusChip variant="available" label="Available" />);
    expect(container.firstChild).toHaveClass('ms-chip-available');
  });

  it('renders with unavailable variant', () => {
    const { container } = render(<StatusChip variant="unavailable" label="Unavailable" />);
    expect(container.firstChild).toHaveClass('ms-chip-unavailable');
  });

  it('renders with default variant', () => {
    const { container } = render(<StatusChip variant="default" label="Default" />);
    expect(container.firstChild).toHaveClass('ms-chip-default');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<StatusChip label="Clickable" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('has button role when onClick is provided', () => {
    render(<StatusChip label="Button" onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles keyboard Enter press', () => {
    const handleClick = jest.fn();
    render(<StatusChip label="Keyboard" onClick={handleClick} />);
    fireEvent.keyDown(screen.getByText('Keyboard'), { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });

  it('handles keyboard Space press', () => {
    const handleClick = jest.fn();
    render(<StatusChip label="Keyboard" onClick={handleClick} />);
    fireEvent.keyDown(screen.getByText('Keyboard'), { key: ' ' });
    expect(handleClick).toHaveBeenCalled();
  });

  it('applies filter class when isFilter is true', () => {
    const { container } = render(<StatusChip label="Filter" isFilter />);
    expect(container.firstChild).toHaveClass('ms-chip-filter');
  });

  it('applies active class when active is true', () => {
    const { container } = render(<StatusChip label="Active" active />);
    expect(container.firstChild).toHaveClass('active');
  });

  it('renders with sm size', () => {
    const { container } = render(<StatusChip label="Small" size="sm" />);
    expect(container.firstChild).toHaveStyle({ fontSize: '0.7rem' });
  });

  it('renders with md size (default)', () => {
    const { container } = render(<StatusChip label="Medium" size="md" />);
    expect(container.firstChild).toHaveStyle({ fontSize: '0.8rem' });
  });

  it('renders with lg size', () => {
    const { container } = render(<StatusChip label="Large" size="lg" />);
    expect(container.firstChild).toHaveStyle({ fontSize: '0.9rem' });
  });

  it('applies custom className', () => {
    const { container } = render(<StatusChip label="Custom" className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('renders custom icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(<StatusChip label="Custom Icon" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
