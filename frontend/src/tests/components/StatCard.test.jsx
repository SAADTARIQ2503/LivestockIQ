/**
 * Component tests — StatCard.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';

describe('StatCard', () => {

  it('renders title and value', () => {
    render(<StatCard title="Total Animals" value={42} icon={Activity} />);
    expect(screen.getByText('Total Animals')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders trend upward indicator', () => {
    // StatCard appends "%" itself, so pass the number without it
    render(
      <StatCard title="Revenue" value="PKR 5,000" icon={Activity}
                trend="+12" trendDirection="up" />
    );
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders trend downward indicator', () => {
    render(
      <StatCard title="Expenses" value="PKR 2,000" icon={Activity}
                trend="-5" trendDirection="down" />
    );
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders without trend when trend prop is omitted', () => {
    const { container } = render(
      <StatCard title="Farms" value={3} icon={Activity} />
    );
    // No trend icons should be present
    expect(container.querySelector('svg[data-testid="trending-up"]')).toBeNull();
  });

  it('applies the correct color class', () => {
    const { container } = render(
      <StatCard title="Healthy" value={8} icon={Activity} color="green" />
    );
    expect(container.innerHTML).toContain('bg-green-500');
  });

  it('applies default blue color when color prop is omitted', () => {
    const { container } = render(
      <StatCard title="Total" value={10} icon={Activity} />
    );
    expect(container.innerHTML).toContain('bg-blue-500');
  });

  it('renders zero value correctly', () => {
    render(<StatCard title="Alerts" value={0} icon={Activity} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard title="Status" value="Active" icon={Activity} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
