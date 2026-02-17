import { Button } from "@/components/ui/button";
import './SelectionActions.css';

type ActionMode = 'move' | 'copy' | 'delete' | null;

interface SelectionActionsProps {
  selectedCount: number;
  actionMode: ActionMode;
  onActionModeChange: (mode: ActionMode) => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

export function SelectionActions({
  selectedCount,
  actionMode,
  onActionModeChange,
  onClearSelection,
  onDeleteSelected,
}: SelectionActionsProps) {
  const isAnyActionActive = actionMode !== null;

  const handleActionClick = (mode: ActionMode) => {
    if (mode === 'delete') {
      onDeleteSelected();
    } else {
      onActionModeChange(mode);
    }
  };

  if (selectedCount === 0) {
    return (
      <div className="selection-hint">
        Sélectionnez des événements pour effectuer des actions en groupe
      </div>
    );
  }

  return (
    <div className="selection-actions">
      <span className="selection-count">{selectedCount} événement(s) sélectionné(s)</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleActionClick('move')}
        disabled={isAnyActionActive && actionMode !== 'move'}
      >
        Déplacer
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleActionClick('copy')}
        disabled={isAnyActionActive && actionMode !== 'copy'}
      >
        Copier
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleActionClick('delete')}
        disabled={isAnyActionActive && actionMode !== 'delete'}
        className="text-red-500"
      >
        Supprimer
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearSelection}
      >
        Annuler
      </Button>
      {actionMode && (
        <div className="action-hint">
          {actionMode === 'move' && 'Sélectionnez le jour de destination'}
          {actionMode === 'copy' && 'Sélectionnez le jour de destination'}
          {/*actionMode === 'delete' && 'Confirmez la suppression'*/}
        </div>
      )}
    </div>
  );
}
