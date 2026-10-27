// Modüller arası paylaşılan uygulama bağlamı.
export const ctx = {
  store: null,
  index: null,
  words: [],
  actions: {},     // data-a="..." eylemleri
  toast: () => {},
  rerender: () => {},
};
