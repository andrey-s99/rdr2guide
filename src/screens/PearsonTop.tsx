import { VendorInfoLink } from './VendorList';

/** Link to the Pearson page and the chapter reminder (SPEC 9.5). */
export function PearsonTop() {
  return (
    <>
      <VendorInfoLink vendorId="pearson" label="Как работает Пирсон →" />
      <p class="vendor-list__reminder">Пирсон работает до конца главы 6</p>
    </>
  );
}
