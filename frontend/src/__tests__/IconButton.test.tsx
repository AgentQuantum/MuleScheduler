/**
 * Tests for IconButton component.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from '../components/IconButton';

describe('IconButton', () => {
  it('renders with chevronLeft icon', () => {
    render(<IconButton icon="chevronLeft" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with chevronRight icon', () => {
    render(<IconButton icon="chevronRight" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with calendar icon', () => {
    render(<IconButton icon="calendar" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with refresh icon', () => {
    render(<IconButton icon="refresh" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with plus icon', () => {
    render(<IconButton icon="plus" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with minus icon', () => {
    render(<IconButton icon="minus" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with check icon', () => {
    render(<IconButton icon="check" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with x icon', () => {
    render(<IconButton icon="x" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with menu icon', () => {
    render(<IconButton icon="menu" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<IconButton icon="plus" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<IconButton icon="plus" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with sm size', () => {
    const { container } = render(<IconButton icon="plus" size="sm" />);
    expect(container.firstChild).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('renders with md size (default)', () => {
    const { container } = render(<IconButton icon="plus" size="md" />);
    expect(container.firstChild).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('renders with lg size', () => {
    const { container } = render(<IconButton icon="plus" size="lg" />);
    expect(container.firstChild).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('applies primary variant style', () => {
    const { container } = render(<IconButton icon="plus" variant="primary" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies danger variant style', () => {
    const { container } = render(<IconButton icon="plus" variant="danger" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows title as tooltip', () => {
    render(<IconButton icon="plus" title="Add item" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Add item');
  });

  it('applies custom className', () => {
    const { container } = render(<IconButton icon="plus" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
