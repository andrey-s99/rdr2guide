import { PaperCard } from '../components/PaperCard';

export interface OutfitScreenProps {
  id: string;
}

export function OutfitScreen({ id }: OutfitScreenProps) {
  return (
    <div class="screen">
      <PaperCard title="Костюм" subtitle={id}>
        <p class="muted">Карточка появится в следующей версии.</p>
      </PaperCard>
    </div>
  );
}
