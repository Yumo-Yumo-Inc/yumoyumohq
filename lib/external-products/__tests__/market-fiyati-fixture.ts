interface FixtureOptions {
  page: number;
  count?: number;
  start?: number;
  duplicateSourceId?: string | null;
  missingPriceAt?: number | null;
}

export function marketFiyatiPageFixture(options: FixtureOptions): string {
  const count = options.count ?? 25;
  const start = options.start ?? (options.page - 1) * count + 1;
  const cards = Array.from({ length: count }, (_, offset) => {
    const n = start + offset;
    const id = offset === 0 && options.duplicateSourceId ? options.duplicateSourceId : `P${String(n).padStart(4, "0")}`;
    const missingPrice = options.missingPriceAt === offset;
    const name = n % 3 === 0 ? `Test Süt 6x180 ml ${n}` : n % 3 === 1 ? `Test Su 1 Lt ${n}` : `Test Kahve 250 g ${n}`;
    return `
      <article class="shadow product-summary rounded">
        <a class="product-link" href="/detay/${id}/test-urun-${n}">
          <h2 data-id="${n}" class="product-name title" title="${name}">${name}</h2>
        </a>
        <img class="responsive depot-logo" alt="En ucuz market bim" src="https://cdn.invalid/logo.png">
        ${missingPrice ? "" : `<span class="caption-16 fw-bold">${n},75₺</span>`}
        ${n === start ? '<span class="text-decoration-line-through">12,50₺</span>' : ""}
        <span class="caption-12 fw-normal">54,17 ₺/Lt</span>
      </article>`;
  }).join("\n");
  return `<main>${cards}<nav class="pagination"><a>1</a><span class="page active">${options.page}</span><a>4</a></nav></main>`;
}

