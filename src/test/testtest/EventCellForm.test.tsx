
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventCellForm from '../../modules/schedule/EventCellForm';

describe('EventCellForm', () => {
  const mockValues = {
    subject: 'Test Event',
    start: '10:00',
    end: '11:00',
    id: '1'
  };

  const mockSetValues = vi.fn();
  const mockOnValidate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleSelect = vi.fn();
  const mockOnTagColorChange = vi.fn();
  const mockSetEditingEvent = vi.fn();

  const renderComponent = (props = {}) => {
    return render(
      <EventCellForm
        values={mockValues}
        setValues={mockSetValues}
        onValidate={mockOnValidate}
        onDelete={mockOnDelete}
        onToggleSelect={mockOnToggleSelect}
        onTagColorChange={mockOnTagColorChange}
        tagColor="#FF0000"
        day="monday"
        hour="10:00"
        setEditingEvent={mockSetEditingEvent}
        isEditing={true}
        inlineEdit={false}
        {...props}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche correctement le formulaire avec les valeurs fournies', () => {
    renderComponent();
    const subjectInput = screen.getByPlaceholderText('Cours ou activité') as HTMLInputElement;
    expect(subjectInput.value).toBe('Test Event');
  });

  it('met à jour le sujet lors de la saisie', () => {
    renderComponent();
    const subjectInput = screen.getByPlaceholderText('Cours ou activité');
    fireEvent.change(subjectInput, { target: { value: 'Nouvel événement' } });
    expect((subjectInput as HTMLInputElement).value).toBe('Nouvel événement');
  });

  it('affiche le bouton de suppression quand onDelete est fourni', () => {
    renderComponent();
    const deleteButton = screen.getByRole('button', { name: /supprimer/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('appelle onDelete lors du clic sur le bouton de suppression', () => {
    renderComponent();
    const deleteButton = screen.getByRole('button', { name: /supprimer/i });
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('affiche correctement le formulaire avec les valeurs fournies', () => {
    renderComponent();
    const subjectInput = screen.getByPlaceholderText('Cours ou activité') as HTMLInputElement;
    expect(subjectInput.value).toBe('Test Event');
  });


});