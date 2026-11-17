import { useShopCart } from '../context/ShopCartContext';
import { CAMBLU_CLEAN_CREST_URL } from '../lib/shopHelpers';
import { formatBrlFromCents } from '../lib/validators';
import { Icon } from './Icon';

export function FloatingCartPill() {
  const { cart, totalItemsCount, totalCents, setCartOpen } = useShopCart();
  const visibleEntries = cart.slice(0, 2);
  const extraCount = Math.max(0, totalItemsCount - visibleEntries.reduce((acc, item) => acc + item.quantity, 0));

  return (
    <div className="m3-floating-bag-wrap" data-visible={totalItemsCount > 0 ? 'true' : 'false'}>
      <button
        type="button"
        className="m3-floating-bag"
        aria-label={`Abrir sacola com ${totalItemsCount} itens, total ${formatBrlFromCents(totalCents)}`}
        tabIndex={totalItemsCount > 0 ? 0 : -1}
        onClick={() => setCartOpen(true)}
      >
        <span className="m3-floating-bag__icon">
          <Icon name="shopping_cart" size={20} />
        </span>

        <span className="m3-floating-bag__thumbs" aria-hidden="true">
          {visibleEntries.map((entry) =>
            entry.product.images[0] ? (
              <img
                key={`${entry.product.id}-${entry.size}-${entry.colorName || ''}`}
                src={entry.product.images[0]}
                alt=""
                className="m3-floating-bag__thumb"
              />
            ) : (
              <span
                key={`${entry.product.id}-${entry.size}-${entry.colorName || ''}`}
                className="m3-floating-bag__thumb m3-floating-bag__thumb--crest"
                style={{ backgroundColor: entry.product.colors?.[0]?.hex || '#0f3325' }}
              >
                <img src={CAMBLU_CLEAN_CREST_URL} alt="" />
              </span>
            ),
          )}
          {extraCount > 0 && <span className="m3-floating-bag__more">+{extraCount}</span>}
        </span>

        <span className="m3-floating-bag__meta">
          <strong>{totalItemsCount === 1 ? '1 item' : `${totalItemsCount} itens`}</strong>
          <span>{formatBrlFromCents(totalCents)}</span>
        </span>
      </button>
    </div>
  );
}
