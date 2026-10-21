import type { User } from '@/types';
import { initials } from '@/lib/people';
import { AvatarFace } from '@/features/avatar/AvatarFace';

/** Round avatar: the user's layered-SVG face, or coloured initials as a fallback. */
export function Avatar({ user, size = 40, ring = false }: { user?: User; size?: number; ring?: boolean }) {
  const ringCls = ring ? 'ring-2 ring-white ring-offset-2 ring-offset-leaf-500' : '';
  if (user?.avatar) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-sky-100 to-leaf-100 ${ringCls}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <AvatarFace avatar={user.avatar} size={size * 1.08} className="translate-y-[6%]" />
      </span>
    );
  }
  return (
    <span
      className={`grid shrink-0 select-none place-items-center rounded-full font-display font-extrabold text-white shadow-inner ${ringCls}`}
      style={{ width: size, height: size, background: user?.color ?? '#94a3b8', fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(user?.name ?? '?')}
    </span>
  );
}
