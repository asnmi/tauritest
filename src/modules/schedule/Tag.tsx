import { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from 'lucide-react';
import './tag.css';

interface TagProps {
  initialColor?: string;
  onColorChange?: (color: string, label: string) => void;
  className?: string;
  onAddCustomTag?: (color: string, label: string) => void;
}

// Déplacer les options de base dans un composant parent ou un contexte
const DEFAULT_COLORS = [
  { name: 'Cours', value: '#FF5252' },
  { name: 'Travail', value: '#4CAF50' },
  { name: 'Sport', value: '#2196F3' },
  { name: 'Loisirs', value: '#FFC107' },
  { name: 'Famille', value: '#9C27B0' },
  { name: 'Santé', value: '#00BCD4' },
  { name: 'Autre', value: '#9E9E9E' },
  { name: 'Urgent', value: '#FF9800' }
];

// Hook personnalisé pour gérer les tags personnalisés
const useTags = () => {
  const [customTags, setCustomTags] = useState<Array<{name: string, value: string}>>(
    JSON.parse(localStorage.getItem('customTags') || '[]')
  );

  const addCustomTag = (name: string, value: string) => {
    const newTag = { name: name.trim(), value };
    const updatedTags = [...customTags, newTag];
    setCustomTags(updatedTags);
    localStorage.setItem('customTags', JSON.stringify(updatedTags));
    return newTag;
  };

  const getTags = () => [...DEFAULT_COLORS, ...customTags];

  const removeCustomTag = (name: string) => {
    const updatedTags = customTags.filter(tag => tag.name !== name);
    setCustomTags(updatedTags);
    localStorage.setItem('customTags', JSON.stringify(updatedTags));
  };

  const clearAllCustomTags = () => {
    setCustomTags([]);
    localStorage.setItem('customTags', '[]');
  };

  return { tags: getTags(), addCustomTag, removeCustomTag, clearAllCustomTags };
};

export default function Tag({ 
  initialColor,
  onColorChange,
  className = '',
  onAddCustomTag
}: TagProps) {
  if(initialColor === ''){
    initialColor = '#9E9E9E';
  }

  const [isOpen, setIsOpen] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTagName, setCustomTagName] = useState('');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [currentColor, setCurrentColor] = useState(initialColor);
  const { tags: colorOptions, addCustomTag, removeCustomTag } = useTags();
  
  const [currentLabel, setCurrentLabel] = useState(
    () => {
      const defaultTag = DEFAULT_COLORS.find(c => c.value === initialColor);
      const customTag = JSON.parse(localStorage.getItem('customTags') || '[]')
        .find((t: any) => t.value === initialColor);
      return defaultTag?.name || customTag?.name || 'Autre';
    }
  );
  
  const formRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleColorSelect = (color: string, label: string) => {
    setCurrentColor(color);
    setCurrentLabel(label);
    onColorChange?.(color, label);
    setIsOpen(false);
  };

  const handleAddCustomTag = () => {
    if (customTagName.trim()) {
      const newTag = addCustomTag(customTagName, customColor);
      handleColorSelect(newTag.value, newTag.name);
      onAddCustomTag?.(newTag.value, newTag.name);
      
      // Reset form
      setCustomTagName('');
      setCustomColor('#3b82f6');
      setShowCustomForm(false);
    }
  };

  // Handle clicks outside the form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowCustomForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerColorPicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  return (
    <div className="tag-container">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="tag-trigger">
            <div 
              className={`tag ${className}`}
              style={{ backgroundColor: currentColor }}
              aria-label={`Tag: ${currentLabel}`}
            />
            <span className="tag-label">{currentLabel}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="tag-popover" align="start" sideOffset={5}>
          <div className="color-picker">
            <div className="popover-header">
              <h4 className="color-picker-title">Choisir une catégorie</h4>
              <button 
                className="close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="color-grid">
              {colorOptions.map((color) => (
                <div key={`${color.value}-${color.name}`} className="color-option-container">
                  <div className="color-option-wrapper">
                    <button
                      className={`color-option ${currentColor === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorSelect(color.value, color.name)}
                      title={color.name}
                      aria-label={color.name}
                    />
                    {DEFAULT_COLORS.some(tag => tag.name === color.name) ? null : (
                      <button
                        className="delete-tag-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomTag(color.name);
                          // Si le tag supprimé est celui actuellement sélectionné, on sélectionne le premier tag par défaut
                          if (currentColor === color.value) {
                            handleColorSelect(DEFAULT_COLORS[0].value, DEFAULT_COLORS[0].name);
                          }
                        }}
                        title="Supprimer ce tag"
                        aria-label={`Supprimer le tag ${color.name}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <span className="color-label">{color.name}</span>
                </div>
              ))}
              <div className="color-option-container">
                <button
                  className="add-custom-tag-button"
                  onClick={() => setShowCustomForm(true)}
                  title="Ajouter un tag personnalisé"
                  aria-label="Ajouter un tag personnalisé"
                >
                  <Plus size={20} />
                </button>
                <span className="color-label">Personnalisé</span>
              </div>
            </div>

            {showCustomForm && (
              <div className="custom-tag-form" ref={formRef}>
                <div className="form-group">
                  <label htmlFor="tag-name">Nom du tag</label>
                  <Input
                    id="tag-name"
                    value={customTagName}
                    onChange={(e) => setCustomTagName(e.target.value)}
                    placeholder="Entrez un nom"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Couleur</label>
                  <div className="native-color-picker">
                    <div 
                      className="color-preview"
                      style={{ backgroundColor: customColor }}
                      onClick={triggerColorPicker}
                    />
                    <input
                      type="color"
                      ref={colorInputRef}
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="color-input"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCustomForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleAddCustomTag}
                    disabled={!customTagName.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
