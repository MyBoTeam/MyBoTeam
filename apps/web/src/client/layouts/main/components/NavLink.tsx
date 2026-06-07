import { Link } from 'react-router';
import { cn } from '@/utils/utils';

export function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'no-drag px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        active && 'text-foreground bg-accent',
      )}
    >
      {children}
    </Link>
  );
}
