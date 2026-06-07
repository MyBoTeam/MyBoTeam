import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTaskStore } from '@/stores/taskStore';
import ConversationsPage from './ConversationsPage';
import { FavoritesSection } from '@/pages/home/FavoritesSection';
import { FAVORITES_PREVIEW_COUNT } from '@/pages/home/homeConstants';

export default function ConversationsFavoritesPage() {
  const navigate = useNavigate();
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const favorites = useTaskStore((state) => state.favorites);
  const loadFavorites = useTaskStore((state) => state.loadFavorites);
  const removeFavorite = useTaskStore((state) => state.removeFavorite);

  useEffect(() => {
    if (typeof loadFavorites === 'function') {
      void loadFavorites();
    }
  }, [loadFavorites]);

  const favoritesList = Array.isArray(favorites) ? favorites : [];
  const displayedFavorites = showAllFavorites
    ? favoritesList
    : favoritesList.slice(0, FAVORITES_PREVIEW_COUNT);
  const hasMoreFavorites = favoritesList.length > FAVORITES_PREVIEW_COUNT;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-2 shrink-0">
        <FavoritesSection
          favoritesList={favoritesList}
          displayedFavorites={displayedFavorites}
          hasMoreFavorites={hasMoreFavorites}
          showAllFavorites={showAllFavorites}
          onSetPrompt={(prompt) => navigate('/', { state: { prompt } })}
          onRemoveFavorite={(taskId: string) => void removeFavorite(taskId)}
          onShowAll={() => setShowAllFavorites(true)}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <ConversationsPage />
      </div>
    </div>
  );
}
