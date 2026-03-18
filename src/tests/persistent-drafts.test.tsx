import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePersistentDraftState } from '@/shared/lib/usePersistentDraftState';

describe('usePersistentDraftState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores an autosaved draft and keeps writing changes', () => {
    localStorage.setItem(
      'test-draft',
      JSON.stringify({
        modalOpen: true,
        draft: { name: 'Compra de sementes', amount: 1200 }
      })
    );

    const { result } = renderHook(() =>
      usePersistentDraftState('test-draft', () => ({
        modalOpen: false,
        draft: { name: '', amount: 0 }
      }))
    );

    expect(result.current.value).toEqual({
      modalOpen: true,
      draft: { name: 'Compra de sementes', amount: 1200 }
    });

    act(() => {
      result.current.setValue((state) => ({
        ...state,
        draft: {
          ...state.draft,
          amount: 1500
        }
      }));
    });

    expect(JSON.parse(localStorage.getItem('test-draft') || '{}')).toEqual({
      modalOpen: true,
      draft: { name: 'Compra de sementes', amount: 1500 }
    });
  });

  it('clears the stored draft without re-saving an empty shell', () => {
    const { result } = renderHook(() =>
      usePersistentDraftState('test-draft', () => ({
        modalOpen: false,
        draft: { name: '', amount: 0 }
      }))
    );

    act(() => {
      result.current.setValue({
        modalOpen: true,
        draft: { name: 'Aplicacao', amount: 30 }
      });
    });

    expect(localStorage.getItem('test-draft')).toBeTruthy();

    act(() => {
      result.current.clear();
    });

    expect(result.current.value).toEqual({
      modalOpen: false,
      draft: { name: '', amount: 0 }
    });
    expect(localStorage.getItem('test-draft')).toBeNull();
  });
});
