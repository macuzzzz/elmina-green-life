import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AvatarConfig } from '@/types';
import { AvatarFace } from './AvatarFace';

const cache = new Map<string, string>();

/**
 * Avatar as a cached SVG data URL. Map avatars use <img> so the browser decodes
 * each face once and just blits the bitmap while the camera moves.
 */
export function avatarUrl(avatar: AvatarConfig) {
  const key = JSON.stringify(avatar);
  let url = cache.get(key);
  if (!url) {
    const svg = renderToStaticMarkup(createElement(AvatarFace, { avatar, size: 96 }));
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    cache.set(key, url);
  }
  return url;
}
