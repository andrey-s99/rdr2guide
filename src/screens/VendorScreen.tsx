import { PaperCard } from '../components/PaperCard';

export interface VendorScreenProps {
  id: string;
}

export function VendorScreen({ id }: VendorScreenProps) {
  return (
    <div class="screen">
      <PaperCard title="Торговец" subtitle={id}>
        <p class="muted">Карточка появится в следующей версии.</p>
      </PaperCard>
    </div>
  );
}
