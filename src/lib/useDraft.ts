'use client';

import { useState, useEffect, useRef } from 'react';
import { getDraft, saveDraft } from './api';

export const EMPTY_DRAFT = {
  title: '',
  date: '',
  time: '',
  location: '',
  category: '',
  description: '',
  people: [] as any[],
  documents: [] as any[],
};



export function useDraft() {
  const [draft, setDraft] = useState<any>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    getDraft()
      .then((d) => { if (active) setDraft({ ...EMPTY_DRAFT, ...(d || {}) }); })
      .catch(() => {  })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDraft(draft).catch(() => {  });
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [draft, loaded]);

  return { draft, setDraft, loaded };
}
