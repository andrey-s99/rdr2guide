import { AppShell, animalsTabOf } from './components/AppShell';
import { currentRoute, type Route } from './router';
import { AnimalScreen } from './screens/AnimalScreen';
import { Animals } from './screens/Animals';
import { FenceTalismans } from './screens/FenceTalismans';
import { FenceTrinkets } from './screens/FenceTrinkets';
import { ItemScreen } from './screens/ItemScreen';
import { NotFound } from './screens/NotFound';
import { OutfitScreen } from './screens/OutfitScreen';
import { PearsonCamp } from './screens/PearsonCamp';
import { PearsonSatchels } from './screens/PearsonSatchels';
import { Search } from './screens/Search';
import { Settings } from './screens/Settings';
import { Summary } from './screens/Summary';
import { TrapperItems } from './screens/TrapperItems';
import { TrapperOutfits } from './screens/TrapperOutfits';
import { VendorScreen } from './screens/VendorScreen';

/** Number of goals for the header star badge. */
export function getGoalsCount(): number {
  return 0;
}

function renderScreen(route: Route) {
  switch (route.name) {
    case 'trapper-outfits':
      return <TrapperOutfits />;
    case 'trapper-items':
      return <TrapperItems />;
    case 'pearson-satchels':
      return <PearsonSatchels />;
    case 'pearson-camp':
      return <PearsonCamp />;
    case 'fence-trinkets':
      return <FenceTrinkets />;
    case 'fence-talismans':
      return <FenceTalismans />;
    case 'animals':
      return <Animals tab={animalsTabOf(route)} />;
    case 'summary':
      return <Summary scope={route.query.scope} group={route.query.group} />;
    case 'item':
      return route.id ? <ItemScreen id={route.id} /> : <NotFound />;
    case 'outfit':
      return route.id ? <OutfitScreen id={route.id} /> : <NotFound />;
    case 'animal':
      return route.id ? <AnimalScreen id={route.id} /> : <NotFound />;
    case 'vendor':
      return route.id ? <VendorScreen id={route.id} /> : <NotFound />;
    case 'search':
      return <Search q={route.query.q ?? ''} />;
    case 'settings':
      return <Settings />;
    default:
      return <NotFound />;
  }
}

export function App() {
  const route = currentRoute.value;
  return (
    <AppShell route={route} goalsCount={getGoalsCount()}>
      {renderScreen(route)}
    </AppShell>
  );
}
