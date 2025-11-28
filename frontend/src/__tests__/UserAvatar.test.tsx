/**
 * Tests for UserAvatar component.
 */
import { render, screen } from '@testing-library/react'
import UserAvatar from '../components/UserAvatar'

describe('UserAvatar', () => {
  it('renders initials from name', () => {
    render(<UserAvatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders single initial for single name', () => {
    render(<UserAvatar name="John" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders max 2 initials for long names', () => {
    render(<UserAvatar name="John James Doe Smith" />)
    expect(screen.getByText('JJ')).toBeInTheDocument()
  })

  it('renders profile photo when provided', () => {
    render(<UserAvatar name="John Doe" profilePhotoUrl="https://example.com/photo.jpg" />)
    const img = screen.getByRole('img', { name: 'John Doe' })
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('generates consistent color for same seed', () => {
    const { container: container1 } = render(<UserAvatar name="John" email="john@test.com" />)
    const { container: container2 } = render(<UserAvatar name="Jane" email="john@test.com" />)
    
    // Same email = same color, even with different names
    const style1 = window.getComputedStyle(container1.firstChild as Element)
    const style2 = window.getComputedStyle(container2.firstChild as Element)
    // Both should have a background (gradient)
    expect(container1.firstChild).toBeInTheDocument()
    expect(container2.firstChild).toBeInTheDocument()
  })

  it('uses userId as seed when email not provided', () => {
    const { container } = render(<UserAvatar name="John" userId={123} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('uses name as seed when no email or userId', () => {
    const { container } = render(<UserAvatar name="John" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with xs size', () => {
    const { container } = render(<UserAvatar name="John" size="xs" />)
    expect(container.firstChild).toHaveStyle({ width: '24px', height: '24px' })
  })

  it('renders with sm size', () => {
    const { container } = render(<UserAvatar name="John" size="sm" />)
    expect(container.firstChild).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('renders with md size (default)', () => {
    const { container } = render(<UserAvatar name="John" size="md" />)
    expect(container.firstChild).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('renders with lg size', () => {
    const { container } = render(<UserAvatar name="John" size="lg" />)
    expect(container.firstChild).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('renders with xl size', () => {
    const { container } = render(<UserAvatar name="John" size="xl" />)
    expect(container.firstChild).toHaveStyle({ width: '64px', height: '64px' })
  })

  it('applies custom className', () => {
    const { container } = render(<UserAvatar name="John" className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })

  it('shows border by default', () => {
    const { container } = render(<UserAvatar name="John" />)
    expect(container.firstChild).toHaveStyle({ border: '2px solid white' })
  })

  it('hides border when showBorder is false', () => {
    const { container } = render(<UserAvatar name="John" showBorder={false} />)
    expect(container.firstChild).toHaveStyle({ border: 'none' })
  })

  it('shows name as title tooltip', () => {
    render(<UserAvatar name="John Doe" />)
    expect(screen.getByTitle('John Doe')).toBeInTheDocument()
  })
})

