class Observable {
  constructor() {
    this._observers = new Set();
  }

  subscribe(fn) {
    if (typeof fn !== "function") {
      throw new TypeError("Observer deve essere una funzione");
    }

    this._observers.add(fn);

    return () => this.unsubscribe(fn);
  }

  unsubscribe(fn) {
    this._observers.delete(fn);
  }

  notify(payload) {
    for (const fn of this._observers) {
      try {
        fn(payload);
      } catch (err) {
        console.error("Observer error:", err);
      }
    }
  }

  get size() {
    return this._observers.size;
  }
}
// ========== TEST ==========
const observable = new Observable();

function osservatore1(payload) {
  console.log("Observer 1:", payload);
}

function osservatore2(payload) {
  console.log("Observer 2:", payload);
}

observable.subscribe(osservatore1);
observable.subscribe(osservatore2);

observable.notify("Prodotto aggiunto!");

console.log("Osservatori iscritti:", observable.size);

// ========== CarrelloObservable ==========

class CarrelloObservable extends Observable {
  constructor() {
    super();
    this._items = new Map();
  }

  addProdotto(item) {
    if (!item || !item.id || !item.nome) {
      throw new TypeError("item deve avere id e nome");
    }

    const qty = Number(item.qty ?? 1);

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new TypeError("qty deve essere un numero > 0");
    }

    const cur = this._items.get(item.id);

    if (cur) {
      cur.qty += qty;
      this._items.set(item.id, cur);
    } else {
      this._items.set(item.id, {
        id: item.id,
        nome: item.nome,
        qty,
      });
    }

    this.notify({
      type: "add",
      id: item.id,
      count: this.totalItems,
      items: this.snapshot(),
    });
  }

  removeProdotto(id, qty = 1) {
    if (!this._items.has(id)) return;

    const count = Number(qty);

    if (!Number.isFinite(count) || count <= 0) {
      throw new TypeError("qty deve essere un numero > 0");
    }

    const cur = this._items.get(id);

    cur.qty -= count;

    if (cur.qty <= 0) {
      this._items.delete(id);
    } else {
      this._items.set(id, cur);
    }

    this.notify({
      type: "remove",
      id,
      count: this.totalItems,
      items: this.snapshot(),
    });
  }

  get totalItems() {
    let total = 0;

    for (const { qty } of this._items.values()) {
      total += qty;
    }

    return total;
  }

  snapshot() {
    return Array.from(this._items.values()).map((it) => ({ ...it }));
  }
} // FINE CLASSE CarrelloObservable

// ========== OSSERVATORI ==========

// Observer 1 - Aggiornamento contatore HTML

function updateCounterOnScreen({ count }) {
  const el = document.getElementById("cart-count");

  if (el) {
    el.textContent = String(count);
  }
}

// Observer 2 - Registrazione operazioni in console

function logOperation({ type, id, count }) {
  console.log(`[CART] ${type} -> id: ${id} | tot: ${count}`);
}

// ========== INIZIALIZZAZIONE CARRELLO ==========

const carrello = new CarrelloObservable();

let stopCounter = carrello.subscribe(updateCounterOnScreen);

let stopLogger = carrello.subscribe(logOperation);

// ========== GESTIONE EVENTI ==========

// Aggiungi T-shirt

document.getElementById("add-shirt").addEventListener("click", () => {
  carrello.addProdotto({
    id: "SKU-1",
    nome: "T-shirt",
    qty: 1,
  });
});

// Rimuovi T-shirt

document.getElementById("remove-shirt").addEventListener("click", () => {
  carrello.removeProdotto("SKU-1", 1);
});

// Aggiungi Jeans

document.getElementById("add-jeans").addEventListener("click", () => {
  carrello.addProdotto({
    id: "SKU-2",
    nome: "Jeans",
    qty: 1,
  });
});

// Rimuovi Jeans

document.getElementById("remove-jeans").addEventListener("click", () => {
  carrello.removeProdotto("SKU-2", 1);
});

// ========== GESTIONE OSSERVATORI ==========

function updateObserverCount() {
  const el = document.getElementById("observer-count");

  el.textContent = carrello.size;
}

// Observer 1 - Attivazione e disattivazione

document
  .getElementById("toggle-counter")
  .addEventListener("change", (event) => {
    if (event.target.checked) {
      stopCounter = carrello.subscribe(updateCounterOnScreen);

      updateCounterOnScreen({
        count: carrello.totalItems,
      });
    } else {
      stopCounter();
    }

    updateObserverCount();
  });

// Observer 2 - Attivazione e disattivazione

document.getElementById("toggle-logger").addEventListener("change", (event) => {
  if (event.target.checked) {
    stopLogger = carrello.subscribe(logOperation);
  } else {
    stopLogger();
  }

  updateObserverCount();
});
