import { PaperCard } from '../components/PaperCard';

export interface ItemScreenProps {
  id: string;
}

export function ItemScreen({ id }: ItemScreenProps) {
  return (
    <div class="screen">
      <PaperCard title="Предмет" subtitle={id}>
        <p class="muted">Карточка появится в следующей версии.</p>
      </PaperCard>
    </div>
  );
}
