import type { StateCreator } from 'zustand';

import type { Person } from '@/types';

/**
 * The organization directory. Populated from the seed with a handful
 * of believable colleagues so the Create Chat dialog and channel
 * member lists can render real content.
 */
export interface PeopleSlice {
  peopleById: Record<string, Person>;

  addPerson: (person: Person) => void;
  removePerson: (id: string) => void;
}

export const peopleSlice: StateCreator<PeopleSlice, [], [], PeopleSlice> = (
  set,
) => ({
  peopleById: {},

  addPerson: (person) =>
    set((state) => ({
      peopleById: { ...state.peopleById, [person.id]: person },
    })),

  removePerson: (id) =>
    set((state) => {
      const rest = { ...state.peopleById };
      delete rest[id];
      return { peopleById: rest };
    }),
});
