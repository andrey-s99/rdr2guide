import { PaperCard } from '../components/PaperCard';

export interface AnimalScreenProps {
  id: string;
}

export function AnimalScreen({ id }: AnimalScreenProps) {
  return (
    <div class="screen">
      <PaperCard title="Зверь" subtitle={id}>
        <p class="muted">Карточка появится в следующей версии.</p>
      </PaperCard>
    </div>
  );
}
