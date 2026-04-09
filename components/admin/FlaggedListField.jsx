'use client';

import { StringListField } from '@/components/admin/StringListField';

export function FlaggedListField({ type = 'included', ...props }) {
  const marker = type === 'included' ? '✓' : '✕';
  return <StringListField {...props} marker={marker} />;
}

